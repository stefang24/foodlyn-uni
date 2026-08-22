using Foodlyn.Shared.Application;

namespace Foodlyn.Modules.Ordering.Application.DTOs
{
    public class PagedOrderQueryDto : PagedQuery
    {
        public long RestaurantId { get; set; }
        public List<long>? RestrictToRestaurantIds { get; set; }
        public bool AllRestaurants { get; set; }
        public string? Status { get; set; }
        public string? PaymentMethod { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }
}
