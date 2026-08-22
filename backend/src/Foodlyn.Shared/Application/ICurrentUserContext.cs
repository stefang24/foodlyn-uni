namespace Foodlyn.Shared.Application
{
    public interface ICurrentUserContext
    {
        bool IsAuthenticated { get; }
        long? UserId { get; }
        string? Email { get; }
        string? Username { get; }
        string? FullName { get; }
        string? Role { get; }
        long? RestaurantId { get; }
        long? TableId { get; }
        string? SessionId { get; }
        bool IsSuperAdmin { get; }
        bool IsManager { get; }
        bool IsGuest { get; }
        bool IsInRole(string role);
        bool IsInAnyRole(params string[] roles);
    }
}
