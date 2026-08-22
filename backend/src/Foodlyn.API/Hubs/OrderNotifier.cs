using Foodlyn.Modules.Notifications.Application.Services;
using Foodlyn.Modules.Notifications.Domain.Entities;
using Foodlyn.Modules.Ordering.Application.DTOs;
using Foodlyn.Modules.Ordering.Application.Services;
using Foodlyn.Shared.Constants;
using Microsoft.AspNetCore.SignalR;

namespace Foodlyn.API.Hubs
{
    public class OrderNotifier : IOrderNotifier
    {
        private readonly IHubContext<OrderHub> _hub;
        private readonly INotificationDispatcher _notifications;

        public OrderNotifier(IHubContext<OrderHub> hub, INotificationDispatcher notifications)
        {
            _hub = hub;
            _notifications = notifications;
        }

        public async Task OrderCreatedAsync(OrderDto order)
        {
            if (order.RestaurantId is null) return;

            await _hub.Clients.Group(OrderHub.StaffGroup(OrderHub.CashierGroup, order.RestaurantId.Value))
                .SendAsync("orderCreated", order);

            await _hub.Clients.Group(OrderHub.TableOrdersGroup(order.TableId))
                .SendAsync("orderCreated", order);

            await _notifications.DispatchToRoleAsync(
                order.RestaurantId.Value,
                Roles.Cashier,
                NotificationTypes.OrderCreated,
                $"New order #{order.Id}",
                $"Table {order.TableNumber} · {order.Items.Count} item(s)",
                new { orderId = order.Id, tableNumber = order.TableNumber });
        }

        public async Task OrderUpdatedAsync(OrderDto order)
        {
            await _hub.Clients.Group(OrderHub.OrderGroup(order.Id)).SendAsync("orderUpdated", order);

            await _hub.Clients.Group(OrderHub.TableOrdersGroup(order.TableId))
                .SendAsync("orderUpdated", order);

            if (order.RestaurantId is null) return;

            var cashier = OrderHub.StaffGroup(OrderHub.CashierGroup, order.RestaurantId.Value);
            var kitchen = OrderHub.StaffGroup(OrderHub.KitchenGroup, order.RestaurantId.Value);
            var waiter = OrderHub.StaffGroup(OrderHub.WaiterGroup, order.RestaurantId.Value);
            var status = OrderHub.StaffGroup(OrderHub.StatusDisplayGroup, order.RestaurantId.Value);

            switch (order.Status)
            {
                case "Approved":
                    await _hub.Clients.Group(cashier).SendAsync("orderUpdated", order);
                    await _hub.Clients.Group(kitchen).SendAsync("orderCreated", order);
                    await _notifications.DispatchToRoleAsync(
                        order.RestaurantId.Value,
                        Roles.Cook,
                        NotificationTypes.OrderToPrepare,
                        $"Order #{order.Id} to prepare",
                        $"Table {order.TableNumber} · {order.Items.Count} item(s)",
                        new { orderId = order.Id, tableNumber = order.TableNumber });
                    break;
                case "Preparing":
                    await _hub.Clients.Group(cashier).SendAsync("orderUpdated", order);
                    await _hub.Clients.Group(kitchen).SendAsync("orderUpdated", order);
                    await _hub.Clients.Group(waiter).SendAsync("orderCreated", order);
                    await _hub.Clients.Group(status).SendAsync("orderCreated", order);
                    await _notifications.DispatchToRoleAsync(
                        order.RestaurantId.Value,
                        Roles.Waiter,
                        NotificationTypes.OrderPreparing,
                        $"Order #{order.Id} in preparation",
                        $"Table {order.TableNumber} · ready in ~{order.PrepTimeMinutes ?? 0} min",
                        new { orderId = order.Id, tableNumber = order.TableNumber, prepTimeMinutes = order.PrepTimeMinutes });
                    break;
                case "Ready":
                    await _hub.Clients.Group(cashier).SendAsync("orderUpdated", order);
                    await _hub.Clients.Group(kitchen).SendAsync("orderRemoved", order.Id);
                    await _hub.Clients.Group(waiter).SendAsync("orderUpdated", order);
                    await _hub.Clients.Group(status).SendAsync("orderUpdated", order);
                    await _notifications.DispatchToRoleAsync(
                        order.RestaurantId.Value,
                        Roles.Waiter,
                        NotificationTypes.OrderReady,
                        $"Order #{order.Id} ready to serve",
                        $"Table {order.TableNumber}",
                        new { orderId = order.Id, tableNumber = order.TableNumber });
                    break;
                case "Served":
                    await _hub.Clients.Group(cashier).SendAsync("orderRemoved", order.Id);
                    await _hub.Clients.Group(waiter).SendAsync("orderRemoved", order.Id);
                    await _hub.Clients.Group(status).SendAsync("orderRemoved", order.Id);
                    break;
                case "AwaitingPayment":
                    await _hub.Clients.Group(cashier).SendAsync("orderUpdated", order);
                    await _hub.Clients.Group(waiter).SendAsync("orderRemoved", order.Id);
                    await _hub.Clients.Group(status).SendAsync("orderRemoved", order.Id);
                    break;
                case "Completed":
                    await _hub.Clients.Group(cashier).SendAsync("orderRemoved", order.Id);
                    await _hub.Clients.Group(waiter).SendAsync("orderRemoved", order.Id);
                    await _hub.Clients.Group(status).SendAsync("orderRemoved", order.Id);
                    break;
                case "Rejected":
                case "Cancelled":
                    await _hub.Clients.Group(cashier).SendAsync("orderRemoved", order.Id);
                    await _hub.Clients.Group(kitchen).SendAsync("orderRemoved", order.Id);
                    await _hub.Clients.Group(waiter).SendAsync("orderRemoved", order.Id);
                    await _hub.Clients.Group(status).SendAsync("orderRemoved", order.Id);
                    break;
            }
        }
    }
}
