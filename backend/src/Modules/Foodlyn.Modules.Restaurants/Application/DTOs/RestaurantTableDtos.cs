namespace Foodlyn.Modules.Restaurants.Application.DTOs
{
    public class RestaurantTableDto
    {
        public long Id { get; set; }
        public long? RestaurantId { get; set; }
        public int Number { get; set; }
        public string? Label { get; set; }
        public int Capacity { get; set; }
        public string? Location { get; set; }
        public string? Notes { get; set; }
        public string Status { get; set; } = string.Empty;
        public int CurrentPartySize { get; set; }
        public DateTime? OccupiedSince { get; set; }
        public Guid QrToken { get; set; }
        public DateTime? QrTokenRotatedAt { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateRestaurantTableDto
    {
        public long RestaurantId { get; set; }
        public int Number { get; set; }
        public string? Label { get; set; }
        public int Capacity { get; set; } = 2;
        public string? Location { get; set; }
        public string? Notes { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class BulkCreateRestaurantTablesDto
    {
        public long RestaurantId { get; set; }
        public int Count { get; set; }
        public int StartingNumber { get; set; } = 1;
        public int Capacity { get; set; } = 2;
        public string? Location { get; set; }
    }

    public class UpdateRestaurantTableDto
    {
        public int Number { get; set; }
        public string? Label { get; set; }
        public int Capacity { get; set; }
        public string? Location { get; set; }
        public string? Notes { get; set; }
        public string Status { get; set; } = "Free";
        public int CurrentPartySize { get; set; }
        public bool IsActive { get; set; }
    }

    public class TableQrResolveDto
    {
        public string Status { get; set; } = string.Empty;
        public long TableId { get; set; }
        public int TableNumber { get; set; }
        public string? TableLabel { get; set; }
        public long RestaurantId { get; set; }
        public string RestaurantName { get; set; } = string.Empty;
        public string RestaurantSlug { get; set; } = string.Empty;
        public string? RestaurantLogoUrl { get; set; }
        public string? Currency { get; set; }
    }
}
