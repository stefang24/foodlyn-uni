using Foodlyn.API.Hubs;
using Foodlyn.API.Services.TableLobby;
using Foodlyn.Modules.Identity.Application.Services;
using Foodlyn.Modules.Menus.Application.Services;
using Foodlyn.Modules.Ordering.Application.DTOs;
using Foodlyn.Modules.Ordering.Application.Services;
using Foodlyn.Modules.Ordering.Domain.Entities;
using Foodlyn.Modules.Restaurants.Application.Services;
using Foodlyn.Modules.Restaurants.Domain.Enums;
using Foodlyn.Shared.Application;
using Foodlyn.Shared.Configuration;
using Foodlyn.Shared.Constants;
using Foodlyn.Shared.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Foodlyn.API.Controllers
{
    [Route("api/orders")]
    [ApiController]
    [Authorize]
    public class OrderController : ControllerBase
    {
        private readonly IOrderService _orderService;
        private readonly IMenuService _menuService;
        private readonly IRestaurantTableService _tableService;
        private readonly IRestaurantService _restaurantService;
        private readonly ITableSessionService _sessionService;
        private readonly ITableLobbyService _lobbyService;
        private readonly IUserService _userService;
        private readonly ITableNotifier _tableNotifier;
        private readonly ICurrentUserContext _currentUser;

        public OrderController(
            IOrderService orderService,
            IMenuService menuService,
            IRestaurantTableService tableService,
            IRestaurantService restaurantService,
            ITableSessionService sessionService,
            ITableLobbyService lobbyService,
            IUserService userService,
            ITableNotifier tableNotifier,
            ICurrentUserContext currentUser)
        {
            _orderService = orderService;
            _menuService = menuService;
            _tableService = tableService;
            _restaurantService = restaurantService;
            _sessionService = sessionService;
            _lobbyService = lobbyService;
            _userService = userService;
            _tableNotifier = tableNotifier;
            _currentUser = currentUser;
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create(CreateOrderDto dto)
        {
            var tableResult = await _tableService.GetByIdAsync(dto.TableId);
            if (!tableResult.IsSuccess || tableResult.Value is null)
                return BadRequest(Result<OrderDto>.Failure("Table not found"));

            var table = tableResult.Value;
            if (table.RestaurantId is null)
                return BadRequest(Result<OrderDto>.Failure("Table has no restaurant"));

            var guestRestaurantId = GuestRestaurantId();
            if (guestRestaurantId.HasValue && guestRestaurantId.Value != table.RestaurantId.Value)
                return Forbid();

            var isStaff = _currentUser.IsInAnyRole(Roles.Waiter, Roles.Cashier, Roles.Manager, Roles.SuperAdmin);
            var isDirectStaffOrder = isStaff && !(dto.SessionId.HasValue && dto.SessionId.Value > 0);
            if (isStaff)
            {
                if (!await CanAccessRestaurantAsync(table.RestaurantId.Value))
                    return Forbid();

                if (isDirectStaffOrder &&
                    (table.Status == nameof(RestaurantTableStatus.Cleaning) ||
                     table.Status == nameof(RestaurantTableStatus.OutOfService)))
                {
                    return BadRequest(Result<OrderDto>.Failure("TABLE_NOT_AVAILABLE"));
                }
            }
            else if (!_currentUser.IsInAnyRole(Roles.User, Roles.Guest))
            {
                return Forbid();
            }

            var restaurantRes = await _restaurantService.GetByIdAsync(table.RestaurantId.Value);
            if (!restaurantRes.IsSuccess || restaurantRes.Value is null)
                return BadRequest(Result<OrderDto>.Failure("Restaurant not found"));
            var orderCurrency = restaurantRes.Value.Currency;

            var menus = await _menuService.GetPublicByRestaurantAsync(table.RestaurantId.Value);
            if (!menus.IsSuccess) return BadRequest(menus);

            var itemMap = menus.Value!
                .SelectMany(m => m.Categories)
                .SelectMany(c => c.Items)
                .ToDictionary(i => i.Id);

            var resolvedItems = new List<ResolvedOrderItem>();
            int partySize = dto.PartySize > 0 ? dto.PartySize : 1;
            long? closeSessionId = null;
            string? closingSessionOwnerKind = null;

            if (dto.SessionId.HasValue && dto.SessionId.Value > 0)
            {
                var sessionRes = await _sessionService.GetWithCartAsync(dto.SessionId.Value);
                if (!sessionRes.IsSuccess || sessionRes.Value is null)
                    return BadRequest(Result<OrderDto>.Failure("Session not found"));
                var session = sessionRes.Value;
                if (session.TableId != table.Id)
                    return BadRequest(Result<OrderDto>.Failure("Session does not belong to this table"));
                if (session.Status != "Open")
                    return BadRequest(Result<OrderDto>.Failure("Session is closed"));
                if (session.CartLines.Count == 0)
                    return BadRequest(Result<OrderDto>.Failure("Cart is empty"));

                foreach (var line in session.CartLines)
                {
                    resolvedItems.Add(new ResolvedOrderItem
                    {
                        MenuItemId = line.MenuItemId,
                        Name = line.Name,
                        Price = line.UnitPrice,
                        Quantity = line.Quantity,
                        Notes = line.Notes,
                        Modifiers = line.Modifiers.Select(m => new ResolvedOrderModifier
                        {
                            MenuItemModifierId = m.MenuItemModifierId,
                            GroupName = m.GroupName,
                            Name = m.Name,
                            Price = m.Price,
                        }).ToList(),
                    });
                }

                partySize = session.PartySize > 0 ? session.PartySize : partySize;
                closeSessionId = session.Id;
                closingSessionOwnerKind = session.OwnerKind;
            }
            else
            {
                if (!isStaff)
                    return BadRequest(Result<OrderDto>.Failure("Session is required"));

                foreach (var line in dto.Items)
                {
                    if (!itemMap.TryGetValue(line.MenuItemId, out var item))
                        return BadRequest(Result<OrderDto>.Failure($"Item {line.MenuItemId} is not available"));

                    var unitPrice = item.DiscountedPrice ?? item.Price;
                    var resolvedModifiers = new List<ResolvedOrderModifier>();

                    var groupSelections = new Dictionary<long, int>();
                    foreach (var modId in line.ModifierIds.Distinct())
                    {
                        var group = item.ModifierGroups.FirstOrDefault(g => g.Modifiers.Any(m => m.Id == modId));
                        if (group is null)
                            return BadRequest(Result<OrderDto>.Failure($"Modifier {modId} is not available for item {item.Name}"));

                        var modifier = group.Modifiers.First(m => m.Id == modId);
                        if (!modifier.IsActive)
                            return BadRequest(Result<OrderDto>.Failure($"Modifier {modifier.Name} is not available"));

                        groupSelections[group.Id] = groupSelections.GetValueOrDefault(group.Id) + 1;

                        resolvedModifiers.Add(new ResolvedOrderModifier
                        {
                            MenuItemModifierId = modifier.Id,
                            GroupName = group.Name,
                            Name = modifier.Name,
                            Price = modifier.PriceDelta,
                        });
                    }

                    foreach (var group in item.ModifierGroups.Where(g => g.IsActive))
                    {
                        var count = groupSelections.GetValueOrDefault(group.Id);
                        if (count < group.MinSelect)
                            return BadRequest(Result<OrderDto>.Failure(
                                $"Group '{group.Name}' requires at least {group.MinSelect} selection(s)"));
                        if (count > group.MaxSelect)
                            return BadRequest(Result<OrderDto>.Failure(
                                $"Group '{group.Name}' allows at most {group.MaxSelect} selection(s)"));
                    }

                    resolvedItems.Add(new ResolvedOrderItem
                    {
                        MenuItemId = item.Id,
                        Name = item.Name,
                        Price = unitPrice,
                        Quantity = line.Quantity,
                        Notes = line.Notes?.Trim(),
                        Modifiers = resolvedModifiers,
                    });
                }
            }

            if (resolvedItems.Count == 0)
                return BadRequest(Result<OrderDto>.Failure("Order must have at least one item"));

            PaymentMethod? paymentMethod = null;
            if (!string.IsNullOrWhiteSpace(dto.PaymentMethod) &&
                Enum.TryParse<PaymentMethod>(dto.PaymentMethod, true, out var parsed))
            {
                paymentMethod = parsed;
            }

            var ctx = new ResolvedOrderContext
            {
                RestaurantId = table.RestaurantId.Value,
                TableId = table.Id,
                TableNumber = table.Number,
                TableLabel = table.Label,
                DeliveryNotes = dto.DeliveryNotes?.Trim(),
                CustomerName = dto.CustomerName?.Trim(),
                PartySize = partySize,
                PaymentMethod = paymentMethod,
                Currency = orderCurrency,
                SessionId = SessionId(),
                IsStaffOrder = isDirectStaffOrder,
                UserId = CurrentUserIdOrNull(),
                Items = resolvedItems,
            };

            var result = await _orderService.CreateAsync(ctx);
            if (result.IsSuccess && result.Value!.RestaurantId.HasValue)
            {
                await RecomputeTableAsync(result.Value.TableId, result.Value.RestaurantId!.Value);
                if (closeSessionId.HasValue)
                    await _sessionService.CloseAsync(closeSessionId.Value);

                if (closeSessionId.HasValue)
                {
                    var stage = closingSessionOwnerKind == "User"
                        ? TableLobbyStages.UserLocked
                        : TableLobbyStages.Tracking;
                    await _lobbyService.AdvanceAsync(
                        result.Value.TableId,
                        result.Value.RestaurantId.Value,
                        stage,
                        sessionId: closeSessionId,
                        orderId: result.Value.Id);
                }
            }
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpGet("analytics")]
        [Authorize]
        public async Task<IActionResult> GetAnalytics(
            [FromQuery] long? restaurantId,
            [FromQuery] string range = "week",
            [FromQuery] int? year = null,
            [FromQuery] int? month = null)
        {
            if (!Enum.TryParse<AnalyticsRange>(range, true, out var parsedRange))
                return BadRequest(Result<OrderAnalyticsDto>.Failure("Unknown range"));

            var query = new OrderAnalyticsQueryDto
            {
                Range = parsedRange,
                Year = year,
                Month = month,
            };

            if (restaurantId.HasValue && restaurantId.Value > -1)
            {
                if (!await CanAccessRestaurantAsync(restaurantId.Value))
                    return Forbid();
                query.RestaurantId = restaurantId.Value;
            }
            else if (_currentUser.IsSuperAdmin)
            {
                query.AllRestaurants = true;
            }
            else
            {
                var ids = await _userService.GetAssignedRestaurantIdsAsync(CurrentUserId());
                query.RestrictToRestaurantIds = ids;
            }

            var result = await _orderService.GetAnalyticsAsync(query);
            return Ok(result);
        }

        [HttpGet("top-restaurants")]
        [Authorize(Policy = Policies.SuperAdmin)]
        public async Task<IActionResult> GetTopRestaurants()
        {
            var result = await _orderService.GetLifetimeTopRestaurantsAsync();
            return Ok(result);
        }

        [HttpGet("active-at-table/{tableId:long}")]
        [Authorize]
        public async Task<IActionResult> GetActiveAtTable(long tableId)
        {
            var tableResult = await _tableService.GetByIdAsync(tableId);
            if (!tableResult.IsSuccess || tableResult.Value is null)
                return NotFound(Result<List<OrderDto>>.Failure("Table not found"));

            var table = tableResult.Value;
            if (table.RestaurantId is null)
                return BadRequest(Result<List<OrderDto>>.Failure("Table has no restaurant"));

            var guestRestaurantId = GuestRestaurantId();
            if (guestRestaurantId.HasValue && guestRestaurantId.Value != table.RestaurantId.Value)
                return Forbid();

            if (_currentUser.IsInAnyRole(Roles.Waiter, Roles.Cashier, Roles.Manager, Roles.SuperAdmin))
            {
                if (!await CanAccessRestaurantAsync(table.RestaurantId.Value))
                    return Forbid();
            }

            var result = await _orderService.GetActiveAtTableAsync(tableId);
            return Ok(result);
        }

        [HttpGet("mine")]
        [Authorize(Policy = Policies.Customer)]
        public async Task<IActionResult> GetMine()
        {
            long? tableId = _currentUser.IsGuest ? _currentUser.TableId : null;
            if (tableId is null && _currentUser.UserId is > 0)
                tableId = await _sessionService.GetOpenTableIdForUserAsync(_currentUser.UserId.Value);

            var result = await _orderService.GetMineAsync(CurrentUserIdOrNull(), SessionId(), tableId);
            return Ok(result);
        }

        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetById(long id)
        {
            var result = await _orderService.GetByIdAsync(id);
            if (!result.IsSuccess) return NotFound(result);

            if (!await CanReadOrderAsync(result.Value!)) return Forbid();

            if (result.Value!.CreatedBy is > 0)
            {
                var userRes = await _userService.GetByIdAsync(result.Value.CreatedBy.Value);
                if (userRes.IsSuccess && userRes.Value is not null)
                {
                    result.Value.CustomerUsername = userRes.Value.Username;
                    var first = userRes.Value.FirstName?.Trim();
                    var last = userRes.Value.LastName?.Trim();
                    var full = string.Join(" ", new[] { first, last }.Where(s => !string.IsNullOrEmpty(s)));
                    result.Value.CustomerFullName = string.IsNullOrEmpty(full) ? null : full;
                }
            }

            return Ok(result);
        }

        [HttpGet("{id:long}/return-link")]
        public async Task<IActionResult> GetReturnLink(long id)
        {
            var orderRes = await _orderService.GetByIdAsync(id);
            if (!orderRes.IsSuccess) return NotFound(orderRes);
            if (!await CanReadOrderAsync(orderRes.Value!)) return Forbid();

            var tableRes = await _tableService.GetByIdAsync(orderRes.Value!.TableId);
            if (!tableRes.IsSuccess || tableRes.Value is null)
                return NotFound(Result<object>.Failure("Table not found"));

            return Ok(Result<object>.Success(new
            {
                qrToken = tableRes.Value.QrToken,
                tableId = tableRes.Value.Id,
                tableNumber = tableRes.Value.Number,
            }));
        }

        [HttpGet("cashier/{restaurantId:long}")]
        [Authorize(Policy = Policies.Cashier)]
        public async Task<IActionResult> GetCashierQueue(long restaurantId)
        {
            if (!await CanAccessRestaurantAsync(restaurantId)) return Forbid();
            var result = await _orderService.GetCashierQueueAsync(restaurantId);
            return Ok(result);
        }

        [HttpGet("kitchen/{restaurantId:long}")]
        [Authorize(Policy = Policies.Cook)]
        public async Task<IActionResult> GetKitchenQueue(long restaurantId)
        {
            if (!await CanAccessRestaurantAsync(restaurantId)) return Forbid();
            var result = await _orderService.GetKitchenQueueAsync(restaurantId);
            return Ok(result);
        }

        [HttpGet("waiter/{restaurantId:long}")]
        [Authorize(Policy = Policies.Waiter)]
        public async Task<IActionResult> GetWaiterQueue(long restaurantId)
        {
            if (!await CanAccessRestaurantAsync(restaurantId)) return Forbid();
            var result = await _orderService.GetWaiterQueueAsync(restaurantId);
            return Ok(result);
        }

        [HttpGet("awaiting-payment/{restaurantId:long}")]
        [Authorize(Policy = Policies.Cashier)]
        public async Task<IActionResult> GetAwaitingPayment(long restaurantId)
        {
            if (!await CanAccessRestaurantAsync(restaurantId)) return Forbid();
            var result = await _orderService.GetAwaitingPaymentAsync(restaurantId);
            return Ok(result);
        }

        [HttpGet("live/{restaurantId:long}")]
        [Authorize(Policy = Policies.Manager)]
        public async Task<IActionResult> GetLive(long restaurantId)
        {
            if (!await CanAccessRestaurantAsync(restaurantId)) return Forbid();
            var result = await _orderService.GetLiveByRestaurantAsync(restaurantId);
            return Ok(result);
        }

        [HttpGet("status-display/{restaurantId:long}")]
        [Authorize(Policy = Policies.StatusDisplay)]
        public async Task<IActionResult> GetStatusDisplay(long restaurantId)
        {
            if (!await CanAccessRestaurantAsync(restaurantId)) return Forbid();
            var result = await _orderService.GetActiveByRestaurantAsync(restaurantId);
            return Ok(result);
        }

        [HttpGet("live-all")]
        [Authorize(Policy = Policies.SuperAdmin)]
        public async Task<IActionResult> GetLiveAll()
        {
            var result = await _orderService.GetLiveAllAsync();
            return Ok(result);
        }

        [HttpGet("history/{restaurantId:long}")]
        [Authorize]
        public async Task<IActionResult> GetHistory(long restaurantId, [FromQuery] int take = 100)
        {
            if (!_currentUser.IsInAnyRole(Roles.Cashier, Roles.Manager, Roles.SuperAdmin))
                return Forbid();
            if (!await CanAccessRestaurantAsync(restaurantId)) return Forbid();

            var result = await _orderService.GetHistoryAsync(restaurantId, take);
            return Ok(result);
        }

        [HttpGet("history/{restaurantId:long}/paged")]
        [Authorize]
        public async Task<IActionResult> GetPagedHistory(long restaurantId, [FromQuery] PagedOrderQueryDto query)
        {
            if (!_currentUser.IsInAnyRole(Roles.Cashier, Roles.Manager, Roles.SuperAdmin))
                return Forbid();
            if (!await CanAccessRestaurantAsync(restaurantId)) return Forbid();

            query.RestaurantId = restaurantId;
            var result = await _orderService.GetPagedHistoryAsync(query);
            return Ok(result);
        }

        [HttpGet("history-all/paged")]
        [Authorize]
        public async Task<IActionResult> GetPagedHistoryAll([FromQuery] PagedOrderQueryDto query)
        {
            if (!_currentUser.IsInAnyRole(Roles.Cashier, Roles.Manager, Roles.SuperAdmin))
                return Forbid();

            query.RestaurantId = 0;
            if (_currentUser.IsSuperAdmin)
            {
                query.AllRestaurants = true;
            }
            else
            {
                var ids = await _userService.GetAssignedRestaurantIdsAsync(CurrentUserId());
                query.RestrictToRestaurantIds = ids;
            }

            var result = await _orderService.GetPagedHistoryAsync(query);
            return Ok(result);
        }

        [HttpPost("{id:long}/approve")]
        [Authorize(Policy = Policies.Cashier)]
        public async Task<IActionResult> Approve(long id)
        {
            var existing = await _orderService.GetByIdAsync(id);
            if (!existing.IsSuccess) return NotFound(existing);
            if (existing.Value!.RestaurantId is null || !await CanAccessRestaurantAsync(existing.Value.RestaurantId.Value))
                return Forbid();

            var result = await _orderService.ApproveAsync(id, CurrentUserId(), existing.Value.RestaurantId!.Value);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpPost("{id:long}/reject")]
        [Authorize(Policy = Policies.Cashier)]
        public async Task<IActionResult> Reject(long id, RejectOrderDto dto)
        {
            var existing = await _orderService.GetByIdAsync(id);
            if (!existing.IsSuccess) return NotFound(existing);
            if (existing.Value!.RestaurantId is null || !await CanAccessRestaurantAsync(existing.Value.RestaurantId.Value))
                return Forbid();

            var result = await _orderService.RejectAsync(id, dto, CurrentUserId(), existing.Value.RestaurantId!.Value);
            if (result.IsSuccess)
            {
                await RecomputeTableAsync(existing.Value.TableId, existing.Value.RestaurantId!.Value);
            }
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpPost("{id:long}/start")]
        [Authorize(Policy = Policies.Cook)]
        public async Task<IActionResult> Start(long id, StartPreparingDto dto)
        {
            var existing = await _orderService.GetByIdAsync(id);
            if (!existing.IsSuccess) return NotFound(existing);
            if (existing.Value!.RestaurantId is null || !await CanAccessRestaurantAsync(existing.Value.RestaurantId.Value))
                return Forbid();

            var result = await _orderService.StartPreparingAsync(id, dto, CurrentUserId(), existing.Value.RestaurantId!.Value);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpPost("{id:long}/ready")]
        [Authorize(Policy = Policies.Cook)]
        public async Task<IActionResult> Ready(long id)
        {
            var existing = await _orderService.GetByIdAsync(id);
            if (!existing.IsSuccess) return NotFound(existing);
            if (existing.Value!.RestaurantId is null || !await CanAccessRestaurantAsync(existing.Value.RestaurantId.Value))
                return Forbid();

            var result = await _orderService.MarkReadyAsync(id, CurrentUserId(), existing.Value.RestaurantId!.Value);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpPost("{id:long}/serve")]
        [Authorize(Policy = Policies.Waiter)]
        public async Task<IActionResult> Serve(long id)
        {
            var existing = await _orderService.GetByIdAsync(id);
            if (!existing.IsSuccess) return NotFound(existing);
            if (existing.Value!.RestaurantId is null || !await CanAccessRestaurantAsync(existing.Value.RestaurantId.Value))
                return Forbid();

            var result = await _orderService.MarkServedAsync(id, CurrentUserId(), existing.Value.RestaurantId!.Value);

            if (result.IsSuccess)
            {
                await RecomputeTableAsync(existing.Value.TableId, existing.Value.RestaurantId!.Value);
            }

            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpPost("{id:long}/mark-paid")]
        [Authorize(Policy = Policies.Cashier)]
        public async Task<IActionResult> MarkPaid(long id)
        {
            var existing = await _orderService.GetByIdAsync(id);
            if (!existing.IsSuccess) return NotFound(existing);
            if (existing.Value!.RestaurantId is null || !await CanAccessRestaurantAsync(existing.Value.RestaurantId.Value))
                return Forbid();

            var result = await _orderService.MarkPaidAsync(id, CurrentUserId(), existing.Value.RestaurantId!.Value);
            if (!result.IsSuccess) return BadRequest(result);

            await RecomputeTableAsync(existing.Value.TableId, existing.Value.RestaurantId!.Value);

            return Ok(result);
        }

        [HttpPost("{id:long}/cancel")]
        [Authorize(Policy = Policies.Customer)]
        public async Task<IActionResult> Cancel(long id)
        {
            var existing = await _orderService.GetByIdAsync(id);
            var result = await _orderService.CancelAsync(id, CurrentUserIdOrNull(), SessionId());
            if (result.IsSuccess && existing.IsSuccess && existing.Value!.RestaurantId.HasValue)
            {
                await RecomputeTableAsync(existing.Value.TableId, existing.Value.RestaurantId!.Value);
            }
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        private long CurrentUserId() => _currentUser.UserId ?? -1;

        private long? CurrentUserIdOrNull() => _currentUser.UserId;

        private string? SessionId() => _currentUser.SessionId;

        private long? GuestRestaurantId() => _currentUser.IsGuest ? _currentUser.RestaurantId : null;

        private async Task<bool> CanAccessRestaurantAsync(long restaurantId)
        {
            if (_currentUser.IsSuperAdmin) return true;
            var ids = await _userService.GetAssignedRestaurantIdsAsync(CurrentUserId());
            return ids.Contains(restaurantId);
        }

        private async Task RecomputeTableAsync(long tableId, long restaurantId)
        {
            var tableRes = await _tableService.GetByIdAsync(tableId);
            if (!tableRes.IsSuccess || tableRes.Value is null) return;
            var current = tableRes.Value.Status;

            var progress = await _orderService.GetTableProgressAsync(tableId);

            RestaurantTableStatus? target = progress switch
            {
                TableProgress.StillCooking
                    => RestaurantTableStatus.Occupied,
                TableProgress.AllServed
                    => RestaurantTableStatus.Eating,
                TableProgress.NoActive
                    when current == nameof(RestaurantTableStatus.Eating)
                      || current == nameof(RestaurantTableStatus.Occupied)
                    => RestaurantTableStatus.Cleaning,
                _ => null,
            };

            if (target is null || target.Value.ToString() == current) return;

            var statusRes = await _tableService.SetStatusAsync(tableId, target.Value, CurrentUserId());
            if (!statusRes.IsSuccess) return;

            await _tableNotifier.TableStatusChangedAsync(restaurantId, new TableStatusUpdate
            {
                Id = tableId,
                Status = target.Value.ToString(),
                CurrentPartySize = statusRes.Value!.CurrentPartySize,
            });
        }

        private async Task<bool> CanReadOrderAsync(OrderDto order)
        {
            if (_currentUser.IsInAnyRole(Roles.User, Roles.Guest))
            {
                var userId = CurrentUserIdOrNull();
                var session = SessionId();
                var isStaffCreatedOrder = order.IsStaffOrder;

                if (order.CreatedBy.HasValue && order.CreatedBy.Value > 0 && !isStaffCreatedOrder)
                {
                    return userId.HasValue && userId.Value == order.CreatedBy.Value;
                }

                if (!string.IsNullOrEmpty(session) && order.SessionId == session) return true;

                var guestTableId = _currentUser.TableId;
                if (guestTableId.HasValue && guestTableId.Value == order.TableId)
                {
                    var liveStatuses = new[]
                    {
                        "Placed", "Approved", "Preparing", "Ready", "Served", "AwaitingPayment",
                    };
                    if (liveStatuses.Contains(order.Status)) return true;
                    var ageMinutes = (DateTime.UtcNow - order.CreatedAt).TotalMinutes;
                    if (ageMinutes <= 30) return true;
                }
                return false;
            }

            if (order.RestaurantId is null) return false;
            return await CanAccessRestaurantAsync(order.RestaurantId.Value);
        }
    }
}
