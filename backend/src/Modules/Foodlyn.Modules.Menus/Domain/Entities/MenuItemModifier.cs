using Foodlyn.Shared.Domain;

namespace Foodlyn.Modules.Menus.Domain.Entities
{
    public class MenuItemModifier : BaseEntity, ITenantEntity, IAuditableEntity
    {
        public long? RestaurantId { get; set; }
        public long MenuItemModifierGroupId { get; set; }

        public string Name { get; set; } = string.Empty;
        public decimal PriceDelta { get; set; }
        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; }

        public MenuItemModifierGroup Group { get; set; } = null!;

        public long? CreatedBy { get; set; }
        public long? UpdatedBy { get; set; }
    }
}
