using Foodlyn.Modules.Restaurants.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Foodlyn.Modules.Restaurants.Infrastructure.Configurations
{
    public class RestaurantOpeningHourConfiguration : IEntityTypeConfiguration<RestaurantOpeningHour>
    {
        public void Configure(EntityTypeBuilder<RestaurantOpeningHour> builder)
        {
            builder.ToTable("restaurant_opening_hours");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.RestaurantId).IsRequired();
            builder.Property(x => x.DayOfWeek).IsRequired();
            builder.Property(x => x.IsOpen).IsRequired();
            builder.Property(x => x.OpenTime);
            builder.Property(x => x.CloseTime);

            builder.HasIndex(x => new { x.RestaurantId, x.DayOfWeek }).IsUnique();
        }
    }
}
