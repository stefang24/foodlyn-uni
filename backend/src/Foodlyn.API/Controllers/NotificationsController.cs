using Foodlyn.Modules.Notifications.Application.DTOs;
using Foodlyn.Modules.Notifications.Application.Services;
using Foodlyn.Shared.Application;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Foodlyn.API.Controllers
{
    [Route("api/notifications")]
    [ApiController]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _service;
        private readonly ICurrentUserContext _currentUser;

        public NotificationsController(INotificationService service, ICurrentUserContext currentUser)
        {
            _service = service;
            _currentUser = currentUser;
        }

        [HttpGet]
        public async Task<IActionResult> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var userId = _currentUser.UserId;
            if (userId is null or <= 0)
                return Unauthorized(Result<PagedResult<NotificationDto>>.Failure("Not signed in"));

            var result = await _service.GetPagedAsync(userId.Value, page, pageSize);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            var userId = _currentUser.UserId;
            if (userId is null or <= 0)
                return Ok(Result<int>.Success(0));

            var result = await _service.GetUnreadCountAsync(userId.Value);
            return Ok(result);
        }

        [HttpPost("{id:long}/read")]
        public async Task<IActionResult> MarkRead(long id)
        {
            var userId = _currentUser.UserId;
            if (userId is null or <= 0)
                return Unauthorized(Result<NotificationDto>.Failure("Not signed in"));

            var result = await _service.MarkReadAsync(id, userId.Value);
            return result.IsSuccess ? Ok(result) : NotFound(result);
        }

        [HttpPost("read-all")]
        public async Task<IActionResult> MarkAllRead()
        {
            var userId = _currentUser.UserId;
            if (userId is null or <= 0)
                return Unauthorized(Result<int>.Failure("Not signed in"));

            var result = await _service.MarkAllReadAsync(userId.Value);
            return Ok(result);
        }
    }
}
