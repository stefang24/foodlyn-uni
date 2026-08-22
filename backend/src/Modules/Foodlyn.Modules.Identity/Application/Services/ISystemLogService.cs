using Foodlyn.Shared.Application;
using Foodlyn.Shared.Domain;

namespace Foodlyn.Modules.Identity.Application.Services
{
    public interface ISystemLogService
    {
        Task LogAsync(SystemLog log);
        Task<PagedResult<SystemLog>> GetPagedAsync(SystemLogQuery query);
        Task<SystemLog?> GetByIdAsync(long id);
    }
}
