using Foodlyn.Modules.Ordering.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Foodlyn.Modules.Ordering.Infrastructure.Configurations
{
    public class OrderConfiguration : IEntityTypeConfiguration<Order>
    {
        public void Configure(EntityTypeBuilder<Order> builder)
        {
            builder.ToTable("orders");
            builder.HasKey(o => o.Id);

            builder.Property(o => o.Status).HasConversion<int>();
            builder.Property(o => o.PaymentMethod).HasConversion<int?>();
            builder.Property(o => o.TotalAmount).HasPrecision(12, 2);
            builder.Property(o => o.Currency).HasMaxLength(3);
            builder.Property(o => o.SessionId).HasMaxLength(100);
            builder.Property(o => o.CustomerName).HasMaxLength(150);
            builder.Property(o => o.TableLabel).HasMaxLength(100);
            builder.Property(o => o.DeliveryNotes).HasMaxLength(1000);
            builder.Property(o => o.RejectedReason).HasMaxLength(500);

            builder.HasIndex(o => o.RestaurantId);
            builder.HasIndex(o => o.TableId);
            builder.HasIndex(o => o.SessionId);
            builder.HasIndex(o => o.Status);

            builder.HasMany(o => o.Items)
                   .WithOne(i => i.Order)
                   .HasForeignKey(i => i.OrderId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
    {
        public void Configure(EntityTypeBuilder<OrderItem> builder)
        {
            builder.ToTable("order_items");
            builder.HasKey(i => i.Id);

            builder.Property(i => i.Name).HasMaxLength(200).IsRequired();
            builder.Property(i => i.Price).HasPrecision(12, 2);
            builder.Property(i => i.Notes).HasMaxLength(500);

            builder.HasIndex(i => i.OrderId);
            builder.HasIndex(i => i.MenuItemId);

            builder.HasMany(i => i.Modifiers)
                   .WithOne(m => m.OrderItem)
                   .HasForeignKey(m => m.OrderItemId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public class OrderItemModifierConfiguration : IEntityTypeConfiguration<OrderItemModifier>
    {
        public void Configure(EntityTypeBuilder<OrderItemModifier> builder)
        {
            builder.ToTable("order_item_modifiers");
            builder.HasKey(m => m.Id);

            builder.Property(m => m.GroupName).HasMaxLength(150).IsRequired();
            builder.Property(m => m.Name).HasMaxLength(150).IsRequired();
            builder.Property(m => m.Price).HasPrecision(12, 2);

            builder.HasIndex(m => m.OrderItemId);
        }
    }
}
