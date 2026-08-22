using Foodlyn.Modules.Identity.Application.Services;
using Foodlyn.Modules.Restaurants.Application.DTOs;
using Foodlyn.Modules.Restaurants.Application.Services;
using Foodlyn.Shared.Application;
using Foodlyn.Shared.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Foodlyn.API.Controllers
{
    [Route("api/restaurants")]
    [ApiController]
    public class RestaurantController : ControllerBase
    {
        private readonly IRestaurantService _restaurantService;
        private readonly IUserService _userService;
        private readonly ICurrentUserContext _currentUser;

        public RestaurantController(
            IRestaurantService restaurantService,
            IUserService userService,
            ICurrentUserContext currentUser)
        {
            _restaurantService = restaurantService;
            _userService = userService;
            _currentUser = currentUser;
        }

        [HttpPost]
        [Authorize(Policy = Policies.SuperAdmin)]
        public async Task<IActionResult> Create(CreateRestaurantDto dto)
        {
            var userId = _currentUser.UserId ?? -1;

            var result = await _restaurantService.CreateAsync(dto, userId);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpGet]
        [Authorize(Policy = Policies.SuperAdmin)]
        public async Task<IActionResult> GetAll()
        {
            var result = await _restaurantService.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("paged")]
        [Authorize(Policy = Policies.SuperAdmin)]
        public async Task<IActionResult> GetPaged([FromQuery] PagedRestaurantQueryDto query)
        {
            query.RestrictToIds = null;
            var result = await _restaurantService.GetPagedAsync(query);
            return Ok(result);
        }

        [HttpGet("public")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPublic()
        {
            var result = await _restaurantService.GetPublicActiveAsync();
            return Ok(result);
        }

        [HttpGet("public/slug/{slug}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPublicBySlug(string slug)
        {
            var result = await _restaurantService.GetBySlugAsync(slug);
            if (!result.IsSuccess || !(result.Value?.IsActive ?? false))
                return NotFound(result);
            return Ok(result);
        }

        [HttpGet("mine")]
        [Authorize]
        public async Task<IActionResult> GetMine()
        {
            var userId = _currentUser.UserId ?? -1;

            if (_currentUser.IsSuperAdmin)
            {
                var all = await _restaurantService.GetAllAsync();
                return Ok(all);
            }

            var ids = await _userService.GetAssignedRestaurantIdsAsync(userId);
            var result = await _restaurantService.GetByIdsAsync(ids);
            return Ok(result);
        }

        [HttpGet("{id:long}")]
        [Authorize]
        public async Task<IActionResult> GetById(long id)
        {
            var userId = _currentUser.UserId ?? -1;

            if (!_currentUser.IsSuperAdmin)
            {
                var ids = await _userService.GetAssignedRestaurantIdsAsync(userId);
                if (!ids.Contains(id))
                    return Forbid();
            }

            var result = await _restaurantService.GetByIdAsync(id);

            if (!result.IsSuccess)
                return NotFound(result);

            return Ok(result);
        }

        [HttpGet("{id:long}/opening-hours")]
        [AllowAnonymous]
        public async Task<IActionResult> GetOpeningHours(long id)
        {
            var result = await _restaurantService.GetOpeningHoursAsync(id);
            return Ok(result);
        }

        [HttpPut("{id:long}/opening-hours")]
        [Authorize(Policy = Policies.Manager)]
        public async Task<IActionResult> SaveOpeningHours(long id, UpdateOpeningHoursDto dto)
        {
            var userId = _currentUser.UserId ?? -1;

            if (!_currentUser.IsSuperAdmin)
            {
                var ids = await _userService.GetAssignedRestaurantIdsAsync(userId);
                if (!ids.Contains(id)) return Forbid();
            }

            var result = await _restaurantService.SaveOpeningHoursAsync(id, dto);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        [HttpPut("{id:long}")]
        [Authorize(Policy = Policies.Manager)]
        public async Task<IActionResult> Update(long id, UpdateRestaurantDto dto)
        {
            var userId = _currentUser.UserId ?? -1;
            var isSuperAdmin = _currentUser.IsSuperAdmin;

            if (!isSuperAdmin)
            {
                var ids = await _userService.GetAssignedRestaurantIdsAsync(userId);
                if (!ids.Contains(id))
                    return Forbid();
            }

            var result = await _restaurantService.UpdateAsync(id, dto, userId, allowRename: isSuperAdmin);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }
    }
}
