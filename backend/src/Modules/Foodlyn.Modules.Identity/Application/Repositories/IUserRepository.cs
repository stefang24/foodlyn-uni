using Foodlyn.Modules.Identity.Application.DTOs;
using Foodlyn.Modules.Identity.Domain.Entities;

namespace Foodlyn.Modules.Identity.Application.Repositories
{
    public interface IUserRepository
    {
        Task<List<User>> GetAllWithAssignmentsAsync();
        Task<(List<User> Items, int TotalCount)> GetPagedAsync(PagedUserQueryDto query);
        Task<User?> GetByIdWithAssignmentsAsync(long id);
        Task<bool> EmailExistsForOtherAsync(string email, long userId);
        Task<bool> UsernameExistsForOtherAsync(string username, long userId);
        Task ClearAssignmentsAsync(long userId);
        Task AddAssignmentAsync(RestaurantAssignment assignment);
        Task SaveChangesAsync();
        Task<bool> EmailExistsAsync(string email);
        Task<bool> UsernameExistsAsync(string email);
        Task AddAsync(User user);
        Task<List<long>> GetAssignedRestaurantIdsAsync(long userId);
        Task<bool> RestaurantExistsAsync(long restaurantId);
    }
}
