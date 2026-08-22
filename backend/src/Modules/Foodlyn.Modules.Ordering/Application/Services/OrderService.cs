using Foodlyn.Modules.Ordering.Application.DTOs;
using Foodlyn.Modules.Ordering.Application.Repositories;
using Foodlyn.Modules.Ordering.Domain.Entities;
using Foodlyn.Shared.Application;
using Mapster;

namespace Foodlyn.Modules.Ordering.Application.Services
{
    public class OrderService : IOrderService
    {
        private readonly IOrderRepository _repo;
        private readonly IOrderNotifier _notifier;

        public OrderService(IOrderRepository repo, IOrderNotifier notifier)
        {
            _repo = repo;
            _notifier = notifier;
        }

        public async Task<Result<OrderDto>> GetByIdAsync(long id)
        {
            var order = await _repo.GetByIdAsync(id);
            return order is null
                ? Result<OrderDto>.Failure("Order not found")
                : Result<OrderDto>.Success(order.Adapt<OrderDto>());
        }

        public async Task<Result<List<OrderDto>>> GetCashierQueueAsync(long restaurantId)
        {
            var orders = await _repo.GetByRestaurantAndStatusesAsync(restaurantId,
                new[] { OrderStatus.Placed, OrderStatus.Approved, OrderStatus.Preparing, OrderStatus.Ready });
            return Result<List<OrderDto>>.Success(orders.Adapt<List<OrderDto>>());
        }

        public async Task<Result<List<OrderDto>>> GetAwaitingPaymentAsync(long restaurantId)
        {
            var orders = await _repo.GetByRestaurantAndStatusesAsync(restaurantId,
                new[] { OrderStatus.AwaitingPayment });
            return Result<List<OrderDto>>.Success(orders.Adapt<List<OrderDto>>());
        }

        public async Task<Result<List<OrderDto>>> GetHistoryAsync(long restaurantId, int take = 100)
        {
            if (take <= 0 || take > 500) take = 100;
            var orders = await _repo.GetHistoryByRestaurantAsync(restaurantId, take);
            return Result<List<OrderDto>>.Success(orders.Adapt<List<OrderDto>>());
        }

        public async Task<Result<PagedResult<OrderDto>>> GetPagedHistoryAsync(PagedOrderQueryDto query)
        {
            var (items, total) = await _repo.GetPagedHistoryAsync(query);
            return Result<PagedResult<OrderDto>>.Success(new PagedResult<OrderDto>
            {
                Items = items.Adapt<List<OrderDto>>(),
                TotalCount = total,
                Page = query.SafePage,
                PageSize = query.SafePageSize,
            });
        }

        public async Task<Result<List<OrderDto>>> GetKitchenQueueAsync(long restaurantId)
        {
            var orders = await _repo.GetByRestaurantAndStatusesAsync(restaurantId,
                new[] { OrderStatus.Approved, OrderStatus.Preparing });
            return Result<List<OrderDto>>.Success(orders.Adapt<List<OrderDto>>());
        }

        public async Task<Result<List<OrderDto>>> GetWaiterQueueAsync(long restaurantId)
        {
            var orders = await _repo.GetByRestaurantAndStatusesAsync(restaurantId,
                new[] { OrderStatus.Preparing, OrderStatus.Ready });
            return Result<List<OrderDto>>.Success(orders.Adapt<List<OrderDto>>());
        }

        public async Task<Result<List<OrderDto>>> GetActiveByRestaurantAsync(long restaurantId)
        {
            var orders = await _repo.GetByRestaurantAndStatusesAsync(restaurantId,
                new[] { OrderStatus.Placed, OrderStatus.Approved, OrderStatus.Preparing, OrderStatus.Ready });
            return Result<List<OrderDto>>.Success(orders.Adapt<List<OrderDto>>());
        }

        public async Task<Result<List<OrderDto>>> GetLiveByRestaurantAsync(long restaurantId)
        {
            var orders = await _repo.GetByRestaurantAndStatusesAsync(restaurantId, LiveStatuses);
            return Result<List<OrderDto>>.Success(orders.Adapt<List<OrderDto>>());
        }

