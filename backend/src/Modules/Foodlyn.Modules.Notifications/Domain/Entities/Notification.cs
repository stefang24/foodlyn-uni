using Foodlyn.Shared.Domain;

namespace Foodlyn.Modules.Notifications.Domain.Entities
{
    public class Notification : BaseEntity
    {
        public long UserId { get; set; }
        public long? RestaurantId { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Body { get; set; }
        public string? Data { get; set; }
        public bool IsRead { get; set; }
        public DateTime? ReadAt { get; set; }
    }

    public static class NotificationTypes
    {
        public const string OrderCreated = "ORDER_CREATED";
        public const string OrderToPrepare = "ORDER_TO_PREPARE";
        public const string OrderPreparing = "ORDER_PREPARING";
        public const string OrderReady = "ORDER_READY";
        public const string WaiterCalled = "WAITER_CALLED";
    }
}
