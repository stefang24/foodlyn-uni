using Foodlyn.Modules.Identity.Application.Services;
using Foodlyn.Shared.Application;
using Foodlyn.Shared.Domain;
using Foodlyn.Shared.Helpers;

namespace Foodlyn.API.Middleware
{
    public class GlobalErrorHandlerMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalErrorHandlerMiddleware> _logger;
        private readonly ISystemLogService _logService;

        public GlobalErrorHandlerMiddleware(
            RequestDelegate next,
            ILogger<GlobalErrorHandlerMiddleware> logger,
            ISystemLogService logService)
        {
            _next = next;
            _logger = logger;
            _logService = logService;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception at {Path}", context.Request.Path);

            var (statusCode, userMessage, isAppException) = ex is AppException appEx
                ? (appEx.StatusCode, appEx.UserMessage, true)
                : (StatusCodes.Status500InternalServerError,
                   "An unexpected error occurred. Please try again.",
                   false);

            var entry = new SystemLog
            {
                Level = isAppException ? "Warning" : "Error",
                StatusCode = statusCode,
                Message = ex.Message,
                ExceptionType = ex.GetType().FullName,
                StackTrace = ex.ToString(),
                Path = context.Request.Path.Value,
                Method = context.Request.Method,
                QueryString = context.Request.QueryString.HasValue
                    ? context.Request.QueryString.Value
                    : null,
                IpAddress = context.Connection.RemoteIpAddress?.ToString(),
                UserAgent = context.Request.Headers["User-Agent"].ToString(),
                Source = "Server",
                CreatedAt = DateTime.UtcNow,
            };

            var user = context.User;
            if (user?.Identity?.IsAuthenticated == true)
            {
                entry.UserId = user.GetUserId();
                entry.Username = user.GetFullName() ?? user.GetUsername();
                entry.UserRole = user.GetRole();
                entry.RestaurantId = user.GetRestaurantId();
            }

            await _logService.LogAsync(entry);

            if (context.Response.HasStarted) return;

            context.Response.Clear();
            context.Response.StatusCode = statusCode;
            context.Response.ContentType = "application/json";

            var payload = new
            {
                isSuccess = false,
                error = userMessage,
                logId = entry.Id > 0 ? entry.Id : (long?)null,
            };
            await context.Response.WriteAsync(JsonHelper.Serialize(payload));
        }
    }

    public static class GlobalErrorHandlerExtensions
    {
        public static IApplicationBuilder UseGlobalErrorHandler(this IApplicationBuilder app)
            => app.UseMiddleware<GlobalErrorHandlerMiddleware>();
    }
}
