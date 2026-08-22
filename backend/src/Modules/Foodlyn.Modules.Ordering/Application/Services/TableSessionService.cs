using Foodlyn.Modules.Ordering.Application.DTOs;
using Foodlyn.Modules.Ordering.Application.Repositories;
using Foodlyn.Modules.Ordering.Domain.Entities;
using Foodlyn.Shared.Application;
using Mapster;

namespace Foodlyn.Modules.Ordering.Application.Services
{
    public class TableSessionService : ITableSessionService
    {
        private readonly ITableSessionRepository _repo;
        private readonly ITableSessionNotifier? _notifier;

        public TableSessionService(ITableSessionRepository repo, ITableSessionNotifier? notifier = null)
        {
            _repo = repo;
            _notifier = notifier;
        }

        public Task<TableSession?> GetOpenForTableAsync(long tableId)
            => _repo.GetOpenByTableAsync(tableId);

        public async Task<long?> GetOpenTableIdForUserAsync(long userId)
        {
            var session = await _repo.GetOpenByOwnerUserAsync(userId);
            return session?.TableId;
        }

        public async Task<Result<TableSessionDto>> GetWithCartAsync(long sessionId)
        {
            var s = await _repo.GetByIdWithCartAsync(sessionId);
            if (s is null) return Result<TableSessionDto>.Failure("Session not found");
            return Result<TableSessionDto>.Success(s.Adapt<TableSessionDto>());
        }

        public async Task<Result<TableSessionDto>> CreateAsync(CreateSessionInput input)
        {
            var session = new TableSession
            {
                RestaurantId = input.RestaurantId,
                TableId = input.TableId,
                TableNumber = input.TableNumber,
                TableLabel = input.TableLabel,
                PartySize = input.PartySize <= 0 ? 1 : input.PartySize,
                OwnerKind = input.OwnerKind,
                OwnerUserId = input.OwnerUserId,
                Status = TableSessionStatus.Open,
                OpenedAt = DateTime.UtcNow,
            };
            await _repo.AddAsync(session);
            await _repo.SaveChangesAsync();
            return Result<TableSessionDto>.Success(session.Adapt<TableSessionDto>());
        }

        public async Task<Result<TableSessionDto>> CloseAsync(long sessionId)
        {
            var s = await _repo.GetByIdWithCartAsync(sessionId);
            if (s is null) return Result<TableSessionDto>.Failure("Session not found");
            if (s.Status == TableSessionStatus.Closed)
                return Result<TableSessionDto>.Success(s.Adapt<TableSessionDto>());

            s.Status = TableSessionStatus.Closed;
            s.ClosedAt = DateTime.UtcNow;
            await _repo.SaveChangesAsync();
            if (_notifier is not null)
                await _notifier.SessionClosedAsync(s.Id, s.RestaurantId);
            return Result<TableSessionDto>.Success(s.Adapt<TableSessionDto>());
        }

        public async Task<Result<TableSessionDto>> AddOrIncreaseCartLineAsync(long sessionId, ResolvedCartLineInput input)
        {
            var session = await _repo.GetByIdWithCartAsync(sessionId);
            if (session is null) return Result<TableSessionDto>.Failure("Session not found");
            if (session.Status != TableSessionStatus.Open)
                return Result<TableSessionDto>.Failure("Session is closed");

            var existing = await _repo.GetCartLineAsync(sessionId, input.LineKey);
            if (existing is not null)
            {
                existing.Quantity += Math.Max(1, input.Quantity);
            }
            else
            {
                var line = new TableSessionCartLine
                {
                    TableSessionId = sessionId,
                    LineKey = input.LineKey,
                    MenuItemId = input.MenuItemId,
                    Name = input.Name,
                    UnitPrice = input.UnitPrice,
                    Quantity = Math.Max(1, input.Quantity),
                    Notes = input.Notes,
                    ImageUrl = input.ImageUrl,
                    AddedByLabel = input.AddedByLabel,
                    AddedByUserId = input.AddedByUserId,
                    AddedBySessionId = input.AddedBySessionId,
                    Modifiers = input.Modifiers.Select(m => new TableSessionCartLineModifier
                    {
                        MenuItemModifierId = m.MenuItemModifierId,
                        GroupName = m.GroupName,
                        Name = m.Name,
                        Price = m.Price,
                    }).ToList(),
                };
                await _repo.AddCartLineAsync(line);
            }

            await _repo.SaveChangesAsync();
            return await ReturnUpdatedAsync(sessionId);
        }

        public async Task<Result<TableSessionDto>> SetCartLineQuantityAsync(long sessionId, long lineId, int quantity)
        {
            var session = await _repo.GetByIdWithCartAsync(sessionId);
            if (session is null) return Result<TableSessionDto>.Failure("Session not found");
            if (session.Status != TableSessionStatus.Open)
                return Result<TableSessionDto>.Failure("Session is closed");

            var line = await _repo.GetCartLineByIdAsync(sessionId, lineId);
            if (line is null) return Result<TableSessionDto>.Failure("Cart line not found");

            if (quantity <= 0)
            {
                _repo.RemoveCartLine(line);
            }
            else
            {
                line.Quantity = quantity;
            }

            await _repo.SaveChangesAsync();
            return await ReturnUpdatedAsync(sessionId);
        }

        public async Task<Result<TableSessionDto>> RemoveCartLineAsync(long sessionId, long lineId)
        {
            var session = await _repo.GetByIdWithCartAsync(sessionId);
            if (session is null) return Result<TableSessionDto>.Failure("Session not found");

            var line = await _repo.GetCartLineByIdAsync(sessionId, lineId);
            if (line is null) return Result<TableSessionDto>.Failure("Cart line not found");

            _repo.RemoveCartLine(line);
            await _repo.SaveChangesAsync();
            return await ReturnUpdatedAsync(sessionId);
        }

        public async Task<Result<TableSessionDto>> ClearCartAsync(long sessionId)
        {
            var session = await _repo.GetByIdWithCartAsync(sessionId);
            if (session is null) return Result<TableSessionDto>.Failure("Session not found");

            foreach (var line in session.CartLines.ToList())
            {
                _repo.RemoveCartLine(line);
            }
            await _repo.SaveChangesAsync();
            return await ReturnUpdatedAsync(sessionId);
        }

        private async Task<Result<TableSessionDto>> ReturnUpdatedAsync(long sessionId)
        {
            var fresh = await _repo.GetByIdWithCartAsync(sessionId);
            if (fresh is null) return Result<TableSessionDto>.Failure("Session not found");
            var dto = fresh.Adapt<TableSessionDto>();
            if (_notifier is not null)
                await _notifier.SessionCartUpdatedAsync(dto);
            return Result<TableSessionDto>.Success(dto);
        }
    }

    public interface ITableSessionNotifier
    {
        Task SessionCartUpdatedAsync(TableSessionDto session);
        Task SessionClosedAsync(long sessionId, long restaurantId);
    }
}
