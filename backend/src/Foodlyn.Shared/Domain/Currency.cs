namespace Foodlyn.Shared.Domain
{
    public class Currency
    {
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Symbol { get; set; }
        public decimal RateToEur { get; set; } = 1m;
        public bool IsActive { get; set; } = true;
        public DateTime? UpdatedAt { get; set; }
    }
}
