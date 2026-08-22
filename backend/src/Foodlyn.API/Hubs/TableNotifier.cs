using Microsoft.AspNetCore.SignalR;

namespace Foodlyn.API.Hubs
{
    public class TableNotifier : ITableNotifier
    {
        private readonly IHubContext<OrderHub> _hub;

        public TableNotifier(IHubContext<OrderHub> hub)
        {
            _hub = hub;
        }

        public async Task TableStatusChangedAsync(long restaurantId, TableStatusUpdate update)
        {
            var cashier = OrderHub.StaffGroup(OrderHub.CashierGroup, restaurantId);
            var kitchen = OrderHub.StaffGroup(OrderHub.KitchenGroup, restaurantId);
            var waiter = OrderHub.StaffGroup(OrderHub.WaiterGroup, restaurantId);
            var manager = OrderHub.StaffGroup(OrderHub.ManagerGroup, restaurantId);
            await _hub.Clients.Groups(cashier, kitchen, waiter, manager)
                .SendAsync("tableStatusChanged", update);
        }
    }
}
