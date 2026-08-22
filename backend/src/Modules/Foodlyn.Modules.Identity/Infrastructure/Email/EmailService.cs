using Foodlyn.Modules.Identity.Application.Services;
using Foodlyn.Shared.Configuration;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace Foodlyn.Modules.Identity.Infrastructure.Email
{
    public class EmailService : IEmailService
    {
        public async Task SendVerificationCodeAsync(string toEmail, string toName, string code)
        {
            var settings = ConfigProvider.Email;
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(settings.FromName, settings.FromEmail));
            message.To.Add(new MailboxAddress(toName, toEmail));
            message.Subject = "Verify your Foodlyn account";

            var body = new BodyBuilder
            {
                HtmlBody = BuildHtmlTemplate(toName, code),
                TextBody = $"Your Foodlyn verification code is: {code}\nThis code expires in 15 minutes."
            };

            message.Body = body.ToMessageBody();

            using (var client = new SmtpClient())
            {
                await client.ConnectAsync(settings.Host, settings.Port, SecureSocketOptions.StartTls);
                await client.AuthenticateAsync(settings.Username, settings.Password);
                await client.SendAsync(message);
                await client.DisconnectAsync(true);
            }
        }

        private static string BuildHtmlTemplate(string name, string code)
        {
            var greeting = string.IsNullOrWhiteSpace(name) ? "there" : name;
            return $@"<!DOCTYPE html>
            <html lang=""en"">
            <head>
              <meta charset=""UTF-8"">
              <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
              <title>Verify your Foodlyn account</title>
            </head>
            <body style=""margin:0;padding:0;background:#f4f1ee;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f1f1f;"">
              <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background:#f4f1ee;padding:40px 16px;"">
                <tr>
                  <td align=""center"">
                    <table role=""presentation"" width=""560"" cellpadding=""0"" cellspacing=""0"" style=""max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 18px 50px rgba(15,23,42,0.10);"">
                      <tr>
                        <td style=""background:linear-gradient(135deg,#7d0707 0%,#460404 100%);padding:36px 40px;text-align:center;color:#ffffff;"">
                          <div style=""font-size:13px;letter-spacing:4px;text-transform:uppercase;opacity:0.85;margin-bottom:8px;"">FOODLYN</div>
                          <h1 style=""margin:0;font-size:26px;font-weight:700;letter-spacing:0.3px;"">Verify your email</h1>
                        </td>
                      </tr>
                      <tr>
                        <td style=""padding:36px 40px 8px 40px;"">
                          <p style=""margin:0 0 14px 0;font-size:16px;line-height:1.55;"">Hi {greeting},</p>
                          <p style=""margin:0 0 22px 0;font-size:15px;line-height:1.6;color:#475569;"">
                            Thanks for joining Foodlyn! To finish creating your account, please enter the 6-digit code below on the verification page.
                          </p>
                          <div style=""text-align:center;margin:28px 0 12px 0;"">
                            <div style=""display:inline-block;background:#fff7f7;border:1px solid #f1d2d2;border-radius:14px;padding:18px 28px;"">
                              <div style=""font-size:12px;letter-spacing:3px;color:#7d0707;font-weight:600;margin-bottom:8px;text-transform:uppercase;"">Your code</div>
                              <div style=""font-size:38px;letter-spacing:14px;font-weight:700;color:#1f1f1f;font-family:'Courier New',monospace;"">{code}</div>
                            </div>
                          </div>
                          <p style=""margin:18px 0 0 0;font-size:13px;line-height:1.6;color:#64748b;text-align:center;"">
                            This code expires in <strong>15 minutes</strong>. If you didn't request this, you can safely ignore this email.
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style=""padding:24px 40px 36px 40px;"">
                          <hr style=""border:none;border-top:1px solid #eef2f7;margin:0 0 18px 0;"">
                          <p style=""margin:0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;"">
                            Sent by Foodlyn &middot; Please do not reply to this email.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>";
        }
    }
}
