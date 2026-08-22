namespace Foodlyn.Modules.Identity.Application.DTOs
{
    public class UpdateUserDto
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public long? RestaurantId { get; set; }
        public List<long> RestaurantIds { get; set; } = new();
        public bool IsActive { get; set; }
    }
}
