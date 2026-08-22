using Foodlyn.Modules.Identity.Application.Repositories;
using Foodlyn.Modules.Identity.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Foodlyn.Persistence.Repositories
{
    public class AuthRepository : IAuthRepository
    {
        private readonly AppDbContext _db;

        public AuthRepository(AppDbContext db) => _db = db;

        public async Task<User?> GetByIdAsync(long id)
            => await _db.Users
                .Include(u => u.RefreshTokens)
                .FirstOrDefaultAsync(u => u.Id == id);

        public async Task<User?> GetByEmailAsync(string email)
            => await _db.Users
                .IgnoreQueryFilters()
                .Include(u => u.RefreshTokens)
                .FirstOrDefaultAsync(u => u.Email == email.ToLower());

        public async Task<User?> GetByUsernameAsync(string username)
            => await _db.Users
                .IgnoreQueryFilters()
                .Include(u => u.RefreshTokens)
                .FirstOrDefaultAsync(u => u.Username == username);

        public async Task<bool> EmailExistsAsync(string email)
            => await _db.Users.IgnoreQueryFilters().AnyAsync(u => u.Email == email.ToLower());

        public async Task<bool> UsernameExistsAsync(string username)
            => await _db.Users.IgnoreQueryFilters().AnyAsync(u => u.Username == username);

        public async Task AddAsync(User user)
            => await _db.Users.AddAsync(user);

        public async Task AddUserAndSaveAsync(User user)
        {
            await _db.Users.AddAsync(user);
            await _db.SaveChangesAsync();
        }

        public async Task AddRefreshTokenAsync(RefreshToken refreshToken)
            => await _db.RefreshTokens.AddAsync(refreshToken);

        public async Task<RefreshToken?> GetRefreshTokenAsync(string token)
            => await _db.RefreshTokens
                .IgnoreQueryFilters()
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Token == token);

        public async Task SaveChangesAsync()
            => await _db.SaveChangesAsync();
    }
}
