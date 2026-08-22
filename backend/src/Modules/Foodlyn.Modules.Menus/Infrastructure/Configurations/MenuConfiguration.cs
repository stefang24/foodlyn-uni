using Foodlyn.Modules.Menus.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Foodlyn.Modules.Menus.Infrastructure.Configurations
{
    public class MenuConfiguration : IEntityTypeConfiguration<Menu>
    {
        public void Configure(EntityTypeBuilder<Menu> builder)
        {
            builder.ToTable("menus");

            builder.HasKey(m => m.Id);

            builder.Property(m => m.Name).HasMaxLength(150).IsRequired();
            builder.Property(m => m.Description).HasMaxLength(1000);
            builder.Property(m => m.ImageUrl).HasMaxLength(500);
            builder.Property(m => m.BannerImageUrl).HasMaxLength(500);

            builder.HasIndex(m => new { m.RestaurantId, m.Name });
            builder.HasIndex(m => m.RestaurantId);

            builder.HasMany(m => m.Categories)
                   .WithOne(c => c.Menu)
                   .HasForeignKey(c => c.MenuId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public class MenuCategoryConfiguration : IEntityTypeConfiguration<MenuCategory>
    {
        public void Configure(EntityTypeBuilder<MenuCategory> builder)
        {
            builder.ToTable("menu_categories");

            builder.HasKey(c => c.Id);

            builder.Property(c => c.Name).HasMaxLength(150).IsRequired();
            builder.Property(c => c.Description).HasMaxLength(1000);
            builder.Property(c => c.ImageUrl).HasMaxLength(500);
            builder.Property(c => c.Icon).HasMaxLength(100);

            builder.HasIndex(c => c.MenuId);
            builder.HasIndex(c => c.RestaurantId);

            builder.HasMany(c => c.Items)
                   .WithOne(i => i.Category)
                   .HasForeignKey(i => i.MenuCategoryId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public class MenuItemConfiguration : IEntityTypeConfiguration<MenuItem>
    {
        public void Configure(EntityTypeBuilder<MenuItem> builder)
        {
            builder.ToTable("menu_items");

            builder.HasKey(i => i.Id);

            builder.Property(i => i.Name).HasMaxLength(150).IsRequired();
            builder.Property(i => i.Description).HasMaxLength(2000);
            builder.Property(i => i.ShortDescription).HasMaxLength(300);
            builder.Property(i => i.ImageUrl).HasMaxLength(500);
            builder.Property(i => i.ThumbnailUrl).HasMaxLength(500);
            builder.Property(i => i.Price).HasPrecision(12, 2);
            builder.Property(i => i.DiscountedPrice).HasPrecision(12, 2);

            builder.Property(i => i.Allergens).HasColumnType("text[]");
            builder.Property(i => i.Tags).HasColumnType("text[]");
            builder.Property(i => i.Ingredients).HasColumnType("text[]");

            builder.HasIndex(i => i.MenuId);
            builder.HasIndex(i => i.MenuCategoryId);
            builder.HasIndex(i => i.RestaurantId);

            builder.HasMany(i => i.ModifierGroups)
                   .WithOne(g => g.MenuItem)
                   .HasForeignKey(g => g.MenuItemId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public class MenuItemModifierGroupConfiguration : IEntityTypeConfiguration<MenuItemModifierGroup>
    {
        public void Configure(EntityTypeBuilder<MenuItemModifierGroup> builder)
        {
            builder.ToTable("menu_item_modifier_groups");
            builder.HasKey(g => g.Id);

            builder.Property(g => g.Name).HasMaxLength(150).IsRequired();

            builder.HasIndex(g => g.MenuItemId);
            builder.HasIndex(g => g.RestaurantId);

            builder.HasMany(g => g.Modifiers)
                   .WithOne(m => m.Group)
                   .HasForeignKey(m => m.MenuItemModifierGroupId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public class MenuItemModifierConfiguration : IEntityTypeConfiguration<MenuItemModifier>
    {
        public void Configure(EntityTypeBuilder<MenuItemModifier> builder)
        {
            builder.ToTable("menu_item_modifiers");
            builder.HasKey(m => m.Id);

            builder.Property(m => m.Name).HasMaxLength(150).IsRequired();
            builder.Property(m => m.PriceDelta).HasPrecision(12, 2);

            builder.HasIndex(m => m.MenuItemModifierGroupId);
            builder.HasIndex(m => m.RestaurantId);
        }
    }
}
