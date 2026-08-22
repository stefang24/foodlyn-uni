using Foodlyn.Modules.Identity.Application.DTOs;
using Foodlyn.Shared.Application;
using Microsoft.AspNetCore.Http;

namespace Foodlyn.Modules.Identity.Application.Services
{
    public interface IAuthService
    {
        Task<Result<AuthResponseDto>> LoginAsync(LoginDto dto, HttpResponse response);
        Task<Result<AuthResponseDto>> RefreshTokenAsync(string refreshToken, HttpResponse response);
        Task<Result<LogoutResponseDto>> LogoutAsync(string refreshToken, HttpResponse response);
        Task<Result<RegisterCustomerResponseDto>> RegisterCustomerAsync(RegisterCustomerDto dto);
        Task<Result<AuthResponseDto>> VerifyEmailAsync(VerifyEmailDto dto, HttpResponse response);
        Task<Result<string>> ResendVerificationCodeAsync(ResendVerificationDto dto);
        Task<Result<VerificationStatusDto>> GetVerificationStatusAsync(string email);
        Task<Result<GuestSessionDto>> IssueGuestSessionAsync(long restaurantId, long tableId, HttpResponse response);
    }
}
