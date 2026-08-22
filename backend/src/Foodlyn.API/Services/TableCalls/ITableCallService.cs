namespace Foodlyn.API.Services.TableCalls
{
    public interface ITableCallService
    {
        Task<TableCallDto> CreateAsync(long tableId, int tableNumber, string? tableLabel, long restaurantId, string? message);
        Task<bool> AcknowledgeAsync(long id, long restaurantId);
        IReadOnlyList<TableCallDto> GetActive(long restaurantId);
    }
}