        public async Task<Result<List<OrderDto>>> GetLiveAllAsync()
        {
            var orders = await _repo.GetByStatusesAsync(LiveStatuses);
            return Result<List<OrderDto>>.Success(orders.Adapt<List<OrderDto>>());
        }

        private static readonly OrderStatus[] LiveStatuses =
        {
            OrderStatus.Placed,
            OrderStatus.Approved,
            OrderStatus.Preparing,
            OrderStatus.Ready,
            OrderStatus.Served,
            OrderStatus.AwaitingPayment,
        };

        public async Task<Result<List<OrderDto>>> GetMineAsync(long? userId, string? sessionId, long? tableId = null)
        {
            var merged = new Dictionary<long, Order>();

            if (userId is > -1)
            {
                foreach (var o in await _repo.GetByUserAsync(userId.Value))
                    merged[o.Id] = o;
            }

            if (!string.IsNullOrWhiteSpace(sessionId))
            {
                foreach (var o in await _repo.GetBySessionAsync(sessionId))
                    merged[o.Id] = o;
            }

            if (tableId is > 0)
            {
                foreach (var o in await _repo.GetByTableAsync(tableId.Value, LiveStatuses))
                {
                    if (o.CreatedBy is null or 0 || o.IsStaffOrder)
                        merged[o.Id] = o;
                }
            }

            var list = merged.Values
                .OrderByDescending(o => o.CreatedAt)
                .ToList();
            return Result<List<OrderDto>>.Success(list.Adapt<List<OrderDto>>());
        }

        public async Task<Result<OrderDto>> CreateAsync(ResolvedOrderContext ctx)
        {
            if (ctx.Items.Count == 0)
                return Result<OrderDto>.Failure("Order must have at least one item");

            if (ctx.Items.Any(i => i.Quantity <= 0))
                return Result<OrderDto>.Failure("Item quantity must be positive");

            var order = new Order
            {
                RestaurantId = ctx.RestaurantId,
                TableId = ctx.TableId,
                TableNumber = ctx.TableNumber,
                TableLabel = ctx.TableLabel,
                SessionId = ctx.SessionId,
                IsStaffOrder = ctx.IsStaffOrder,
                CustomerName = ctx.CustomerName,
                DeliveryNotes = ctx.DeliveryNotes,
                PartySize = ctx.PartySize,
                Status = OrderStatus.Placed,
                TotalAmount = ctx.Items.Sum(i => (i.Price + i.Modifiers.Sum(m => m.Price)) * i.Quantity),
                Currency = ctx.Currency,
                PaymentMethod = ctx.PaymentMethod,
                CreatedBy = ctx.UserId,
                Items = ctx.Items.Select(i => new OrderItem
                {
                    MenuItemId = i.MenuItemId,
                    Name = i.Name,
                    Price = i.Price,
                    Quantity = i.Quantity,
                    Notes = i.Notes,
                    Modifiers = i.Modifiers.Select(m => new OrderItemModifier
                    {
                        MenuItemModifierId = m.MenuItemModifierId,
                        GroupName = m.GroupName,
                        Name = m.Name,
                        Price = m.Price,
                    }).ToList(),
                }).ToList(),
            };

            await _repo.AddAsync(order);
            await _repo.SaveChangesAsync();

            var dto = order.Adapt<OrderDto>();
            await _notifier.OrderCreatedAsync(dto);
            return Result<OrderDto>.Success(dto);
        }

        public async Task<Result<OrderDto>> ApproveAsync(long id, long userId, long restaurantId)
        {
            var order = await _repo.GetByIdAsync(id);
            if (order is null) return Result<OrderDto>.Failure("Order not found");
            if (order.RestaurantId != restaurantId) return Result<OrderDto>.Failure("Forbidden");
            if (order.Status != OrderStatus.Placed)
                return Result<OrderDto>.Failure($"Cannot approve order in status {order.Status}");

            order.Status = OrderStatus.Approved;
            order.ApprovedAt = DateTime.UtcNow;
            order.ApprovedBy = userId;
            order.UpdatedBy = userId;

            await _repo.SaveChangesAsync();

            var dto = order.Adapt<OrderDto>();
            await _notifier.OrderUpdatedAsync(dto);
            return Result<OrderDto>.Success(dto);
        }

