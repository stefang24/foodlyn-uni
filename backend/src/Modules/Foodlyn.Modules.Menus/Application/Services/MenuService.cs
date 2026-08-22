using Foodlyn.Modules.Menus.Application.DTOs;
using Foodlyn.Modules.Menus.Application.Repositories;
using Foodlyn.Modules.Menus.Domain.Entities;
using Foodlyn.Shared.Application;
using Mapster;

namespace Foodlyn.Modules.Menus.Application.Services
{
    public class MenuService : IMenuService
    {
        private readonly IMenuRepository _repository;

        public MenuService(IMenuRepository repository)
        {
            _repository = repository;
        }

        public async Task<Result<List<MenuDto>>> GetByRestaurantAsync(long restaurantId)
        {
            var menus = await _repository.GetByRestaurantAsync(restaurantId);
            return Result<List<MenuDto>>.Success(menus.Adapt<List<MenuDto>>());
        }

        public async Task<Result<List<MenuDto>>> GetPublicByRestaurantAsync(long restaurantId)
        {
            var now = DateTime.UtcNow;
            var menus = await _repository.GetByRestaurantAsync(restaurantId);

            var filtered = menus
                .Where(m => m.IsPublished && m.IsActive)
                .Where(m => m.StartDate == null || m.StartDate <= now)
                .Where(m => m.EndDate == null || m.EndDate >= now)
                .Select(m => new Menu
                {
                    Id = m.Id,
                    RestaurantId = m.RestaurantId,
                    Name = m.Name,
                    Description = m.Description,
                    ImageUrl = m.ImageUrl,
                    BannerImageUrl = m.BannerImageUrl,
                    SortOrder = m.SortOrder,
                    IsActive = m.IsActive,
                    IsPublished = m.IsPublished,
                    StartDate = m.StartDate,
                    EndDate = m.EndDate,
                    CreatedAt = m.CreatedAt,
                    UpdatedAt = m.UpdatedAt,
                    Categories = m.Categories
                        .Where(c => c.IsActive)
                        .Select(c => new MenuCategory
                        {
                            Id = c.Id,
                            MenuId = c.MenuId,
                            RestaurantId = c.RestaurantId,
                            Name = c.Name,
                            Description = c.Description,
                            ImageUrl = c.ImageUrl,
                            Icon = c.Icon,
                            SortOrder = c.SortOrder,
                            IsActive = c.IsActive,
                            Items = c.Items
                                .Where(i => i.IsActive && i.IsAvailable)
                                .ToList(),
                        })
                        .Where(c => c.Items.Count > 0)
                        .ToList(),
                })
                .Where(m => m.Categories.Count > 0)
                .ToList();

            return Result<List<MenuDto>>.Success(filtered.Adapt<List<MenuDto>>());
        }

        public async Task<Result<MenuDto>> GetByIdAsync(long id)
        {
            var menu = await _repository.GetByIdWithTreeAsync(id);
            if (menu == null) return Result<MenuDto>.Failure("Menu not found");
            return Result<MenuDto>.Success(menu.Adapt<MenuDto>());
        }

        public async Task<Result<MenuDto>> CreateMenuAsync(CreateMenuDto dto, long userId)
        {
            var menu = dto.Adapt<Menu>();
            menu.CreatedBy = userId;

            await _repository.AddMenuAsync(menu);
            await _repository.SaveChangesAsync();

            return Result<MenuDto>.Success(menu.Adapt<MenuDto>());
        }

        public async Task<Result<MenuDto>> UpdateMenuAsync(long id, UpdateMenuDto dto, long userId)
        {
            var menu = await _repository.GetByIdAsync(id);
            if (menu == null) return Result<MenuDto>.Failure("Menu not found");

            dto.Adapt(menu);
            menu.UpdatedBy = userId;
            menu.UpdatedAt = DateTime.UtcNow;

            await _repository.SaveChangesAsync();
            return Result<MenuDto>.Success(menu.Adapt<MenuDto>());
        }

        public async Task<Result<string>> DeleteMenuAsync(long id)
        {
            var menu = await _repository.GetByIdAsync(id);
            if (menu == null) return Result<string>.Failure("Menu not found");

            _repository.RemoveMenu(menu);
            await _repository.SaveChangesAsync();
            return Result<string>.Success("Menu deleted");
        }

        public async Task<Result<MenuCategoryDto>> CreateCategoryAsync(CreateMenuCategoryDto dto, long userId)
        {
            var menu = await _repository.GetByIdAsync(dto.MenuId);
            if (menu == null) return Result<MenuCategoryDto>.Failure("Menu not found");

            var category = dto.Adapt<MenuCategory>();
            category.RestaurantId = menu.RestaurantId;
            category.CreatedBy = userId;

            await _repository.AddCategoryAsync(category);
            await _repository.SaveChangesAsync();

            return Result<MenuCategoryDto>.Success(category.Adapt<MenuCategoryDto>());
        }

        public async Task<MenuCategory?> GetCategoryByIdAsync(long id)
        {
            return await _repository.GetCategoryAsync(id);
        }

        public async Task<Result<MenuCategoryDto>> UpdateCategoryAsync(long id, UpdateMenuCategoryDto dto, long userId, MenuCategory category)
        {
            dto.Adapt(category);
            category.UpdatedBy = userId;
            category.UpdatedAt = DateTime.UtcNow;

            await _repository.SaveChangesAsync();
            return Result<MenuCategoryDto>.Success(category.Adapt<MenuCategoryDto>());
        }

