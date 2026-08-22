namespace Foodlyn.Shared.Domain
{
    public abstract class BaseEntity
    {
        public long Id { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }

    public interface ITenantEntity
    {
        long? RestaurantId { get; set; }
    }

    public interface IAuditableEntity
    {
        long? CreatedBy { get; set; }
        long? UpdatedBy { get; set; }
    }
}
