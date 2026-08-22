namespace Foodlyn.API.Services.TableCalls
{
    public class TableCallDto
    {
        public long Id { get; set; }
        public long TableId { get; set; }
        public int TableNumber { get; set; }
        public string? TableLabel { get; set; }
        public long RestaurantId { get; set; }
        public string? Message { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
