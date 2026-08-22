namespace Foodlyn.API.Services.TableLobby
{
    public interface ITableLobbyService
    {
        TableLobbyDto? Get(long tableId);
        Task<TableLobbyDto> AdvanceAsync(
            long tableId,
            long restaurantId,
            string stage,
            long? sessionId = null,
            long? orderId = null,
            string? qrToken = null);
        Task ClearAsync(long tableId);
    }
}
