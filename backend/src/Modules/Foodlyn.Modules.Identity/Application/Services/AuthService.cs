using Foodlyn.Modules.Identity.Application.DTOs;
using Foodlyn.Modules.Identity.Application.Repositories;
using Foodlyn.Modules.Identity.Domain.Entities;
using Foodlyn.Modules.Identity.Domain.Enums;
using Foodlyn.Modules.Identity.Helpers;
using Foodlyn.Shared.Application;
using Foodlyn.Shared.Configuration;
using Foodlyn.Shared.Constants;
using Foodlyn.Shared.Helpers;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Security.Cryptography;

namespace Foodlyn.Modules.Identity.Application.Services
{
    public class AuthService : IAuthService
    {
        public const string EmailNotVerifiedError = "EMAIL_NOT_VERIFIED";

        private readonly IAuthRepository _authRepo;
        private readonly IEmailService _emailService;
        private readonly ILogger<AuthService> _logger;
        private readonly IHostEnvironment _env;

        public AuthService(
            IAuthRepository userRepo,
            IEmailService emailService,
            ILogger<AuthService> logger,
            IHostEnvironment env)
        {
            _authRepo = userRepo;
            _emailService = emailService;
            _logger = logger;
            _env = env;
        }

        private bool CookieSecure => !_env.IsDevelopment();
        private SameSiteMode CookieSameSite => _env.IsDevelopment() ? SameSiteMode.Lax : SameSiteMode.Strict;

        public async Task<Result<AuthResponseDto>> LoginAsync(LoginDto dto, HttpResponse response)
        {
            User? user = null;

            if(!string.IsNullOrWhiteSpace(dto.Email))
                user = await _authRepo.GetByEmailAsync(dto.Email);

            if (user == null && !string.IsNullOrWhiteSpace(dto.Username))
                user = await _authRepo.GetByUsernameAsync(dto.Username);

            if (user == null)
                return Result<AuthResponseDto>.Failure("Wrong email/username or password");

            if (!PasswordHelper.VerifyPassword(dto.Password, user.PasswordHash))
                return Result<AuthResponseDto>.Failure("Wrong email/username or password");

            if (!user.IsActive)
                return Result<AuthResponseDto>.Failure("Account is deactivated, please contact admin");

            if (user.Role == UserRole.User && !user.IsEmailVerified)
                return Result<AuthResponseDto>.Failure($"{EmailNotVerifiedError}|{user.Email}");

            user.LastLoginAt = DateTime.UtcNow;

            return await UpdateRefreshTokenAndGenerateResponseAsync(user, response);
        }

        public async Task<Result<AuthResponseDto>> RefreshTokenAsync(string refreshToken, HttpResponse response)
        {
            var storedToken = await _authRepo.GetRefreshTokenAsync(refreshToken);
            if (storedToken == null)
                return Result<AuthResponseDto>.Failure("Invalid refresh token");

            if (!storedToken.IsActive)
                return Result<AuthResponseDto>.Failure("Token has expired or been revoked");

            storedToken.IsRevoked = true;
            storedToken.RevokedAt = DateTime.UtcNow;

            var user = storedToken.User;
            var newRefreshToken = JwtHelper.GenerateRefreshToken();
            storedToken.ReplacedByToken = newRefreshToken;

            return await UpdateRefreshTokenAndGenerateResponseAsync(user, response, newRefreshToken);
        }

        public async Task<Result<RegisterCustomerResponseDto>> RegisterCustomerAsync(RegisterCustomerDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Username))
                return Result<RegisterCustomerResponseDto>.Failure("Email and username are required");

