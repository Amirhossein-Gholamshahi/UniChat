namespace ChatApp.Models
{
	public class Group
	{
		public long GroupId { get; set; }
		public string Name { get; set; }
		public DateTime CreatedAt { get; set; }
		public long OwnerId { get; set; }  
		public User Owner { get; set; }
		public ICollection<User> Members { get; set; } = new List<User>();
	}
}
