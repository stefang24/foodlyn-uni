using Foodlyn.Shared.Domain;

namespace Foodlyn.Modules.Restaurants.Domain.Entities
{
    public class RestaurantOpeningHour : BaseEntity
    {
        public long RestaurantId { get; set; }
        public int DayOfWeek { get; set; }
        public bool IsOpen { get; set; }
        public TimeOnly? OpenTime { get; set; }
        public TimeOnly? CloseTime { get; set; }
    }
}
