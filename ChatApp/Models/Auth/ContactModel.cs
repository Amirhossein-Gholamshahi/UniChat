using System.ComponentModel.DataAnnotations;

public class ContactModel
{
	[Required]
	public string Username { get; set; }

	//[Required]
	//[DataType(DataType.Password)]
	//public string Password { get; set; }
}
