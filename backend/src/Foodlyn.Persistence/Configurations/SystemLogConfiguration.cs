using Foodlyn.Shared.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Foodlyn.Persistence.Configurations
{
    public class SystemLogConfiguration : IEntityTypeConfiguration<SystemLog>
    {
        public void Configure(EntityTypeBuilder<SystemLog> builder)
        {
            builder.ToTable("system_logs");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.Level).HasMaxLength(20).IsRequired();
            builder.Property(x => x.Message).IsRequired();
            builder.Property(x => x.ExceptionType).HasMaxLength(200);
            builder.Property(x => x.Path).HasMaxLength(500);
            builder.Property(x => x.Method).HasMaxLength(10);
            builder.Property(x => x.QueryString).HasMaxLength(2000);
            builder.Property(x => x.Username).HasMaxLength(100);
            builder.Property(x => x.UserRole).HasMaxLength(50);
            builder.Property(x => x.IpAddress).HasMaxLength(64);
            builder.Property(x => x.UserAgent).HasMaxLength(500);
            builder.Property(x => x.Source).HasMaxLength(100);

            builder.HasIndex(x => x.CreatedAt);
            builder.HasIndex(x => x.Level);
            builder.HasIndex(x => x.UserId);
        }
    }
}
