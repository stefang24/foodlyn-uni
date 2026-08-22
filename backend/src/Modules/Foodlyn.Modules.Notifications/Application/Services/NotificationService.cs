using Foodlyn.Modules.Notifications.Application.DTOs;
using Foodlyn.Modules.Notifications.Application.Repositories;
using Foodlyn.Shared.Application;
using Mapster;

namespace Foodlyn.Modules.Notifications.Application.Services
{
    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _repo;

        public NotificationService(INotificationRepository repo)
        {
            _repo = repo;
        }

        public async Task<Result<PagedResult<NotificationDto>>> GetPagedAsync(long userId, int page, int pageSize)
        {
            if (page < 1) page = 1;
            if (pageSize < 1) pageSize = 10;
            if (pageSize > 100) pageSize = 100;

            var (items, total) = await _repo.GetPagedForUserAsync(userId, page, pageSize);
            return Result<PagedResult<NotificationDto>>.Success(new PagedResult<NotificationDto>
            {
                Items = items.Adapt<List<NotificationDto>>(),
                TotalCount = total,
                Page = page,
                PageSize = pageSize,
            });
        }

        public async Task<Result<int>> GetUnreadCountAsync(long userId)
        {
            var count = await _repo.GetUnreadCountForUserAsync(userId);
            return Result<int>.Success(count);
        }

        public async Task<Result<NotificationDto>> MarkReadAsync(long id, long userId)
        {
            var n = await _repo.GetByIdAsync(id);
            if (n is null || n.UserId != userId) return Result<NotificationDto>.Failure("Notification not found");
            if (!n.IsRead)
            {
                n.IsRead = true;
                n.ReadAt = DateTime.UtcNow;
                await _repo.SaveChangesAsync();
            }
            return Result<NotificationDto>.Success(n.Adapt<NotificationDto>());
        }

        public async Task<Result<int>> MarkAllReadAsync(long userId)
        {
            var count = await _repo.MarkAllReadForUserAsync(userId);
            return Result<int>.Success(count);
        }
    }
}
