using Foodlyn.Shared.Domain;

namespace Foodlyn.Modules.Menus.Domain.Entities
{
    public class MenuItem : BaseEntity, ITenantEntity, IAuditableEntity
    {
        public long? RestaurantId { get; set; }
        public long MenuId { get; set; }
        public long MenuCategoryId { get; set; }

        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ShortDescription { get; set; }

        public string? ImageUrl { get; set; }
        public string? ThumbnailUrl { get; set; }

        public decimal Price { get; set; }
        public decimal? DiscountedPrice { get; set; }

        public int? Calories { get; set; }
        public int? PreparationTimeMinutes { get; set; }
        public int? ServingSizeGrams { get; set; }
        public int SpicinessLevel { get; set; }

        public bool IsVegetarian { get; set; }
        public bool IsVegan { get; set; }
        public bool IsGlutenFree { get; set; }
        public bool IsDairyFree { get; set; }
        public bool IsHalal { get; set; }
        public bool IsKosher { get; set; }
        public bool IsFeatured { get; set; }
        public bool IsNew { get; set; }
        public bool IsAvailable { get; set; } = true;
        public bool IsActive { get; set; } = true;

        public List<string> Allergens { get; set; } = new();
        public List<string> Tags { get; set; } = new();
        public List<string> Ingredients { get; set; } = new();

        public int? StockQuantity { get; set; }
        public int SortOrder { get; set; }

        public long? CreatedBy { get; set; }
        public long? UpdatedBy { get; set; }

        public MenuCategory Category { get; set; } = null!;
        public List<MenuItemModifierGroup> ModifierGroups { get; set; } = new();
    }
}
