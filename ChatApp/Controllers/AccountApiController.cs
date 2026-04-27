using ChatApp.Data;
using ChatApp.Hubs;
using ChatApp.Models;
using ChatApp.Models.Auth;
using ChatApp.Models.Chat;
using ChatApp.Repositories;
using ChatApp.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Reflection;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;

namespace ChatApp.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	[Authorize]
	public class AccountApiController : ControllerBase
	{
		private readonly UserManager<ApplicationUser> _userManager;
		private readonly ChatDbContext _chatDbContext;
		private readonly IGenericRepository<User> _userRepository;
		private readonly IGenericRepository<Contact> _contactRepository;
		private readonly IGenericRepository<Message> _messageRepository;
		private readonly OpenAiService _openAiService;
		private readonly IGenericRepository<Group> _groupRepository;
		private readonly IGenericRepository<UserGroupKey> _userGroupKeyRepository;

		public AccountApiController(UserManager<ApplicationUser> userManager, ChatDbContext chatDbContext,
									IGenericRepository<User> userRepository, IGenericRepository<Contact> contactRepository,
									IGenericRepository<Message> messageRepository, OpenAiService openAiService, IGenericRepository<Group> groupRepository, IGenericRepository<UserGroupKey> userGroupKeyRepository)
		{
			_userManager = userManager;
			_chatDbContext = chatDbContext;
			_userRepository = userRepository;
			_contactRepository = contactRepository;
			_messageRepository = messageRepository;
			_openAiService = openAiService;
			_groupRepository = groupRepository;
			_userGroupKeyRepository = userGroupKeyRepository;
		}
		[Authorize]
		[HttpGet("GetCurrentUserData")]
		public async Task<IActionResult> GetCurrentUserData()
		{
			var identityUser = await _userManager.GetUserAsync(User);
			if (identityUser == null)
				return Unauthorized();

			var customUser = await _chatDbContext.Users
				.Include(u => u.Status)
				.Include(u => u.Contacts)
				.ThenInclude(c => c.ContactUser)
				.ThenInclude(c => c.Status)
				.FirstOrDefaultAsync(u => u.IdentityUserId == identityUser.Id);

			if (customUser == null)
				return NotFound();
			var aiMessages = await _messageRepository
										.FindAsync(m => (m.SenderId == 5000000 && m.ReceiverId == customUser.UserId) || (m.ReceiverId == 5000000 && m.SenderId == customUser.UserId));
			var lastAiResponse = aiMessages.OrderByDescending(m => m.Timestamp).Select(m => m.Content).FirstOrDefault();
			
			var userGroups = await _groupRepository.FindListWithIncludesAsync(u => u.Members.Select(u => u.UserId).Contains(customUser.UserId) || u.OwnerId == customUser.UserId, u => u.Members);
			var userGroupKeys = await _userGroupKeyRepository.FindAsync(u => u.UserId == customUser.UserId);
			var membersWithGroup = userGroups
				.SelectMany(g => g.Members, (group, member) => new
				{
					Member = member,
					GroupId = group.GroupId
				});

			var memberNames = membersWithGroup.Join(_chatDbContext.Users, m => m.Member.UserId, u => u.UserId, (m, u) => new { m, u })
				.Join(_userManager.Users, x => x.m.Member.IdentityUserId, b => b.Id, (x, y) => new {x.m.GroupId , y.UserName});

			var groupContacts = userGroups.Select(u => new
			{
				id = u.GroupId.ToString(),
				UserId = u.OwnerId,
				ContactName = u.Name,
				status = "online",
				ProfilePicUrl = "",//c.ContactUser.ProfilePicUrl,
				PublicKey = userGroupKeys.FirstOrDefault(x => x.GroupId == u.GroupId).EncryptedGroupKey,//c.ContactUser.PublicKey,
				lastMessage = string.Join(',', memberNames.Where(m => m.GroupId == u.GroupId).Select(a => a.UserName)),
				isGroup = true
			});
			var allIdentityUsers = _userManager.Users.ToList();
			var userContacts = customUser.Contacts.Select(c => new
			{
				id = c.ContactUser.IdentityUserId,
				c.ContactUser.UserId,
				ContactName = allIdentityUsers.FirstOrDefault(u => u.Id == c.ContactUser.IdentityUserId).UserName,
				status = c.ContactUser.Status.Name,
				c.ContactUser.ProfilePicUrl,
				c.ContactUser.PublicKey,
				lastMessage = _chatDbContext.Messages.Where(m => m.SenderId == c.ContactUser.UserId && m.ReceiverId == customUser.UserId && m.MessageTypeId == 1).OrderByDescending(m => m.Timestamp).Select(m => m.Content).FirstOrDefault() ?? "",
				isGroup = false
			});
			var combinedContacts = userContacts.Concat(groupContacts);
			var result = new
			{
				identityUser.Id,
				identityUser.UserName,
				identityUser.Email,
				customUser.PhoneNumber,
				customUser.ProfilePicUrl,
				customUser.Bio,
				customUser.PublicKey,
				Status = customUser.Status?.Name,
				Contacts = combinedContacts,
				lastAiResponse,
			};
			return Ok(result);
		}
		[Authorize]
		[HttpGet("GetCurrentUserMessages")]
		public async Task<IActionResult> GetCurrentUserMessages()
		{
			var identityUser = await _userManager.GetUserAsync(User);
			var currentUser = await _userRepository.FindOneAsync(u => u.IdentityUserId == identityUser.Id);
			//var userGroups = await _groupRepository.FindListWithIncludesAsync(u => u.Members.Select(u => u.UserId).Contains(currentUser.UserId), u => u.Members);
			//var _userGroups = userGroups.Select(a => a.GroupId).ToList();

			var userGroups  =_chatDbContext.Groups.FromSqlRaw("select g.groupid from dbo.groups  join dbo.groupuser gu on g.groupid = gu.groupsgroupid where gu.memberuserid = @memberid", new { memberid = currentUser.UserId});

			var messages = await _messageRepository.FindListWithIncludesAsync
								(m => m.SenderId == currentUser.UserId || m.ReceiverId == currentUser.UserId || (m.isGroup && m.ReceiverId == 1),
								m => m.Sender,
								m => m.Receiver);
			messages.Select(a => a.IsSeen);
			var result = messages.Select(m => new
			{
				m.MessageId,
				Content = m.SenderId == currentUser.UserId ? m.SenderContent : m.Content,
				SenderId = m.Sender.IdentityUserId,
				ReceiverId = m.isGroup ? m.ReceiverId.ToString() : m.Receiver.IdentityUserId,
				m.Timestamp,
				m.IsSeen,
				m.MessageTypeId,
				m.isGroup,
			}).OrderBy(m => m.Timestamp);


			return Ok(result);
		}

		[Authorize]
		[HttpGet("GetUserByUserName/{userName}")]
		public async Task<IActionResult> GetUserByUserName(string userName)
		{
			var currentUser = await _userManager.GetUserAsync(User);
			var currentCustomUser = await _userRepository.FindOneWithIncludesAsync(u => u.IdentityUserId == currentUser.Id, a => a.Status);
			var identityUser = await _userManager.FindByNameAsync(userName);
			if (identityUser == null)
				return NotFound();

			var customUser = await _userRepository.FindOneWithIncludesAsync(u => u.IdentityUserId == identityUser.Id, a => a.Status);
			if (customUser == null)
				return NotFound();

			var result = new
			{
				identityUser.Id,
				identityUser.UserName,
				customUser.PhoneNumber,
				customUser.ProfilePicUrl,
				Status = customUser.Status?.Name,
				customUser.PublicKey,
			};
			var newContact = new Contact()
			{
				OwnerUser = currentCustomUser,
				ContactUser = customUser
			};
			currentCustomUser.Contacts.Add(newContact);
			await _contactRepository.SaveChangesAsync();

			return Ok(result);
		}
		[Authorize]
		[HttpPost("UpdateProfile")]
		public async Task<IActionResult> UpdateProfile([FromForm] IFormFile? ProfilePicture,
														[FromForm] string? Username,
														[FromForm] string? Phone,
														[FromForm] string? Bio)
		{
			var identityUser = await _userManager.GetUserAsync(User);
			var currentUser = await _userRepository.FindOneAsync(u => u.IdentityUserId == identityUser.Id);

			if (ProfilePicture != null && ProfilePicture.Length > 0)
			{
				var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/uploads");

				if (!Directory.Exists(uploadsFolder))
					Directory.CreateDirectory(uploadsFolder);

				var uniqueFileName = Guid.NewGuid().ToString() + Path.GetExtension(ProfilePicture.FileName);
				var filePath = Path.Combine(uploadsFolder, uniqueFileName);
				using (var stream = new FileStream(filePath, FileMode.Create))
				{
					await ProfilePicture.CopyToAsync(stream);
				}
				currentUser.ProfilePicUrl = "/uploads/" + uniqueFileName;
			}
			currentUser.Bio = Bio;
			currentUser.PhoneNumber = Phone;
			await _userRepository.SaveChangesAsync();

			return Ok();
		}

		[HttpPost("upload")]
		public async Task<IActionResult> Upload(IFormFile file)
		{
			if (file == null || file.Length == 0)
				return BadRequest(new { message = "No file provided" });

			var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/uploads");

			if (!Directory.Exists(uploadsFolder))
				Directory.CreateDirectory(uploadsFolder);

			var uniqueFileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
			var filePath = Path.Combine(uploadsFolder, uniqueFileName);
			using (var stream = new FileStream(filePath, FileMode.Create))
			{
				await file.CopyToAsync(stream);
			}
			return Ok(new { filePath = "/uploads/" + uniqueFileName });
		}
		[HttpPost("CreateGroupChat")]
		public async Task<IActionResult> CreateGroupChat([FromBody]CreateGroupDto createGroupDto) 
		{
			var group = new Group()
			{
				Name = createGroupDto.GroupName,
				OwnerId = await getCurrentUserId(),
				CreatedAt = DateTime.UtcNow,
			};
			foreach (var memberId in createGroupDto.UserIds)
			{
				var user = await _userRepository.FindOneAsync(u => u.IdentityUserId == memberId);
				group.Members.Add(user);
			}
			await _groupRepository.InsertOneAsync(group);
			await _groupRepository.SaveChangesAsync();
			var currentUser = await getCurrentUser();
			var aesKey = GenerateAesKey();
			var ownerKey = new UserGroupKey
			{
				GroupId = group.GroupId,
				UserId = currentUser.UserId,
				EncryptedGroupKey = EncryptKeyWithRsa(aesKey, currentUser.PublicKey),
			};
			await _userGroupKeyRepository.InsertOneAsync(ownerKey);
			// encrypt AES key per user and save to UserGroupKeys
			foreach (var user in group.Members)
			{
				if (string.IsNullOrWhiteSpace(user.PublicKey))
					throw new InvalidOperationException($"User {user.UserId} has no public key registered.");

				var encryptedForUser = EncryptKeyWithRsa(aesKey, user.PublicKey);

				var ugk = new UserGroupKey
				{
					GroupId = group.GroupId,
					UserId = user.UserId,
					EncryptedGroupKey = encryptedForUser
				};

				await _userGroupKeyRepository.InsertOneAsync(ugk);
			}

			await _userGroupKeyRepository.SaveChangesAsync();


			return Ok();
		}

		private async Task<long> getCurrentUserId() 
		{
			var currentUser = await _userManager.GetUserAsync(User);
			var currentCustomUser = await _userRepository.FindOneWithIncludesAsync(u => u.IdentityUserId == currentUser.Id);
			return currentCustomUser.UserId;
		}
		private async Task<User> getCurrentUser()
		{
			var currentUser = await _userManager.GetUserAsync(User);
			var currentCustomUser = await _userRepository.FindOneWithIncludesAsync(u => u.IdentityUserId == currentUser.Id);
			return currentCustomUser;
		}
		private static byte[] GenerateAesKey(int bits = 256)
		{
			using var aes = System.Security.Cryptography.Aes.Create();
			aes.KeySize = bits;
			aes.GenerateKey();
			return aes.Key;
		}

		private static string EncryptKeyWithRsa(byte[] symmetricKeyBytes, string userPublicKeyPem)
		{
			
			using var rsa = CreateRsaFromPublicKeyPem(userPublicKeyPem);
			var encrypted = rsa.Encrypt(symmetricKeyBytes, RSAEncryptionPadding.OaepSHA256);
			return Convert.ToBase64String(encrypted);
		}
		public static RSA CreateRsaFromPublicKeyPem(string publicKeyPem)
		{
			if (string.IsNullOrWhiteSpace(publicKeyPem))
				throw new ArgumentException("Public key PEM cannot be null or empty.");


			// Remove PEM header/footer if present
			publicKeyPem = publicKeyPem
			.Replace("-----BEGIN PUBLIC KEY-----", string.Empty)
			.Replace("-----END PUBLIC KEY-----", string.Empty)
			.Replace("\n", string.Empty)
			.Replace("\r", string.Empty)
			.Trim();


			// Decode Base64
			var publicKeyBytes = Convert.FromBase64String(publicKeyPem);


			// Create RSA object and import SubjectPublicKeyInfo
			var rsa = RSA.Create();
			rsa.ImportSubjectPublicKeyInfo(publicKeyBytes, out _);


			return rsa;
		}
	}
	public class CreateGroupDto
	{
		public string GroupName { get; set; }
		public List<string> UserIds { get; set; }
	}


}
