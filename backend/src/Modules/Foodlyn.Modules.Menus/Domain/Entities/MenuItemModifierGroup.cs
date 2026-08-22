using Foodlyn.Shared.Domain;

namespace Foodlyn.Modules.Menus.Domain.Entities
{
    public class MenuItemModifierGroup : BaseEntity, ITenantEntity, IAuditableEntity
    {
        public long? RestaurantId { get; set; }
        public long MenuItemId { get; set; }

        public string Name { get; set; } = string.Empty;
        public int MinSelect { get; set; } = 0;
        public int MaxSelect { get; set; } = 1;
        public int SortOrder { get; set; }
        public bool IsActive { get; set; } = true;

        public List<MenuItemModifier> Modifiers { get; set; } = new();
        public MenuItem MenuItem { get; set; } = null!;

        public long? CreatedBy { get; set; }
        public long? UpdatedBy { get; set; }
    }
}
