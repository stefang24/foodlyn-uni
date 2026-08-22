using Foodlyn.Modules.Identity.Application.Services;
using Foodlyn.Shared.Application;
using Foodlyn.Shared.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Foodlyn.Persistence.Repositories
{
    public class SystemLogService : ISystemLogService
    {
        private readonly IServiceProvider _serviceProvider;

        public SystemLogService(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        public async Task LogAsync(SystemLog log)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                if (log.CreatedAt == default) log.CreatedAt = DateTime.UtcNow;
                await db.SystemLogs.AddAsync(log);
                await db.SaveChangesAsync();
            }
            catch
            {
            }
        }

        public async Task<PagedResult<SystemLog>> GetPagedAsync(SystemLogQuery query)
        {
            using var scope = _serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var q = db.SystemLogs.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(query.Level))
                q = q.Where(l => l.Level == query.Level);

            if (query.StatusCode.HasValue)
                q = q.Where(l => l.StatusCode == query.StatusCode.Value);

            if (query.FromDate.HasValue)
                q = q.Where(l => l.CreatedAt >= query.FromDate.Value);

            if (query.ToDate.HasValue)
                q = q.Where(l => l.CreatedAt <= query.ToDate.Value);

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var s = query.Search.Trim().ToLower();
                q = q.Where(l =>
                    l.Message.ToLower().Contains(s) ||
                    (l.ExceptionType != null && l.ExceptionType.ToLower().Contains(s)) ||
                    (l.Path != null && l.Path.ToLower().Contains(s)) ||
                    (l.Username != null && l.Username.ToLower().Contains(s)));
            }

            var total = await q.CountAsync();

            q = (query.SortBy?.ToLowerInvariant()) switch
            {
                "level" => query.SortAsc ? q.OrderBy(l => l.Level) : q.OrderByDescending(l => l.Level),
                "statuscode" => query.SortAsc ? q.OrderBy(l => l.StatusCode) : q.OrderByDescending(l => l.StatusCode),
                "path" => query.SortAsc ? q.OrderBy(l => l.Path) : q.OrderByDescending(l => l.Path),
                "username" => query.SortAsc ? q.OrderBy(l => l.Username) : q.OrderByDescending(l => l.Username),
                _ => query.SortAsc ? q.OrderBy(l => l.CreatedAt) : q.OrderByDescending(l => l.CreatedAt),
            };

            var items = await q.Skip(query.Skip).Take(query.SafePageSize).ToListAsync();

            return new PagedResult<SystemLog>
            {
                Items = items,
                TotalCount = total,
                Page = query.SafePage,
                PageSize = query.SafePageSize,
            };
        }

        public async Task<SystemLog?> GetByIdAsync(long id)
        {
            using var scope = _serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            return await db.SystemLogs.AsNoTracking().FirstOrDefaultAsync(l => l.Id == id);
        }
    }
}
