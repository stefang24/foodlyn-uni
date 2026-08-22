namespace Foodlyn.Modules.Notifications.Application.Services
{
    public interface INotificationDispatcher
    {
        Task DispatchToRoleAsync(
            long restaurantId,
            string role,
            string type,
            string title,
            string? body = null,
            object? data = null);

        Task DispatchToUserAsync(
            long userId,
            string type,
            string title,
            string? body = null,
            long? restaurantId = null,
            object? data = null);
    }
}
