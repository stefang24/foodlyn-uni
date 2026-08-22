namespace Foodlyn.Modules.Notifications.Application.DTOs
{
    public class NotificationDto
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public long? RestaurantId { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Body { get; set; }
        public string? Data { get; set; }
        public bool IsRead { get; set; }
        public DateTime? ReadAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class NotificationUnreadCountDto
    {
        public int Count { get; set; }
    }
}
