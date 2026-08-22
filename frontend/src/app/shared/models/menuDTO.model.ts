export interface MenuItemDTO {
    id: number;
    menuId: number;
    menuCategoryId: number;
    restaurantId: number | null;

    name: string;
    description: string | null;
    shortDescription: string | null;

    imageUrl: string | null;
    thumbnailUrl: string | null;

    price: number;
    discountedPrice: number | null;

    calories: number | null;
    preparationTimeMinutes: number | null;
    servingSizeGrams: number | null;
    spicinessLevel: number;

    isVegetarian: boolean;
    isVegan: boolean;
    isGlutenFree: boolean;
    isDairyFree: boolean;
    isHalal: boolean;
    isKosher: boolean;
    isFeatured: boolean;
    isNew: boolean;
    isAvailable: boolean;
    isActive: boolean;

    allergens: string[];
    tags: string[];
    ingredients: string[];

    stockQuantity: number | null;
    sortOrder: number;

    modifierGroups: MenuItemModifierGroupDTO[];
}

export interface MenuItemModifierGroupDTO {
    id: number;
    menuItemId: number;
    name: string;
    minSelect: number;
    maxSelect: number;
    sortOrder: number;
    isActive: boolean;
    modifiers: MenuItemModifierDTO[];
}

export interface MenuItemModifierDTO {
    id: number;
    menuItemModifierGroupId: number;
    name: string;
    priceDelta: number;
    isActive: boolean;
    sortOrder: number;
}

export interface CreateMenuItemModifierGroupDTO {
    menuItemId: number;
    name: string;
    minSelect: number;
    maxSelect: number;
    sortOrder: number;
    isActive: boolean;
}

export interface UpdateMenuItemModifierGroupDTO {
    name: string;
    minSelect: number;
    maxSelect: number;
    sortOrder: number;
    isActive: boolean;
}

export interface CreateMenuItemModifierDTO {
    menuItemModifierGroupId: number;
    name: string;
    priceDelta: number;
    isActive: boolean;
    sortOrder: number;
}

export interface UpdateMenuItemModifierDTO {
    name: string;
    priceDelta: number;
    isActive: boolean;
    sortOrder: number;
}

export interface MenuCategoryDTO {
    id: number;
    menuId: number;
    restaurantId: number | null;
    name: string;
    description: string | null;
    imageUrl: string | null;
    icon: string | null;
    sortOrder: number;
    isActive: boolean;
    items: MenuItemDTO[];
}

export interface MenuDTO {
    id: number;
    restaurantId: number | null;
    name: string;
    description: string | null;
    imageUrl: string | null;
    bannerImageUrl: string | null;
    sortOrder: number;
    isActive: boolean;
    isPublished: boolean;
    startDate: string | null;
    endDate: string | null;
    createdAt: string;
    updatedAt: string | null;
    categories: MenuCategoryDTO[];
}

export interface CreateMenuDTO {
    restaurantId: number;
    name: string;
    description: string | null;
    imageUrl: string | null;
    bannerImageUrl: string | null;
    sortOrder: number;
    isActive: boolean;
    isPublished: boolean;
    startDate: string | null;
    endDate: string | null;
}

export interface UpdateMenuDTO {
    name: string;
    description: string | null;
    imageUrl: string | null;
    bannerImageUrl: string | null;
    sortOrder: number;
    isActive: boolean;
    isPublished: boolean;
    startDate: string | null;
    endDate: string | null;
}

export interface CreateMenuCategoryDTO {
    menuId: number;
    name: string;
    description: string | null;
    imageUrl: string | null;
    icon: string | null;
    sortOrder: number;
    isActive: boolean;
}

export interface UpdateMenuCategoryDTO {
    name: string;
    description: string | null;
    imageUrl: string | null;
    icon: string | null;
    sortOrder: number;
    isActive: boolean;
}

export interface CreateMenuItemDTO {
    menuCategoryId: number;

    name: string;
    description: string | null;
    shortDescription: string | null;
    imageUrl: string | null;
    thumbnailUrl: string | null;

    price: number;
    discountedPrice: number | null;

    calories: number | null;
    preparationTimeMinutes: number | null;
    servingSizeGrams: number | null;
    spicinessLevel: number;

    isVegetarian: boolean;
    isVegan: boolean;
    isGlutenFree: boolean;
    isDairyFree: boolean;
    isHalal: boolean;
    isKosher: boolean;
    isFeatured: boolean;
    isNew: boolean;
    isAvailable: boolean;
    isActive: boolean;

    allergens: string[];
    tags: string[];
    ingredients: string[];

    stockQuantity: number | null;
    sortOrder: number;
}

export interface UpdateMenuItemDTO extends CreateMenuItemDTO {}
