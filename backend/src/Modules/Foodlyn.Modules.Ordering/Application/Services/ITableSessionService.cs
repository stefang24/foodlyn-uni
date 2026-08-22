using Foodlyn.Modules.Ordering.Application.DTOs;
using Foodlyn.Modules.Ordering.Domain.Entities;
using Foodlyn.Shared.Application;

namespace Foodlyn.Modules.Ordering.Application.Services
{
    public class ResolvedCartLineInput
    {
        public string LineKey { get; set; } = string.Empty;
        public long MenuItemId { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; }
        public string? Notes { get; set; }
        public string? ImageUrl { get; set; }
        public string? AddedByLabel { get; set; }
        public long? AddedByUserId { get; set; }
        public string? AddedBySessionId { get; set; }
        public List<ResolvedCartModifier> Modifiers { get; set; } = new();
    }

    public class ResolvedCartModifier
    {
        public long? MenuItemModifierId { get; set; }
        public string GroupName { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
    }

    public class CreateSessionInput
    {
        public long RestaurantId { get; set; }
        public long TableId { get; set; }
        public int TableNumber { get; set; }
        public string? TableLabel { get; set; }
        public int PartySize { get; set; }
        public TableSessionOwner OwnerKind { get; set; }
        public long? OwnerUserId { get; set; }
    }

    public interface ITableSessionService
    {
        Task<TableSession?> GetOpenForTableAsync(long tableId);
        Task<long?> GetOpenTableIdForUserAsync(long userId);
        Task<Result<TableSessionDto>> GetWithCartAsync(long sessionId);
        Task<Result<TableSessionDto>> CreateAsync(CreateSessionInput input);
        Task<Result<TableSessionDto>> CloseAsync(long sessionId);

        Task<Result<TableSessionDto>> AddOrIncreaseCartLineAsync(long sessionId, ResolvedCartLineInput input);
        Task<Result<TableSessionDto>> SetCartLineQuantityAsync(long sessionId, long lineId, int quantity);
        Task<Result<TableSessionDto>> RemoveCartLineAsync(long sessionId, long lineId);
        Task<Result<TableSessionDto>> ClearCartAsync(long sessionId);
    }
}
