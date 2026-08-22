using Foodlyn.Modules.Notifications.Application.DTOs;
using Foodlyn.Shared.Application;

namespace Foodlyn.Modules.Notifications.Application.Services
{
    public interface INotificationService
    {
        Task<Result<PagedResult<NotificationDto>>> GetPagedAsync(long userId, int page, int pageSize);
        Task<Result<int>> GetUnreadCountAsync(long userId);
        Task<Result<NotificationDto>> MarkReadAsync(long id, long userId);
        Task<Result<int>> MarkAllReadAsync(long userId);
    }
}