        public async Task<Result<OrderDto>> RejectAsync(long id, RejectOrderDto dto, long userId, long restaurantId)
        {
            var order = await _repo.GetByIdAsync(id);
            if (order is null) return Result<OrderDto>.Failure("Order not found");
            if (order.RestaurantId != restaurantId) return Result<OrderDto>.Failure("Forbidden");
            if (order.Status != OrderStatus.Placed)
                return Result<OrderDto>.Failure($"Cannot reject order in status {order.Status}");

            order.Status = OrderStatus.Rejected;
            order.RejectedAt = DateTime.UtcNow;
            order.RejectedReason = dto.Reason?.Trim();
            order.UpdatedBy = userId;

            await _repo.SaveChangesAsync();

            var res = order.Adapt<OrderDto>();
            await _notifier.OrderUpdatedAsync(res);
            return Result<OrderDto>.Success(res);
        }

        public async Task<Result<OrderDto>> StartPreparingAsync(long id, StartPreparingDto dto, long userId, long restaurantId)
        {
            if (dto.PrepTimeMinutes <= 0 || dto.PrepTimeMinutes > 240)
                return Result<OrderDto>.Failure("Prep time must be between 1 and 240 minutes");

            var order = await _repo.GetByIdAsync(id);
            if (order is null) return Result<OrderDto>.Failure("Order not found");
            if (order.RestaurantId != restaurantId) return Result<OrderDto>.Failure("Forbidden");
            if (order.Status != OrderStatus.Approved)
                return Result<OrderDto>.Failure($"Cannot start preparing order in status {order.Status}");

            order.Status = OrderStatus.Preparing;
            order.PreparingStartedAt = DateTime.UtcNow;
            order.PrepTimeMinutes = dto.PrepTimeMinutes;
            order.PreparedBy = userId;
            order.UpdatedBy = userId;

            await _repo.SaveChangesAsync();

            var res = order.Adapt<OrderDto>();
            await _notifier.OrderUpdatedAsync(res);
            return Result<OrderDto>.Success(res);
        }

        public async Task<Result<OrderDto>> MarkReadyAsync(long id, long userId, long restaurantId)
        {
            var order = await _repo.GetByIdAsync(id);
            if (order is null) return Result<OrderDto>.Failure("Order not found");
            if (order.RestaurantId != restaurantId) return Result<OrderDto>.Failure("Forbidden");
            if (order.Status != OrderStatus.Preparing)
                return Result<OrderDto>.Failure($"Cannot mark ready order in status {order.Status}");

            order.Status = OrderStatus.Ready;
            order.ReadyAt = DateTime.UtcNow;
            order.UpdatedBy = userId;

            await _repo.SaveChangesAsync();

            var res = order.Adapt<OrderDto>();
            await _notifier.OrderUpdatedAsync(res);
            return Result<OrderDto>.Success(res);
        }

        public async Task<Result<OrderDto>> MarkServedAsync(long id, long userId, long restaurantId)
        {
            var order = await _repo.GetByIdAsync(id);
            if (order is null) return Result<OrderDto>.Failure("Order not found");
            if (order.RestaurantId != restaurantId) return Result<OrderDto>.Failure("Forbidden");
            if (order.Status != OrderStatus.Ready)
                return Result<OrderDto>.Failure($"Cannot mark served order in status {order.Status}");

            var now = DateTime.UtcNow;
            order.ServedAt = now;
            order.ServedBy = userId;
            order.UpdatedBy = userId;

            if (order.PaymentMethod == Domain.Entities.PaymentMethod.Cash)
            {
                order.Status = OrderStatus.AwaitingPayment;
            }
            else
            {
                order.Status = OrderStatus.Completed;
                order.PaidAt = now;
                order.PaidBy = userId;
                order.CompletedAt = now;
            }

            await _repo.SaveChangesAsync();

            var res = order.Adapt<OrderDto>();
            await _notifier.OrderUpdatedAsync(res);
            return Result<OrderDto>.Success(res);
        }

