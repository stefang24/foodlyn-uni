using Foodlyn.Modules.Identity.Domain.Entities;
using Foodlyn.Shared.Constants;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Foodlyn.Modules.Identity.Helpers
{
    public static class JwtHelper
    {
        public static string GenerateAccessToken(User user, string secret, string issuer, string audience, long expirationMinutes)
        {
            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new(ClaimTypes.Email, user.Email),
                new(ClaimTypes.Name, user.FullName ?? ""),
                new(ClaimTypes.Role, user.Role.ToString()),
                new(ClaimNames.RestaurantId, user.RestaurantId.ToString() ?? "null"),
                new(ClaimNames.Username, user.Username)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public static string GenerateGuestToken(long restaurantId, long tableId, string sessionId,
            string secret, string issuer, string audience, long expirationMinutes)
        {
            var claims = new List<Claim>
            {
                new(ClaimTypes.Role, Roles.Guest),
                new(ClaimNames.RestaurantId, restaurantId.ToString()),
                new(ClaimNames.TableId, tableId.ToString()),
                new(ClaimNames.SessionId, sessionId)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public static string GenerateRefreshToken()
        {
            var randomNumber = new byte[64];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(randomNumber);
            }

            return Convert.ToBase64String(randomNumber);
        }

        public static ClaimsPrincipal? ValidateToken(string token, string secret, string issuer, string audience)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.UTF8.GetBytes(secret);

                var principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = issuer,
                    ValidAudience = audience,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ClockSkew = TimeSpan.Zero
                }, out _);

                return principal;
            }
            catch
            {
                return null;
            }
        }
    }
}
