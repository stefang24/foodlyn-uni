namespace Foodlyn.Modules.Restaurants.Application.DTOs
{
    public class RestaurantDto
    {
        public long Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;

        public string? Description { get; set; }
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Website { get; set; }

        public string? StreetAddress { get; set; }
        public string? City { get; set; }
        public string? PostalCode { get; set; }
        public string? Country { get; set; }
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }

        public string? LogoUrl { get; set; }
        public string? CoverImageUrl { get; set; }

        public string? Currency { get; set; }
        public string? TimeZone { get; set; }
        public string? Cuisine { get; set; }
        public string? OpeningHours { get; set; }
        public string? TaxId { get; set; }

        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
