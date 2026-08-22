using Foodlyn.Shared.Domain;

namespace Foodlyn.Modules.Ordering.Domain.Entities
{
    public class Order : BaseEntity, ITenantEntity, IAuditableEntity
    {
        public long? RestaurantId { get; set; }
        public long TableId { get; set; }
        public int TableNumber { get; set; }
        public string? TableLabel { get; set; }
        public string? SessionId { get; set; }
        public string? CustomerName { get; set; }
        public OrderStatus Status { get; set; } = OrderStatus.Placed;
        public string? DeliveryNotes { get; set; }
        public decimal TotalAmount { get; set; }
        public string? Currency { get; set; }
        public int PartySize { get; set; }
        public bool IsStaffOrder { get; set; }

        public int? PrepTimeMinutes { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public DateTime? RejectedAt { get; set; }
        public string? RejectedReason { get; set; }
        public DateTime? PreparingStartedAt { get; set; }
        public DateTime? ReadyAt { get; set; }
        public DateTime? ServedAt { get; set; }
        public DateTime? CancelledAt { get; set; }
        public DateTime? PaidAt { get; set; }
        public DateTime? CompletedAt { get; set; }

        public PaymentMethod? PaymentMethod { get; set; }

        public long? ApprovedBy { get; set; }
        public long? PreparedBy { get; set; }
        public long? ServedBy { get; set; }
        public long? PaidBy { get; set; }

        public List<OrderItem> Items { get; set; } = new();
        public long? CreatedBy { get; set; }
        public long? UpdatedBy { get; set; }
    }

    public class OrderItem : BaseEntity
    {
        public long OrderId { get; set; }
        public long MenuItemId { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Quantity { get; set; }
        public string? Notes { get; set; }

        public Order Order { get; set; } = null!;
        public List<OrderItemModifier> Modifiers { get; set; } = new();
    }

    public class OrderItemModifier : BaseEntity
    {
        public long OrderItemId { get; set; }
        public long? MenuItemModifierId { get; set; }
        public string GroupName { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }

        public OrderItem OrderItem { get; set; } = null!;
    }

    public enum OrderStatus
    {
        Placed = 0,
        Approved = 1,
        Rejected = 2,
        Preparing = 3,
        Ready = 4,
        Served = 5,
        Cancelled = 6,
        AwaitingPayment = 7,
        Completed = 8
    }

    public enum PaymentMethod
    {
        Card = 0,
        Cash = 1
    }
}
