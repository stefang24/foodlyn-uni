namespace Foodlyn.Modules.Identity.Application.DTOs
{
    public class VerifyEmailDto
    {
        public string Email { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
    }

    public class ResendVerificationDto
    {
        public string Email { get; set; } = string.Empty;
    }

    public class RegisterCustomerResponseDto
    {
        public string Email { get; set; } = string.Empty;
        public bool RequiresVerification { get; set; } = true;
    }

    public class VerificationStatusDto
    {
        public bool IsVerified { get; set; }
        public int CooldownRemainingSeconds { get; set; }
    }
}
