using Microsoft.AspNetCore.Http;

namespace Foodlyn.Shared.Application
{
    public interface IFileStorageService
    {
        Task<Result<string>> SaveImageAsync(IFormFile file, string subfolder);
        bool DeleteFile(string? relativePath);
    }
}
