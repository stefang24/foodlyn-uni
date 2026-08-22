using Foodlyn.Modules.Restaurants.Application.Repositories;
using Foodlyn.Modules.Restaurants.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Foodlyn.Persistence.Repositories
{
    public class RestaurantTableRepository : IRestaurantTableRepository
    {
        private readonly AppDbContext _db;

        public RestaurantTableRepository(AppDbContext db) => _db = db;

        public async Task<List<RestaurantTable>> GetByRestaurantAsync(long restaurantId)
            => await _db.RestaurantTables
                .IgnoreQueryFilters()
                .Where(t => t.RestaurantId == restaurantId)
                .OrderBy(t => t.Number)
                .ToListAsync();

        public async Task<RestaurantTable?> GetByIdAsync(long id)
            => await _db.RestaurantTables
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(t => t.Id == id);

        public async Task<RestaurantTable?> GetByQrTokenAsync(Guid token)
            => await _db.RestaurantTables
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(t => t.QrToken == token);

        public async Task<bool> NumberExistsAsync(long restaurantId, int number, long? excludeId = null)
            => await _db.RestaurantTables
                .IgnoreQueryFilters()
                .AnyAsync(t => t.RestaurantId == restaurantId
                               && t.Number == number
                               && (excludeId == null || t.Id != excludeId));

        public async Task<int> GetMaxNumberAsync(long restaurantId)
            => await _db.RestaurantTables
                .IgnoreQueryFilters()
                .Where(t => t.RestaurantId == restaurantId)
                .Select(t => (int?)t.Number)
                .MaxAsync() ?? 0;

        public async Task AddAsync(RestaurantTable table)
            => await _db.RestaurantTables.AddAsync(table);

        public async Task AddRangeAsync(IEnumerable<RestaurantTable> tables)
            => await _db.RestaurantTables.AddRangeAsync(tables);

        public void Remove(RestaurantTable table)
            => _db.RestaurantTables.Remove(table);

        public async Task SaveChangesAsync()
            => await _db.SaveChangesAsync();
    }
}
