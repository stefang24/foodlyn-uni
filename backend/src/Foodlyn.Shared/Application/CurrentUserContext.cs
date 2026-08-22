using System.Security.Claims;
using Foodlyn.Shared.Constants;
using Microsoft.AspNetCore.Http;

namespace Foodlyn.Shared.Application
{
    public class CurrentUserContext : ICurrentUserContext
    {
        private readonly IHttpContextAccessor _http;

        public CurrentUserContext(IHttpContextAccessor http) => _http = http;

        private ClaimsPrincipal? Principal => _http.HttpContext?.User;

        public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated ?? false;

        public long? UserId => Principal.GetUserId();
        public string? Email => Principal.GetEmail();
        public string? Username => Principal.GetUsername();
        public string? FullName => Principal.GetFullName();
        public string? Role => Principal.GetRole();
        public long? RestaurantId => Principal.GetRestaurantId();
        public long? TableId => Principal.GetTableId();
        public string? SessionId => Principal.GetSessionId();

        public bool IsSuperAdmin => Role == Roles.SuperAdmin;
        public bool IsManager => Role == Roles.Manager;
        public bool IsGuest => Role == Roles.Guest;

        public bool IsInRole(string role) => Role == role;
        public bool IsInAnyRole(params string[] roles) => Principal.IsInAnyRole(roles);
    }
}
