using Foodlyn.Modules.Menus.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Foodlyn.Modules.Menus
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddMenusModule(this IServiceCollection services)
        {
            services.AddScoped<IMenuService, MenuService>();
            services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));
            return services;
        }
    }
}
