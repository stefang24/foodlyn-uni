namespace Foodlyn.API.Hubs
{
    public interface ITableNotifier
    {
        Task TableStatusChangedAsync(long restaurantId, TableStatusUpdate update);
    }

    public class TableStatusUpdate
    {
        public long Id { get; set; }
        public string Status { get; set; } = string.Empty;
        public int CurrentPartySize { get; set; }
    }
}
