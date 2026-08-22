using Foodlyn.Modules.Identity.Application.Services;
using Foodlyn.Modules.Identity.Infrastructure.Email;
using Foodlyn.Shared.Configuration;
using Foodlyn.Shared.Constants;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace Foodlyn.Modules.Identity
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddIdentityModule(this IServiceCollection services)
        {
            services.AddScoped<IEmailService, EmailService>();

            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IAdminService, AdminService>();
            services.AddScoped<IUserService, UserService>();

            services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));

            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = ConfigProvider.Jwt.Issuer,
                    ValidAudience = ConfigProvider.Jwt.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(ConfigProvider.Jwt.Secret)),
                    ClockSkew = TimeSpan.Zero
                };

                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var token = context.Request.Cookies[AuthCookies.AccessToken];
                        if (!string.IsNullOrEmpty(token))
                        {
                            context.Token = token;
                        }
                        return Task.CompletedTask;
                    }
                };
            });

            services.AddAuthorization(options =>
            {
                options.AddPolicy(Policies.SuperAdmin, policy =>
                    policy.RequireRole(Roles.SuperAdmin));
                options.AddPolicy(Policies.Manager, policy =>
                    policy.RequireRole(Roles.Manager, Roles.SuperAdmin));
                options.AddPolicy(Policies.Cook, policy =>
                    policy.RequireRole(Roles.Cook, Roles.Manager, Roles.SuperAdmin));
                options.AddPolicy(Policies.Waiter, policy =>
                    policy.RequireRole(Roles.Waiter, Roles.Manager, Roles.SuperAdmin));
                options.AddPolicy(Policies.Cashier, policy =>
                    policy.RequireRole(Roles.Cashier, Roles.Manager, Roles.SuperAdmin));
                options.AddPolicy(Policies.StatusDisplay, policy =>
                    policy.RequireRole(Roles.StatusDisplay, Roles.Manager, Roles.SuperAdmin));
                options.AddPolicy(Policies.Customer, policy =>
                    policy.RequireRole(Roles.User, Roles.Guest));
            });

            return services;
        }
    }
}
