using Foodlyn.Modules.Identity.Application.DTOs;
using Foodlyn.Modules.Identity.Application.Services;
using Foodlyn.Shared.Application;
using Foodlyn.Shared.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Foodlyn.API.Controllers
{
    [Route("api/users")]
    [ApiController]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ICurrentUserContext _currentUser;

        public UsersController(IUserService userService, ICurrentUserContext currentUser)
        {
            _userService = userService;
            _currentUser = currentUser;
        }

        [HttpGet]
        [Authorize(Policy = Policies.SuperAdmin)]
        public async Task<IActionResult> GetAll()
        {
            var result = await _userService.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("paged")]
        [Authorize(Policy = Policies.SuperAdmin)]
        public async Task<IActionResult> GetPaged([FromQuery] PagedUserQueryDto query)
        {
            query.RestrictToRestaurantIds = null;
            var result = await _userService.GetPagedAsync(query);
            return Ok(result);
        }

        [HttpGet("{id:long}")]
        [Authorize(Policy = Policies.SuperAdmin)]
        public async Task<IActionResult> GetById(long id)
        {
            var result = await _userService.GetByIdAsync(id);
            if (!result.IsSuccess)
                return NotFound(result);
            return Ok(result);
        }

        [HttpPut("{id:long}")]
        [Authorize(Policy = Policies.SuperAdmin)]
        public async Task<IActionResult> Update(long id, UpdateUserDto dto)
        {
            var updaterId = _currentUser.UserId ?? -1;
            var result = await _userService.UpdateAsync(id, dto, updaterId);
            if (!result.IsSuccess)
                return BadRequest(result);
            return Ok(result);
        }

        [HttpGet("me/profile")]
        public async Task<IActionResult> GetMyProfile()
        {
            var userId = _currentUser.UserId ?? -1;
            var result = await _userService.GetByIdAsync(userId);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }

        [HttpPut("me/profile")]
        public async Task<IActionResult> UpdateMyProfile(UpdateMyProfileDto dto)
        {
            var userId = _currentUser.UserId ?? -1;
            var result = await _userService.UpdateMyProfileAsync(userId, dto);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpPost("me/change-password")]
        public async Task<IActionResult> ChangePassword(ChangePasswordDto dto)
        {
            var userId = _currentUser.UserId ?? -1;
            var result = await _userService.ChangePasswordAsync(userId, dto);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
    }
}
