using Foodlyn.Modules.Ordering.Application.DTOs;
using Foodlyn.Modules.Ordering.Domain.Entities;

namespace Foodlyn.Modules.Ordering.Application.Repositories
{
    public interface IOrderRepository
    {
        Task<Order?> GetByIdAsync(long id);
        Task<List<Order>> GetByRestaurantAndStatusesAsync(long restaurantId, IEnumerable<OrderStatus> statuses);
        Task<List<Order>> GetByStatusesAsync(IEnumerable<OrderStatus> statuses);
        Task<List<Order>> GetBySessionAsync(string sessionId);
        Task<List<Order>> GetByUserAsync(long userId);
        Task<List<Order>> GetByTableAsync(long tableId, IEnumerable<OrderStatus> statuses);
        Task<List<Order>> GetHistoryByRestaurantAsync(long restaurantId, int take);
        Task<List<Order>> GetCompletedInRangeAsync(IEnumerable<long>? restaurantIds, DateTime from, DateTime to);
        Task<DateTime?> GetEarliestCompletedDateAsync(IEnumerable<long>? restaurantIds);
        Task<(List<Order> Items, int TotalCount)> GetPagedHistoryAsync(PagedOrderQueryDto query);
        Task<Dictionary<string, decimal>> GetCurrencyRatesToEurAsync();
        Task AddAsync(Order order);
        Task SaveChangesAsync();
    }
}
