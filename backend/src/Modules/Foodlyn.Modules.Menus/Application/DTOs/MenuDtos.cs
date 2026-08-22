namespace Foodlyn.Modules.Menus.Application.DTOs
{
    public class MenuDto
    {
        public long Id { get; set; }
        public long? RestaurantId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public string? BannerImageUrl { get; set; }
        public int SortOrder { get; set; }
        public bool IsActive { get; set; }
        public bool IsPublished { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public List<MenuCategoryDto> Categories { get; set; } = new();
    }

    public class MenuCategoryDto
    {
        public long Id { get; set; }
        public long MenuId { get; set; }
        public long? RestaurantId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public string? Icon { get; set; }
        public int SortOrder { get; set; }
        public bool IsActive { get; set; }

        public List<MenuItemDto> Items { get; set; } = new();
    }

    public class MenuItemDto
    {
        public long Id { get; set; }
        public long MenuId { get; set; }
        public long MenuCategoryId { get; set; }
        public long? RestaurantId { get; set; }

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
        public bool IsAvailable { get; set; }
        public bool IsActive { get; set; }

        public List<string> Allergens { get; set; } = new();
        public List<string> Tags { get; set; } = new();
        public List<string> Ingredients { get; set; } = new();

        public int? StockQuantity { get; set; }
        public int SortOrder { get; set; }

        public List<MenuItemModifierGroupDto> ModifierGroups { get; set; } = new();
    }

    public class MenuItemModifierGroupDto
    {
        public long Id { get; set; }
        public long MenuItemId { get; set; }
        public string Name { get; set; } = string.Empty;
        public int MinSelect { get; set; }
        public int MaxSelect { get; set; } = 1;
        public int SortOrder { get; set; }
        public bool IsActive { get; set; } = true;

        public List<MenuItemModifierDto> Modifiers { get; set; } = new();
    }

    public class MenuItemModifierDto
    {
        public long Id { get; set; }
        public long MenuItemModifierGroupId { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal PriceDelta { get; set; }
        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; }
    }

    public class CreateMenuItemModifierGroupDto
    {
        public long MenuItemId { get; set; }
        public string Name { get; set; } = string.Empty;
        public int MinSelect { get; set; }
        public int MaxSelect { get; set; } = 1;
        public int SortOrder { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class UpdateMenuItemModifierGroupDto
    {
        public string Name { get; set; } = string.Empty;
        public int MinSelect { get; set; }
        public int MaxSelect { get; set; } = 1;
        public int SortOrder { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class CreateMenuItemModifierDto
    {
        public long MenuItemModifierGroupId { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal PriceDelta { get; set; }
        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; }
    }

    public class UpdateMenuItemModifierDto
    {
        public string Name { get; set; } = string.Empty;
        public decimal PriceDelta { get; set; }
        public bool IsActive { get; set; } = true;
        public int SortOrder { get; set; }
    }

    public class CreateMenuDto
    {
        public long RestaurantId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public string? BannerImageUrl { get; set; }
        public int SortOrder { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsPublished { get; set; } = true;
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }

    public class UpdateMenuDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public string? BannerImageUrl { get; set; }
        public int SortOrder { get; set; }
        public bool IsActive { get; set; }
        public bool IsPublished { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }

    public class CreateMenuCategoryDto
    {
        public long MenuId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public string? Icon { get; set; }
        public int SortOrder { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class UpdateMenuCategoryDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public string? Icon { get; set; }
        public int SortOrder { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateMenuItemDto
    {
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
    }

    public class UpdateMenuItemDto
    {
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
        public bool IsAvailable { get; set; }
        public bool IsActive { get; set; }

        public List<string> Allergens { get; set; } = new();
        public List<string> Tags { get; set; } = new();
        public List<string> Ingredients { get; set; } = new();

        public int? StockQuantity { get; set; }
        public int SortOrder { get; set; }
    }
}
