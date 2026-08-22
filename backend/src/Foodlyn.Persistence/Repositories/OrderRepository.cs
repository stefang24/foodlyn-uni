using Foodlyn.Modules.Ordering.Application.DTOs;
using Foodlyn.Modules.Ordering.Application.Repositories;
using Foodlyn.Modules.Ordering.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Foodlyn.Persistence.Repositories
{
    public class OrderRepository : IOrderRepository
    {
        private readonly AppDbContext _db;

        public OrderRepository(AppDbContext db) => _db = db;

        public async Task<Order?> GetByIdAsync(long id)
            => await _db.Orders
                .Include(o => o.Items)
                    .ThenInclude(i => i.Modifiers)
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(o => o.Id == id);

        public async Task<List<Order>> GetByRestaurantAndStatusesAsync(long restaurantId, IEnumerable<OrderStatus> statuses)
        {
            var list = statuses.ToList();
            return await _db.Orders
                .IgnoreQueryFilters()
                .Include(o => o.Items)
                    .ThenInclude(i => i.Modifiers)
                .Where(o => o.RestaurantId == restaurantId && list.Contains(o.Status))
                .OrderBy(o => o.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Order>> GetByStatusesAsync(IEnumerable<OrderStatus> statuses)
        {
            var list = statuses.ToList();
            return await _db.Orders
                .IgnoreQueryFilters()
                .Include(o => o.Items)
                    .ThenInclude(i => i.Modifiers)
                .Where(o => list.Contains(o.Status))
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Order>> GetBySessionAsync(string sessionId)
            => await _db.Orders
                .IgnoreQueryFilters()
                .Include(o => o.Items)
                    .ThenInclude(i => i.Modifiers)
                .Where(o => o.SessionId == sessionId)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

        public async Task<List<Order>> GetByUserAsync(long userId)
            => await _db.Orders
                .IgnoreQueryFilters()
                .Include(o => o.Items)
                    .ThenInclude(i => i.Modifiers)
                .Where(o => o.CreatedBy == userId)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

        public async Task<List<Order>> GetByTableAsync(long tableId, IEnumerable<OrderStatus> statuses)
        {
            var list = statuses.ToList();
            return await _db.Orders
                .IgnoreQueryFilters()
                .Include(o => o.Items)
                    .ThenInclude(i => i.Modifiers)
                .Where(o => o.TableId == tableId && list.Contains(o.Status))
                .OrderBy(o => o.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<Order>> GetCompletedInRangeAsync(IEnumerable<long>? restaurantIds, DateTime from, DateTime to)
        {
            var q = _db.Orders
                .IgnoreQueryFilters()
                .Include(o => o.Items)
                    .ThenInclude(i => i.Modifiers)
                .Where(o => o.Status == OrderStatus.Completed
                    && o.CompletedAt.HasValue
                    && o.CompletedAt.Value >= from
                    && o.CompletedAt.Value < to);

            if (restaurantIds is not null)
            {
                var ids = restaurantIds.ToList();
                if (ids.Count == 0) return new List<Order>();
                q = q.Where(o => o.RestaurantId.HasValue && ids.Contains(o.RestaurantId.Value));
            }

            return await q.ToListAsync();
        }

        public async Task<DateTime?> GetEarliestCompletedDateAsync(IEnumerable<long>? restaurantIds)
        {
            var q = _db.Orders
                .IgnoreQueryFilters()
                .Where(o => o.Status == OrderStatus.Completed && o.CompletedAt.HasValue);

            if (restaurantIds is not null)
            {
                var ids = restaurantIds.ToList();
                if (ids.Count == 0) return null;
                q = q.Where(o => o.RestaurantId.HasValue && ids.Contains(o.RestaurantId.Value));
            }

            return await q.MinAsync(o => (DateTime?)o.CompletedAt);
        }

        public async Task<List<Order>> GetHistoryByRestaurantAsync(long restaurantId, int take)
        {
            var terminal = new[]
            {
                OrderStatus.Completed, OrderStatus.Served, OrderStatus.Rejected, OrderStatus.Cancelled,
            };
            return await _db.Orders
                .IgnoreQueryFilters()
                .Include(o => o.Items)
                    .ThenInclude(i => i.Modifiers)
                .Where(o => o.RestaurantId == restaurantId && terminal.Contains(o.Status))
                .OrderByDescending(o => o.UpdatedAt ?? o.CreatedAt)
                .Take(take)
                .ToListAsync();
        }

        public async Task<(List<Order> Items, int TotalCount)> GetPagedHistoryAsync(PagedOrderQueryDto query)
        {
            var terminal = new[]
            {
                OrderStatus.Completed, OrderStatus.Served, OrderStatus.AwaitingPayment,
                OrderStatus.Rejected, OrderStatus.Cancelled,
            };

            var q = _db.Orders
                .IgnoreQueryFilters()
                .Include(o => o.Items)
                    .ThenInclude(i => i.Modifiers)
                .Where(o => terminal.Contains(o.Status));

            if (query.RestaurantId > 0)
            {
                q = q.Where(o => o.RestaurantId == query.RestaurantId);
            }
            else if (query.AllRestaurants)
            {
            }
            else if (query.RestrictToRestaurantIds is { Count: > 0 })
            {
                var ids = query.RestrictToRestaurantIds;
                q = q.Where(o => o.RestaurantId.HasValue && ids.Contains(o.RestaurantId.Value));
            }
            else
            {
                return (new List<Order>(), 0);
            }

            if (!string.IsNullOrWhiteSpace(query.Status) && Enum.TryParse<OrderStatus>(query.Status, true, out var status))
                q = q.Where(o => o.Status == status);

            if (!string.IsNullOrWhiteSpace(query.PaymentMethod) && Enum.TryParse<PaymentMethod>(query.PaymentMethod, true, out var pm))
                q = q.Where(o => o.PaymentMethod == pm);

            if (query.FromDate.HasValue)
                q = q.Where(o => o.CreatedAt >= query.FromDate.Value);

            if (query.ToDate.HasValue)
                q = q.Where(o => o.CreatedAt <= query.ToDate.Value);

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var s = query.Search.Trim().ToLower();
                if (long.TryParse(s, out var idVal))
                {
                    q = q.Where(o =>
                        o.Id == idVal ||
                        o.TableNumber == (int)idVal ||
                        (o.CustomerName != null && o.CustomerName.ToLower().Contains(s)) ||
                        o.Items.Any(i => i.Name.ToLower().Contains(s)));
                }
                else
                {
                    q = q.Where(o =>
                        (o.CustomerName != null && o.CustomerName.ToLower().Contains(s)) ||
                        o.Items.Any(i => i.Name.ToLower().Contains(s)));
                }
            }

            var total = await q.CountAsync();

            q = (query.SortBy?.ToLowerInvariant()) switch
            {
                "id" => query.SortAsc ? q.OrderBy(o => o.Id) : q.OrderByDescending(o => o.Id),
                "tablenumber" => query.SortAsc ? q.OrderBy(o => o.TableNumber) : q.OrderByDescending(o => o.TableNumber),
                "totalamount" => query.SortAsc ? q.OrderBy(o => o.TotalAmount) : q.OrderByDescending(o => o.TotalAmount),
                "status" => query.SortAsc ? q.OrderBy(o => o.Status) : q.OrderByDescending(o => o.Status),
                "createdat" => query.SortAsc ? q.OrderBy(o => o.CreatedAt) : q.OrderByDescending(o => o.CreatedAt),
                _ => q.OrderByDescending(o => o.UpdatedAt ?? o.CreatedAt),
            };

            var items = await q.Skip(query.Skip).Take(query.SafePageSize).ToListAsync();
            return (items, total);
        }

        public async Task AddAsync(Order order)
            => await _db.Orders.AddAsync(order);

        public async Task SaveChangesAsync()
            => await _db.SaveChangesAsync();

        public async Task<Dictionary<string, decimal>> GetCurrencyRatesToEurAsync()
            => await _db.Currencies
                .AsNoTracking()
                .Where(c => c.RateToEur > 0)
                .ToDictionaryAsync(c => c.Code, c => c.RateToEur);
    }
}
