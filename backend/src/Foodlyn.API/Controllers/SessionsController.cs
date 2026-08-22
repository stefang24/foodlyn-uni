using Foodlyn.API.Services.TableLobby;
using Foodlyn.Modules.Identity.Application.Services;
using Foodlyn.Modules.Menus.Application.Services;
using Foodlyn.Modules.Ordering.Application.DTOs;
using Foodlyn.Modules.Ordering.Application.Services;
using Foodlyn.Modules.Ordering.Domain.Entities;
using Foodlyn.Modules.Restaurants.Application.Services;
using Foodlyn.Shared.Application;
using Foodlyn.Shared.Configuration;
using Foodlyn.Shared.Constants;
using Foodlyn.Shared.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Foodlyn.API.Controllers
{
    [Route("api/sessions")]
    [ApiController]
    public class SessionsController : ControllerBase
    {
        private readonly ITableSessionService _sessionService;
        private readonly ITableLobbyService _lobbyService;
        private readonly IRestaurantService _restaurantService;
        private readonly IRestaurantTableService _tableService;
        private readonly IMenuService _menuService;
        private readonly IAuthService _authService;
        private readonly IOrderService _orderService;
        private readonly ICurrentUserContext _currentUser;

        public SessionsController(
            ITableSessionService sessionService,
            ITableLobbyService lobbyService,
            IRestaurantService restaurantService,
            IRestaurantTableService tableService,
            IMenuService menuService,
            IAuthService authService,
            IOrderService orderService,
            ICurrentUserContext currentUser)
        {
            _sessionService = sessionService;
            _lobbyService = lobbyService;
            _restaurantService = restaurantService;
            _tableService = tableService;
            _menuService = menuService;
            _authService = authService;
            _orderService = orderService;
            _currentUser = currentUser;
        }

        [HttpPost("scan")]
        public async Task<IActionResult> Scan([FromBody] ScanQrDto dto)
        {
            if (dto.QrToken == Guid.Empty)
                return BadRequest(Result<ScanResultDto>.Failure("QR token is required"));

            var tableRes = await _tableService.ResolveQrTokenAsync(dto.QrToken);
            if (!tableRes.IsSuccess || tableRes.Value is null)
                return BadRequest(Result<ScanResultDto>.Failure(tableRes.Error ?? "Invalid QR token"));

            var table = tableRes.Value;
            if (table.Status == "OutOfService")
                return BadRequest(Result<ScanResultDto>.Failure("TABLE_OUT_OF_SERVICE"));

            if (table.Status == "Cleaning")
                return BadRequest(Result<ScanResultDto>.Failure("TABLE_NEEDS_CLEANING"));

            var restaurantRes = await _restaurantService.GetByIdAsync(table.RestaurantId);
            if (!restaurantRes.IsSuccess || restaurantRes.Value is null)
                return BadRequest(Result<ScanResultDto>.Failure("Restaurant not found"));

            var restaurant = restaurantRes.Value;
            var geoCheck = CheckGeo(restaurant.Latitude, restaurant.Longitude, dto.CustomerLatitude, dto.CustomerLongitude);
            if (geoCheck is not null) return BadRequest(geoCheck);

            var result = new ScanResultDto
            {
                RestaurantId = restaurant.Id,
                TableId = table.TableId,
                TableNumber = table.TableNumber,
                TableLabel = table.TableLabel,
                RestaurantName = restaurant.Name,
                RestaurantLogoUrl = restaurant.LogoUrl,
            };

            var existing = await _sessionService.GetOpenForTableAsync(table.TableId);
            if (existing is not null)
            {
                var existingDto = (await _sessionService.GetWithCartAsync(existing.Id)).Value;

                if (existing.OwnerKind == TableSessionOwner.User)
                {
                    var callerUserId = _currentUser.UserId;
                    if (callerUserId is null || callerUserId.Value != existing.OwnerUserId)
                    {
                        result.BlockedByOtherUser = true;
                    }
                    else
                    {
                        result.IsOwnerOfExisting = true;
                    }
                }
                else
                {
                    if (_currentUser.UserId is > 0 && !_currentUser.IsGuest)
                    {
                        result.ShouldLogoutForGuestJoin = true;
                    }
                }

                if (!result.BlockedByOtherUser)
                {
                    result.ExistingSession = existingDto;
                }
            }
            else
            {
                var joinableOrderId = await _orderService.GetJoinableStaffOrderIdForTableAsync(table.TableId);
                if (joinableOrderId.HasValue)
                {
                    result.JoinableOrderId = joinableOrderId;
                }
                else if (await _orderService.HasUnsettledForTableAsync(table.TableId))
                {
                    var isTableGuest = _currentUser.IsGuest && _currentUser.TableId == table.TableId;
                    var myOrderId = await _orderService.GetMyLiveOrderIdForTableAsync(
                        table.TableId, _currentUser.UserId, _currentUser.SessionId, isTableGuest);
                    if (myOrderId.HasValue)
                    {
                        result.MyActiveOrderId = myOrderId;
                    }
                    else
                    {
                        result.BlockedByActiveOrder = true;
                    }
                }
            }

            return Ok(Result<ScanResultDto>.Success(result));
        }

        [HttpGet("access/{token:guid}")]
        public async Task<IActionResult> Access(Guid token)
        {
            var tableRes = await _tableService.ResolveQrTokenAsync(token);
            if (!tableRes.IsSuccess || tableRes.Value is null)
                return Ok(Result<TableAccessDto>.Success(new TableAccessDto { CanStartFresh = false }));

            var table = tableRes.Value;
            var info = new TableAccessDto
            {
                RestaurantId = table.RestaurantId,
                TableId = table.TableId,
            };

            var existing = await _sessionService.GetOpenForTableAsync(table.TableId);
            if (existing is not null)
            {
                info.HasOpenSession = true;
                info.SessionOwnerKind = existing.OwnerKind.ToString();

                if (existing.OwnerKind == TableSessionOwner.User)
                {
                    info.IsSessionMember =
                        _currentUser.UserId is > 0 && _currentUser.UserId == existing.OwnerUserId;
                    info.BlockedByOtherUser = !info.IsSessionMember;
                }
                else
                {
                    info.IsSessionMember = _currentUser.IsGuest && _currentUser.TableId == table.TableId;
                }
                info.CanStartFresh = info.IsSessionMember;
            }
            else
            {
                var joinableOrderId = await _orderService.GetJoinableStaffOrderIdForTableAsync(table.TableId);
                if (joinableOrderId.HasValue)
                {
                    info.JoinableOrderId = joinableOrderId;
                    info.CanStartFresh = true;
                }
                else if (await _orderService.HasUnsettledForTableAsync(table.TableId))
                {
                    var isTableGuest = _currentUser.IsGuest && _currentUser.TableId == table.TableId;
                    var myOrderId = await _orderService.GetMyLiveOrderIdForTableAsync(
                        table.TableId, _currentUser.UserId, _currentUser.SessionId, isTableGuest);
                    if (myOrderId.HasValue)
                    {
                        info.JoinableOrderId = myOrderId;
                        info.CanStartFresh = true;
                    }
                    else
                    {
                        info.BlockedByActiveOrder = true;
                        info.CanStartFresh = false;
                    }
                }
                else
                {
                    info.CanStartFresh = true;
                }
            }

            return Ok(Result<TableAccessDto>.Success(info));
        }

        [HttpPost("start-user")]
        [Authorize(Policy = Policies.Customer)]
        public async Task<IActionResult> StartUserSession([FromBody] StartSessionDto dto)
        {
            var scan = await ResolveAndCheckGeo(dto.QrToken, dto.CustomerLatitude, dto.CustomerLongitude);
            if (scan.error is not null) return BadRequest(scan.error);

            var userId = _currentUser.UserId;
            if (userId is null or <= 0)
                return Unauthorized(Result<TableSessionDto>.Failure("Not signed in"));

            var existing = await _sessionService.GetOpenForTableAsync(scan.table!.TableId);
            if (existing is not null)
            {
                if (existing.OwnerKind == TableSessionOwner.Guest)
                    return Conflict(Result<TableSessionDto>.Failure("TABLE_HAS_GUEST_SESSION"));

                if (existing.OwnerUserId != userId.Value)
                    return Conflict(Result<TableSessionDto>.Failure("TABLE_IN_USE_BY_OTHER_USER"));

                var current = await _sessionService.GetWithCartAsync(existing.Id);
                await _lobbyService.AdvanceAsync(
                    scan.table.TableId,
                    scan.table.RestaurantId,
                    TableLobbyStages.UserLocked,
                    sessionId: existing.Id);
                return Ok(current);
            }

            if (await _orderService.HasUnsettledForTableAsync(scan.table.TableId))
            {
                var myOrderId = await _orderService.GetMyLiveOrderIdForTableAsync(
                    scan.table.TableId, userId, null, false);
                if (!myOrderId.HasValue)
                    return Conflict(Result<TableSessionDto>.Failure("TABLE_HAS_UNFINISHED_ORDER"));
            }

            var created = await _sessionService.CreateAsync(new CreateSessionInput
            {
                RestaurantId = scan.table.RestaurantId,
                TableId = scan.table.TableId,
                TableNumber = scan.table.TableNumber,
                TableLabel = scan.table.TableLabel,
                PartySize = dto.PartySize <= 0 ? 1 : dto.PartySize,
                OwnerKind = TableSessionOwner.User,
                OwnerUserId = userId.Value,
            });
            if (created.IsSuccess && created.Value is not null)
            {
                await _lobbyService.AdvanceAsync(
                    scan.table.TableId,
                    scan.table.RestaurantId,
                    TableLobbyStages.UserLocked,
                    sessionId: created.Value.Id);
            }
            return Ok(created);
        }

        [HttpPost("start-guest")]
        public async Task<IActionResult> StartGuestSession([FromBody] StartSessionDto dto)
        {
            var scan = await ResolveAndCheckGeo(dto.QrToken, dto.CustomerLatitude, dto.CustomerLongitude);
            if (scan.error is not null) return BadRequest(scan.error);

            var existing = await _sessionService.GetOpenForTableAsync(scan.table!.TableId);

            if (existing is not null && existing.OwnerKind == TableSessionOwner.User)
            {
                if (_currentUser.UserId is null || _currentUser.UserId.Value != existing.OwnerUserId)
                    return Conflict(Result<TableSessionDto>.Failure("TABLE_IN_USE_BY_OTHER_USER"));
            }

            long? joinableOrderId = null;
            if (existing is null && await _orderService.HasUnsettledForTableAsync(scan.table.TableId))
            {
                joinableOrderId = await _orderService.GetJoinableStaffOrderIdForTableAsync(scan.table.TableId);
                if (!joinableOrderId.HasValue)
                {
                    var isTableGuest = _currentUser.IsGuest && _currentUser.TableId == scan.table.TableId;
                    var myOrderId = await _orderService.GetMyLiveOrderIdForTableAsync(
                        scan.table.TableId, _currentUser.UserId, _currentUser.SessionId, isTableGuest);
                    if (!myOrderId.HasValue)
                        return Conflict(Result<TableSessionDto>.Failure("TABLE_HAS_UNFINISHED_ORDER"));
                }
            }

            var guestRes = await _authService.IssueGuestSessionAsync(scan.table.RestaurantId, scan.table.TableId, Response);
            if (!guestRes.IsSuccess)
                return BadRequest(Result<TableSessionDto>.Failure(guestRes.Error ?? "Could not start guest session"));

            if (existing is not null)
            {
                var current = await _sessionService.GetWithCartAsync(existing.Id);
                await _lobbyService.AdvanceAsync(
                    scan.table.TableId,
                    scan.table.RestaurantId,
                    TableLobbyStages.Menu,
                    sessionId: existing.Id);
                return Ok(current);
            }

            var partySize = dto.PartySize <= 0 ? 1 : dto.PartySize;
            if (joinableOrderId.HasValue)
            {
                var joinableOrder = await _orderService.GetByIdAsync(joinableOrderId.Value);
                if (joinableOrder.IsSuccess && joinableOrder.Value!.PartySize > 0)
                    partySize = joinableOrder.Value.PartySize;
            }

            var created = await _sessionService.CreateAsync(new CreateSessionInput
            {
                RestaurantId = scan.table.RestaurantId,
                TableId = scan.table.TableId,
                TableNumber = scan.table.TableNumber,
                TableLabel = scan.table.TableLabel,
                PartySize = partySize,
                OwnerKind = TableSessionOwner.Guest,
                OwnerUserId = null,
            });
            if (created.IsSuccess && created.Value is not null)
            {
                await _lobbyService.AdvanceAsync(
                    scan.table.TableId,
                    scan.table.RestaurantId,
                    joinableOrderId.HasValue ? TableLobbyStages.Tracking : TableLobbyStages.Menu,
                    sessionId: created.Value.Id,
                    orderId: joinableOrderId);
            }
            return Ok(created);
        }

        [HttpGet("lobby/{tableId:long}")]
        public IActionResult GetLobby(long tableId)
        {
            var state = _lobbyService.Get(tableId);
            return Ok(Result<TableLobbyDto?>.Success(state));
        }

        [HttpPost("lobby/{tableId:long}/advance")]
        public async Task<IActionResult> AdvanceLobby(long tableId, [FromBody] AdvanceLobbyDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Stage))
                return BadRequest(Result<TableLobbyDto>.Failure("Stage required"));

            var tableRes = await _tableService.GetByIdAsync(tableId);
            if (!tableRes.IsSuccess || tableRes.Value is null || tableRes.Value.RestaurantId is null)
                return BadRequest(Result<TableLobbyDto>.Failure("Table not found"));

            var next = await _lobbyService.AdvanceAsync(
                tableId,
                tableRes.Value.RestaurantId.Value,
                dto.Stage,
                sessionId: dto.SessionId,
                orderId: dto.OrderId,
                qrToken: dto.QrToken);
            return Ok(Result<TableLobbyDto>.Success(next));
        }

        public class AdvanceLobbyDto
        {
            public string Stage { get; set; } = TableLobbyStages.Choice;
            public long? SessionId { get; set; }
            public long? OrderId { get; set; }
            public string? QrToken { get; set; }
        }

        [HttpGet("for-table/{tableId:long}")]
        [Authorize]
        public async Task<IActionResult> GetForTable(long tableId)
        {
            if (!await CanAccessTableAsync(tableId)) return Forbid();

            var existing = await _sessionService.GetOpenForTableAsync(tableId);
            if (existing is null) return NotFound(Result<TableSessionDto>.Failure("No active session"));

            var dto = await _sessionService.GetWithCartAsync(existing.Id);
            return Ok(dto);
        }

        [HttpGet("{id:long}")]
        [Authorize]
        public async Task<IActionResult> GetById(long id)
        {
            if (!await CanAccessSessionAsync(id)) return Forbid();
            var dto = await _sessionService.GetWithCartAsync(id);
            return dto.IsSuccess ? Ok(dto) : NotFound(dto);
        }

        [HttpPost("{id:long}/cart")]
        [Authorize(Policy = Policies.Customer)]
        public async Task<IActionResult> AddCartLine(long id, [FromBody] AddCartLineDto dto)
        {
            if (!await CanAccessSessionAsync(id)) return Forbid();

            var sessionRes = await _sessionService.GetWithCartAsync(id);
            if (!sessionRes.IsSuccess) return NotFound(sessionRes);
            var session = sessionRes.Value!;

            var menus = await _menuService.GetPublicByRestaurantAsync(session.RestaurantId);
            if (!menus.IsSuccess) return BadRequest(menus);
            var item = menus.Value!
                .SelectMany(m => m.Categories)
                .SelectMany(c => c.Items)
                .FirstOrDefault(i => i.Id == dto.MenuItemId);
            if (item is null)
                return BadRequest(Result<TableSessionDto>.Failure("Item not available"));

            var unitPrice = item.DiscountedPrice ?? item.Price;
            var modifiers = new List<ResolvedCartModifier>();
            foreach (var modId in dto.ModifierIds.Distinct())
            {
                var group = item.ModifierGroups.FirstOrDefault(g => g.Modifiers.Any(m => m.Id == modId));
                if (group is null) return BadRequest(Result<TableSessionDto>.Failure($"Modifier {modId} is not available"));
                var modifier = group.Modifiers.First(m => m.Id == modId);
                if (!modifier.IsActive) return BadRequest(Result<TableSessionDto>.Failure($"Modifier {modifier.Name} is not available"));
                modifiers.Add(new ResolvedCartModifier
                {
                    MenuItemModifierId = modifier.Id,
                    GroupName = group.Name,
                    Name = modifier.Name,
                    Price = modifier.PriceDelta,
                });
            }

            foreach (var group in item.ModifierGroups.Where(g => g.IsActive))
            {
                var count = modifiers.Count(m => m.GroupName == group.Name);
                if (count < group.MinSelect)
                    return BadRequest(Result<TableSessionDto>.Failure($"Group '{group.Name}' requires at least {group.MinSelect} selection(s)"));
                if (count > group.MaxSelect)
                    return BadRequest(Result<TableSessionDto>.Failure($"Group '{group.Name}' allows at most {group.MaxSelect} selection(s)"));
            }

            var notes = dto.Notes?.Trim();
            var modIdsKey = string.Join(",", dto.ModifierIds.Distinct().OrderBy(x => x));
            var lineKey = $"{dto.MenuItemId}|{notes ?? string.Empty}|{modIdsKey}";

            var input = new ResolvedCartLineInput
            {
                LineKey = lineKey,
                MenuItemId = item.Id,
                Name = item.Name,
                UnitPrice = unitPrice,
                Quantity = Math.Max(1, dto.Quantity),
                Notes = string.IsNullOrEmpty(notes) ? null : notes,
                ImageUrl = item.ThumbnailUrl ?? item.ImageUrl,
                AddedByLabel = CurrentDisplayLabel(),
                AddedByUserId = _currentUser.UserId,
                AddedBySessionId = _currentUser.SessionId,
                Modifiers = modifiers,
            };

            var result = await _sessionService.AddOrIncreaseCartLineAsync(id, input);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpPut("{id:long}/cart/{lineId:long}")]
        [Authorize(Policy = Policies.Customer)]
        public async Task<IActionResult> UpdateCartLine(long id, long lineId, [FromBody] UpdateCartLineQuantityDto dto)
        {
            if (!await CanAccessSessionAsync(id)) return Forbid();
            var result = await _sessionService.SetCartLineQuantityAsync(id, lineId, dto.Quantity);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("{id:long}/cart/{lineId:long}")]
        [Authorize(Policy = Policies.Customer)]
        public async Task<IActionResult> RemoveCartLine(long id, long lineId)
        {
            if (!await CanAccessSessionAsync(id)) return Forbid();
            var result = await _sessionService.RemoveCartLineAsync(id, lineId);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpPost("{id:long}/cart/clear")]
        [Authorize(Policy = Policies.Customer)]
        public async Task<IActionResult> ClearCart(long id)
        {
            if (!await CanAccessSessionAsync(id)) return Forbid();
            var result = await _sessionService.ClearCartAsync(id);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpPost("{id:long}/close")]
        [Authorize]
        public async Task<IActionResult> Close(long id)
        {
            if (!await CanAccessSessionAsync(id, allowStaff: true)) return Forbid();
            var result = await _sessionService.CloseAsync(id);
            if (result.IsSuccess && result.Value is not null)
            {
                await _lobbyService.AdvanceAsync(
                    result.Value.TableId,
                    result.Value.RestaurantId,
                    TableLobbyStages.Choice);
            }
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpPost("restart")]
        public async Task<IActionResult> Restart([FromBody] ScanQrDto dto)
        {
            var tableRes = await _tableService.ResolveQrTokenAsync(dto.QrToken);
            if (!tableRes.IsSuccess || tableRes.Value is null)
                return BadRequest(Result<TableSessionDto>.Failure(tableRes.Error ?? "Invalid QR token"));
            var table = tableRes.Value;

            var restaurantRes = await _restaurantService.GetByIdAsync(table.RestaurantId);
            if (!restaurantRes.IsSuccess || restaurantRes.Value is null)
                return BadRequest(Result<TableSessionDto>.Failure("Restaurant not found"));
            var r = restaurantRes.Value;
            var geo = CheckGeo(r.Latitude, r.Longitude, dto.CustomerLatitude, dto.CustomerLongitude);
            if (geo is not null) return BadRequest(geo);

            var existing = await _sessionService.GetOpenForTableAsync(table.TableId);
            if (existing is not null)
            {
                await _sessionService.CloseAsync(existing.Id);
            }
            await _lobbyService.AdvanceAsync(table.TableId, table.RestaurantId, TableLobbyStages.Choice);
            return Ok(Result<bool>.Success(true));
        }

        private string? CurrentDisplayLabel()
        {
            if (_currentUser.IsGuest) return "Guest";
            if (!string.IsNullOrWhiteSpace(_currentUser.Username)) return _currentUser.Username;
            return _currentUser.FullName;
        }

        private async Task<(TableQrResolveDtoLite? table, object? error)> ResolveAndCheckGeo(
            Guid token, double? lat, double? lng)
        {
            if (token == Guid.Empty) return (null, Result<TableSessionDto>.Failure("QR token is required"));

            var tableRes = await _tableService.ResolveQrTokenAsync(token);
            if (!tableRes.IsSuccess || tableRes.Value is null)
                return (null, Result<TableSessionDto>.Failure(tableRes.Error ?? "Invalid QR token"));

            var t = tableRes.Value;
            if (t.Status == "OutOfService")
                return (null, Result<TableSessionDto>.Failure("TABLE_OUT_OF_SERVICE"));

            var restaurantRes = await _restaurantService.GetByIdAsync(t.RestaurantId);
            if (!restaurantRes.IsSuccess || restaurantRes.Value is null)
                return (null, Result<TableSessionDto>.Failure("Restaurant not found"));

            var r = restaurantRes.Value;
            var geo = CheckGeo(r.Latitude, r.Longitude, lat, lng);
            if (geo is not null) return (null, geo);

            return (new TableQrResolveDtoLite
            {
                RestaurantId = t.RestaurantId,
                TableId = t.TableId,
                TableNumber = t.TableNumber,
                TableLabel = t.TableLabel,
            }, null);
        }

        private static Result<TableSessionDto>? CheckGeo(decimal? rLat, decimal? rLng, double? lat, double? lng)
        {
            if (!ConfigProvider.Ordering.EnforceGeoFence) return null;
            if (rLat is null || rLng is null) return null;
            if (lat is null || lng is null)
                return Result<TableSessionDto>.Failure("LOCATION_REQUIRED");

            var distance = GeoHelper.HaversineDistanceMeters((double)rLat.Value, (double)rLng.Value, lat.Value, lng.Value);
            if (distance > ConfigProvider.Ordering.GeoRadiusMeters)
                return Result<TableSessionDto>.Failure(
                    $"OUT_OF_RANGE:{Math.Round(distance)}:{Math.Round(ConfigProvider.Ordering.GeoRadiusMeters)}");
            return null;
        }

        private async Task<bool> CanAccessSessionAsync(long sessionId, bool allowStaff = false)
        {
            var existing = await _sessionService.GetWithCartAsync(sessionId);
            if (!existing.IsSuccess) return false;
            return await CanAccessSessionInternalAsync(existing.Value!, allowStaff);
        }

        private async Task<bool> CanAccessTableAsync(long tableId)
        {
            var existing = await _sessionService.GetOpenForTableAsync(tableId);
            if (existing is null) return true;
            var dto = (await _sessionService.GetWithCartAsync(existing.Id)).Value;
            if (dto is null) return false;
            return await CanAccessSessionInternalAsync(dto, allowStaff: true);
        }

        private Task<bool> CanAccessSessionInternalAsync(TableSessionDto session, bool allowStaff)
        {
            if (allowStaff && _currentUser.IsInAnyRole(
                    Roles.Cashier, Roles.Waiter, Roles.Cook, Roles.Manager, Roles.SuperAdmin))
                return Task.FromResult(true);

            if (session.OwnerKind == nameof(TableSessionOwner.User))
            {
                return Task.FromResult(_currentUser.UserId is > 0 && _currentUser.UserId == session.OwnerUserId);
            }

            if (_currentUser.IsGuest)
            {
                return Task.FromResult(_currentUser.TableId == session.TableId);
            }

            return Task.FromResult(false);
        }

        private class TableQrResolveDtoLite
        {
            public long RestaurantId { get; set; }
            public long TableId { get; set; }
            public int TableNumber { get; set; }
            public string? TableLabel { get; set; }
        }
    }
}
