namespace Foodlyn.Modules.Identity.Application.Services
{
    public interface IEmailService
    {
        Task SendVerificationCodeAsync(string toEmail, string toName, string code);
    }
}
