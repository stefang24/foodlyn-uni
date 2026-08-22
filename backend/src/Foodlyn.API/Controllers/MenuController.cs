using Foodlyn.Modules.Identity.Application.Services;
using Foodlyn.Modules.Menus.Application.DTOs;
using Foodlyn.Modules.Menus.Application.Services;
using Foodlyn.Modules.Restaurants.Application.Services;
using Foodlyn.Shared.Application;
using Foodlyn.Shared.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Foodlyn.API.Controllers
{
    [Route("api/menus")]
    [ApiController]
    [Authorize(Policy = Policies.Manager)]
    public class MenuController : ControllerBase
    {
        private readonly IMenuService _menuService;
        private readonly IUserService _userService;
        private readonly IRestaurantService _restaurantService;
        private readonly ICurrentUserContext _currentUser;

        public MenuController(
            IMenuService menuService,
            IUserService userService,
            IRestaurantService restaurantService,
            ICurrentUserContext currentUser)
        {
            _menuService = menuService;
            _userService = userService;
            _restaurantService = restaurantService;
            _currentUser = currentUser;
        }

        [HttpGet("restaurant/{restaurantId:long}")]
        public async Task<IActionResult> GetByRestaurant(long restaurantId)
        {
            if (!await CanAccessRestaurantAsync(restaurantId))
                return Forbid();

            var result = await _menuService.GetByRestaurantAsync(restaurantId);
            return Ok(result);
        }

        [HttpGet("for-order/{restaurantId:long}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetForOrder(long restaurantId)
        {
            if (!_currentUser.IsAuthenticated)
                return Unauthorized();

            if (!_currentUser.IsInAnyRole(Roles.Waiter, Roles.Cashier, Roles.Cook, Roles.Manager, Roles.SuperAdmin))
                return Forbid();

            if (!await CanAccessRestaurantAsync(restaurantId))
                return Forbid();

            var result = await _menuService.GetPublicByRestaurantAsync(restaurantId);
            return Ok(result);
        }

        [HttpGet("public/slug/{slug}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPublicBySlug(string slug)
        {
            var restaurant = await _restaurantService.GetBySlugAsync(slug);
            if (!restaurant.IsSuccess || restaurant.Value is null || !restaurant.Value.IsActive)
                return NotFound(restaurant);

            var result = await _menuService.GetPublicByRestaurantAsync(restaurant.Value.Id);
            return Ok(result);
        }

        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetById(long id)
        {
            var result = await _menuService.GetByIdAsync(id);
            if (!result.IsSuccess)
                return NotFound(result);

            if (!await CanAccessRestaurantAsync(result.Value!.RestaurantId))
                return Forbid();

            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateMenu(CreateMenuDto dto)
        {
            if (!await CanAccessRestaurantAsync(dto.RestaurantId))
                return Forbid();

            var userId = CurrentUserId();
            var result = await _menuService.CreateMenuAsync(dto, userId);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpPut("{id:long}")]
        public async Task<IActionResult> UpdateMenu(long id, UpdateMenuDto dto)
        {
            var existing = await _menuService.GetByIdAsync(id);
            if (!existing.IsSuccess)
                return NotFound(existing);

            if (!await CanAccessRestaurantAsync(existing.Value!.RestaurantId))
                return Forbid();

            var userId = CurrentUserId();
            var result = await _menuService.UpdateMenuAsync(id, dto, userId);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpDelete("{id:long}")]
        public async Task<IActionResult> DeleteMenu(long id)
        {
            var existing = await _menuService.GetByIdAsync(id);
            if (!existing.IsSuccess)
                return NotFound(existing);

            if (!await CanAccessRestaurantAsync(existing.Value!.RestaurantId))
                return Forbid();

            var result = await _menuService.DeleteMenuAsync(id);
            return Ok(result);
        }

        [HttpPost("categories")]
        public async Task<IActionResult> CreateCategory(CreateMenuCategoryDto dto)
        {
            var menu = await _menuService.GetByIdAsync(dto.MenuId);
            if (!menu.IsSuccess)
                return NotFound(menu);

            if (!await CanAccessRestaurantAsync(menu.Value!.RestaurantId))
                return Forbid();

            var userId = CurrentUserId();
            var result = await _menuService.CreateCategoryAsync(dto, userId);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpPut("categories/{id:long}")]
        public async Task<IActionResult> UpdateCategory(long id, UpdateMenuCategoryDto dto)
        {
            var category = await _menuService.GetCategoryByIdAsync(id);
            if (category == null)
                return NotFound();

            if (!await CanAccessRestaurantAsync(category.RestaurantId!.Value))
                return Forbid();

            var userId = CurrentUserId();
            var result = await _menuService.UpdateCategoryAsync(id, dto, userId, category);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpDelete("categories/{id:long}")]
        public async Task<IActionResult> DeleteCategory(long id)
        {
            var category = await _menuService.GetCategoryByIdAsync(id);
            if (category == null)
                return NotFound();

            if (!await CanAccessRestaurantAsync(category.RestaurantId!.Value))
                return Forbid();

            var result = await _menuService.DeleteCategoryAsync(category);

            if (!result.IsSuccess)
                return NotFound(result);

            return Ok(result);
        }

        [HttpPost("items")]
        public async Task<IActionResult> CreateItem(CreateMenuItemDto dto)
        {
            var category = await _menuService.GetCategoryByIdAsync(dto.MenuCategoryId);
            if (category == null) return BadRequest("Category not found");

            if (!await CanAccessRestaurantAsync(category.RestaurantId!.Value))
                return Forbid();

            var userId = CurrentUserId();
            var result = await _menuService.CreateItemAsync(dto, userId, category);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpPut("items/{id:long}")]
        public async Task<IActionResult> UpdateItem(long id, UpdateMenuItemDto dto)
        {
            var item = await _menuService.GetMenuItemAsync(id);
            if(item == null) return NotFound("Item not found");

            if (!await CanAccessRestaurantAsync(item.RestaurantId!.Value))
                return Forbid();

            var userId = CurrentUserId();
            var result = await _menuService.UpdateItemAsync(id, dto, userId, item);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpDelete("items/{id:long}")]
        public async Task<IActionResult> DeleteItem(long id)
        {
            var item = await _menuService.GetMenuItemAsync(id);
            if (item == null) return NotFound("Item not found");

            if (!await CanAccessRestaurantAsync(item.RestaurantId!.Value))
                return Forbid();

            var result = await _menuService.DeleteItemAsync(id, item);

            if (!result.IsSuccess)
                return NotFound(result);

            return Ok(result);
        }

        [HttpPost("modifier-groups")]
        public async Task<IActionResult> CreateModifierGroup(CreateMenuItemModifierGroupDto dto)
        {
            var item = await _menuService.GetMenuItemAsync(dto.MenuItemId);
            if (item == null) return NotFound("Item not found");

            if (!await CanAccessRestaurantAsync(item.RestaurantId!.Value))
                return Forbid();

            var result = await _menuService.CreateModifierGroupAsync(dto, CurrentUserId(), item.RestaurantId!.Value);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpPut("modifier-groups/{id:long}")]
        public async Task<IActionResult> UpdateModifierGroup(long id, UpdateMenuItemModifierGroupDto dto)
        {
            var group = await _menuService.GetModifierGroupAsync(id);
            if (group == null) return NotFound("Group not found");

            if (!await CanAccessRestaurantAsync(group.RestaurantId!.Value))
                return Forbid();

            var result = await _menuService.UpdateModifierGroupAsync(id, dto, CurrentUserId(), group);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("modifier-groups/{id:long}")]
        public async Task<IActionResult> DeleteModifierGroup(long id)
        {
            var group = await _menuService.GetModifierGroupAsync(id);
            if (group == null) return NotFound("Group not found");

            if (!await CanAccessRestaurantAsync(group.RestaurantId!.Value))
                return Forbid();

            var result = await _menuService.DeleteModifierGroupAsync(id, group);
            return result.IsSuccess ? Ok(result) : NotFound(result);
        }

        [HttpPost("modifiers")]
        public async Task<IActionResult> CreateModifier(CreateMenuItemModifierDto dto)
        {
            var group = await _menuService.GetModifierGroupAsync(dto.MenuItemModifierGroupId);
            if (group == null) return NotFound("Group not found");

            if (!await CanAccessRestaurantAsync(group.RestaurantId!.Value))
                return Forbid();

            var result = await _menuService.CreateModifierAsync(dto, CurrentUserId(), group);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpPut("modifiers/{id:long}")]
        public async Task<IActionResult> UpdateModifier(long id, UpdateMenuItemModifierDto dto)
        {
            var modifier = await _menuService.GetModifierByIdAsync(id);
            if (modifier == null) return NotFound("Modifier not found");

            if (!await CanAccessRestaurantAsync(modifier.RestaurantId!.Value))
                return Forbid();

            var result = await _menuService.UpdateModifierAsync(id, dto, CurrentUserId(), modifier);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("modifiers/{id:long}")]
        public async Task<IActionResult> DeleteModifier(long id)
        {
            var modifier = await _menuService.GetModifierByIdAsync(id);
            if (modifier == null) return NotFound("Modifier not found");

            if (!await CanAccessRestaurantAsync(modifier.RestaurantId!.Value))
                return Forbid();

            var result = await _menuService.DeleteModifierAsync(id, modifier);
            return result.IsSuccess ? Ok(result) : NotFound(result);
        }

        private long CurrentUserId() => _currentUser.UserId ?? -1;

        private bool IsSuperAdmin() => _currentUser.IsSuperAdmin;

        private async Task<bool> CanAccessRestaurantAsync(long? restaurantId)
        {
            if (IsSuperAdmin()) return true;
            if (restaurantId == null) return false;

            var ids = await _userService.GetAssignedRestaurantIdsAsync(CurrentUserId());
            return ids.Contains(restaurantId.Value);
        }
    }
}
