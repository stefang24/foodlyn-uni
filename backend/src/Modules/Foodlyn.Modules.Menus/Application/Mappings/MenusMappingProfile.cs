using Foodlyn.Modules.Menus.Application.DTOs;
using Foodlyn.Modules.Menus.Domain.Entities;
using Mapster;

namespace Foodlyn.Modules.Menus.Application.Mappings
{
    public class MenusMappingProfile : IRegister
    {
        public void Register(TypeAdapterConfig config)
        {
            config.NewConfig<Menu, MenuDto>()
                .Map(d => d.Categories,
                    s => s.Categories
                        .OrderBy(c => c.SortOrder)
                        .ThenBy(c => c.Name)
                        .ToList());

            config.NewConfig<MenuCategory, MenuCategoryDto>()
                .Map(d => d.Items,
                    s => s.Items
                        .OrderBy(i => i.SortOrder)
                        .ThenBy(i => i.Name)
                        .ToList());

            config.NewConfig<MenuItem, MenuItemDto>()
                .Map(d => d.ModifierGroups,
                    s => s.ModifierGroups
                        .OrderBy(g => g.SortOrder)
                        .ThenBy(g => g.Name)
                        .ToList());

            config.NewConfig<MenuItemModifierGroup, MenuItemModifierGroupDto>()
                .Map(d => d.Modifiers,
                    s => s.Modifiers
                        .OrderBy(m => m.SortOrder)
                        .ThenBy(m => m.Name)
                        .ToList());

            config.NewConfig<MenuItemModifier, MenuItemModifierDto>();

            config.NewConfig<CreateMenuItemModifierGroupDto, MenuItemModifierGroup>()
                .Ignore(d => d.Id)
                .Ignore(d => d.RestaurantId)
                .Ignore(d => d.CreatedAt)
                .Ignore(d => d.UpdatedAt)
                .Ignore(d => d.CreatedBy)
                .Ignore(d => d.UpdatedBy)
                .Ignore(d => d.Modifiers)
                .Map(d => d.Name, s => s.Name.Trim());

            config.NewConfig<UpdateMenuItemModifierGroupDto, MenuItemModifierGroup>()
                .Ignore(d => d.Id)
                .Ignore(d => d.MenuItemId)
                .Ignore(d => d.RestaurantId)
                .Ignore(d => d.CreatedAt)
                .Ignore(d => d.UpdatedAt)
                .Ignore(d => d.CreatedBy)
                .Ignore(d => d.UpdatedBy)
                .Ignore(d => d.Modifiers)
                .Map(d => d.Name, s => s.Name.Trim());

            config.NewConfig<CreateMenuItemModifierDto, MenuItemModifier>()
                .Ignore(d => d.Id)
                .Ignore(d => d.RestaurantId)
                .Ignore(d => d.CreatedAt)
                .Ignore(d => d.UpdatedAt)
                .Ignore(d => d.CreatedBy)
                .Ignore(d => d.UpdatedBy)
                .Map(d => d.Name, s => s.Name.Trim());

            config.NewConfig<UpdateMenuItemModifierDto, MenuItemModifier>()
                .Ignore(d => d.Id)
                .Ignore(d => d.MenuItemModifierGroupId)
                .Ignore(d => d.RestaurantId)
                .Ignore(d => d.CreatedAt)
                .Ignore(d => d.UpdatedAt)
                .Ignore(d => d.CreatedBy)
                .Ignore(d => d.UpdatedBy)
                .Map(d => d.Name, s => s.Name.Trim());

            config.NewConfig<CreateMenuDto, Menu>()
                .Ignore(d => d.Id)
                .Ignore(d => d.CreatedAt)
                .Ignore(d => d.UpdatedAt)
                .Ignore(d => d.CreatedBy)
                .Ignore(d => d.UpdatedBy)
                .Ignore(d => d.Categories)
                .Map(d => d.Name, s => s.Name.Trim());

            config.NewConfig<UpdateMenuDto, Menu>()
                .Ignore(d => d.Id)
                .Ignore(d => d.RestaurantId)
                .Ignore(d => d.CreatedAt)
                .Ignore(d => d.UpdatedAt)
                .Ignore(d => d.CreatedBy)
                .Ignore(d => d.UpdatedBy)
                .Ignore(d => d.Categories)
                .Map(d => d.Name, s => s.Name.Trim());

            config.NewConfig<CreateMenuCategoryDto, MenuCategory>()
                .Ignore(d => d.Id)
                .Ignore(d => d.RestaurantId)
                .Ignore(d => d.CreatedAt)
                .Ignore(d => d.UpdatedAt)
                .Ignore(d => d.CreatedBy)
                .Ignore(d => d.UpdatedBy)
                .Ignore(d => d.Items)
                .Map(d => d.Name, s => s.Name.Trim());

            config.NewConfig<UpdateMenuCategoryDto, MenuCategory>()
                .Ignore(d => d.Id)
                .Ignore(d => d.MenuId)
                .Ignore(d => d.RestaurantId)
                .Ignore(d => d.CreatedAt)
                .Ignore(d => d.UpdatedAt)
                .Ignore(d => d.CreatedBy)
                .Ignore(d => d.UpdatedBy)
                .Ignore(d => d.Items)
                .Map(d => d.Name, s => s.Name.Trim());

            config.NewConfig<CreateMenuItemDto, MenuItem>()
                .Ignore(d => d.Id)
                .Ignore(d => d.MenuId)
                .Ignore(d => d.RestaurantId)
                .Ignore(d => d.CreatedAt)
                .Ignore(d => d.UpdatedAt)
                .Ignore(d => d.CreatedBy)
                .Ignore(d => d.UpdatedBy)
                .Map(d => d.Name, s => s.Name.Trim())
                .Map(d => d.Allergens, s => s.Allergens.Select(a => a.Trim()).Where(a => a.Length > 0).ToList())
                .Map(d => d.Tags, s => s.Tags.Select(t => t.Trim()).Where(t => t.Length > 0).ToList())
                .Map(d => d.Ingredients, s => s.Ingredients.Select(i => i.Trim()).Where(i => i.Length > 0).ToList());

            config.NewConfig<UpdateMenuItemDto, MenuItem>()
                .Ignore(d => d.Id)
                .Ignore(d => d.MenuId)
                .Ignore(d => d.RestaurantId)
                .Ignore(d => d.CreatedAt)
                .Ignore(d => d.UpdatedAt)
                .Ignore(d => d.CreatedBy)
                .Ignore(d => d.UpdatedBy)
                .Map(d => d.Name, s => s.Name.Trim())
                .Map(d => d.Allergens, s => s.Allergens.Select(a => a.Trim()).Where(a => a.Length > 0).ToList())
                .Map(d => d.Tags, s => s.Tags.Select(t => t.Trim()).Where(t => t.Length > 0).ToList())
                .Map(d => d.Ingredients, s => s.Ingredients.Select(i => i.Trim()).Where(i => i.Length > 0).ToList());
        }
    }
}
