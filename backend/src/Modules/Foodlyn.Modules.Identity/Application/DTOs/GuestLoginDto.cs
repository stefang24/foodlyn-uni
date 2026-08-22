namespace Foodlyn.Modules.Identity.Application.DTOs
{
    public class GuestLoginDto
    {
        public long RestaurantId { get; set; }
        public long TableId { get; set; }
    }

    public class GuestSessionDto
    {
        public long RestaurantId { get; set; }
        public long TableId { get; set; }
        public string SessionId { get; set; } = string.Empty;
        public string Role { get; set; } = "Guest";
    }
}
