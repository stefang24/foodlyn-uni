using Foodlyn.Modules.Ordering.Domain.Entities;

namespace Foodlyn.Modules.Ordering.Application.Repositories
{
    public interface ITableSessionRepository
    {
        Task<TableSession?> GetByIdWithCartAsync(long id);
        Task<TableSession?> GetOpenByTableAsync(long tableId);
        Task<TableSession?> GetOpenByOwnerUserAsync(long userId);
        Task<TableSessionCartLine?> GetCartLineAsync(long sessionId, string lineKey);
        Task<TableSessionCartLine?> GetCartLineByIdAsync(long sessionId, long lineId);
        Task AddAsync(TableSession session);
        Task AddCartLineAsync(TableSessionCartLine line);
        void RemoveCartLine(TableSessionCartLine line);
        Task SaveChangesAsync();
    }
}