            if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 6)
                return Result<RegisterCustomerResponseDto>.Failure("Password must be at least 6 characters");

            if (dto.Password != dto.ConfirmPassword)
                return Result<RegisterCustomerResponseDto>.Failure("Passwords do not match");

            var email = dto.Email.Trim().ToLower();
            var username = dto.Username.Trim();

            if (await _authRepo.EmailExistsAsync(email))
                return Result<RegisterCustomerResponseDto>.Failure("Email is already registered");

            if (await _authRepo.UsernameExistsAsync(username))
                return Result<RegisterCustomerResponseDto>.Failure("Username is already taken");

            var code = GenerateVerificationCode();
            var user = new User
            {
                FirstName = dto.FirstName?.Trim(),
                LastName = dto.LastName?.Trim(),
                Email = email,
                Username = username,
                PasswordHash = PasswordHelper.HashPassword(dto.Password),
                Role = UserRole.User,
                RestaurantId = null,
                IsActive = true,
                IsEmailVerified = false,
                EmailVerificationCodeHash = PasswordHelper.HashPassword(code),
                EmailVerificationCodeExpiresAt = DateTime.UtcNow.AddMinutes(ConfigProvider.Email.VerificationCodeExpiryMinutes),
                LastVerificationCodeSentAt = DateTime.UtcNow,
            };

            await _authRepo.AddUserAndSaveAsync(user);

            try
            {
                await _emailService.SendVerificationCodeAsync(user.Email, user.FullName ?? user.Username, code);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send verification email to {Email}", user.Email);
                throw new AppException(
                    "Account created but the verification email could not be sent. Please try resending the code.",
                    ex,
                    statusCode: 502);
            }

            return Result<RegisterCustomerResponseDto>.Success(new RegisterCustomerResponseDto
            {
                Email = user.Email,
                RequiresVerification = true,
            });
        }

        public async Task<Result<AuthResponseDto>> VerifyEmailAsync(VerifyEmailDto dto, HttpResponse response)
        {
            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Code))
                return Result<AuthResponseDto>.Failure("Email and code are required");

            var email = dto.Email.Trim().ToLower();
            var user = await _authRepo.GetByEmailAsync(email);

            if (user == null)
                return Result<AuthResponseDto>.Failure("Invalid email");

            if (user.IsEmailVerified)
                return Result<AuthResponseDto>.Failure("Email is already verified");

            if (string.IsNullOrEmpty(user.EmailVerificationCodeHash) || user.EmailVerificationCodeExpiresAt == null)
                return Result<AuthResponseDto>.Failure("No verification code found, please request a new one");

            if (user.EmailVerificationCodeExpiresAt < DateTime.UtcNow)
                return Result<AuthResponseDto>.Failure("Verification code has expired, please request a new one");

            if (!PasswordHelper.VerifyPassword(dto.Code.Trim(), user.EmailVerificationCodeHash))
                return Result<AuthResponseDto>.Failure("Invalid code");

            user.IsEmailVerified = true;
            user.EmailVerificationCodeHash = null;
            user.EmailVerificationCodeExpiresAt = null;
            user.LastLoginAt = DateTime.UtcNow;

            return await UpdateRefreshTokenAndGenerateResponseAsync(user, response);
        }

        public async Task<Result<string>> ResendVerificationCodeAsync(ResendVerificationDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email))
                return Result<string>.Failure("Email is required");

            var email = dto.Email.Trim().ToLower();
            var user = await _authRepo.GetByEmailAsync(email);

            if (user == null)
                return Result<string>.Failure("No account found for this email");

            if (user.IsEmailVerified)
                return Result<string>.Failure("Email is already verified");

            if (user.LastVerificationCodeSentAt.HasValue)
            {
                var elapsed = DateTime.UtcNow - user.LastVerificationCodeSentAt.Value;
                if (elapsed.TotalSeconds < ConfigProvider.Email.ResendCooldownSeconds)
                {
                    var remaining = ConfigProvider.Email.ResendCooldownSeconds - (int)elapsed.TotalSeconds;
                    return Result<string>.Failure($"Please wait {remaining}s before requesting another code");
                }
            }

            var code = GenerateVerificationCode();
            user.EmailVerificationCodeHash = PasswordHelper.HashPassword(code);
            user.EmailVerificationCodeExpiresAt = DateTime.UtcNow.AddMinutes(ConfigProvider.Email.VerificationCodeExpiryMinutes);
            user.LastVerificationCodeSentAt = DateTime.UtcNow;
            await _authRepo.SaveChangesAsync();

            try
            {
                await _emailService.SendVerificationCodeAsync(user.Email, user.FullName ?? user.Username, code);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to resend verification email to {Email}", user.Email);
                throw new AppException(
                        "Email could not be sent. Please try resending the code.",
                        ex,
                        statusCode: 502);
            }

            return Result<string>.Success("Verification code sent");
        }

        public async Task<Result<VerificationStatusDto>> GetVerificationStatusAsync(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return Result<VerificationStatusDto>.Failure("Email is required");

            var user = await _authRepo.GetByEmailAsync(email.Trim().ToLower());
            if (user == null)
                return Result<VerificationStatusDto>.Failure("No account found for this email");

            if (user.IsEmailVerified)
                return Result<VerificationStatusDto>.Success(new VerificationStatusDto
                {
                    IsVerified = true,
                    CooldownRemainingSeconds = 0,
                });

            var remaining = 0;
            if (user.LastVerificationCodeSentAt.HasValue)
            {
                var elapsed = DateTime.UtcNow - user.LastVerificationCodeSentAt.Value;
                if (elapsed.TotalSeconds < ConfigProvider.Email.ResendCooldownSeconds)
                    remaining = ConfigProvider.Email.ResendCooldownSeconds - (int)elapsed.TotalSeconds;
            }

            return Result<VerificationStatusDto>.Success(new VerificationStatusDto
            {
                IsVerified = false,
                CooldownRemainingSeconds = remaining,
            });
        }

        private static string GenerateVerificationCode()
        {
            var value = RandomNumberGenerator.GetInt32(0, 1_000_000);
            return value.ToString("D6");
        }

        public Task<Result<GuestSessionDto>> IssueGuestSessionAsync(long restaurantId, long tableId, HttpResponse response)
        {
            var sessionId = Guid.NewGuid().ToString("N");
            var minutes = GetGuestTokenMinutes();

            var token = JwtHelper.GenerateGuestToken(
                restaurantId,
                tableId,
                sessionId,
                ConfigProvider.Jwt.Secret,
                ConfigProvider.Jwt.Issuer,
                ConfigProvider.Jwt.Audience,
                minutes
            );

            response.Cookies.Append(AuthCookies.AccessToken, token, new CookieOptions
            {
                HttpOnly = true,
                Secure = CookieSecure,
                SameSite = CookieSameSite,
                Expires = DateTimeOffset.UtcNow.AddMinutes(minutes)
            });

            return Task.FromResult(Result<GuestSessionDto>.Success(new GuestSessionDto
            {
                RestaurantId = restaurantId,
                TableId = tableId,
                SessionId = sessionId,
                Role = Roles.Guest,
            }));
        }

        public async Task<Result<LogoutResponseDto>> LogoutAsync(string refreshToken, HttpResponse response)
        {
            var storedToken = await _authRepo.GetRefreshTokenAsync(refreshToken);
            if (storedToken != null && storedToken.IsActive)
            {
                storedToken.IsRevoked = true;
                storedToken.RevokedAt = DateTime.UtcNow;
                await _authRepo.SaveChangesAsync();
            }

            response.Cookies.Delete(AuthCookies.AccessToken);
            response.Cookies.Delete(AuthCookies.RefreshToken);

            return Result<LogoutResponseDto>.Success(new LogoutResponseDto
            {
                Message = "You have been successfully logged out"
            });
        }

        private async Task<Result<AuthResponseDto>> UpdateRefreshTokenAndGenerateResponseAsync(User user, HttpResponse response, string? newToken = null)
        {
            var accessToken = GenerateAccessToken(user);
            var refreshToken = newToken ?? JwtHelper.GenerateRefreshToken();

            var refreshTokenEntity = new RefreshToken
            {
                UserId = user.Id,
                Token = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddDays(GetRefreshTokenDays())
            };

            await _authRepo.AddRefreshTokenAsync(refreshTokenEntity);
            await _authRepo.SaveChangesAsync();

            SetAccessTokenCookie(response, accessToken);
            SetRefreshTokenCookie(response, refreshToken);

            return Result<AuthResponseDto>.Success(new AuthResponseDto
            {
                UserId = user.Id,
                Email = user.Email,
                Username = user.Username,
                FullName = user.FullName ?? "",
                Role = user.Role.ToString(),
                RestaurantId = user.RestaurantId,
                ProfilePictureUrl = user.ProfilePictureUrl,
            });
        }

        private string GenerateAccessToken(User user)
        {
            return JwtHelper.GenerateAccessToken(
                user,
                ConfigProvider.Jwt.Secret,
                ConfigProvider.Jwt.Issuer,
                ConfigProvider.Jwt.Audience,
                GetAccessTokenMinutes()
            );
        }

        private void SetAccessTokenCookie(HttpResponse response, string token)
        {
            response.Cookies.Append(AuthCookies.AccessToken, token, new CookieOptions
            {
                HttpOnly = true,
                Secure = CookieSecure,
                SameSite = CookieSameSite,
                Expires = DateTimeOffset.UtcNow.AddMinutes(GetAccessTokenMinutes())
            });
        }

        private void SetRefreshTokenCookie(HttpResponse response, string token)
        {
            response.Cookies.Append(AuthCookies.RefreshToken, token, new CookieOptions
            {
                HttpOnly = true,
                Secure = CookieSecure,
                SameSite = CookieSameSite,
                Path = AuthCookies.RefreshTokenPath,
                Expires = DateTimeOffset.UtcNow.AddDays(GetRefreshTokenDays())
            });
        }

        private static long GetAccessTokenMinutes() => ConfigProvider.Jwt.AccessTokenMinutes;
        private static long GetRefreshTokenDays() => ConfigProvider.Jwt.RefreshTokenDays;
        private static long GetGuestTokenMinutes() => ConfigProvider.Jwt.GuestTokenMinutes;
    }
}
