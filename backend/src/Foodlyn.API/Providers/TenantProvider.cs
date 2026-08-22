using Foodlyn.Shared.Application;

namespace Foodlyn.API.Providers
{
    public class TenantProvider : ITenantProvider
    {
        private readonly ICurrentUserContext _user;

        public TenantProvider(ICurrentUserContext user) => _user = user;

        public long CurrentRestaurantId => _user.RestaurantId ?? -1;

        public bool IsSuperAdmin => _user.IsSuperAdmin;
    }
}
