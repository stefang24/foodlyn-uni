namespace Foodlyn.Modules.Restaurants.Application.DTOs
{
    public class RestaurantOpeningHourDto
    {
        public int DayOfWeek { get; set; }
        public bool IsOpen { get; set; }
        public string? OpenTime { get; set; }
        public string? CloseTime { get; set; }
    }

    public class UpdateOpeningHoursDto
    {
        public List<RestaurantOpeningHourDto> Days { get; set; } = new();
    }
}
