using Foodlyn.Modules.Menus.Application.DTOs;
using Foodlyn.Modules.Menus.Domain.Entities;
using Foodlyn.Shared.Application;

namespace Foodlyn.Modules.Menus.Application.Services
{
    public interface IMenuService
    {
        Task<Result<List<MenuDto>>> GetByRestaurantAsync(long restaurantId);
        Task<Result<List<MenuDto>>> GetPublicByRestaurantAsync(long restaurantId);
        Task<Result<MenuDto>> GetByIdAsync(long id);

        Task<Result<MenuDto>> CreateMenuAsync(CreateMenuDto dto, long userId);
        Task<Result<MenuDto>> UpdateMenuAsync(long id, UpdateMenuDto dto, long userId);
        Task<Result<string>> DeleteMenuAsync(long id);

        Task<MenuCategory?> GetCategoryByIdAsync(long id);
        Task<Result<MenuCategoryDto>> CreateCategoryAsync(CreateMenuCategoryDto dto, long userId);
        Task<Result<MenuCategoryDto>> UpdateCategoryAsync(long id, UpdateMenuCategoryDto dto, long userId, MenuCategory category);
        Task<Result<string>> DeleteCategoryAsync(MenuCategory category);

        Task<MenuItem?> GetMenuItemAsync(long id);
        Task<Result<MenuItemDto>> CreateItemAsync(CreateMenuItemDto dto, long userId, MenuCategory category);
        Task<Result<MenuItemDto>> UpdateItemAsync(long id, UpdateMenuItemDto dto, long userId, MenuItem item);
        Task<Result<string>> DeleteItemAsync(long id, MenuItem item);

        Task<MenuItemModifierGroup?> GetModifierGroupAsync(long id);
        Task<Result<MenuItemModifierGroupDto>> CreateModifierGroupAsync(CreateMenuItemModifierGroupDto dto, long userId, long restaurantId);
        Task<Result<MenuItemModifierGroupDto>> UpdateModifierGroupAsync(long id, UpdateMenuItemModifierGroupDto dto, long userId, MenuItemModifierGroup group);
        Task<Result<string>> DeleteModifierGroupAsync(long id, MenuItemModifierGroup group);

        Task<MenuItemModifier?> GetModifierByIdAsync(long id);
        Task<Result<MenuItemModifierDto>> CreateModifierAsync(CreateMenuItemModifierDto dto, long userId, MenuItemModifierGroup group);
        Task<Result<MenuItemModifierDto>> UpdateModifierAsync(long id, UpdateMenuItemModifierDto dto, long userId, MenuItemModifier modifier);
        Task<Result<string>> DeleteModifierAsync(long id, MenuItemModifier modifier);
    }
}
