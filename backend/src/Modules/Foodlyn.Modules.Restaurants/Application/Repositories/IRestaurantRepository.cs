using Foodlyn.Modules.Restaurants.Application.DTOs;
using Foodlyn.Modules.Restaurants.Domain.Entities;

namespace Foodlyn.Modules.Restaurants.Application.Repositories
{
    public interface IRestaurantRepository
    {
        Task<bool> SlugExistsAsync(string slug);
        Task<bool> NameExistsAsync(string name);
        Task<List<Restaurant>> GetAllAsync();
        Task<(List<Restaurant> Items, int TotalCount)> GetPagedAsync(PagedRestaurantQueryDto query);
        Task<List<Restaurant>> GetByIdsAsync(IEnumerable<long> ids);
        Task<Restaurant?> GetByIdAsync(long id);
        Task<Restaurant?> GetBySlugAsync(string slug);
        Task AddAsync(Restaurant restaurant);
        Task SaveChangesAsync();

        Task<List<RestaurantOpeningHour>> GetOpeningHoursAsync(long restaurantId);
        Task ReplaceOpeningHoursAsync(long restaurantId, IEnumerable<RestaurantOpeningHour> hours);
    }
}
