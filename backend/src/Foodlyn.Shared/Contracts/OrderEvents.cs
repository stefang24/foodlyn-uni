using MediatR;

namespace Foodlyn.Shared.Contracts
{
    public record OrderPlacedEvent(
    long OrderId, long TableId, long RestaurantId,
    List<OrderItemInfo> Items, string? DeliveryNotes
) : INotification;

    public record OrderAcceptedEvent(
        long OrderId, long TableId, long RestaurantId, long EstimatedMinutes
    ) : INotification;

    public record OrderReadyEvent(
        long OrderId, long TableId, long RestaurantId
    ) : INotification;

    public record OrderCompletedEvent(
        long OrderId, decimal TotalAmount, string PaymentMethod
    ) : INotification;

    public record OrderItemInfo(string Name, long Quantity);
}
