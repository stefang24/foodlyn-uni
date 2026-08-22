using System.Security.Claims;
using Foodlyn.Shared.Constants;

namespace Foodlyn.Shared.Application
{
    public static class ClaimsPrincipalExtensions
    {
        public static long? GetUserId(this ClaimsPrincipal? principal) => GetLong(principal, ClaimTypes.NameIdentifier);
        public static string? GetEmail(this ClaimsPrincipal? principal) => GetString(principal, ClaimTypes.Email);
        public static string? GetUsername(this ClaimsPrincipal? principal) => GetString(principal, ClaimNames.Username);
        public static string? GetFullName(this ClaimsPrincipal? principal) => GetString(principal, ClaimTypes.Name);
        public static string? GetRole(this ClaimsPrincipal? principal) => GetString(principal, ClaimTypes.Role);
        public static long? GetRestaurantId(this ClaimsPrincipal? principal) => GetLong(principal, ClaimNames.RestaurantId);
        public static long? GetTableId(this ClaimsPrincipal? principal) => GetLong(principal, ClaimNames.TableId);
        public static string? GetSessionId(this ClaimsPrincipal? principal) => GetString(principal, ClaimNames.SessionId);

        public static bool IsSuperAdmin(this ClaimsPrincipal? principal) => GetRole(principal) == Roles.SuperAdmin;
        public static bool IsManager(this ClaimsPrincipal? principal) => GetRole(principal) == Roles.Manager;
        public static bool IsGuest(this ClaimsPrincipal? principal) => GetRole(principal) == Roles.Guest;

        public static bool IsInAnyRole(this ClaimsPrincipal? principal, params string[] roles)
        {
            var role = GetRole(principal);
            return role != null && roles.Contains(role);
        }

        private static string? GetString(ClaimsPrincipal? principal, string claimType)
            => principal?.FindFirst(claimType)?.Value;

        private static long? GetLong(ClaimsPrincipal? principal, string claimType)
        {
            var value = principal?.FindFirst(claimType)?.Value;
            return long.TryParse(value, out var id) ? id : null;
        }
    }
}
