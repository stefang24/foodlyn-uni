using Foodlyn.Modules.Ordering.Application.DTOs;
using Foodlyn.Shared.Application;

namespace Foodlyn.Modules.Ordering.Application.Services
{
    public class ResolvedOrderContext
    {
        public long RestaurantId { get; set; }
        public long TableId { get; set; }
        public int TableNumber { get; set; }
        public string? TableLabel { get; set; }
        public List<ResolvedOrderItem> Items { get; set; } = new();
        public string? DeliveryNotes { get; set; }
        public string? CustomerName { get; set; }
        public string? SessionId { get; set; }
        public bool IsStaffOrder { get; set; }
        public long? UserId { get; set; }
        public int PartySize { get; set; }
        public Domain.Entities.PaymentMethod? PaymentMethod { get; set; }
        public string? Currency { get; set; }
    }

    public class ResolvedOrderItem
    {
        public long MenuItemId { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Quantity { get; set; }
        public string? Notes { get; set; }
        public List<ResolvedOrderModifier> Modifiers { get; set; } = new();
    }

    public class ResolvedOrderModifier
    {
        public long? MenuItemModifierId { get; set; }
        public string GroupName { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
    }

    public enum TableProgress
    {
        NoActive,
        StillCooking,
        AllServed,
    }

    public interface IOrderService
    {
        Task<Result<OrderDto>> GetByIdAsync(long id);
        Task<Result<List<OrderDto>>> GetCashierQueueAsync(long restaurantId);
        Task<Result<List<OrderDto>>> GetKitchenQueueAsync(long restaurantId);
        Task<Result<List<OrderDto>>> GetWaiterQueueAsync(long restaurantId);
        Task<Result<List<OrderDto>>> GetAwaitingPaymentAsync(long restaurantId);
        Task<Result<List<OrderDto>>> GetHistoryAsync(long restaurantId, int take = 100);
        Task<Result<PagedResult<OrderDto>>> GetPagedHistoryAsync(PagedOrderQueryDto query);
        Task<Result<List<OrderDto>>> GetActiveByRestaurantAsync(long restaurantId);
        Task<Result<List<OrderDto>>> GetLiveByRestaurantAsync(long restaurantId);
        Task<Result<List<OrderDto>>> GetLiveAllAsync();
        Task<Result<List<OrderDto>>> GetMineAsync(long? userId, string? sessionId, long? tableId = null);
        Task<Result<OrderDto>> CreateAsync(ResolvedOrderContext ctx);
        Task<Result<OrderDto>> ApproveAsync(long id, long userId, long restaurantId);
        Task<Result<OrderDto>> RejectAsync(long id, RejectOrderDto dto, long userId, long restaurantId);
        Task<Result<OrderDto>> StartPreparingAsync(long id, StartPreparingDto dto, long userId, long restaurantId);
        Task<Result<OrderDto>> MarkReadyAsync(long id, long userId, long restaurantId);
        Task<Result<OrderDto>> MarkServedAsync(long id, long userId, long restaurantId);
        Task<Result<OrderDto>> MarkPaidAsync(long id, long userId, long restaurantId);
        Task<Result<OrderDto>> CancelAsync(long id, long? userId, string? sessionId);
        Task<bool> HasUnsettledForTableAsync(long tableId);
        Task<long?> GetJoinableStaffOrderIdForTableAsync(long tableId);
        Task<long?> GetMyLiveOrderIdForTableAsync(long tableId, long? userId, string? sessionId, bool anyForTableGuest);
        Task<Result<List<OrderDto>>> GetActiveAtTableAsync(long tableId);
        Task<TableProgress> GetTableProgressAsync(long tableId);
        Task<Result<OrderAnalyticsDto>> GetAnalyticsAsync(OrderAnalyticsQueryDto query);
        Task<Result<List<TopRestaurantStatDto>>> GetLifetimeTopRestaurantsAsync();
    }
}
