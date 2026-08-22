using Foodlyn.Modules.Identity.Domain.Entities;
using Foodlyn.Modules.Menus.Domain.Entities;
using Foodlyn.Modules.Notifications.Domain.Entities;
using Foodlyn.Modules.Ordering.Domain.Entities;
using Foodlyn.Modules.Restaurants.Domain.Entities;
using Foodlyn.Shared.Application;
using Foodlyn.Shared.Domain;
using Microsoft.EntityFrameworkCore;
using System.Reflection;

namespace Foodlyn.Persistence
{
    public class AppDbContext : DbContext
    {
        private readonly ITenantProvider? _tenant;

        public AppDbContext(DbContextOptions<AppDbContext> options, ITenantProvider? tenant = null)
            : base(options)
        {
            _tenant = tenant;
        }

        public DbSet<Order> Orders => Set<Order>();
        public DbSet<OrderItem> OrderItems => Set<OrderItem>();
        public DbSet<OrderItemModifier> OrderItemModifiers => Set<OrderItemModifier>();
        public DbSet<TableSession> TableSessions => Set<TableSession>();
        public DbSet<TableSessionCartLine> TableSessionCartLines => Set<TableSessionCartLine>();
        public DbSet<TableSessionCartLineModifier> TableSessionCartLineModifiers => Set<TableSessionCartLineModifier>();
        public DbSet<User> Users => Set<User>();
        public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
        public DbSet<RestaurantAssignment> RestaurantAssignments => Set<RestaurantAssignment>();
        public DbSet<Restaurant> Restaurants => Set<Restaurant>();
        public DbSet<RestaurantTable> RestaurantTables => Set<RestaurantTable>();
        public DbSet<RestaurantOpeningHour> RestaurantOpeningHours => Set<RestaurantOpeningHour>();
        public DbSet<SystemLog> SystemLogs => Set<SystemLog>();
        public DbSet<Menu> Menus => Set<Menu>();
        public DbSet<MenuCategory> MenuCategories => Set<MenuCategory>();
        public DbSet<MenuItem> MenuItems => Set<MenuItem>();
        public DbSet<MenuItemModifierGroup> MenuItemModifierGroups => Set<MenuItemModifierGroup>();
        public DbSet<MenuItemModifier> MenuItemModifiers => Set<MenuItemModifier>();
        public DbSet<Currency> Currencies => Set<Currency>();
        public DbSet<Timezone> Timezones => Set<Timezone>();
        public DbSet<Notification> Notifications => Set<Notification>();

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.ApplyConfigurationsFromAssembly(typeof(Order).Assembly);
            builder.ApplyConfigurationsFromAssembly(typeof(User).Assembly);
            builder.ApplyConfigurationsFromAssembly(typeof(Restaurant).Assembly);
            builder.ApplyConfigurationsFromAssembly(typeof(Menu).Assembly);
            builder.ApplyConfigurationsFromAssembly(typeof(Notification).Assembly);
            builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

            foreach (var entityType in builder.Model.GetEntityTypes())
            {
                if (typeof(ITenantEntity).IsAssignableFrom(entityType.ClrType))
                {
                    var method = typeof(AppDbContext)
                        .GetMethod(nameof(SetTenantFilter),
                            BindingFlags.NonPublic | BindingFlags.Static)!
                        .MakeGenericMethod(entityType.ClrType);

                    method.Invoke(null, new object[] { builder, _tenant! });
                }
            }
        }

        private static void SetTenantFilter<T>(ModelBuilder builder, ITenantProvider tenant)
            where T : class, ITenantEntity
        {
            builder.Entity<T>().HasQueryFilter(e => tenant.IsSuperAdmin || e.RestaurantId == tenant.CurrentRestaurantId);
        }

        public override Task<int> SaveChangesAsync(CancellationToken ct = default)
        {
            foreach (var entry in ChangeTracker.Entries<ITenantEntity>())
            {
                if (entry.State != EntityState.Added) continue;
                if (entry.Entity.RestaurantId > 0) continue;
                if (_tenant == null || _tenant.IsSuperAdmin) continue;
                if (_tenant.CurrentRestaurantId <= 0) continue;
                entry.Entity.RestaurantId = _tenant.CurrentRestaurantId;
            }

            foreach (var entry in ChangeTracker.Entries<BaseEntity>())
            {
                if (entry.State == EntityState.Added)
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                if (entry.State == EntityState.Modified)
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
            }

            return base.SaveChangesAsync(ct);
        }
    }
}
