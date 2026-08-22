namespace Foodlyn.Shared.Application
{
    public class CurrencyDto
    {
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Symbol { get; set; }
        public decimal RateToEur { get; set; }
        public bool IsActive { get; set; }
    }

    public class UpdateCurrencyRateDto
    {
        public decimal RateToEur { get; set; }
    }

    public class TimezoneDto
    {
        public string IanaName { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public bool IsActive { get; set; }
    }
}
