namespace Foodlyn.Shared.Application
{
    public interface ITenantProvider
    {
        long CurrentRestaurantId { get; }
        bool IsSuperAdmin { get; }
    }
}
