using Foodlyn.Shared.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Foodlyn.Persistence.Configurations
{
    public class CurrencyConfiguration : IEntityTypeConfiguration<Currency>
    {
        public void Configure(EntityTypeBuilder<Currency> builder)
        {
            builder.ToTable("currencies");
            builder.HasKey(c => c.Code);
            builder.Property(c => c.Code).HasMaxLength(3).IsRequired();
            builder.Property(c => c.Name).HasMaxLength(80).IsRequired();
            builder.Property(c => c.Symbol).HasMaxLength(10);
            builder.Property(c => c.RateToEur).HasPrecision(18, 6);

            builder.HasData(
                new Currency { Code = "EUR", Name = "Euro", Symbol = "€", RateToEur = 1m, IsActive = true },
                new Currency { Code = "USD", Name = "US Dollar", Symbol = "$", RateToEur = 1.08m, IsActive = true },
                new Currency { Code = "GBP", Name = "British Pound", Symbol = "£", RateToEur = 0.85m, IsActive = true },
                new Currency { Code = "RSD", Name = "Serbian Dinar", Symbol = "дин", RateToEur = 117.20m, IsActive = true },
                new Currency { Code = "CHF", Name = "Swiss Franc", Symbol = "Fr", RateToEur = 0.95m, IsActive = true },
                new Currency { Code = "JPY", Name = "Japanese Yen", Symbol = "¥", RateToEur = 161.50m, IsActive = true },
                new Currency { Code = "CNY", Name = "Chinese Yuan", Symbol = "¥", RateToEur = 7.85m, IsActive = true },
                new Currency { Code = "AUD", Name = "Australian Dollar", Symbol = "A$", RateToEur = 1.62m, IsActive = true },
                new Currency { Code = "CAD", Name = "Canadian Dollar", Symbol = "C$", RateToEur = 1.47m, IsActive = true },
                new Currency { Code = "NOK", Name = "Norwegian Krone", Symbol = "kr", RateToEur = 11.50m, IsActive = true }
            );
        }
    }

    public class TimezoneConfiguration : IEntityTypeConfiguration<Timezone>
    {
        public void Configure(EntityTypeBuilder<Timezone> builder)
        {
            builder.ToTable("timezones");
            builder.HasKey(t => t.IanaName);
            builder.Property(t => t.IanaName).HasMaxLength(64).IsRequired();
            builder.Property(t => t.DisplayName).HasMaxLength(120).IsRequired();

            builder.HasData(
                new Timezone { IanaName = "Europe/Belgrade", DisplayName = "Belgrade (CET/CEST)", IsActive = true },
                new Timezone { IanaName = "Europe/Berlin", DisplayName = "Berlin (CET/CEST)", IsActive = true },
                new Timezone { IanaName = "Europe/Vienna", DisplayName = "Vienna (CET/CEST)", IsActive = true },
                new Timezone { IanaName = "Europe/London", DisplayName = "London (GMT/BST)", IsActive = true },
                new Timezone { IanaName = "Europe/Paris", DisplayName = "Paris (CET/CEST)", IsActive = true },
                new Timezone { IanaName = "Europe/Madrid", DisplayName = "Madrid (CET/CEST)", IsActive = true },
                new Timezone { IanaName = "America/New_York", DisplayName = "New York (EST/EDT)", IsActive = true },
                new Timezone { IanaName = "America/Los_Angeles", DisplayName = "Los Angeles (PST/PDT)", IsActive = true },
                new Timezone { IanaName = "Asia/Tokyo", DisplayName = "Tokyo (JST)", IsActive = true },
                new Timezone { IanaName = "Australia/Sydney", DisplayName = "Sydney (AEST/AEDT)", IsActive = true },
                new Timezone { IanaName = "UTC", DisplayName = "UTC", IsActive = true }
            );
        }
    }
}
