using Foodlyn.Shared.Application;

namespace Foodlyn.Modules.Identity.Application.DTOs
{
    public class PagedUserQueryDto : PagedQuery
    {
        public string? Role { get; set; }
        public bool? IsActive { get; set; }
        public long? RestaurantId { get; set; }
        public List<long>? RestrictToRestaurantIds { get; set; }
    }
}
