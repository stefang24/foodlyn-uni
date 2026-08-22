namespace Foodlyn.Modules.Ordering.Application.DTOs
{
    public enum AnalyticsRange
    {
        Week,
        Month,
        Year,
        Lifetime,
    }

    public class OrderAnalyticsQueryDto
    {
        public long? RestaurantId { get; set; }
        public List<long>? RestrictToRestaurantIds { get; set; }
        public bool AllRestaurants { get; set; }
        public AnalyticsRange Range { get; set; } = AnalyticsRange.Week;
        public int? Year { get; set; }
        public int? Month { get; set; }
    }

    public class OrderAnalyticsBarDto
    {
        public string Label { get; set; } = string.Empty;
        public decimal Revenue { get; set; }
        public int OrderCount { get; set; }
        public int Percent { get; set; }
    }

    public class OrderAnalyticsMostSoldDto
    {
        public string Name { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class OrderAnalyticsDto
    {
        public string Range { get; set; } = string.Empty;
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
        public int TotalCompleted { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal AvgOrderValue { get; set; }
        public List<OrderAnalyticsBarDto> Bars { get; set; } = new();
        public List<OrderAnalyticsMostSoldDto> MostSold { get; set; } = new();
    }

    public class TopRestaurantStatDto
    {
        public long RestaurantId { get; set; }
        public int OrderCount { get; set; }
        public decimal Revenue { get; set; }
        public string? Currency { get; set; }
    }
}
