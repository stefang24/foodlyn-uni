using Foodlyn.Shared.Domain;

namespace Foodlyn.Modules.Menus.Domain.Entities
{
    public class MenuCategory : BaseEntity, ITenantEntity, IAuditableEntity
    {
        public long? RestaurantId { get; set; }
        public long MenuId { get; set; }

        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public string? Icon { get; set; }

        public int SortOrder { get; set; }
        public bool IsActive { get; set; } = true;

        public long? CreatedBy { get; set; }
        public long? UpdatedBy { get; set; }

        public Menu Menu { get; set; } = null!;
        public List<MenuItem> Items { get; set; } = new();
    }
}
