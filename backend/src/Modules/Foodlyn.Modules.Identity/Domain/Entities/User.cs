using Foodlyn.Modules.Identity.Domain.Enums;
using Foodlyn.Shared.Domain;

namespace Foodlyn.Modules.Identity.Domain.Entities
{
    public class User : BaseEntity, ITenantEntity, IAuditableEntity
    {
        public long? RestaurantId { get; set; }
        public string? FirstName { get; set; } = string.Empty;
        public string? LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public UserRole Role { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime? LastLoginAt { get; set; }
        public string? ProfilePictureUrl { get; set; }

        public bool IsEmailVerified { get; set; } = false;
        public string? EmailVerificationCodeHash { get; set; }
        public DateTime? EmailVerificationCodeExpiresAt { get; set; }
        public DateTime? LastVerificationCodeSentAt { get; set; }

        public List<RefreshToken>? RefreshTokens { get; set; } = new();
        public List<RestaurantAssignment> RestaurantAssignments { get; set; } = new();

        public string? FullName => $"{FirstName} {LastName}";

        public long? CreatedBy { get; set; }
        public long? UpdatedBy { get; set; }
    }
}
