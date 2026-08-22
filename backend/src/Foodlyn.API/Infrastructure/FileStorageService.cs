using Foodlyn.Shared.Application;

namespace Foodlyn.API.Infrastructure
{
    public class FileStorageService : IFileStorageService
    {
        private static readonly string[] AllowedExtensions =
        {
            ".jpg", ".jpeg", ".png", ".webp", ".gif",
        };
        private const long MaxBytes = 5 * 1024 * 1024;
        private const string BaseFolder = "uploads";

        private readonly IWebHostEnvironment _env;
        private readonly ILogger<FileStorageService> _logger;

        public FileStorageService(IWebHostEnvironment env, ILogger<FileStorageService> logger)
        {
            _env = env;
            _logger = logger;
        }

        public async Task<Result<string>> SaveImageAsync(IFormFile file, string subfolder)
        {
            if (file is null || file.Length == 0)
                return Result<string>.Failure("File is empty");

            if (file.Length > MaxBytes)
                return Result<string>.Failure($"File exceeds {MaxBytes / 1024 / 1024} MB limit");

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (string.IsNullOrEmpty(ext) || Array.IndexOf(AllowedExtensions, ext) < 0)
                return Result<string>.Failure(
                    $"Unsupported file type. Allowed: {string.Join(", ", AllowedExtensions)}");

            var safeSubfolder = SanitizeSubfolder(subfolder);
            var folderRelative = Path.Combine(BaseFolder, safeSubfolder).Replace('\\', '/');
            var folderAbsolute = Path.Combine(GetWebRoot(), folderRelative);
            Directory.CreateDirectory(folderAbsolute);

            var fileName = $"{Guid.NewGuid():N}{ext}";
            var absolutePath = Path.Combine(folderAbsolute, fileName);

            try
            {
                await using var stream = new FileStream(absolutePath, FileMode.Create);
                await file.CopyToAsync(stream);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to save uploaded file {Name}", file.FileName);
                return Result<string>.Failure("Could not save file");
            }

            var publicPath = "/" + folderRelative + "/" + fileName;
            return Result<string>.Success(publicPath);
        }

        public bool DeleteFile(string? relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath)) return false;
            if (!relativePath.StartsWith($"/{BaseFolder}/", StringComparison.OrdinalIgnoreCase))
                return false;

            try
            {
                var trimmed = relativePath.TrimStart('/');
                var fullPath = Path.Combine(GetWebRoot(), trimmed.Replace('/', Path.DirectorySeparatorChar));
                if (File.Exists(fullPath))
                {
                    File.Delete(fullPath);
                    return true;
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not delete file {Path}", relativePath);
            }

            return false;
        }

        private string GetWebRoot()
        {
            var root = _env.WebRootPath;
            if (string.IsNullOrEmpty(root))
            {
                root = Path.Combine(_env.ContentRootPath, "wwwroot");
                Directory.CreateDirectory(root);
            }
            return root;
        }

        private static string SanitizeSubfolder(string subfolder)
        {
            if (string.IsNullOrWhiteSpace(subfolder)) return "misc";
            var parts = subfolder
                .Replace('\\', '/')
                .Split('/', StringSplitOptions.RemoveEmptyEntries)
                .Select(p => string.Concat(p.Where(c =>
                    char.IsLetterOrDigit(c) || c == '-' || c == '_')))
                .Where(p => p.Length > 0);
            var joined = string.Join('/', parts);
            return string.IsNullOrEmpty(joined) ? "misc" : joined;
        }
    }
}
