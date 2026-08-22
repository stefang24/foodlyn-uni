namespace Foodlyn.Modules.Identity.Domain.Entities
{
    public class RestaurantAssignment
    {
        public long UserId { get; set; }
        public long RestaurantId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User User { get; set; } = null!;
    }
}
