using Foodlyn.Modules.Identity.Application.Services;
using Foodlyn.Shared.Application;
using Foodlyn.Shared.Constants;
using Foodlyn.Shared.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Foodlyn.API.Controllers
{
    public class ClientLogDto
    {
        public string Message { get; set; } = string.Empty;
        public string? Level { get; set; }
        public string? Stack { get; set; }
        public string? Url { get; set; }
        public int? StatusCode { get; set; }
        public string? Method { get; set; }
    }

    [Route("api/admin/logs")]
    [ApiController]
    [Authorize(Policy = Policies.SuperAdmin)]
    public class LogsController : ControllerBase
    {
        private readonly ISystemLogService _logService;

        public LogsController(ISystemLogService logService)
        {
            _logService = logService;
        }

        [HttpGet("paged")]
        public async Task<IActionResult> GetPaged([FromQuery] SystemLogQuery query)
        {
            var result = await _logService.GetPagedAsync(query);
            return Ok(Result<PagedResult<SystemLog>>.Success(result));
        }

        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetById(long id)
        {
            var log = await _logService.GetByIdAsync(id);
            if (log is null) return NotFound(Result<string>.Failure("Log not found"));
            return Ok(Result<SystemLog>.Success(log));
        }
    }

    [Route("api/logs")]
    [ApiController]
    public class ClientLogsController : ControllerBase
    {
        private readonly ISystemLogService _logService;

        public ClientLogsController(ISystemLogService logService)
        {
            _logService = logService;
        }

        [HttpPost("client")]
        [AllowAnonymous]
        public async Task<IActionResult> LogClient([FromBody] ClientLogDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Message))
                return BadRequest(Result<string>.Failure("Message is required"));

            var level = dto.Level switch
            {
                "Warning" => "Warning",
                "Info" => "Info",
                _ => "Error",
            };

            var entry = new SystemLog
            {
                Level = level,
                StatusCode = dto.StatusCode,
                Message = Truncate(dto.Message, 4000),
                StackTrace = Truncate(dto.Stack, 8000),
                Path = Truncate(dto.Url, 500),
                Method = Truncate(dto.Method, 10),
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                UserAgent = HttpContext.Request.Headers["User-Agent"].ToString(),
                Source = "Client",
                CreatedAt = DateTime.UtcNow,
            };

            var user = HttpContext.User;
            if (user?.Identity?.IsAuthenticated == true)
            {
                entry.UserId = user.GetUserId();
                entry.Username = user.GetFullName() ?? user.GetUsername();
                entry.UserRole = user.GetRole();
                entry.RestaurantId = user.GetRestaurantId();
            }

            await _logService.LogAsync(entry);
            return Ok(Result<string>.Success("Logged"));
        }

        private static string? Truncate(string? value, int max)
        {
            if (string.IsNullOrEmpty(value)) return value;
            return value.Length <= max ? value : value.Substring(0, max);
        }
    }
}
