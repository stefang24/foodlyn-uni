using Foodlyn.Modules.Identity.Application.DTOs;
using Foodlyn.Modules.Identity.Application.Repositories;
using Foodlyn.Modules.Identity.Domain.Entities;
using Foodlyn.Modules.Identity.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Foodlyn.Persistence.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly AppDbContext _db;

        public UserRepository(AppDbContext db) => _db = db;

        public async Task<List<User>> GetAllWithAssignmentsAsync()
            => await _db.Users
                .IgnoreQueryFilters()
                .Include(u => u.RestaurantAssignments)
                .OrderBy(u => u.Username)
                .ToListAsync();

        public async Task<(List<User> Items, int TotalCount)> GetPagedAsync(PagedUserQueryDto query)
        {
            var q = _db.Users
                .IgnoreQueryFilters()
                .Include(u => u.RestaurantAssignments)
                .AsQueryable();

            if (query.RestrictToRestaurantIds is { Count: > 0 })
            {
                var ids = query.RestrictToRestaurantIds;
                q = q.Where(u =>
                    (u.RestaurantId.HasValue && ids.Contains(u.RestaurantId.Value)) ||
                    u.RestaurantAssignments.Any(a => ids.Contains(a.RestaurantId)));
            }

            if (query.RestaurantId.HasValue)
            {
                var rid = query.RestaurantId.Value;
                q = q.Where(u =>
                    u.RestaurantId == rid ||
                    u.RestaurantAssignments.Any(a => a.RestaurantId == rid));
            }

            if (!string.IsNullOrWhiteSpace(query.Role) && Enum.TryParse<UserRole>(query.Role, true, out var role))
            {
                q = q.Where(u => u.Role == role);
            }

            if (query.IsActive.HasValue)
            {
                var active = query.IsActive.Value;
                q = q.Where(u => u.IsActive == active);
            }

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var s = query.Search.Trim().ToLower();
                q = q.Where(u =>
                    u.Username.ToLower().Contains(s) ||
                    u.Email.ToLower().Contains(s) ||
                    (u.FirstName != null && u.FirstName.ToLower().Contains(s)) ||
                    (u.LastName != null && u.LastName.ToLower().Contains(s)));
            }

            var total = await q.CountAsync();

            q = (query.SortBy?.ToLowerInvariant()) switch
            {
                "email" => query.SortAsc ? q.OrderBy(u => u.Email) : q.OrderByDescending(u => u.Email),
                "role" => query.SortAsc ? q.OrderBy(u => u.Role) : q.OrderByDescending(u => u.Role),
                "isactive" => query.SortAsc ? q.OrderBy(u => u.IsActive) : q.OrderByDescending(u => u.IsActive),
                "createdat" => query.SortAsc ? q.OrderBy(u => u.CreatedAt) : q.OrderByDescending(u => u.CreatedAt),
                "lastloginat" => query.SortAsc ? q.OrderBy(u => u.LastLoginAt) : q.OrderByDescending(u => u.LastLoginAt),
                "fullname" => query.SortAsc
                    ? q.OrderBy(u => u.FirstName).ThenBy(u => u.LastName)
                    : q.OrderByDescending(u => u.FirstName).ThenByDescending(u => u.LastName),
                _ => query.SortAsc ? q.OrderBy(u => u.Username) : q.OrderByDescending(u => u.Username),
            };

            var items = await q.Skip(query.Skip).Take(query.SafePageSize).ToListAsync();
            return (items, total);
        }

        public async Task<User?> GetByIdWithAssignmentsAsync(long id)
            => await _db.Users
                .IgnoreQueryFilters()
                .Include(u => u.RestaurantAssignments)
                .FirstOrDefaultAsync(u => u.Id == id);

        public async Task<bool> EmailExistsForOtherAsync(string email, long userId)
            => await _db.Users
                .IgnoreQueryFilters()
                .AnyAsync(u => u.Email == email.ToLower() && u.Id != userId);

        public async Task<bool> UsernameExistsForOtherAsync(string username, long userId)
            => await _db.Users
                .IgnoreQueryFilters()
                .AnyAsync(u => u.Username == username && u.Id != userId);

        public async Task ClearAssignmentsAsync(long userId)
        {
            var existing = await _db.RestaurantAssignments
                .Where(a => a.UserId == userId)
                .ToListAsync();
            _db.RestaurantAssignments.RemoveRange(existing);
        }

        public async Task AddAssignmentAsync(RestaurantAssignment assignment)
            => await _db.RestaurantAssignments.AddAsync(assignment);

        public async Task SaveChangesAsync()
            => await _db.SaveChangesAsync();

        public async Task<bool> EmailExistsAsync(string email)
            => await _db.Users.IgnoreQueryFilters().AnyAsync(u => u.Email == email.ToLower());

        public async Task<bool> UsernameExistsAsync(string username)
            => await _db.Users.IgnoreQueryFilters().AnyAsync(u => u.Username == username);

        public async Task AddAsync(User user)
            => await _db.Users.AddAsync(user);

        public async Task<List<long>> GetAssignedRestaurantIdsAsync(long userId)
            => await _db.RestaurantAssignments
                .Where(a => a.UserId == userId)
                .Select(a => a.RestaurantId)
                .ToListAsync();

        public async Task<bool> RestaurantExistsAsync(long restaurantId)
            => await _db.Restaurants.AnyAsync(r => r.Id == restaurantId);
    }
}
