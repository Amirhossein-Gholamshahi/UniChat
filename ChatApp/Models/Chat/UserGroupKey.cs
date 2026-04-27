using ChatApp.Models;
using Microsoft.AspNetCore.Identity;

public class UserGroupKey
{
	public long UserGroupKeyId { get; set; }
	public long GroupId { get; set; }
	public long UserId { get; set; }
	public string EncryptedGroupKey { get; set; }
	public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

}


