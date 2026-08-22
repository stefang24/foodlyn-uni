using Foodlyn.Modules.Notifications.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Foodlyn.Modules.Notifications.Infrastructure.Configurations
{
    public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
    {
        public void Configure(EntityTypeBuilder<Notification> builder)
        {
            builder.ToTable("notifications");
            builder.HasKey(n => n.Id);

            builder.Property(n => n.Type).HasMaxLength(60).IsRequired();
            builder.Property(n => n.Title).HasMaxLength(200).IsRequired();
            builder.Property(n => n.Body).HasMaxLength(1000);
            builder.Property(n => n.Data).HasColumnType("jsonb");

            builder.HasIndex(n => new { n.UserId, n.IsRead });
            builder.HasIndex(n => new { n.UserId, n.CreatedAt });
        }
    }
}
