namespace ChatApp.Models.Chat
{
	public class Message
	{
		public long MessageId { get; set; } 
		public long SenderId { get; set; }
		public User Sender { get; set; }
		public long ReceiverId { get; set; }
		public User Receiver { get; set; }

		public long MessageTypeId { get; set; }
		public MessageType MessageType { get; set; }
		public string Content { get; set; }
		public string SenderContent { get; set; }
		public bool IsSeen { get; set; }
		public bool isGroup { get; set; }

		public DateTime Timestamp { get; set; } = DateTime.UtcNow;
	}
}