        public async Task<Result<OrderDto>> MarkPaidAsync(long id, long userId, long restaurantId)
        {
            var order = await _repo.GetByIdAsync(id);
            if (order is null) return Result<OrderDto>.Failure("Order not found");
            if (order.RestaurantId != restaurantId) return Result<OrderDto>.Failure("Forbidden");
            if (order.Status != OrderStatus.AwaitingPayment)
                return Result<OrderDto>.Failure($"Cannot mark paid order in status {order.Status}");

            var now = DateTime.UtcNow;
            order.Status = OrderStatus.Completed;
            order.PaidAt = now;
            order.PaidBy = userId;
            order.CompletedAt = now;
            order.UpdatedBy = userId;

            await _repo.SaveChangesAsync();

            var res = order.Adapt<OrderDto>();
            await _notifier.OrderUpdatedAsync(res);
            return Result<OrderDto>.Success(res);
        }

        public async Task<bool> HasUnsettledForTableAsync(long tableId)
        {
            var orders = await _repo.GetByTableAsync(tableId, LiveStatuses);
            return orders.Count > 0;
        }

        public async Task<long?> GetJoinableStaffOrderIdForTableAsync(long tableId)
        {
            var orders = await _repo.GetByTableAsync(tableId, LiveStatuses);
            var staffOrder = orders
                .Where(o => o.IsStaffOrder || o.CreatedBy is null or 0)
                .OrderByDescending(o => o.CreatedAt)
                .FirstOrDefault();
            return staffOrder?.Id;
        }

        public async Task<long?> GetMyLiveOrderIdForTableAsync(long tableId, long? userId, string? sessionId, bool anyForTableGuest)
        {
            var orders = await _repo.GetByTableAsync(tableId, LiveStatuses);
            var mine = orders
                .Where(o =>
                    anyForTableGuest ||
                    (!string.IsNullOrEmpty(sessionId) && o.SessionId == sessionId) ||
                    (userId is > 0 && !o.IsStaffOrder && o.CreatedBy == userId))
                .OrderByDescending(o => o.CreatedAt)
                .FirstOrDefault();
            return mine?.Id;
        }

        public async Task<Result<List<OrderDto>>> GetActiveAtTableAsync(long tableId)
        {
            var orders = await _repo.GetByTableAsync(tableId, LiveStatuses);
            return Result<List<OrderDto>>.Success(orders.Adapt<List<OrderDto>>());
        }

        public async Task<TableProgress> GetTableProgressAsync(long tableId)
        {
            var active = await _repo.GetByTableAsync(tableId, LiveStatuses);

            if (active.Count == 0) return TableProgress.NoActive;

            var anyStillCooking = active.Any(o =>
                o.Status == OrderStatus.Placed ||
                o.Status == OrderStatus.Approved ||
                o.Status == OrderStatus.Preparing ||
                o.Status == OrderStatus.Ready);

            return anyStillCooking ? TableProgress.StillCooking : TableProgress.AllServed;
        }

        public async Task<Result<OrderAnalyticsDto>> GetAnalyticsAsync(OrderAnalyticsQueryDto query)
        {
            var ids = ResolveRestaurantIds(query);
            if (ids is { Count: 0 })
                return Result<OrderAnalyticsDto>.Success(EmptyAnalytics(query.Range));

            var (from, to) = await ResolveRangeAsync(query, ids);
            var orders = await _repo.GetCompletedInRangeAsync(ids, from, to);
            var rates = await _repo.GetCurrencyRatesToEurAsync();

            var totalRevenue = orders.Sum(o => ToEur(o.TotalAmount, o.Currency, rates));
            var avgOrderValue = orders.Count > 0 ? totalRevenue / orders.Count : 0m;

            var bars = query.Range switch
            {
                AnalyticsRange.Week => BuildDailyBars(orders, from, 7, rates),
                AnalyticsRange.Month => BuildDailyBars(orders, from, DateTime.DaysInMonth(from.Year, from.Month), rates),
                AnalyticsRange.Year => BuildMonthlyBars(orders, from.Year, rates),
                AnalyticsRange.Lifetime => BuildYearlyBars(orders, from, to, rates),
                _ => new List<OrderAnalyticsBarDto>(),
            };

            var mostSold = orders
                .SelectMany(o => o.Items)
                .GroupBy(i => i.Name)
                .Select(g => new OrderAnalyticsMostSoldDto { Name = g.Key, Count = g.Sum(i => i.Quantity) })
                .OrderByDescending(x => x.Count)
                .Take(6)
                .ToList();

            return Result<OrderAnalyticsDto>.Success(new OrderAnalyticsDto
            {
                Range = query.Range.ToString(),
                FromDate = from,
                ToDate = to,
                TotalCompleted = orders.Count,
                TotalRevenue = totalRevenue,
                AvgOrderValue = avgOrderValue,
                Bars = bars,
                MostSold = mostSold,
            });
        }

