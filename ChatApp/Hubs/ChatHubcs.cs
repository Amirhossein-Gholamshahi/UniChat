using Azure.Core.Pipeline;
using ChatApp.Controllers;
using ChatApp.Data;
using ChatApp.Models;
using ChatApp.Models.Auth;
using ChatApp.Models.Chat;
using ChatApp.Repositories;
using ChatApp.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
namespace ChatApp.Hubs
{
	public class ChatHub : Hub
	{
		private static Dictionary<string, string> _connectionIds = new Dictionary<string, string>();
		private readonly UserManager<ApplicationUser> _userManager;
		private readonly IGenericRepository<User> _userRepository;
		private readonly IGenericRepository<Message> _messageRepository;
		private readonly IGenericRepository<Group> _groupRepository;
		private readonly OpenAiService _openAiService;

		public ChatHub(IGenericRepository<User> userRepository, UserManager<ApplicationUser> userManager
						,IGenericRepository<Message> messageRepository, IGenericRepository<Group> groupRepository, OpenAiService openAiService)
		{
			_userRepository = userRepository;
			_userManager = userManager;
			_messageRepository = messageRepository;
			_groupRepository = groupRepository;
			_openAiService = openAiService;
		}
		[Authorize]
		public async Task SendMessage(string user, string message)
		{
			await Clients.Others.SendAsync("ReceiveMessage", user, message);
		}
		[Authorize]
		public async Task SendPrivateMessageToUser(string targetUserId, string message, string encryptedContentForSender, string groupName)
		{
			var currentUserId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
			var sender = await _userRepository.FindOneAsync(u => u.IdentityUserId == currentUserId);
			if (targetUserId == "ai-1")
			{
				if (_connectionIds.TryGetValue(currentUserId, out var _targetConnectionId))
				{
					var recenetMessages = await _messageRepository
												.FindAsync(m => (m.SenderId == 5000000 && m.ReceiverId == sender.UserId )|| (m.ReceiverId == 5000000 && m.SenderId == sender.UserId));
					var recenetMessagesContent = recenetMessages
												.OrderBy(m => m.Timestamp)
												.Select(m => new ApiMessage
												{
													role = m.SenderId == 5000000 ? "assistant" : "user",
													content = m.Content,
												})
												.ToList();
					var response = await _openAiService.StreamAnswerAsync(message, _targetConnectionId, recenetMessagesContent);
					var messageObj = new Message()
					{
						MessageTypeId = 1,
						Content = message,
						SenderContent = message,
						SenderId = sender.UserId,
						ReceiverId = 5000000,
						Timestamp = DateTime.Now,
						IsSeen = true,
					};
					var responseObj = new Message()
					{
						MessageTypeId = 1,
						Content = response,
						SenderContent = response,
						SenderId = 5000000,
						ReceiverId = sender.UserId,
						Timestamp = DateTime.Now,
						IsSeen = true,
					};
					await _messageRepository.InsertListAsync(new List<Message>() { messageObj, responseObj });
					await _messageRepository.SaveChangesAsync();
					return;
				}
			}
			var receiver = await _userRepository.FindOneAsync(u => u.IdentityUserId == targetUserId);
			// check if he sending message to group 
			if (!string.IsNullOrEmpty(groupName))
			{
				await Clients.GroupExcept(groupName, Context.ConnectionId).SendAsync("ReceiveMessage", targetUserId, message, targetUserId, Context.User.Identity.Name);
			}
			if (_connectionIds.TryGetValue(targetUserId, out var targetConnectionId))
			{
				await Clients.Client(targetConnectionId).SendAsync("ReceiveMessage", currentUserId, message);
				var messageObj = new Message()
				{
					MessageTypeId = message.StartsWith("/uploads") ? 2 : 1,
					Content = message,
					SenderContent = encryptedContentForSender,
					SenderId = sender.UserId,
					ReceiverId = receiver.UserId,
					Timestamp = DateTime.Now,
					IsSeen = false,
					isGroup = false,
				};
				await _messageRepository.InsertOneAsync(messageObj);
				await _messageRepository.SaveChangesAsync();
				return;
			}
			else
			{
				Console.WriteLine($"⚠️ User {targetUserId} not connected.");
			}
			var _messageObj = new Message()
			{
				MessageTypeId = message.StartsWith("/uploads") ? 2 : 1,
				Content = message,
				SenderContent = encryptedContentForSender,
				SenderId = sender.UserId,
				ReceiverId = receiver != null ? receiver.UserId : long.Parse(targetUserId),
				Timestamp = DateTime.Now,
				IsSeen = receiver == null ? true : false,
				isGroup = receiver == null ? true : false,
			};
			await _messageRepository.InsertOneAsync(_messageObj);
			await _messageRepository.SaveChangesAsync();
			return;
		}

