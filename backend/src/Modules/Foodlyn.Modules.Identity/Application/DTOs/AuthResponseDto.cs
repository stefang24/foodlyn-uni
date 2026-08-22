namespace Foodlyn.Modules.Identity.Application.DTOs
{
    public class AuthResponseDto
    {
        public long UserId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public long? RestaurantId { get; set; }
        public string? ProfilePictureUrl { get; set; }
    }
}
