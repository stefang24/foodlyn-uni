using Foodlyn.API.Hubs;
using Foodlyn.API.Infrastructure;
using Foodlyn.API.Middleware;
using Foodlyn.API.Providers;
using Foodlyn.API.Services.TableCalls;
using Foodlyn.API.Services.TableLobby;
using Foodlyn.Modules.Identity;
using Foodlyn.Modules.Menus;
using Foodlyn.Modules.Notifications;
using Foodlyn.Modules.Notifications.Application.Services;
using Foodlyn.Modules.Ordering;
using Foodlyn.Modules.Ordering.Application.Services;
using Foodlyn.Modules.Restaurants;
using Foodlyn.Persistence;
using Foodlyn.Shared.Application;
using Foodlyn.Shared.Configuration;
using Mapster;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;

namespace Foodlyn.API.Extensions
{
    public static class ServiceInitializer
    {
        public static IServiceCollection AddFoodlynServices(this IServiceCollection services, IConfiguration configuration)
        {
            ConfigProvider.Initialize(configuration);

            services
                .AddMapsterProfiles()
                .AddInfrastructure()
                .AddBusinessModules()
                .AddRealtime()
                .AddCorsPolicy()
                .AddSwaggerDocumentation();

            services.AddControllers();
            services.AddEndpointsApiExplorer();

            return services;
        }

        public static async Task<WebApplication> UseFoodlynPipelineAsync(this WebApplication app)
        {
            await app.ApplyMigrationsAsync();

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseGlobalErrorHandler();
            app.UseCors("Angular");
            app.UseUploadsStaticFiles();
            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();
            app.MapHub<OrderHub>("/hubs/orders");

            if (!app.Environment.IsDevelopment())
            {
                app.UseHttpsRedirection();
            }

            return app;
        }

        private static IServiceCollection AddMapsterProfiles(this IServiceCollection services)
        {
            TypeAdapterConfig.GlobalSettings.Scan(
                typeof(Foodlyn.Modules.Identity.DependencyInjection).Assembly,
                typeof(Foodlyn.Modules.Restaurants.DependencyInjection).Assembly,
                typeof(Foodlyn.Modules.Menus.DependencyInjection).Assembly,
                typeof(Foodlyn.Modules.Ordering.DependencyInjection).Assembly,
                typeof(Foodlyn.Modules.Notifications.DependencyInjection).Assembly
            );

            return services;
        }

        private static IServiceCollection AddInfrastructure(this IServiceCollection services)
        {
            services.AddPersistence();
            services.AddHttpContextAccessor();
            services.AddScoped<ICurrentUserContext, CurrentUserContext>();
            services.AddScoped<ITenantProvider, TenantProvider>();
            services.AddSingleton<IFileStorageService, FileStorageService>();

            return services;
        }

        private static IServiceCollection AddBusinessModules(this IServiceCollection services)
        {
            services.AddIdentityModule();
            services.AddRestaurantModule();
            services.AddMenusModule();
            services.AddOrderingModule();
            services.AddNotificationsModule();

            return services;
        }

        private static IServiceCollection AddRealtime(this IServiceCollection services)
        {
            services.AddSignalR();
            services.AddScoped<IOrderNotifier, OrderNotifier>();
            services.AddScoped<ITableNotifier, TableNotifier>();
            services.AddScoped<ITableSessionNotifier, TableSessionNotifier>();
            services.AddScoped<INotificationDispatcher, NotificationDispatcher>();
            services.AddSingleton<ITableCallService, TableCallService>();
            services.AddSingleton<ITableLobbyService, TableLobbyService>();

            return services;
        }

        private static IServiceCollection AddCorsPolicy(this IServiceCollection services)
        {
            services.AddCors(options =>
            {
                options.AddPolicy("Angular", policy =>
                    policy.SetIsOriginAllowed(_ => true)
                          .AllowAnyHeader()
                          .AllowAnyMethod()
                          .AllowCredentials());
            });

            return services;
        }

        private static IServiceCollection AddSwaggerDocumentation(this IServiceCollection services)
        {
            services.AddSwaggerGen(options =>
            {
                options.SwaggerDoc("v1", new OpenApiInfo
                {
                    Title = "Foodlyn API",
                    Version = "v1",
                    Description = "Restaurant management platform API"
                });

                options.AddSecurityDefinition("cookieAuth", new OpenApiSecurityScheme
                {
                    Type = SecuritySchemeType.ApiKey,
                    In = ParameterLocation.Cookie,
                    Name = "access_token",
                    Description = "JWT token is in HttpOnly cookie"
                });

                options.MapType<IFormFile>(() => new OpenApiSchema
                {
                    Type = JsonSchemaType.String,
                    Format = "binary"
                });
            });

            return services;
        }

        private static async Task ApplyMigrationsAsync(this WebApplication app)
        {
            using var scope = app.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            await db.Database.MigrateAsync();
        }

        private static void UseUploadsStaticFiles(this WebApplication app)
        {
            var webRoot = app.Environment.WebRootPath;
            if (string.IsNullOrEmpty(webRoot))
            {
                webRoot = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
            }
            Directory.CreateDirectory(Path.Combine(webRoot, "uploads"));
            app.UseStaticFiles();
        }
    }
}
