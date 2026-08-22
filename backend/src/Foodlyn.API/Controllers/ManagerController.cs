using Foodlyn.Modules.Identity.Application.DTOs;
using Foodlyn.Modules.Identity.Application.Services;
using Foodlyn.Modules.Identity.Domain.Enums;
using Foodlyn.Shared.Application;
using Foodlyn.Shared.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Foodlyn.API.Controllers
{
    [Route("api/manager")]
    [ApiController]
    [Authorize(Roles = Roles.Manager)]
    public class ManagerController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ICurrentUserContext _currentUser;

        public ManagerController(IUserService userService, ICurrentUserContext currentUser)
        {
            _userService = userService;
            _currentUser = currentUser;
        }

        [HttpPost("create-account")]
        public async Task<IActionResult> CreateAccount(RegisterDto dto)
        {
            var userId = _currentUser.UserId ?? -1;

            var result = await _userService.CreateAccountAsync(dto, userId, UserRole.Manager);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            var userId = _currentUser.UserId ?? -1;
            var restaurantIds = await _userService.GetAssignedRestaurantIdsAsync(userId);
            var result = await _userService.GetByRestaurantIdsAsync(restaurantIds);
            return Ok(result);
        }

        [HttpGet("users/paged")]
        public async Task<IActionResult> GetUsersPaged([FromQuery] PagedUserQueryDto query)
        {
            var userId = _currentUser.UserId ?? -1;
            var restaurantIds = await _userService.GetAssignedRestaurantIdsAsync(userId);
            query.RestrictToRestaurantIds = restaurantIds;
            var result = await _userService.GetPagedAsync(query);
            return Ok(result);
        }

        [HttpPut("users/{id:long}")]
        public async Task<IActionResult> UpdateUser(long id, UpdateUserDto dto)
        {
            var managerId = _currentUser.UserId ?? -1;
            var result = await _userService.UpdateAsManagerAsync(id, dto, managerId);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        [HttpPost("users/{id:long}/reset-password")]
        public async Task<IActionResult> ResetPassword(long id, AdminResetPasswordDto dto)
        {
            var managerId = _currentUser.UserId ?? -1;
            var result = await _userService.ResetPasswordByAdminAsync(id, dto, managerId);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }
    }
}
