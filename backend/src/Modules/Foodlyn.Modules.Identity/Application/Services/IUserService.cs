using Foodlyn.Modules.Identity.Application.DTOs;
using Foodlyn.Modules.Identity.Domain.Enums;
using Foodlyn.Shared.Application;

namespace Foodlyn.Modules.Identity.Application.Services
{
    public interface IUserService
    {
        Task<Result<List<UserDto>>> GetAllAsync();
        Task<Result<PagedResult<UserDto>>> GetPagedAsync(PagedUserQueryDto query);
        Task<Result<List<UserDto>>> GetByRestaurantIdsAsync(IEnumerable<long> restaurantIds);
        Task<Result<string>> CreateAccountAsync(RegisterDto dto, long creatorId, UserRole creatorRole);
        Task<Result<UserDto>> GetByIdAsync(long id);
        Task<Result<UserDto>> UpdateAsync(long id, UpdateUserDto dto, long updaterId);
        Task<Result<UserDto>> UpdateAsManagerAsync(long id, UpdateUserDto dto, long managerId);
        Task<Result<string>> ResetPasswordByAdminAsync(long targetUserId, AdminResetPasswordDto dto, long actorId);
        Task<Result<UserDto>> UpdateMyProfileAsync(long userId, UpdateMyProfileDto dto);
        Task<Result<string>> ChangePasswordAsync(long userId, ChangePasswordDto dto);
        Task<List<long>> GetAssignedRestaurantIdsAsync(long userId);
    }
}
