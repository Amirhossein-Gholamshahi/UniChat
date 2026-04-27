using ChatApp.Models;
using Microsoft.AspNetCore.Identity;

public class Contact
{
	public long ContactId { get; set; }

	public long OwnerUserId { get; set; }     // The user who added the contact
	public User OwnerUser { get; set; }

	public long ContactUserId { get; set; }   // The user who was added as contact
	public User ContactUser { get; set; }

}


