using System.ComponentModel.DataAnnotations;

public class LoginModel
{
	[Required]
	[Display(Name = "Email or Username")]
	public string UsernameOrEmail { get; set; }

	[Required]
	[DataType(DataType.Password)]
	public string Password { get; set; }
}
