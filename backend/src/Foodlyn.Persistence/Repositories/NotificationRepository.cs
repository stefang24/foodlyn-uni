using Foodlyn.Modules.Notifications.Application.Repositories;
using Foodlyn.Modules.Notifications.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Foodlyn.Persistence.Repositories
{
    public class NotificationRepository : INotificationRepository
    {
        private readonly AppDbContext _db;

        public NotificationRepository(AppDbContext db) => _db = db;

        public async Task AddRangeAsync(IEnumerable<Notification> notifications)
        {
            await _db.Notifications.AddRangeAsync(notifications);
        }

        public Task<Notification?> GetByIdAsync(long id)
            => _db.Notifications.FirstOrDefaultAsync(n => n.Id == id);

        public async Task<(List<Notification> Items, int TotalCount)> GetPagedForUserAsync(long userId, int page, int pageSize)
        {
            var q = _db.Notifications.Where(n => n.UserId == userId);
            var total = await q.CountAsync();
            var items = await q
                .OrderByDescending(n => n.CreatedAt)
                .ThenByDescending(n => n.Id)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
            return (items, total);
        }

        public Task<int> GetUnreadCountForUserAsync(long userId)
            => _db.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);

        public async Task<int> MarkAllReadForUserAsync(long userId)
        {
            var now = DateTime.UtcNow;
            return await _db.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(n => n.IsRead, true)
                    .SetProperty(n => n.ReadAt, now));
        }

        public Task SaveChangesAsync() => _db.SaveChangesAsync();
    }
}
