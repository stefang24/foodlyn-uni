using Foodlyn.Modules.Restaurants.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Foodlyn.Modules.Restaurants.Infrastructure.Configurations
{
    public class RestaurantConfiguration : IEntityTypeConfiguration<Restaurant>
    {
        public void Configure(EntityTypeBuilder<Restaurant> builder)
        {
            builder.ToTable("restaurants");

            builder.HasKey(r => r.Id);

            builder.Property(r => r.Name).HasMaxLength(150).IsRequired();
            builder.Property(r => r.Slug).HasMaxLength(100).IsRequired();

            builder.Property(r => r.Description).HasMaxLength(1000);
            builder.Property(r => r.Email).HasMaxLength(100);
            builder.Property(r => r.PhoneNumber).HasMaxLength(30);
            builder.Property(r => r.Website).HasMaxLength(200);

            builder.Property(r => r.StreetAddress).HasMaxLength(200);
            builder.Property(r => r.City).HasMaxLength(100);
            builder.Property(r => r.PostalCode).HasMaxLength(20);
            builder.Property(r => r.Country).HasMaxLength(100);
            builder.Property(r => r.Latitude).HasPrecision(9, 6);
            builder.Property(r => r.Longitude).HasPrecision(9, 6);

            builder.Property(r => r.LogoUrl).HasMaxLength(500);
            builder.Property(r => r.CoverImageUrl).HasMaxLength(500);

            builder.Property(r => r.Currency).HasMaxLength(3);
            builder.Property(r => r.TimeZone).HasMaxLength(50);
            builder.Property(r => r.Cuisine).HasMaxLength(100);
            builder.Property(r => r.OpeningHours).HasMaxLength(500);
            builder.Property(r => r.TaxId).HasMaxLength(50);

            builder.HasIndex(r => r.Slug).IsUnique();
            builder.HasIndex(r => r.Name);
        }
    }
}
