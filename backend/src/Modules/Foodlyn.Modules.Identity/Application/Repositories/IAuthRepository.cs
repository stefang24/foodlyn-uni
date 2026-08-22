using Foodlyn.Modules.Identity.Domain.Entities;

namespace Foodlyn.Modules.Identity.Application.Repositories
{
    public interface IAuthRepository
    {
        Task<User?> GetByIdAsync(long id);
        Task<User?> GetByEmailAsync(string email);
        Task<User?> GetByUsernameAsync(string email);
        Task<bool> EmailExistsAsync(string email);
        Task<bool> UsernameExistsAsync(string username);
        Task AddAsync(User user);
        Task AddUserAndSaveAsync(User user);
        Task AddRefreshTokenAsync(RefreshToken refreshToken);
        Task<RefreshToken?> GetRefreshTokenAsync(string token);
        Task SaveChangesAsync();
    }
}