        public async Task<Result<List<TopRestaurantStatDto>>> GetLifetimeTopRestaurantsAsync()
        {
            var earliest = await _repo.GetEarliestCompletedDateAsync(null);
            var now = DateTime.UtcNow;
            var from = earliest.HasValue
                ? new DateTime(earliest.Value.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                : new DateTime(now.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            var to = new DateTime(now.Year + 1, 1, 1, 0, 0, 0, DateTimeKind.Utc);

            var orders = await _repo.GetCompletedInRangeAsync(null, from, to);

            var stats = orders
                .Where(o => o.RestaurantId.HasValue)
                .GroupBy(o => o.RestaurantId!.Value)
                .Select(g => new TopRestaurantStatDto
                {
                    RestaurantId = g.Key,
                    OrderCount = g.Count(),
                    Revenue = g.Sum(o => o.TotalAmount),
                    Currency = g.Select(o => o.Currency).FirstOrDefault(c => !string.IsNullOrEmpty(c)),
                })
                .ToList();

            return Result<List<TopRestaurantStatDto>>.Success(stats);
        }

        private static List<long>? ResolveRestaurantIds(OrderAnalyticsQueryDto query)
        {
            if (query.RestaurantId.HasValue && query.RestaurantId.Value > 0)
                return new List<long> { query.RestaurantId.Value };
            if (query.AllRestaurants)
                return null;
            if (query.RestrictToRestaurantIds is { Count: > 0 })
                return query.RestrictToRestaurantIds.Distinct().ToList();
            return new List<long>();
        }

        private async Task<(DateTime From, DateTime To)> ResolveRangeAsync(OrderAnalyticsQueryDto query, List<long>? ids)
        {
            var now = DateTime.UtcNow;
            switch (query.Range)
            {
                case AnalyticsRange.Week:
                    {
                        var endExclusive = new DateTime(now.Year, now.Month, now.Day, 0, 0, 0, DateTimeKind.Utc).AddDays(1);
                        var start = endExclusive.AddDays(-7);
                        return (start, endExclusive);
                    }
                case AnalyticsRange.Month:
                    {
                        var year = query.Year ?? now.Year;
                        var month = query.Month ?? now.Month;
                        var start = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
                        var end = start.AddMonths(1);
                        return (start, end);
                    }
                case AnalyticsRange.Year:
                    {
                        var year = query.Year ?? now.Year;
                        var start = new DateTime(year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
                        var end = start.AddYears(1);
                        return (start, end);
                    }
                case AnalyticsRange.Lifetime:
                default:
                    {
                        var earliest = await _repo.GetEarliestCompletedDateAsync(ids);
                        var start = earliest.HasValue
                            ? new DateTime(earliest.Value.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                            : new DateTime(now.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
                        var end = new DateTime(now.Year + 1, 1, 1, 0, 0, 0, DateTimeKind.Utc);
                        return (start, end);
                    }
            }
        }

        private static decimal ToEur(decimal amount, string? code, Dictionary<string, decimal> rates)
        {
            if (amount == 0 || string.IsNullOrEmpty(code)) return amount;
            if (!rates.TryGetValue(code, out var rate) || rate <= 0) return amount;
            return amount / rate;
        }

        private static List<OrderAnalyticsBarDto> BuildDailyBars(List<Order> orders, DateTime from, int days, Dictionary<string, decimal> rates)
        {
            var bars = new OrderAnalyticsBarDto[days];
            var labels = new[] { "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" };

            for (var i = 0; i < days; i++)
            {
                var day = from.AddDays(i);
                bars[i] = new OrderAnalyticsBarDto
                {
                    Label = days == 7 ? labels[((int)day.DayOfWeek + 6) % 7] : day.Day.ToString(),
                };
            }

            foreach (var o in orders)
            {
                var d = o.CompletedAt ?? o.CreatedAt;
                var idx = (int)Math.Floor((d - from).TotalDays);
                if (idx < 0 || idx >= days) continue;
                bars[idx].Revenue += ToEur(o.TotalAmount, o.Currency, rates);
                bars[idx].OrderCount += 1;
            }

            ApplyPercents(bars);
            return bars.ToList();
        }

        private static List<OrderAnalyticsBarDto> BuildMonthlyBars(List<Order> orders, int year, Dictionary<string, decimal> rates)
        {
            var labels = new[] { "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" };
            var bars = new OrderAnalyticsBarDto[12];
            for (var i = 0; i < 12; i++)
                bars[i] = new OrderAnalyticsBarDto { Label = labels[i] };

            foreach (var o in orders)
            {
                var d = o.CompletedAt ?? o.CreatedAt;
                if (d.Year != year) continue;
                var idx = d.Month - 1;
                bars[idx].Revenue += ToEur(o.TotalAmount, o.Currency, rates);
                bars[idx].OrderCount += 1;
            }

            ApplyPercents(bars);
            return bars.ToList();
        }

        private static List<OrderAnalyticsBarDto> BuildYearlyBars(List<Order> orders, DateTime from, DateTime to, Dictionary<string, decimal> rates)
        {
            var startYear = from.Year;
            var endYear = to.AddDays(-1).Year;
            var count = Math.Max(1, endYear - startYear + 1);

            var bars = new OrderAnalyticsBarDto[count];
            for (var i = 0; i < count; i++)
                bars[i] = new OrderAnalyticsBarDto { Label = (startYear + i).ToString() };

            foreach (var o in orders)
            {
                var d = o.CompletedAt ?? o.CreatedAt;
                var idx = d.Year - startYear;
                if (idx < 0 || idx >= count) continue;
                bars[idx].Revenue += ToEur(o.TotalAmount, o.Currency, rates);
                bars[idx].OrderCount += 1;
            }

            ApplyPercents(bars);
            return bars.ToList();
        }

        private static void ApplyPercents(OrderAnalyticsBarDto[] bars)
        {
            var max = bars.Length == 0 ? 0m : bars.Max(b => b.Revenue);
            if (max <= 0) return;
            foreach (var b in bars)
                b.Percent = (int)Math.Round(b.Revenue / max * 100m);
        }

        private static OrderAnalyticsDto EmptyAnalytics(AnalyticsRange range) => new()
        {
            Range = range.ToString(),
            FromDate = DateTime.UtcNow,
            ToDate = DateTime.UtcNow,
            TotalCompleted = 0,
            TotalRevenue = 0,
            AvgOrderValue = 0,
            Bars = new(),
            MostSold = new(),
        };

        public async Task<Result<OrderDto>> CancelAsync(long id, long? userId, string? sessionId)
        {
            var order = await _repo.GetByIdAsync(id);
            if (order is null) return Result<OrderDto>.Failure("Order not found");

            var ownsByUser = userId is > 0 && order.CreatedBy == userId;
            var ownsBySession = !string.IsNullOrEmpty(sessionId) && order.SessionId == sessionId;
            if (!ownsByUser && !ownsBySession) return Result<OrderDto>.Failure("Forbidden");

            if (order.Status != OrderStatus.Placed)
                return Result<OrderDto>.Failure("Only pending orders can be cancelled");

            order.Status = OrderStatus.Cancelled;
            order.CancelledAt = DateTime.UtcNow;
            order.UpdatedBy = userId;

            await _repo.SaveChangesAsync();

            var res = order.Adapt<OrderDto>();
            await _notifier.OrderUpdatedAsync(res);
            return Result<OrderDto>.Success(res);
        }
    }
}
