namespace Foodlyn.Modules.Ordering.Application.DTOs
{
    public class OrderDto
    {
        public long Id { get; set; }
        public long? RestaurantId { get; set; }
        public long TableId { get; set; }
        public int TableNumber { get; set; }
        public string? TableLabel { get; set; }
        public string? SessionId { get; set; }
        public bool IsStaffOrder { get; set; }
        public string? CustomerName { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? DeliveryNotes { get; set; }
        public decimal TotalAmount { get; set; }
        public string? Currency { get; set; }
        public int PartySize { get; set; }

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
        public string? PaymentMethod { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public long? CreatedBy { get; set; }

        public string? CustomerUsername { get; set; }
        public string? CustomerFullName { get; set; }

        public List<OrderItemDto> Items { get; set; } = new();
    }

    public class OrderItemDto
    {
        public long Id { get; set; }
        public long OrderId { get; set; }
        public long MenuItemId { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Quantity { get; set; }
        public string? Notes { get; set; }
        public List<OrderItemModifierDto> Modifiers { get; set; } = new();
    }

    public class OrderItemModifierDto
    {
        public long Id { get; set; }
        public long? MenuItemModifierId { get; set; }
        public string GroupName { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
    }

    public class CreateOrderDto
    {
        public long TableId { get; set; }
        public long? SessionId { get; set; }
        public string? DeliveryNotes { get; set; }
        public string? CustomerName { get; set; }
        public int PartySize { get; set; }
        public string? PaymentMethod { get; set; }
        public List<CreateOrderItemDto> Items { get; set; } = new();
    }

    public class CreateOrderItemDto
    {
        public long MenuItemId { get; set; }
        public int Quantity { get; set; }
        public string? Notes { get; set; }
        public List<long> ModifierIds { get; set; } = new();
    }

    public class ApproveOrderDto
    {
        public string? Notes { get; set; }
    }

    public class RejectOrderDto
    {
        public string? Reason { get; set; }
    }

    public class StartPreparingDto
    {
        public int PrepTimeMinutes { get; set; }
    }
}
