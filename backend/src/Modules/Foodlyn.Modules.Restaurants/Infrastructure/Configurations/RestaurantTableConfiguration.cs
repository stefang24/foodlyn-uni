using Foodlyn.Modules.Restaurants.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Foodlyn.Modules.Restaurants.Infrastructure.Configurations
{
    public class RestaurantTableConfiguration : IEntityTypeConfiguration<RestaurantTable>
    {
        public void Configure(EntityTypeBuilder<RestaurantTable> builder)
        {
            builder.ToTable("restaurant_tables");

            builder.HasKey(t => t.Id);

            builder.Property(t => t.Number).IsRequired();
            builder.Property(t => t.Label).HasMaxLength(50);
            builder.Property(t => t.Capacity).IsRequired();
            builder.Property(t => t.Location).HasMaxLength(100);
            builder.Property(t => t.Notes).HasMaxLength(500);

            builder.Property(t => t.Status)
                .HasConversion<string>()
                .HasMaxLength(30)
                .IsRequired();

            builder.Property(t => t.QrToken).IsRequired();

            builder.HasIndex(t => t.QrToken).IsUnique();
            builder.HasIndex(t => new { t.RestaurantId, t.Number }).IsUnique();
            builder.HasIndex(t => t.RestaurantId);
        }
    }
}
