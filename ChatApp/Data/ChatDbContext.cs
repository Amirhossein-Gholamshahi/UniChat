using Microsoft.EntityFrameworkCore;
using ChatApp.Models.Chat;
using ChatApp.Models;

namespace ChatApp.Data
{
	public class ChatDbContext : DbContext
	{
		public ChatDbContext(DbContextOptions<ChatDbContext> options)
			: base(options)
		{
		}

		public DbSet<Message> Messages { get; set; }
		public DbSet<User> Users { get; set; }
		public DbSet<MessageType> MessageTypes { get; set; }
		public DbSet<UserStatusType> UserStatusTypes { get; set; }
		public DbSet<Contact> Contacts { get; set; }
		public DbSet<Group> Groups { get; set; }
		public DbSet<UserGroupKey> UserGroupKeys { get; set; }


		protected override void OnModelCreating(ModelBuilder modelBuilder)
		{
			base.OnModelCreating(modelBuilder);
			modelBuilder.HasDefaultSchema("dbo");
			modelBuilder.Entity<User>().ToTable("Users","dbo");

			modelBuilder.Entity<Message>()
				.HasOne(m => m.Sender)   
				.WithMany()                
				.HasForeignKey(m => m.SenderId)  
				.OnDelete(DeleteBehavior.Restrict);  

			modelBuilder.Entity<Message>()
				.HasOne(m => m.Receiver)  
				.WithMany()                
				.HasForeignKey(m => m.ReceiverId) 
				.OnDelete(DeleteBehavior.Restrict);

			modelBuilder.Entity<Message>()
			   .HasOne(m => m.MessageType)  
			   .WithMany()
			   .HasForeignKey(m => m.MessageTypeId);

			modelBuilder.Entity<User>()
			   .HasOne(m => m.Status)
			   .WithMany()
			   .HasForeignKey(m => m.UserStatusTypeId);

			modelBuilder.Entity<User>()
			   .HasMany(u => u.Groups)
			   .WithMany(g => g.Members);

			modelBuilder.Entity<Group>()
			  .HasOne(g => g.Owner)
			  .WithMany()          
			  .HasForeignKey(g => g.OwnerId)
			  .OnDelete(DeleteBehavior.Restrict);

			modelBuilder.Entity<Contact>()
				.HasOne(c => c.OwnerUser)
				.WithMany(u => u.Contacts)
				.HasForeignKey(c => c.OwnerUserId)
				.OnDelete(DeleteBehavior.Restrict);

			modelBuilder.Entity<Contact>()
				.HasOne(c => c.ContactUser)
				.WithMany()
				.HasForeignKey(c => c.ContactUserId)
				.OnDelete(DeleteBehavior.Restrict);


			modelBuilder.Entity<MessageType>().HasData(
				new MessageType { MessageTypeId = 1, Name = "Text" },
				new MessageType { MessageTypeId = 2, Name = "Video" },
				new MessageType { MessageTypeId = 3, Name = "Photo" },
				new MessageType { MessageTypeId = 4, Name = "Voice" }
				);

			modelBuilder.Entity<UserStatusType>().HasData(
				new UserStatusType { UserStatusTypeId = 1, Name = "Online" },
				new UserStatusType { UserStatusTypeId = 2, Name = "Offline" }
				);

			modelBuilder.Entity<User>().HasData(
				new User { UserId = 5000000, IdentityUserId = "ai-1", UserStatusTypeId = 1, PublicKey = "AI Assitant" }
				);

		}
		}
}
