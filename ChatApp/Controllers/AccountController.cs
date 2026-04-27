using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ChatApp.Models.Auth;
using ChatApp.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using ChatApp.Repositories;
public class AccountController : Controller
{
	private readonly UserManager<ApplicationUser> _userManager;
	private readonly SignInManager<ApplicationUser> _signInManager;
	private readonly ChatDbContext _chatDbContext;
	private readonly IGenericRepository<User> _UserRepository;
	public AccountController(UserManager<ApplicationUser> userManager,
							 SignInManager<ApplicationUser> signInManager, ChatDbContext chatDbContext, IGenericRepository<User> UserRepository)
	{
		_userManager = userManager;
		_signInManager = signInManager;
		_chatDbContext = chatDbContext;
		_UserRepository = UserRepository;

	}

	[HttpGet]
	public async Task<IActionResult> Login()
	{
		if (User.Identity.IsAuthenticated)
		{
			return RedirectToAction("Index", "Chat");
		}
		return View();
	}
	[HttpGet]
	public IActionResult AccessDenied()
    {
        return View();
    }
	[HttpGet]
	public IActionResult SignUp()
	{
		return View();
	}
	[HttpPost]
	[Route("Account/SignUp")]
	public async Task<IActionResult> SignUp(RegisterModel model)
	{
		if (!ModelState.IsValid) return View();

		var Identityuser = new ApplicationUser
		{
			UserName = model.FullName,
			Email = model.Email
		};
		var user = new User
		{
			IdentityUserId = Identityuser.Id,
			PhoneNumber = model.PhoneNumber,
			UserStatusTypeId = 2,
			PublicKey = model.PublicKey,
			
		};
		if (model.ProfilePicture != null && model.ProfilePicture.Length > 0)
		{
			var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/uploads");

			if (!Directory.Exists(uploadsFolder))
				Directory.CreateDirectory(uploadsFolder);

			var uniqueFileName = Guid.NewGuid().ToString() + Path.GetExtension(model.ProfilePicture.FileName);
			var filePath = Path.Combine(uploadsFolder, uniqueFileName);

			using (var stream = new FileStream(filePath, FileMode.Create))
			{
				await model.ProfilePicture.CopyToAsync(stream);
			}
			user.ProfilePicUrl = "/uploads/" + uniqueFileName;
		}
		var result = await _userManager.CreateAsync(Identityuser, model.Password);
		if (result.Succeeded)
		{
			_chatDbContext.Users.Add(user);
			await _chatDbContext.SaveChangesAsync();
			await _signInManager.SignInAsync(Identityuser, isPersistent: false);
			return RedirectToAction("Index", "Chat");
		}
		foreach (var error in result.Errors)
		{
			ModelState.AddModelError(string.Empty, error.Description);
		}
		return View(model);
	}
	[HttpPost]
	[Route("Account/Login")]
	public async Task<IActionResult> Login(LoginModel model)
	{
		if (!ModelState.IsValid)
			return View(); 

		var user = await _userManager.FindByEmailAsync(model.UsernameOrEmail) ??
				   await _userManager.FindByNameAsync(model.UsernameOrEmail);

		if (user == null)
		{
			ModelState.AddModelError(string.Empty, "Invalid login attempt.");
			return View(model);
		}

		var result = await _signInManager.PasswordSignInAsync(user.UserName, model.Password, true, false);

		if (result.Succeeded)
			return RedirectToAction("Index", "Chat");

		ModelState.AddModelError(string.Empty, "Invalid login attempt.");
		return View(model);
	}


	[HttpPost]
	[Route("Chat/Logout")]
	public async Task<IActionResult> Logout()
	{
		await _signInManager.SignOutAsync();
		return RedirectToAction("Login", "Account");
	}

	[HttpGet]
	[Authorize]
	[Route("Account/GetCurrentUserData")]
	public async Task<IActionResult> GetCurrentUserData()
	{
		var identityUser = await _userManager.GetUserAsync(User);
		if (identityUser == null)
			return Unauthorized();
		var customUser1 = await _UserRepository.FindOneAsync(u => u.IdentityUserId == identityUser.Id);
		var customUser2 = await _UserRepository.FindOneWithIncludesAsync(u => u.IdentityUserId == identityUser.Id, a => a.Status);

		var customUser = await _chatDbContext.Users
			.Include(u => u.Status)
			.FirstOrDefaultAsync(u => u.IdentityUserId == identityUser.Id);



		if (customUser == null)
			return NotFound();

		var result = new
		{
			identityUser.Id,
			identityUser.UserName,
			identityUser.Email,
			customUser.PhoneNumber,
			customUser.ProfilePicUrl,
			customUser.Bio,
			customUser.PublicKey,
			Status = customUser.Status?.Name
		};

		return Ok(result);
	}

}
  