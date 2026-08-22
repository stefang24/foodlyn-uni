using Foodlyn.Modules.Identity.Application.Services;
using Foodlyn.Modules.Ordering.Application.Services;
using Foodlyn.Shared.Application;
using Foodlyn.Shared.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Foodlyn.API.Hubs
{
    public class OrderHub : Hub
    {
        public const string CashierGroup = "cashier";
        public const string KitchenGroup = "kitchen";
        public const string WaiterGroup = "waiter";
        public const string ManagerGroup = "manager";
        public const string StatusDisplayGroup = "statusDisplay";

        private static readonly string[] StaffRoles =
        {
            Roles.Manager, Roles.Cashier, Roles.Cook, Roles.Waiter, Roles.StatusDisplay,
        };

        private readonly IUserService _userService;
        private readonly IOrderService _orderService;
        private readonly ITableSessionService _sessionService;

        public OrderHub(
            IUserService userService,
            IOrderService orderService,
            ITableSessionService sessionService)
        {
            _userService = userService;
            _orderService = orderService;
            _sessionService = sessionService;
        }

        [Authorize]
        public async Task JoinOrderGroup(long orderId)
        {
            if (!await CanAccessOrderAsync(orderId)) return;
            await Groups.AddToGroupAsync(Context.ConnectionId, OrderGroup(orderId));
        }

        [Authorize]
        public Task LeaveOrderGroup(long orderId)
            => Groups.RemoveFromGroupAsync(Context.ConnectionId, OrderGroup(orderId));

        [Authorize]
        public async Task JoinStaffGroup(string staffGroup, long restaurantId)
        {
            if (staffGroup != CashierGroup && staffGroup != KitchenGroup && staffGroup != WaiterGroup && staffGroup != ManagerGroup && staffGroup != StatusDisplayGroup)
                return;

            if (!await CanAccessRestaurantAsync(restaurantId)) return;

            await Groups.AddToGroupAsync(Context.ConnectionId, StaffGroup(staffGroup, restaurantId));
        }

        [Authorize]
        public Task LeaveStaffGroup(string staffGroup, long restaurantId)
            => Groups.RemoveFromGroupAsync(Context.ConnectionId, StaffGroup(staffGroup, restaurantId));

        public static string OrderGroup(long orderId) => $"order:{orderId}";
        public static string StaffGroup(string role, long restaurantId) => $"restaurant:{restaurantId}:{role}";
        public static string UserGroup(long userId) => $"user:{userId}";
        public static string SessionGroup(long sessionId) => $"session:{sessionId}";
        public static string TableGroup(long tableId) => $"table:{tableId}";
        public static string TableOrdersGroup(long tableId) => $"table:{tableId}:orders";

        [Authorize]
        public async Task JoinSessionGroup(long sessionId)
        {
            if (!await CanAccessSessionAsync(sessionId)) return;
            await Groups.AddToGroupAsync(Context.ConnectionId, SessionGroup(sessionId));
        }

        [Authorize]
        public Task LeaveSessionGroup(long sessionId)
            => Groups.RemoveFromGroupAsync(Context.ConnectionId, SessionGroup(sessionId));

        public Task JoinTableGroup(long tableId)
            => Groups.AddToGroupAsync(Context.ConnectionId, TableGroup(tableId));

        public Task LeaveTableGroup(long tableId)
            => Groups.RemoveFromGroupAsync(Context.ConnectionId, TableGroup(tableId));

        [Authorize]
        public async Task JoinTableOrdersGroup(long tableId)
        {
            if (!await CanAccessTableAsync(tableId)) return;
            await Groups.AddToGroupAsync(Context.ConnectionId, TableOrdersGroup(tableId));
        }

        [Authorize]
        public Task LeaveTableOrdersGroup(long tableId)
            => Groups.RemoveFromGroupAsync(Context.ConnectionId, TableOrdersGroup(tableId));

        private async Task<bool> CanAccessTableAsync(long tableId)
        {
            var principal = Context.User;
            if (principal.IsSuperAdmin()) return true;

            var claimTableId = principal.GetTableId();
            if (claimTableId.HasValue && claimTableId.Value == tableId) return true;

            var session = await _sessionService.GetOpenForTableAsync(tableId);
            var userId = principal.GetUserId();
            return session is not null && userId is > 0 && session.OwnerUserId == userId.Value;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.GetUserId();
            if (userId is not null)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, UserGroup(userId.Value));
            }
            await base.OnConnectedAsync();
        }

        private async Task<bool> CanAccessRestaurantAsync(long restaurantId)
        {
            var principal = Context.User;
            if (principal.IsSuperAdmin()) return true;

            var userId = principal.GetUserId();
            if (userId is null) return false;

            var ids = await _userService.GetAssignedRestaurantIdsAsync(userId.Value);
            return ids.Contains(restaurantId);
        }

        private async Task<bool> CanAccessOrderAsync(long orderId)
        {
            var principal = Context.User;
            if (principal.IsSuperAdmin()) return true;

            var orderRes = await _orderService.GetByIdAsync(orderId);
            if (!orderRes.IsSuccess || orderRes.Value is null) return false;
            var order = orderRes.Value;

            if (principal.IsInAnyRole(StaffRoles))
                return order.RestaurantId.HasValue && await CanAccessRestaurantAsync(order.RestaurantId.Value);

            var userId = principal.GetUserId();
            if (userId is > 0 && order.CreatedBy == userId.Value) return true;

            var sessionId = principal.GetSessionId();
            if (!string.IsNullOrEmpty(sessionId) && order.SessionId == sessionId) return true;

            var tableId = principal.GetTableId();
            return tableId.HasValue && tableId.Value == order.TableId;
        }

        private async Task<bool> CanAccessSessionAsync(long sessionId)
        {
            var principal = Context.User;
            if (principal.IsSuperAdmin()) return true;

            var sessionRes = await _sessionService.GetWithCartAsync(sessionId);
            if (!sessionRes.IsSuccess || sessionRes.Value is null) return false;
            var session = sessionRes.Value;

            if (principal.IsInAnyRole(StaffRoles))
                return await CanAccessRestaurantAsync(session.RestaurantId);

            var tableId = principal.GetTableId();
            if (tableId.HasValue && tableId.Value == session.TableId) return true;

            var userId = principal.GetUserId();
            return userId is > 0 && session.OwnerUserId == userId.Value;
        }
    }
}
