using Foodlyn.Modules.Ordering.Application.DTOs;
using Foodlyn.Modules.Ordering.Application.Services;
using Microsoft.AspNetCore.SignalR;

namespace Foodlyn.API.Hubs
{
    public class TableSessionNotifier : ITableSessionNotifier
    {
        private readonly IHubContext<OrderHub> _hub;

        public TableSessionNotifier(IHubContext<OrderHub> hub)
        {
            _hub = hub;
        }

        public Task SessionCartUpdatedAsync(TableSessionDto session)
        {
            return _hub.Clients
                .Group(OrderHub.SessionGroup(session.Id))
                .SendAsync("sessionCartUpdated", session);
        }

        public Task SessionClosedAsync(long sessionId, long restaurantId)
        {
            return _hub.Clients
                .Group(OrderHub.SessionGroup(sessionId))
                .SendAsync("sessionClosed", sessionId);
        }
    }
}
