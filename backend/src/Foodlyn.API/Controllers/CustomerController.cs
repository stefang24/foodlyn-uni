using Foodlyn.Modules.Menus.Application.Services;
using Foodlyn.Modules.Restaurants.Application.Services;
using Foodlyn.Shared.Application;
using Foodlyn.Shared.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Foodlyn.API.Controllers
{
    [Route("api/customer")]
    [ApiController]
    [Authorize(Policy = Policies.Customer)]
    public class CustomerController : ControllerBase
    {
        private readonly IMenuService _menuService;
        private readonly IRestaurantService _restaurantService;
        private readonly ICurrentUserContext _currentUser;

        public CustomerController(
            IMenuService menuService,
            IRestaurantService restaurantService,
            ICurrentUserContext currentUser)
        {
            _menuService = menuService;
            _restaurantService = restaurantService;
            _currentUser = currentUser;
        }

        [HttpGet("restaurant/{restaurantId:long}")]
        public async Task<IActionResult> GetRestaurant(long restaurantId)
        {
            if (!GuestCanAccess(restaurantId))
                return Forbid();

            var result = await _restaurantService.GetByIdAsync(restaurantId);
            return result.IsSuccess ? Ok(result) : NotFound(result);
        }

        [HttpGet("restaurant/{restaurantId:long}/menus")]
        public async Task<IActionResult> GetMenus(long restaurantId)
        {
            if (!GuestCanAccess(restaurantId))
                return Forbid();

            var result = await _menuService.GetPublicByRestaurantAsync(restaurantId);
            return Ok(result);
        }

        private bool GuestCanAccess(long restaurantId)
        {
            if (!_currentUser.IsGuest) return true;
            return _currentUser.RestaurantId == restaurantId;
        }
    }
}
