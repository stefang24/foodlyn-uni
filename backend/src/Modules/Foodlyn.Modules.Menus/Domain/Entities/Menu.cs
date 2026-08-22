using Foodlyn.Shared.Domain;

namespace Foodlyn.Modules.Menus.Domain.Entities
{
    public class Menu : BaseEntity, ITenantEntity, IAuditableEntity
    {
        public long? RestaurantId { get; set; }

        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }

        public string? ImageUrl { get; set; }
        public string? BannerImageUrl { get; set; }

        public int SortOrder { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsPublished { get; set; } = true;

        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }

        public long? CreatedBy { get; set; }
        public long? UpdatedBy { get; set; }

        public List<MenuCategory> Categories { get; set; } = new();
    }
}
