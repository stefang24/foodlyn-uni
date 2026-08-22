using Foodlyn.Modules.Identity.Application.DTOs;
using Foodlyn.Modules.Identity.Application.Requests;
using Foodlyn.Modules.Identity.Application.Services;
using Foodlyn.Modules.Restaurants.Application.Services;
using Foodlyn.Shared.Application;
using Foodlyn.Shared.Constants;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Foodlyn.API.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IRestaurantTableService _tableService;
        private readonly ICurrentUserContext _currentUser;
        private readonly IUserService _userService;

        public AuthController(
            IAuthService authService,
            IRestaurantTableService tableService,
            ICurrentUserContext currentUser,
            IUserService userService)
        {
            _authService = authService;
            _tableService = tableService;
            _currentUser = currentUser;
            _userService = userService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var result = await _authService.LoginAsync(dto, Response);

            if (!result.IsSuccess)
                return Unauthorized(result);

            return Ok(result);
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh()
        {
            var refreshToken = Request.Cookies[AuthCookies.RefreshToken];

            if (string.IsNullOrEmpty(refreshToken))
                return Unauthorized(Result<AuthResponseDto>.Failure("No refresh token"));

            var result = await _authService.RefreshTokenAsync(refreshToken, Response);

            if (!result.IsSuccess)
                return Unauthorized(result);

            return Ok(result);
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            var refreshToken = Request.Cookies[AuthCookies.RefreshToken];
            var result = await _authService.LogoutAsync(refreshToken ?? "", Response);

            return Ok(result);
        }

        [HttpPost("register-customer")]
        public async Task<IActionResult> RegisterCustomer(RegisterCustomerDto dto)
        {
            var result = await _authService.RegisterCustomerAsync(dto);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpPost("verify-email")]
        public async Task<IActionResult> VerifyEmail(VerifyEmailDto dto)
        {
            var result = await _authService.VerifyEmailAsync(dto, Response);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpPost("resend-verification")]
        public async Task<IActionResult> ResendVerification(ResendVerificationDto dto)
        {
            var result = await _authService.ResendVerificationCodeAsync(dto);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpGet("verification-status")]
        public async Task<IActionResult> GetVerificationStatus([FromQuery] string email)
        {
            var result = await _authService.GetVerificationStatusAsync(email);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpPost("guest")]
        public async Task<IActionResult> GuestLogin([FromBody] GuestLoginRequest body)
        {
            if (body is null || body.QrToken == Guid.Empty)
                return BadRequest(Result<GuestSessionDto>.Failure("QR token is required"));

            var resolved = await _tableService.ResolveQrTokenAsync(body.QrToken);
            if (!resolved.IsSuccess)
                return BadRequest(Result<GuestSessionDto>.Failure(resolved.Error ?? "Invalid QR token"));

            var result = await _authService.IssueGuestSessionAsync(
                resolved.Value!.RestaurantId,
                resolved.Value.TableId,
                Response);

            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> Me()
        {
            var dto = new AuthResponseDto
            {
                UserId = _currentUser.UserId ?? -1,
                Email = _currentUser.Email ?? "",
                Username = _currentUser.Username ?? "",
                FullName = _currentUser.FullName ?? "",
                Role = _currentUser.Role ?? "",
                RestaurantId = _currentUser.RestaurantId
            };

            if (_currentUser.UserId is > 0)
            {
                var profile = await _userService.GetByIdAsync(_currentUser.UserId.Value);
                if (profile.IsSuccess && profile.Value is not null)
                    dto.ProfilePictureUrl = profile.Value.ProfilePictureUrl;
            }

            return Ok(Result<AuthResponseDto>.Success(dto));
        }
    }
}
