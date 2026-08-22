using Foodlyn.Modules.Ordering.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Foodlyn.Modules.Ordering
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddOrderingModule(this IServiceCollection services)
        {
            services.AddScoped<IOrderService, OrderService>();
            services.AddScoped<ITableSessionService, TableSessionService>();
            services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));
            return services;
        }
    }
}
