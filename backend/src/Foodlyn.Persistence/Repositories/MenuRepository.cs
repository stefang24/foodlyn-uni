using Foodlyn.Modules.Menus.Application.Repositories;
using Foodlyn.Modules.Menus.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Foodlyn.Persistence.Repositories
{
    public class MenuRepository : IMenuRepository
    {
        private readonly AppDbContext _db;

        public MenuRepository(AppDbContext db) => _db = db;

        public async Task<List<Menu>> GetByRestaurantAsync(long restaurantId)
            => await _db.Menus
                .IgnoreQueryFilters()
                .Include(m => m.Categories.OrderBy(c => c.SortOrder).ThenBy(c => c.Name))
                    .ThenInclude(c => c.Items.OrderBy(i => i.SortOrder).ThenBy(i => i.Name))
                        .ThenInclude(i => i.ModifierGroups.OrderBy(g => g.SortOrder).ThenBy(g => g.Name))
                            .ThenInclude(g => g.Modifiers.OrderBy(mo => mo.SortOrder).ThenBy(mo => mo.Name))
                .Where(m => m.RestaurantId == restaurantId)
                .OrderBy(m => m.SortOrder).ThenBy(m => m.Name)
                .ToListAsync();

        public async Task<Menu?> GetByIdAsync(long id)
            => await _db.Menus.IgnoreQueryFilters().FirstOrDefaultAsync(m => m.Id == id);

        public async Task<Menu?> GetByIdWithTreeAsync(long id)
            => await _db.Menus
                .IgnoreQueryFilters()
                .Include(m => m.Categories.OrderBy(c => c.SortOrder).ThenBy(c => c.Name))
                    .ThenInclude(c => c.Items.OrderBy(i => i.SortOrder).ThenBy(i => i.Name))
                        .ThenInclude(i => i.ModifierGroups.OrderBy(g => g.SortOrder).ThenBy(g => g.Name))
                            .ThenInclude(g => g.Modifiers.OrderBy(mo => mo.SortOrder).ThenBy(mo => mo.Name))
                .FirstOrDefaultAsync(m => m.Id == id);

        public async Task AddMenuAsync(Menu menu) => await _db.Menus.AddAsync(menu);

        public void RemoveMenu(Menu menu) => _db.Menus.Remove(menu);

        public async Task<MenuCategory?> GetCategoryAsync(long id)
            => await _db.MenuCategories.IgnoreQueryFilters().FirstOrDefaultAsync(c => c.Id == id);

        public async Task AddCategoryAsync(MenuCategory category)
            => await _db.MenuCategories.AddAsync(category);

        public void RemoveCategory(MenuCategory category) => _db.MenuCategories.Remove(category);

        public async Task<MenuItem?> GetItemAsync(long id)
            => await _db.MenuItems.IgnoreQueryFilters().FirstOrDefaultAsync(i => i.Id == id);

        public async Task<MenuItem?> GetItemWithModifiersAsync(long id)
            => await _db.MenuItems
                .IgnoreQueryFilters()
                .Include(i => i.ModifierGroups.OrderBy(g => g.SortOrder).ThenBy(g => g.Name))
                    .ThenInclude(g => g.Modifiers.OrderBy(mo => mo.SortOrder).ThenBy(mo => mo.Name))
                .FirstOrDefaultAsync(i => i.Id == id);

        public async Task AddItemAsync(MenuItem item) => await _db.MenuItems.AddAsync(item);

        public void RemoveItem(MenuItem item) => _db.MenuItems.Remove(item);

        public async Task<MenuItemModifierGroup?> GetModifierGroupAsync(long id)
            => await _db.MenuItemModifierGroups
                .IgnoreQueryFilters()
                .Include(g => g.Modifiers)
                .FirstOrDefaultAsync(g => g.Id == id);

        public async Task AddModifierGroupAsync(MenuItemModifierGroup group)
            => await _db.MenuItemModifierGroups.AddAsync(group);

        public void RemoveModifierGroup(MenuItemModifierGroup group)
            => _db.MenuItemModifierGroups.Remove(group);

        public async Task<MenuItemModifier?> GetModifierAsync(long id)
            => await _db.MenuItemModifiers.IgnoreQueryFilters().FirstOrDefaultAsync(m => m.Id == id);

        public async Task<List<MenuItemModifier>> GetModifiersByIdsAsync(IEnumerable<long> ids)
        {
            var list = ids.ToList();
            if (list.Count == 0) return new List<MenuItemModifier>();
            return await _db.MenuItemModifiers
                .IgnoreQueryFilters()
                .Where(m => list.Contains(m.Id))
                .ToListAsync();
        }

        public async Task AddModifierAsync(MenuItemModifier modifier)
            => await _db.MenuItemModifiers.AddAsync(modifier);

        public void RemoveModifier(MenuItemModifier modifier)
            => _db.MenuItemModifiers.Remove(modifier);

        public async Task SaveChangesAsync() => await _db.SaveChangesAsync();
    }
}