        public async Task<Result<string>> DeleteCategoryAsync(MenuCategory category)
        {
            _repository.RemoveCategory(category);
            await _repository.SaveChangesAsync();
            return Result<string>.Success("Category deleted");
        }

        public async Task<MenuItem?> GetMenuItemAsync(long id)
        {
            return await _repository.GetItemAsync(id);
        }

        public async Task<Result<MenuItemDto>> CreateItemAsync(CreateMenuItemDto dto, long userId, MenuCategory category)
        {
            var item = dto.Adapt<MenuItem>();
            item.MenuId = category.MenuId;
            item.RestaurantId = category.RestaurantId;
            item.CreatedBy = userId;

            await _repository.AddItemAsync(item);
            await _repository.SaveChangesAsync();

            return Result<MenuItemDto>.Success(item.Adapt<MenuItemDto>());
        }

        public async Task<Result<MenuItemDto>> UpdateItemAsync(long id, UpdateMenuItemDto dto, long userId, MenuItem item)
        {
            if (item.MenuCategoryId != dto.MenuCategoryId)
            {
                var newCategory = await _repository.GetCategoryAsync(dto.MenuCategoryId);
                if (newCategory == null) return Result<MenuItemDto>.Failure("Target category not found");
                if (newCategory.MenuId != item.MenuId)
                    return Result<MenuItemDto>.Failure("Cannot move item to a category in a different menu");
            }

            dto.Adapt(item);
            item.UpdatedBy = userId;

            await _repository.SaveChangesAsync();
            return Result<MenuItemDto>.Success(item.Adapt<MenuItemDto>());
        }

        public async Task<Result<string>> DeleteItemAsync(long id, MenuItem item)
        {
            _repository.RemoveItem(item);
            await _repository.SaveChangesAsync();
            return Result<string>.Success("Item deleted");
        }

        public async Task<Result<MenuItemModifierGroupDto>> CreateModifierGroupAsync(CreateMenuItemModifierGroupDto dto, long userId, long restaurantId)
        {
            if (dto.MinSelect < 0 || dto.MaxSelect <= 0 || dto.MinSelect > dto.MaxSelect)
                return Result<MenuItemModifierGroupDto>.Failure("Invalid min/max selection");

            var group = dto.Adapt<MenuItemModifierGroup>();
            group.RestaurantId = restaurantId;
            group.CreatedBy = userId;

            await _repository.AddModifierGroupAsync(group);
            await _repository.SaveChangesAsync();

            return Result<MenuItemModifierGroupDto>.Success(group.Adapt<MenuItemModifierGroupDto>());
        }

        public async Task<MenuItemModifierGroup?> GetModifierGroupAsync(long id)
        {
            return await _repository.GetModifierGroupAsync(id);
        }

        public async Task<Result<MenuItemModifierGroupDto>> UpdateModifierGroupAsync(long id, UpdateMenuItemModifierGroupDto dto, long userId, MenuItemModifierGroup group)
        {
            if (dto.MinSelect < 0 || dto.MaxSelect <= 0 || dto.MinSelect > dto.MaxSelect)
                return Result<MenuItemModifierGroupDto>.Failure("Invalid min/max selection");

            dto.Adapt(group);
            group.UpdatedBy = userId;

            await _repository.SaveChangesAsync();
            return Result<MenuItemModifierGroupDto>.Success(group.Adapt<MenuItemModifierGroupDto>());
        }

        public async Task<Result<string>> DeleteModifierGroupAsync(long id, MenuItemModifierGroup group)
        {
            _repository.RemoveModifierGroup(group);
            await _repository.SaveChangesAsync();
            return Result<string>.Success("Modifier group deleted");
        }

        public async Task<Result<MenuItemModifierDto>> CreateModifierAsync(CreateMenuItemModifierDto dto, long userId, MenuItemModifierGroup group)
        {
            if (dto.PriceDelta < 0)
                return Result<MenuItemModifierDto>.Failure("Price cannot be negative");

            var modifier = dto.Adapt<MenuItemModifier>();
            modifier.RestaurantId = group.RestaurantId;
            modifier.CreatedBy = userId;

            await _repository.AddModifierAsync(modifier);
            await _repository.SaveChangesAsync();

            return Result<MenuItemModifierDto>.Success(modifier.Adapt<MenuItemModifierDto>());
        }

        public async Task<MenuItemModifier?> GetModifierByIdAsync(long id)
        {
            return await _repository.GetModifierAsync(id);
        }

        public async Task<Result<MenuItemModifierDto>> UpdateModifierAsync(long id, UpdateMenuItemModifierDto dto, long userId, MenuItemModifier modifier)
        {
            if (dto.PriceDelta < 0)
                return Result<MenuItemModifierDto>.Failure("Price cannot be negative");

            dto.Adapt(modifier);
            modifier.UpdatedBy = userId;

            await _repository.SaveChangesAsync();
            return Result<MenuItemModifierDto>.Success(modifier.Adapt<MenuItemModifierDto>());
        }

        public async Task<Result<string>> DeleteModifierAsync(long id, MenuItemModifier modifier)
        {
            _repository.RemoveModifier(modifier);
            await _repository.SaveChangesAsync();
            return Result<string>.Success("Modifier deleted");
        }
    }
}
