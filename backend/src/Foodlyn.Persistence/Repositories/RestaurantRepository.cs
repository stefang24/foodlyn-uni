using Foodlyn.Modules.Restaurants.Application.DTOs;
using Foodlyn.Modules.Restaurants.Application.Repositories;
using Foodlyn.Modules.Restaurants.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Foodlyn.Persistence.Repositories
{
    public class RestaurantRepository : IRestaurantRepository
    {
        private readonly AppDbContext _db;

        public RestaurantRepository(AppDbContext db) => _db = db;

        public async Task<bool> SlugExistsAsync(string slug)
            => await _db.Restaurants.AnyAsync(r => r.Slug == slug);

        public async Task<bool> NameExistsAsync(string name)
            => await _db.Restaurants.AnyAsync(r => r.Name == name);

        public async Task<List<Restaurant>> GetAllAsync()
            => await _db.Restaurants.OrderBy(r => r.Name).ToListAsync();

        public async Task<(List<Restaurant> Items, int TotalCount)> GetPagedAsync(PagedRestaurantQueryDto query)
        {
            var q = _db.Restaurants.IgnoreQueryFilters().AsQueryable();

            if (query.RestrictToIds is { Count: > 0 })
                q = q.Where(r => query.RestrictToIds.Contains(r.Id));

            if (query.IsActive.HasValue)
                q = q.Where(r => r.IsActive == query.IsActive.Value);

            if (!string.IsNullOrWhiteSpace(query.Cuisine))
            {
                var c = query.Cuisine.Trim().ToLower();
                q = q.Where(r => r.Cuisine != null && r.Cuisine.ToLower() == c);
            }

            if (!string.IsNullOrWhiteSpace(query.City))
            {
                var c = query.City.Trim().ToLower();
                q = q.Where(r => r.City != null && r.City.ToLower() == c);
            }

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var s = query.Search.Trim().ToLower();
                q = q.Where(r =>
                    r.Name.ToLower().Contains(s) ||
                    (r.City != null && r.City.ToLower().Contains(s)) ||
                    (r.Cuisine != null && r.Cuisine.ToLower().Contains(s)) ||
                    (r.Email != null && r.Email.ToLower().Contains(s)) ||
                    r.Slug.ToLower().Contains(s));
            }

            var total = await q.CountAsync();

            q = (query.SortBy?.ToLowerInvariant()) switch
            {
                "city" => query.SortAsc ? q.OrderBy(r => r.City) : q.OrderByDescending(r => r.City),
                "cuisine" => query.SortAsc ? q.OrderBy(r => r.Cuisine) : q.OrderByDescending(r => r.Cuisine),
                "isactive" => query.SortAsc ? q.OrderBy(r => r.IsActive) : q.OrderByDescending(r => r.IsActive),
                "createdat" => query.SortAsc ? q.OrderBy(r => r.CreatedAt) : q.OrderByDescending(r => r.CreatedAt),
                _ => query.SortAsc ? q.OrderBy(r => r.Name) : q.OrderByDescending(r => r.Name),
            };

            var items = await q.Skip(query.Skip).Take(query.SafePageSize).ToListAsync();
            return (items, total);
        }

        public async Task<List<Restaurant>> GetByIdsAsync(IEnumerable<long> ids)
            => await _db.Restaurants
                .Where(r => ids.Contains(r.Id))
                .OrderBy(r => r.Name)
                .ToListAsync();

        public async Task<Restaurant?> GetByIdAsync(long id)
            => await _db.Restaurants.FirstOrDefaultAsync(r => r.Id == id);

        public async Task<Restaurant?> GetBySlugAsync(string slug)
            => await _db.Restaurants.FirstOrDefaultAsync(r => r.Slug == slug);

        public async Task AddAsync(Restaurant restaurant)
            => await _db.Restaurants.AddAsync(restaurant);

        public async Task SaveChangesAsync()
            => await _db.SaveChangesAsync();

        public async Task<List<RestaurantOpeningHour>> GetOpeningHoursAsync(long restaurantId)
            => await _db.RestaurantOpeningHours
                .Where(h => h.RestaurantId == restaurantId)
                .OrderBy(h => h.DayOfWeek)
                .ToListAsync();

        public async Task ReplaceOpeningHoursAsync(long restaurantId, IEnumerable<RestaurantOpeningHour> hours)
        {
            var existing = await _db.RestaurantOpeningHours
                .Where(h => h.RestaurantId == restaurantId)
                .ToListAsync();
            _db.RestaurantOpeningHours.RemoveRange(existing);
            foreach (var h in hours)
            {
                h.RestaurantId = restaurantId;
                await _db.RestaurantOpeningHours.AddAsync(h);
            }
        }
    }
}
