using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ChatApp.Models.Auth;
using Microsoft.AspNetCore.Authorization;
public class ChatController : Controller
{
	private readonly UserManager<ApplicationUser> _userManager;
	private readonly SignInManager<ApplicationUser> _signInManager;

	public ChatController(UserManager<ApplicationUser> userManager,
							 SignInManager<ApplicationUser> signInManager)
	{
		_userManager = userManager;
		_signInManager = signInManager;
	}
	[Authorize]
	[HttpGet]
	public IActionResult Index()
	{
		return View();
	}
	[Authorize(Roles = "Admin")]
	public IActionResult AdminOnly()
	{
		return View();
	}


}
