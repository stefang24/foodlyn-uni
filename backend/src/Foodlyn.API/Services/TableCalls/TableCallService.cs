using Foodlyn.API.Hubs;
using Foodlyn.Modules.Notifications.Application.Services;
using Foodlyn.Modules.Notifications.Domain.Entities;
using Foodlyn.Shared.Constants;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace Foodlyn.API.Services.TableCalls
{
    public class TableCallService : ITableCallService
    {
        private readonly IHubContext<OrderHub> _hub;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ConcurrentDictionary<long, TableCallDto> _calls = new();
        private long _nextId;

        public TableCallService(IHubContext<OrderHub> hub, IServiceScopeFactory scopeFactory)
        {
            _hub = hub;
            _scopeFactory = scopeFactory;
        }

        public async Task<TableCallDto> CreateAsync(long tableId, int tableNumber, string? tableLabel, long restaurantId, string? message)
        {
            var existing = _calls.Values.FirstOrDefault(c => c.TableId == tableId && c.RestaurantId == restaurantId);
            if (existing != null) return existing;

            var call = new TableCallDto
            {
                Id = Interlocked.Increment(ref _nextId),
                TableId = tableId,
                TableNumber = tableNumber,
                TableLabel = tableLabel,
                RestaurantId = restaurantId,
                Message = message?.Trim(),
                CreatedAt = DateTime.UtcNow,
            };
            _calls.TryAdd(call.Id, call);

            await _hub.Clients.Group(OrderHub.StaffGroup(OrderHub.WaiterGroup, restaurantId))
                .SendAsync("waiterCalled", call);

            await using var scope = _scopeFactory.CreateAsyncScope();
            var dispatcher = scope.ServiceProvider.GetRequiredService<INotificationDispatcher>();
            await dispatcher.DispatchToRoleAsync(
                restaurantId,
                Roles.Waiter,
                NotificationTypes.WaiterCalled,
                $"Table {tableNumber} calling",
                string.IsNullOrWhiteSpace(message) ? "Guest needs assistance" : message,
                new { tableId, tableNumber, callId = call.Id });

            return call;
        }

        public async Task<bool> AcknowledgeAsync(long id, long restaurantId)
        {
            if (!_calls.TryGetValue(id, out var call)) return false;
            if (call.RestaurantId != restaurantId) return false;
            if (!_calls.TryRemove(id, out _)) return false;

            await _hub.Clients.Group(OrderHub.StaffGroup(OrderHub.WaiterGroup, restaurantId))
                .SendAsync("waiterCallRemoved", id);
            return true;
        }

        public IReadOnlyList<TableCallDto> GetActive(long restaurantId)
            => _calls.Values.Where(c => c.RestaurantId == restaurantId).OrderBy(c => c.CreatedAt).ToList();
    }
}
