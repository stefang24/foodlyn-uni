using Foodlyn.API.Hubs;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace Foodlyn.API.Services.TableLobby
{
    public class TableLobbyService : ITableLobbyService
    {
        private readonly IHubContext<OrderHub> _hub;
        private readonly ConcurrentDictionary<long, TableLobbyDto> _states = new();

        public TableLobbyService(IHubContext<OrderHub> hub)
        {
            _hub = hub;
        }

        public TableLobbyDto? Get(long tableId)
            => _states.TryGetValue(tableId, out var s) ? s : null;

        public async Task<TableLobbyDto> AdvanceAsync(
            long tableId,
            long restaurantId,
            string stage,
            long? sessionId = null,
            long? orderId = null,
            string? qrToken = null)
        {
            var next = new TableLobbyDto
            {
                TableId = tableId,
                RestaurantId = restaurantId,
                Stage = stage,
                SessionId = sessionId,
                OrderId = orderId,
                QrToken = qrToken,
            };
            _states[tableId] = next;

            await _hub.Clients
                .Group(OrderHub.TableGroup(tableId))
                .SendAsync("tableLobbyChanged", next);

            return next;
        }

        public async Task ClearAsync(long tableId)
        {
            if (_states.TryRemove(tableId, out _))
            {
                await _hub.Clients
                    .Group(OrderHub.TableGroup(tableId))
                    .SendAsync("tableLobbyCleared", tableId);
            }
        }
    }
}
