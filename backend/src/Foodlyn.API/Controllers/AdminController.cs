using Foodlyn.Modules.Identity.Application.DTOs;
using Foodlyn.Modules.Identity.Application.Services;
using Foodlyn.Modules.Identity.Domain.Enums;
using Foodlyn.Shared.Application;
using Foodlyn.Shared.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Foodlyn.API.Controllers
{
    [Route("api/admin")]
    [ApiController]
    [Authorize(Policy = Policies.SuperAdmin)]
    public class AdminController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ICurrentUserContext _currentUser;

        public AdminController(IUserService userService, ICurrentUserContext currentUser)
        {
            _userService = userService;
            _currentUser = currentUser;
        }

        [HttpPost("create-account")]
        public async Task<IActionResult> CreateAccount(RegisterDto dto)
        {
            var userId = _currentUser.UserId ?? -1;

            var result = await _userService.CreateAccountAsync(dto, userId, UserRole.SuperAdmin);

            if (!result.IsSuccess)
                return BadRequest(result);

            return Ok(result);
        }
    }
}
