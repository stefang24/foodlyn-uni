using Foodlyn.Modules.Menus.Domain.Entities;

namespace Foodlyn.Modules.Menus.Application.Repositories
{
    public interface IMenuRepository
    {
        Task<List<Menu>> GetByRestaurantAsync(long restaurantId);
        Task<Menu?> GetByIdAsync(long id);
        Task<Menu?> GetByIdWithTreeAsync(long id);
        Task AddMenuAsync(Menu menu);
        void RemoveMenu(Menu menu);

        Task<MenuCategory?> GetCategoryAsync(long id);
        Task AddCategoryAsync(MenuCategory category);
        void RemoveCategory(MenuCategory category);

        Task<MenuItem?> GetItemAsync(long id);
        Task<MenuItem?> GetItemWithModifiersAsync(long id);
        Task AddItemAsync(MenuItem item);
        void RemoveItem(MenuItem item);

        Task<MenuItemModifierGroup?> GetModifierGroupAsync(long id);
        Task AddModifierGroupAsync(MenuItemModifierGroup group);
        void RemoveModifierGroup(MenuItemModifierGroup group);

        Task<MenuItemModifier?> GetModifierAsync(long id);
        Task<List<MenuItemModifier>> GetModifiersByIdsAsync(IEnumerable<long> ids);
        Task AddModifierAsync(MenuItemModifier modifier);
        void RemoveModifier(MenuItemModifier modifier);

        Task SaveChangesAsync();
    }
}
