using Foodlyn.Shared.Application;

namespace Foodlyn.Modules.Restaurants.Application.DTOs
{
    public class PagedRestaurantQueryDto : PagedQuery
    {
        public bool? IsActive { get; set; }
        public string? Cuisine { get; set; }
        public string? City { get; set; }
        public List<long>? RestrictToIds { get; set; }
    }
}
