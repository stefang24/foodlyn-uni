using Foodlyn.Modules.Identity.Application.Repositories;
using Foodlyn.Modules.Identity.Application.Services;
using Foodlyn.Modules.Menus.Application.Repositories;
using Foodlyn.Modules.Notifications.Application.Repositories;
using Foodlyn.Modules.Ordering.Application.Repositories;
using Foodlyn.Modules.Restaurants.Application.Repositories;
using Foodlyn.Persistence.Repositories;
using Foodlyn.Shared.Configuration;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Foodlyn.Persistence
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddPersistence(this IServiceCollection services)
        {
            services.AddScoped<IAuthRepository, AuthRepository>();
            services.AddScoped<IAdminRepository, AdminRepository>();
            services.AddScoped<IUserRepository, UserRepository>();
            services.AddScoped<IRestaurantRepository, RestaurantRepository>();
            services.AddScoped<IRestaurantTableRepository, RestaurantTableRepository>();
            services.AddScoped<IMenuRepository, MenuRepository>();
            services.AddScoped<IOrderRepository, OrderRepository>();
            services.AddScoped<ITableSessionRepository, TableSessionRepository>();
            services.AddScoped<INotificationRepository, NotificationRepository>();

            services.AddSingleton<ISystemLogService, SystemLogService>();

            services.AddDbContext<AppDbContext>(options =>
                options.UseNpgsql(ConfigProvider.ConnectionString));

            return services;
        }
    }
}
