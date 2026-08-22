using Foodlyn.Modules.Restaurants.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Foodlyn.Modules.Restaurants
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddRestaurantModule(this IServiceCollection services)
        {
            services.AddScoped<IRestaurantService, RestaurantService>();
            services.AddScoped<IRestaurantTableService, RestaurantTableService>();

            services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));
            return services;
        }
    }
}
