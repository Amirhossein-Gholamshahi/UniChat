using System.ComponentModel.DataAnnotations;

public class RegisterModel
{
	[Required]
	[Display(Name = "Full Name")]
	public string FullName { get; set; }

	[Required]
	[EmailAddress]
	public string Email { get; set; }

	[StringLength(11, MinimumLength = 11, ErrorMessage = "Phone number must be exactly 11 digits.")]
	[RegularExpression(@"^\d{11}$", ErrorMessage = "Phone number must be 11 digits.")]
	public string? PhoneNumber { get; set; }

	[Required]
	[DataType(DataType.Password)]
	public string Password { get; set; }

	[Required]
	[DataType(DataType.Password)]
	[Compare("Password", ErrorMessage = "Passwords do not match.")]
	[Display(Name = "Confirm Password")]
	public string ConfirmPassword { get; set; }

	[Display(Name = "Accept Terms")]
	[Range(typeof(bool), "true", "true", ErrorMessage = "You must accept the terms and conditions.")]
	public bool HasAcceptedTerms { get; set; }

	[Display(Name = "Profile Picture")]
	public IFormFile? ProfilePicture { get; set; }
	public string PublicKey { get; set; }

}
public class UpdateProfileDto
{
	public string Username { get; set; }
	public string Phone { get; set; }
	public string Bio { get; set; }
	public IFormFile ProfilePicture { get; set; }
}
