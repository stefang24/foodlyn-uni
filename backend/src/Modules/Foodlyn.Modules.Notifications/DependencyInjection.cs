using Foodlyn.Modules.Notifications.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Foodlyn.Modules.Notifications
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddNotificationsModule(this IServiceCollection services)
        {
            services.AddScoped<INotificationService, NotificationService>();
            return services;
        }
    }
}
