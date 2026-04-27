using ChatApp.Models;

public class User
{
	public long UserId { get; set; }
	public string IdentityUserId { get; set; }
	public ICollection<Contact> Contacts { get; set; } = new List<Contact>();
	public string? ProfilePicUrl { get; set; }
	public string? PhoneNumber { get; set; }
	public string? Bio { get; set; }
	public long UserStatusTypeId { get; set; }
	public UserStatusType Status { get; set; }
	public string PublicKey { get; set; }

	public ICollection<Group> Groups { get; set; } = new List<Group>();
}