		[Authorize]
		public async Task RegisterUserId()
		{
			var connectionId = Context.ConnectionId;
			var currentUserId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
			await Clients.Others.SendAsync("UserOnline", currentUserId);
			var currentCustomUser = await _userRepository.FindOneAsync(u => u.IdentityUserId == currentUserId);
			currentCustomUser.UserStatusTypeId = 1;
			await _userRepository.SaveChangesAsync();
			if (!string.IsNullOrWhiteSpace(currentUserId))
			{
				_connectionIds[currentUserId] = connectionId;
				Console.WriteLine($"✅ Registered user: {currentUserId} with connectionId: {connectionId}");
			}
			var userGroups = await _groupRepository.FindListWithIncludesAsync(u => u.Members.Select(u => u.UserId).Contains(currentCustomUser.UserId) 
								|| u.OwnerId == currentCustomUser.UserId);
			foreach (var group in userGroups)
			{
				await JoinGroup(group.Name);
			}

		}
		public async Task SendImageUrl(string imageUrl)
		{
			await Clients.All.SendAsync("ReceiveImageUrl", imageUrl);
		}
		public async Task SendVideoUrl(string videoUrl)
		{
			await Clients.All.SendAsync("ReceiveVideoUrl", videoUrl);
		}

		public async Task UserTyping(string toUserId)
		{
			//var username = _connectionIds.FirstOrDefault(kvp => kvp.Value == Context.ConnectionId).Key;
			var currentUserId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
			if (_connectionIds.TryGetValue(toUserId, out var targetConnectionId))
			{
				await Clients.Client(targetConnectionId).SendAsync("ShowTyping", currentUserId);
			}
		}

		public async Task UserStoppedTyping(string toUserId)
		{
			//var username = _connectionIds.FirstOrDefault(kvp => kvp.Value == Context.ConnectionId).Key;
			var currentUserId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
			if (_connectionIds.TryGetValue(toUserId, out var targetConnectionId))
			{
				await Clients.Client(targetConnectionId).SendAsync("HideTyping", currentUserId);
			}
		}

		public override async Task OnDisconnectedAsync(Exception? exception)
		{
			var currentUserId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
			if (currentUserId != null)
			{
				_connectionIds.Remove(currentUserId);
				await Clients.Others.SendAsync("UserOffline", currentUserId);
				var currentCustomUser = await _userRepository.FindOneAsync(u => u.IdentityUserId == currentUserId);
				currentCustomUser.UserStatusTypeId = 2;
				await _userRepository.SaveChangesAsync();
			}
			await Clients.Others.SendAsync("UserOffline", currentUserId);
			await base.OnDisconnectedAsync(exception);
		}

		public async Task MarkMessagesAsSeen(string targetUserId) 
		{
			var currentUserId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
			var currentCustomUser = await _userRepository.FindOneAsync(u => u.IdentityUserId == currentUserId);
			var currentTargetUser = await _userRepository.FindOneAsync(u => u.IdentityUserId == targetUserId);
			if (_connectionIds.TryGetValue(targetUserId, out var targetConnectionId))
			{
				await Clients.Client(targetConnectionId).SendAsync("MessageSeen", currentUserId);
				var messages = await _messageRepository.FindListWithIncludesAsync
								(m => m.SenderId == currentTargetUser.UserId && m.ReceiverId == currentCustomUser.UserId && !m.IsSeen);
				messages.ToList().ForEach(m => m.IsSeen = true);
				_messageRepository.SaveChangesAsync();


			}
		}
		//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
		public async Task JoinGroup(string groupName)
		{
			await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
			await Clients.Group(groupName).SendAsync("ReceiveSystemMessage", $"{Context.ConnectionId} joined the group {groupName}");
		}

		// Remove a user from a group
		public async Task LeaveGroup(string groupName)
		{
			await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
			await Clients.Group(groupName).SendAsync("ReceiveSystemMessage", $"{Context.ConnectionId} left the group {groupName}");
		}

		// Send a message to all members in the group
		public async Task SendGroupMessage(string groupName, string message)
		{
			await Clients.Group(groupName).SendAsync("ReceiveGroupMessage", message);
		}
	}
	public sealed class ApiMessage
	{
		public string role { get; set; }	
		public string content { get; set; }
	}
}
