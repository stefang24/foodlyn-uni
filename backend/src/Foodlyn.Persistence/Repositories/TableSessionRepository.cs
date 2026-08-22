using Foodlyn.Modules.Ordering.Application.Repositories;
using Foodlyn.Modules.Ordering.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Foodlyn.Persistence.Repositories
{
    public class TableSessionRepository : ITableSessionRepository
    {
        private readonly AppDbContext _db;

        public TableSessionRepository(AppDbContext db) => _db = db;

        public Task<TableSession?> GetByIdWithCartAsync(long id)
            => _db.TableSessions
                .Include(s => s.CartLines).ThenInclude(l => l.Modifiers)
                .FirstOrDefaultAsync(s => s.Id == id);

        public Task<TableSession?> GetOpenByTableAsync(long tableId)
            => _db.TableSessions
                .Include(s => s.CartLines).ThenInclude(l => l.Modifiers)
                .FirstOrDefaultAsync(s => s.TableId == tableId && s.Status == TableSessionStatus.Open);

        public Task<TableSession?> GetOpenByOwnerUserAsync(long userId)
            => _db.TableSessions
                .FirstOrDefaultAsync(s => s.OwnerUserId == userId && s.Status == TableSessionStatus.Open);

        public Task<TableSessionCartLine?> GetCartLineAsync(long sessionId, string lineKey)
            => _db.TableSessionCartLines
                .Include(l => l.Modifiers)
                .FirstOrDefaultAsync(l => l.TableSessionId == sessionId && l.LineKey == lineKey);

        public Task<TableSessionCartLine?> GetCartLineByIdAsync(long sessionId, long lineId)
            => _db.TableSessionCartLines
                .Include(l => l.Modifiers)
                .FirstOrDefaultAsync(l => l.TableSessionId == sessionId && l.Id == lineId);

        public async Task AddAsync(TableSession session)
        {
            await _db.TableSessions.AddAsync(session);
        }

        public async Task AddCartLineAsync(TableSessionCartLine line)
        {
            await _db.TableSessionCartLines.AddAsync(line);
        }

        public void RemoveCartLine(TableSessionCartLine line)
        {
            _db.TableSessionCartLines.Remove(line);
        }

        public Task SaveChangesAsync() => _db.SaveChangesAsync();
    }
}
