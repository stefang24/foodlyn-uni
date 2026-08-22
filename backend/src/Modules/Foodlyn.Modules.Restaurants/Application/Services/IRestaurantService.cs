using Foodlyn.Modules.Restaurants.Application.DTOs;
using Foodlyn.Shared.Application;

namespace Foodlyn.Modules.Restaurants.Application.Services
{
    public interface IRestaurantService
    {
        Task<Result<RestaurantDto>> CreateAsync(CreateRestaurantDto dto, long userId);
        Task<Result<List<RestaurantDto>>> GetAllAsync();
        Task<Result<List<RestaurantDto>>> GetByIdsAsync(IEnumerable<long> ids);
        Task<Result<RestaurantDto>> GetByIdAsync(long id);
        Task<Result<RestaurantDto>> GetBySlugAsync(string slug);
        Task<Result<List<RestaurantDto>>> GetPublicActiveAsync();
        Task<Result<PagedResult<RestaurantDto>>> GetPagedAsync(PagedRestaurantQueryDto query);
        Task<Result<RestaurantDto>> UpdateAsync(long id, UpdateRestaurantDto dto, long userId, bool allowRename);
        Task<Result<List<RestaurantOpeningHourDto>>> GetOpeningHoursAsync(long restaurantId);
        Task<Result<List<RestaurantOpeningHourDto>>> SaveOpeningHoursAsync(long restaurantId, UpdateOpeningHoursDto dto);
    }
}
