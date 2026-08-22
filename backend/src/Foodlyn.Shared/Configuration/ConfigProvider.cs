using Microsoft.Extensions.Configuration;

namespace Foodlyn.Shared.Configuration
{
    public static class ConfigProvider
    {
        public static JwtConfig Jwt { get; private set; } = new();
        public static EmailConfig Email { get; private set; } = new();
        public static OrderingConfig Ordering { get; private set; } = new();
        public static string ConnectionString { get; private set; } = string.Empty;

        public static void Initialize(IConfiguration configuration)
        {
            Jwt = new JwtConfig
            {
                Secret = configuration["Jwt:Secret"] ?? throw new InvalidOperationException("Jwt:Secret is not configured"),
                Issuer = configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("Jwt:Issuer is not configured"),
                Audience = configuration["Jwt:Audience"] ?? throw new InvalidOperationException("Jwt:Audience is not configured"),
                AccessTokenMinutes = long.Parse(configuration["Jwt:AccessTokenMinutes"] ?? "15"),
                RefreshTokenDays = long.Parse(configuration["Jwt:RefreshTokenDays"] ?? "7"),
                GuestTokenMinutes = long.Parse(configuration["Jwt:GuestTokenMinutes"] ?? "180"),
            };

            Email = new EmailConfig
            {
                Host = configuration["Email:Host"] ?? "smtp.gmail.com",
                Port = int.Parse(configuration["Email:Port"] ?? "587"),
                Username = configuration["Email:Username"] ?? string.Empty,
                Password = configuration["Email:Password"] ?? string.Empty,
                FromEmail = configuration["Email:FromEmail"] ?? string.Empty,
                FromName = configuration["Email:FromName"] ?? "Foodlyn",
                VerificationCodeExpiryMinutes = int.Parse(configuration["Email:VerificationCodeExpiryMinutes"] ?? "15"),
                ResendCooldownSeconds = int.Parse(configuration["Email:ResendCooldownSeconds"] ?? "60")
            };

            Ordering = new OrderingConfig
            {
                GeoRadiusMeters = double.Parse(configuration["Ordering:GeoRadiusMeters"] ?? "100"),
                EnforceGeoFence = bool.Parse(configuration["Ordering:EnforceGeoFence"] ?? "true"),
            };

            ConnectionString = configuration.GetConnectionString("Default") ?? string.Empty;
        }
    }

    public class OrderingConfig
    {
        public double GeoRadiusMeters { get; init; } = 100;
        public bool EnforceGeoFence { get; init; } = true;
    }

    public class JwtConfig
    {
        public string Secret { get; init; } = string.Empty;
        public string Issuer { get; init; } = string.Empty;
        public string Audience { get; init; } = string.Empty;
        public long AccessTokenMinutes { get; init; }
        public long RefreshTokenDays { get; init; }
        public long GuestTokenMinutes { get; init; }
    }

    public class EmailConfig
    {
        public string Host { get; init; } = string.Empty;
        public int Port { get; init; }
        public string Username { get; init; } = string.Empty;
        public string Password { get; init; } = string.Empty;
        public string FromEmail { get; init; } = string.Empty;
        public string FromName { get; init; } = string.Empty;
        public int VerificationCodeExpiryMinutes { get; init; }
        public int ResendCooldownSeconds { get; init; }
    }
}
