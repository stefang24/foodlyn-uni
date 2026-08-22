using Foodlyn.Modules.Restaurants.Application.DTOs;
using Foodlyn.Modules.Restaurants.Domain.Enums;
using Foodlyn.Shared.Application;

namespace Foodlyn.Modules.Restaurants.Application.Services
{
    public interface IRestaurantTableService
    {
        Task<Result<List<RestaurantTableDto>>> GetByRestaurantAsync(long restaurantId);
        Task<Result<RestaurantTableDto>> GetByIdAsync(long id);
        Task<Result<RestaurantTableDto>> CreateAsync(CreateRestaurantTableDto dto, long userId);
        Task<Result<List<RestaurantTableDto>>> BulkCreateAsync(BulkCreateRestaurantTablesDto dto, long userId);
        Task<Result<RestaurantTableDto>> UpdateAsync(long id, UpdateRestaurantTableDto dto, long userId);
        Task<Result<string>> DeleteAsync(long id);
        Task<Result<RestaurantTableDto>> RotateQrTokenAsync(long id, long userId);
        Task<Result<RestaurantTableDto>> SetStatusAsync(long id, RestaurantTableStatus status, long userId);
        Task<Result<TableQrResolveDto>> ResolveQrTokenAsync(Guid token);
    }
}
