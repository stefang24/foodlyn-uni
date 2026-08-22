using Foodlyn.Modules.Restaurants.Domain.Entities;

namespace Foodlyn.Modules.Restaurants.Application.Repositories
{
    public interface IRestaurantTableRepository
    {
        Task<List<RestaurantTable>> GetByRestaurantAsync(long restaurantId);
        Task<RestaurantTable?> GetByIdAsync(long id);
        Task<RestaurantTable?> GetByQrTokenAsync(Guid token);
        Task<bool> NumberExistsAsync(long restaurantId, int number, long? excludeId = null);
        Task<int> GetMaxNumberAsync(long restaurantId);
        Task AddAsync(RestaurantTable table);
        Task AddRangeAsync(IEnumerable<RestaurantTable> tables);
        void Remove(RestaurantTable table);
        Task SaveChangesAsync();
    }
}
