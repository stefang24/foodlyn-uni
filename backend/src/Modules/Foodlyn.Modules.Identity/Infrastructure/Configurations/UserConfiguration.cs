using Foodlyn.Modules.Identity.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Foodlyn.Modules.Identity.Infrastructure.Configurations
{
    public class UserConfiguration : IEntityTypeConfiguration<User>
    {
        public void Configure(EntityTypeBuilder<User> builder)
        {
            builder.ToTable("users");

            builder.HasKey(u => u.Id);

            builder.Property(u => u.FirstName).HasMaxLength(50);
            builder.Property(u => u.LastName).HasMaxLength(50);
            builder.Property(u => u.Email).HasMaxLength(100).IsRequired();
            builder.Property(u => u.Username).HasMaxLength(100).IsRequired();
            builder.Property(u => u.PasswordHash).IsRequired();
            builder.Property(u => u.Role).HasConversion<string>().HasMaxLength(20);
            builder.Property(u => u.IsEmailVerified).HasDefaultValue(false);
            builder.Property(u => u.EmailVerificationCodeHash).HasMaxLength(200);
            builder.Property(u => u.ProfilePictureUrl).HasMaxLength(500);

            builder.HasIndex(u => u.Email).IsUnique();
            builder.HasIndex(u => u.Username).IsUnique();
            builder.HasIndex(u => u.RestaurantId);

            builder.HasMany(u => u.RefreshTokens)
                .WithOne(r => r.User)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(u => u.RestaurantAssignments)
                .WithOne(a => a.User)
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
    {
        public void Configure(EntityTypeBuilder<RefreshToken> builder)
        {
            builder.ToTable("refresh_tokens");

            builder.HasKey(r => r.Id);

            builder.Property(r => r.Token).HasMaxLength(200).IsRequired();
            builder.Property(r => r.ReplacedByToken).HasMaxLength(200);

            builder.HasIndex(r => r.Token).IsUnique();
        }
    }

    public class RestaurantAssignmentConfiguration : IEntityTypeConfiguration<RestaurantAssignment>
    {
        public void Configure(EntityTypeBuilder<RestaurantAssignment> builder)
        {
            builder.ToTable("restaurant_assignments");

            builder.HasKey(a => new { a.UserId, a.RestaurantId });

            builder.HasIndex(a => a.RestaurantId);
        }
    }
}
