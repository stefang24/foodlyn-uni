namespace Foodlyn.Modules.Identity.Application.DTOs
{
    public class UpdateMyProfileDto
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string? ProfilePictureUrl { get; set; }
    }
}
