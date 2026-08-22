using Foodlyn.Modules.Identity.Application.DTOs;
using Foodlyn.Modules.Identity.Domain.Entities;
using Mapster;

namespace Foodlyn.Modules.Identity.Application.Mappings
{
    public class IdentityMappingProfile : IRegister
    {
        public void Register(TypeAdapterConfig config)
        {
            config.NewConfig<User, UserDto>()
                .Map(d => d.Role, s => s.Role.ToString())
                .Map(d => d.RestaurantIds, s => s.RestaurantAssignments.Select(a => a.RestaurantId).ToList());

            config.NewConfig<RegisterDto, User>()
                .Ignore(d => d.Id)
                .Ignore(d => d.PasswordHash)
                .Ignore(d => d.Role)
                .Ignore(d => d.RestaurantAssignments)
                .Ignore(d => d.RefreshTokens)
                .Ignore(d => d.IsActive)
                .Ignore(d => d.LastLoginAt)
                .Ignore(d => d.IsEmailVerified)
                .Ignore(d => d.EmailVerificationCodeHash)
                .Ignore(d => d.EmailVerificationCodeExpiresAt)
                .Ignore(d => d.LastVerificationCodeSentAt)
                .Ignore(d => d.CreatedAt)
                .Ignore(d => d.UpdatedAt)
                .Ignore(d => d.CreatedBy)
                .Ignore(d => d.UpdatedBy)
                .Map(d => d.FirstName, s => s.FirstName != null ? s.FirstName.Trim() : null)
                .Map(d => d.LastName, s => s.LastName != null ? s.LastName.Trim() : null)
                .Map(d => d.Email, s => s.Email.Trim().ToLower())
                .Map(d => d.Username, s => s.Username.Trim());

            config.NewConfig<UpdateUserDto, User>()
                .Ignore(d => d.Id)
                .Ignore(d => d.PasswordHash)
                .Ignore(d => d.Role)
                .Ignore(d => d.RestaurantAssignments)
                .Ignore(d => d.RefreshTokens)
                .Ignore(d => d.LastLoginAt)
                .Ignore(d => d.IsEmailVerified)
                .Ignore(d => d.EmailVerificationCodeHash)
                .Ignore(d => d.EmailVerificationCodeExpiresAt)
                .Ignore(d => d.LastVerificationCodeSentAt)
                .Ignore(d => d.CreatedAt)
                .Ignore(d => d.UpdatedAt)
                .Ignore(d => d.CreatedBy)
                .Ignore(d => d.UpdatedBy)
                .Map(d => d.FirstName, s => s.FirstName != null ? s.FirstName.Trim() : null)
                .Map(d => d.LastName, s => s.LastName != null ? s.LastName.Trim() : null)
                .Map(d => d.Email, s => s.Email.Trim().ToLower())
                .Map(d => d.Username, s => s.Username.Trim());

            config.NewConfig<UpdateMyProfileDto, User>()
                .Ignore(d => d.Id)
                .Ignore(d => d.PasswordHash)
                .Ignore(d => d.Role)
                .Ignore(d => d.RestaurantId)
                .Ignore(d => d.RestaurantAssignments)
                .Ignore(d => d.RefreshTokens)
                .Ignore(d => d.IsActive)
                .Ignore(d => d.LastLoginAt)
                .Ignore(d => d.IsEmailVerified)
                .Ignore(d => d.EmailVerificationCodeHash)
                .Ignore(d => d.EmailVerificationCodeExpiresAt)
                .Ignore(d => d.LastVerificationCodeSentAt)
                .Ignore(d => d.CreatedAt)
                .Ignore(d => d.UpdatedAt)
                .Ignore(d => d.CreatedBy)
                .Ignore(d => d.UpdatedBy)
                .Map(d => d.FirstName, s => s.FirstName != null ? s.FirstName.Trim() : null)
                .Map(d => d.LastName, s => s.LastName != null ? s.LastName.Trim() : null)
                .Map(d => d.Email, s => s.Email.Trim().ToLower())
                .Map(d => d.Username, s => s.Username.Trim());
        }
    }
}
