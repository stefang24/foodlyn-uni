using Foodlyn.Shared.Application;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Foodlyn.API.Controllers
{
    [Route("api/files")]
    [ApiController]
    [Authorize]
    public class FilesController : ControllerBase
    {
        private readonly IFileStorageService _storage;

        public FilesController(IFileStorageService storage)
        {
            _storage = storage;
        }

        [HttpPost("upload")]
        [RequestSizeLimit(10 * 1024 * 1024)]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Upload(IFormFile file, [FromQuery] string folder = "misc")
        {
            var result = await _storage.SaveImageAsync(file, folder);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
    }
}
