using Foodlyn.Modules.Notifications.Domain.Entities;

namespace Foodlyn.Modules.Notifications.Application.Repositories
{
    public interface INotificationRepository
    {
        Task AddRangeAsync(IEnumerable<Notification> notifications);
        Task<Notification?> GetByIdAsync(long id);
        Task<(List<Notification> Items, int TotalCount)> GetPagedForUserAsync(long userId, int page, int pageSize);
        Task<int> GetUnreadCountForUserAsync(long userId);
        Task<int> MarkAllReadForUserAsync(long userId);
        Task SaveChangesAsync();
    }
}
