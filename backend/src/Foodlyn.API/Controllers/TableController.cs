using Foodlyn.API.Hubs;
using Foodlyn.API.Services.TableCalls;
using Foodlyn.API.Services.TableLobby;
using Foodlyn.Modules.Identity.Application.Services;
using Foodlyn.Modules.Ordering.Application.Services;
using Foodlyn.Modules.Restaurants.Application.DTOs;
using Foodlyn.Modules.Restaurants.Application.Services;
using Foodlyn.Modules.Restaurants.Domain.Enums;
using Foodlyn.Shared.Application;
using Foodlyn.Shared.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Foodlyn.API.Controllers
{
    [Route("api/tables")]
    [ApiController]
    public class TableController : ControllerBase
    {
        private readonly IRestaurantTableService _tableService;
        private readonly IUserService _userService;
        private readonly ITableCallService _callService;
        private readonly IOrderService _orderService;
        private readonly ITableSessionService _sessionService;
        private readonly ITableLobbyService _lobbyService;
        private readonly ITableNotifier _tableNotifier;
        private readonly ICurrentUserContext _currentUser;

        public TableController(
            IRestaurantTableService tableService,
            IUserService userService,
            ITableCallService callService,
            IOrderService orderService,
            ITableSessionService sessionService,
            ITableLobbyService lobbyService,
            ITableNotifier tableNotifier,
            ICurrentUserContext currentUser)
        {
            _tableService = tableService;
            _userService = userService;
            _callService = callService;
            _orderService = orderService;
            _sessionService = sessionService;
            _lobbyService = lobbyService;
            _tableNotifier = tableNotifier;
            _currentUser = currentUser;
        }

        private async Task EnsureTableSessionClosedAsync(long tableId, long restaurantId)
        {
            var existing = await _sessionService.GetOpenForTableAsync(tableId);
            if (existing is not null)
            {
                await _sessionService.CloseAsync(existing.Id);
            }
            await _lobbyService.AdvanceAsync(tableId, restaurantId, TableLobbyStages.Choice);
        }

        [HttpGet("qr/{token:guid}")]
        [AllowAnonymous]
        public async Task<IActionResult> ResolveQr(Guid token)
        {
            var result = await _tableService.ResolveQrTokenAsync(token);
            return result.IsSuccess ? Ok(result) : NotFound(result);
        }

        [HttpGet("restaurant/{restaurantId:long}")]
        [Authorize(Policy = Policies.Manager)]
        public async Task<IActionResult> GetByRestaurant(long restaurantId)
        {
            if (!await CanAccessRestaurantAsync(restaurantId))
                return Forbid();

            var result = await _tableService.GetByRestaurantAsync(restaurantId);
            return Ok(result);
        }

        [HttpGet("{id:long}")]
        [Authorize(Policy = Policies.Manager)]
        public async Task<IActionResult> GetById(long id)
        {
            var result = await _tableService.GetByIdAsync(id);
            if (!result.IsSuccess)
                return NotFound(result);

            if (!await CanAccessRestaurantAsync(result.Value!.RestaurantId))
                return Forbid();

            return Ok(result);
        }

        [HttpPost]
        [Authorize(Policy = Policies.Manager)]
        public async Task<IActionResult> Create(CreateRestaurantTableDto dto)
        {
            if (!await CanAccessRestaurantAsync(dto.RestaurantId))
                return Forbid();

            var result = await _tableService.CreateAsync(dto, CurrentUserId());
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpPost("bulk")]
        [Authorize(Policy = Policies.Manager)]
        public async Task<IActionResult> BulkCreate(BulkCreateRestaurantTablesDto dto)
        {
            if (!await CanAccessRestaurantAsync(dto.RestaurantId))
                return Forbid();

            var result = await _tableService.BulkCreateAsync(dto, CurrentUserId());
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpPut("{id:long}")]
        [Authorize(Policy = Policies.Manager)]
        public async Task<IActionResult> Update(long id, UpdateRestaurantTableDto dto)
        {
            var existing = await _tableService.GetByIdAsync(id);
            if (!existing.IsSuccess)
                return NotFound(existing);

            if (!await CanAccessRestaurantAsync(existing.Value!.RestaurantId))
                return Forbid();

            var result = await _tableService.UpdateAsync(id, dto, CurrentUserId());
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("{id:long}")]
        [Authorize(Policy = Policies.Manager)]
        public async Task<IActionResult> Delete(long id)
        {
            var existing = await _tableService.GetByIdAsync(id);
            if (!existing.IsSuccess)
                return NotFound(existing);

            if (!await CanAccessRestaurantAsync(existing.Value!.RestaurantId))
                return Forbid();

            var result = await _tableService.DeleteAsync(id);
            return Ok(result);
        }

        [HttpPost("{id:long}/rotate-token")]
        [Authorize(Policy = Policies.SuperAdmin)]
        public async Task<IActionResult> RotateToken(long id)
        {
            var existing = await _tableService.GetByIdAsync(id);
            if (!existing.IsSuccess)
                return NotFound(existing);

            if (!await CanAccessRestaurantAsync(existing.Value!.RestaurantId))
                return Forbid();

            var result = await _tableService.RotateQrTokenAsync(id, CurrentUserId());
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        public class CallWaiterDto
        {
            public string? Message { get; set; }
        }

        [HttpPost("{id:long}/call-waiter")]
        [Authorize(Policy = Policies.Customer)]
        public async Task<IActionResult> CallWaiter(long id, CallWaiterDto? dto)
        {
            var tableRes = await _tableService.GetByIdAsync(id);
            if (!tableRes.IsSuccess || tableRes.Value is null)
                return NotFound(tableRes);

            var table = tableRes.Value;
            if (table.RestaurantId is null)
                return BadRequest(Result<TableCallDto>.Failure("Table has no restaurant"));

            var guestRestaurantId = GuestRestaurantId();
            if (guestRestaurantId.HasValue && guestRestaurantId.Value != table.RestaurantId.Value)
                return Forbid();

            var call = await _callService.CreateAsync(
                table.Id, table.Number, table.Label, table.RestaurantId.Value, dto?.Message);
            return Ok(Result<TableCallDto>.Success(call));
        }

        [HttpGet("calls/{restaurantId:long}")]
        [Authorize(Policy = Policies.Waiter)]
        public async Task<IActionResult> GetCalls(long restaurantId)
        {
            if (!await CanAccessRestaurantAsync(restaurantId))
                return Forbid();

            var calls = _callService.GetActive(restaurantId);
            return Ok(Result<IReadOnlyList<TableCallDto>>.Success(calls));
        }

        [HttpPost("calls/{callId:long}/acknowledge")]
        [Authorize(Policy = Policies.Waiter)]
        public async Task<IActionResult> AcknowledgeCall(long callId, [FromQuery] long restaurantId)
        {
            if (!await CanAccessRestaurantAsync(restaurantId))
                return Forbid();

            var ok = await _callService.AcknowledgeAsync(callId, restaurantId);
            return ok ? Ok(Result<string>.Success("acknowledged")) : NotFound(Result<string>.Failure("Call not found"));
        }

        [HttpPost("{id:long}/close-session")]
        [Authorize(Policy = Policies.Customer)]
        public async Task<IActionResult> CloseSession(long id)
        {
            var tableRes = await _tableService.GetByIdAsync(id);
            if (!tableRes.IsSuccess || tableRes.Value is null)
                return NotFound(tableRes);

            var table = tableRes.Value;
            if (table.RestaurantId is null)
                return BadRequest(Result<RestaurantTableDto>.Failure("Table has no restaurant"));

            var guestRestaurantId = GuestRestaurantId();
            if (guestRestaurantId.HasValue && guestRestaurantId.Value != table.RestaurantId.Value)
                return Forbid();

            var liveOrders = await _orderService.GetActiveAtTableAsync(id);
            if (liveOrders.IsSuccess && liveOrders.Value!.Any(o =>
                    o.Status is "Placed" or "Approved" or "Preparing" or "Ready"))
            {
                return BadRequest(Result<RestaurantTableDto>.Failure("ORDERS_STILL_ACTIVE"));
            }

            var statusRes = await _tableService.SetStatusAsync(id, RestaurantTableStatus.Cleaning, CurrentUserIdOrZero());
            if (!statusRes.IsSuccess) return BadRequest(statusRes);

            await EnsureTableSessionClosedAsync(id, table.RestaurantId.Value);

            await _tableNotifier.TableStatusChangedAsync(table.RestaurantId.Value, new TableStatusUpdate
            {
                Id = id,
                Status = nameof(RestaurantTableStatus.Cleaning),
                CurrentPartySize = 0,
            });

            return Ok(statusRes);
        }

        [HttpPost("{id:long}/mark-cleaned")]
        [Authorize(Policy = Policies.Cashier)]
        public async Task<IActionResult> MarkCleaned(long id)
        {
            var existing = await _tableService.GetByIdAsync(id);
            if (!existing.IsSuccess || existing.Value is null)
                return NotFound(existing);

            if (!await CanAccessRestaurantAsync(existing.Value.RestaurantId))
                return Forbid();

            var result = await _tableService.SetStatusAsync(id, RestaurantTableStatus.Free, CurrentUserId());
            if (!result.IsSuccess) return BadRequest(result);

            await EnsureTableSessionClosedAsync(id, existing.Value.RestaurantId!.Value);

            await _tableNotifier.TableStatusChangedAsync(existing.Value.RestaurantId!.Value, new TableStatusUpdate
            {
                Id = id,
                Status = nameof(RestaurantTableStatus.Free),
                CurrentPartySize = 0,
            });

            return Ok(result);
        }

        [HttpPost("{id:long}/finish-eating")]
        [Authorize(Policy = Policies.Cashier)]
        public async Task<IActionResult> FinishEating(long id)
        {
            var existing = await _tableService.GetByIdAsync(id);
            if (!existing.IsSuccess || existing.Value is null)
                return NotFound(existing);

            if (!await CanAccessRestaurantAsync(existing.Value.RestaurantId))
                return Forbid();

            var statusRes = await _tableService.SetStatusAsync(id, RestaurantTableStatus.Cleaning, CurrentUserId());
            if (!statusRes.IsSuccess) return BadRequest(statusRes);

            await EnsureTableSessionClosedAsync(id, existing.Value.RestaurantId!.Value);

            await _tableNotifier.TableStatusChangedAsync(existing.Value.RestaurantId!.Value, new TableStatusUpdate
            {
                Id = id,
                Status = nameof(RestaurantTableStatus.Cleaning),
                CurrentPartySize = 0,
            });

            return Ok(statusRes);
        }

        [HttpGet("status/{restaurantId:long}")]
        [Authorize]
        public async Task<IActionResult> GetStatus(long restaurantId)
        {
            if (!await CanAccessRestaurantAsync(restaurantId))
                return Forbid();

            var tablesRes = await _tableService.GetByRestaurantAsync(restaurantId);
            if (!tablesRes.IsSuccess)
                return BadRequest(tablesRes);

            var tables = tablesRes.Value ?? new List<RestaurantTableDto>();
            var activeRes = await _orderService.GetActiveByRestaurantAsync(restaurantId);
            var active = activeRes.IsSuccess ? activeRes.Value! : new();

            var byTable = active
                .GroupBy(o => o.TableId)
                .ToDictionary(g => g.Key, g => g.OrderByDescending(o => o.CreatedAt).ToList());

            var dto = tables.Select(t => new TableStatusDto
            {
                Id = t.Id,
                Number = t.Number,
                Label = t.Label,
                Capacity = t.Capacity,
                Status = t.Status,
                CurrentPartySize = t.CurrentPartySize,
                IsActive = t.IsActive,
                ActiveOrders = byTable.TryGetValue(t.Id, out var list) ? list.Count : 0,
                LatestOrderStatus = byTable.TryGetValue(t.Id, out var list2) && list2.Count > 0
                    ? list2[0].Status
                    : null,
                LatestOrderId = byTable.TryGetValue(t.Id, out var list3) && list3.Count > 0
                    ? list3[0].Id
                    : (long?)null,
            }).ToList();

            return Ok(Result<List<TableStatusDto>>.Success(dto));
        }

        public class TableStatusDto
        {
            public long Id { get; set; }
            public int Number { get; set; }
            public string? Label { get; set; }
            public int Capacity { get; set; }
            public string Status { get; set; } = string.Empty;
            public int CurrentPartySize { get; set; }
            public bool IsActive { get; set; }
            public int ActiveOrders { get; set; }
            public string? LatestOrderStatus { get; set; }
            public long? LatestOrderId { get; set; }
        }

        private long CurrentUserIdOrZero() => _currentUser.UserId ?? 0;

        private long? GuestRestaurantId() => _currentUser.IsGuest ? _currentUser.RestaurantId : null;

        private long CurrentUserId() => _currentUser.UserId ?? -1;

        private bool IsSuperAdmin() => _currentUser.IsSuperAdmin;

        private async Task<bool> CanAccessRestaurantAsync(long? restaurantId)
        {
            if (IsSuperAdmin()) return true;
            if (restaurantId == null) return false;

            var ids = await _userService.GetAssignedRestaurantIdsAsync(CurrentUserId());
            return ids.Contains(restaurantId.Value);
        }
    }
}
