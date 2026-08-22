using Foodlyn.Modules.Ordering.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Foodlyn.Modules.Ordering.Infrastructure.Configurations
{
    public class TableSessionConfiguration : IEntityTypeConfiguration<TableSession>
    {
        public void Configure(EntityTypeBuilder<TableSession> builder)
        {
            builder.ToTable("table_sessions");
            builder.HasKey(s => s.Id);

            builder.Property(s => s.OwnerKind).HasConversion<int>();
            builder.Property(s => s.Status).HasConversion<int>();
            builder.Property(s => s.TableLabel).HasMaxLength(100);

            builder.HasIndex(s => new { s.TableId, s.Status });
            builder.HasIndex(s => new { s.RestaurantId, s.Status });

            builder.HasMany(s => s.CartLines)
                   .WithOne(l => l.Session)
                   .HasForeignKey(l => l.TableSessionId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public class TableSessionCartLineConfiguration : IEntityTypeConfiguration<TableSessionCartLine>
    {
        public void Configure(EntityTypeBuilder<TableSessionCartLine> builder)
        {
            builder.ToTable("table_session_cart_lines");
            builder.HasKey(l => l.Id);

            builder.Property(l => l.LineKey).HasMaxLength(200).IsRequired();
            builder.Property(l => l.Name).HasMaxLength(200).IsRequired();
            builder.Property(l => l.UnitPrice).HasPrecision(12, 2);
            builder.Property(l => l.Notes).HasMaxLength(500);
            builder.Property(l => l.ImageUrl).HasMaxLength(500);
            builder.Property(l => l.AddedByLabel).HasMaxLength(100);
            builder.Property(l => l.AddedBySessionId).HasMaxLength(100);

            builder.HasIndex(l => new { l.TableSessionId, l.LineKey });

            builder.HasMany(l => l.Modifiers)
                   .WithOne(m => m.Line)
                   .HasForeignKey(m => m.TableSessionCartLineId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public class TableSessionCartLineModifierConfiguration : IEntityTypeConfiguration<TableSessionCartLineModifier>
    {
        public void Configure(EntityTypeBuilder<TableSessionCartLineModifier> builder)
        {
            builder.ToTable("table_session_cart_line_modifiers");
            builder.HasKey(m => m.Id);

            builder.Property(m => m.GroupName).HasMaxLength(150).IsRequired();
            builder.Property(m => m.Name).HasMaxLength(150).IsRequired();
            builder.Property(m => m.Price).HasPrecision(12, 2);
        }
    }
}
