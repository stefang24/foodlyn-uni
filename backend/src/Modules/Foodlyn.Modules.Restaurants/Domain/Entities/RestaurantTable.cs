using Foodlyn.Modules.Restaurants.Domain.Enums;
using Foodlyn.Shared.Domain;

namespace Foodlyn.Modules.Restaurants.Domain.Entities
{
    public class RestaurantTable : BaseEntity, ITenantEntity, IAuditableEntity
    {
        public long? RestaurantId { get; set; }

        public int Number { get; set; }
        public string? Label { get; set; }
        public int Capacity { get; set; } = 2;
        public string? Location { get; set; }
        public string? Notes { get; set; }

        public RestaurantTableStatus Status { get; set; } = RestaurantTableStatus.Free;
        public int CurrentPartySize { get; set; }
        public DateTime? OccupiedSince { get; set; }

        public Guid QrToken { get; set; } = Guid.NewGuid();
        public DateTime? QrTokenRotatedAt { get; set; }

        public bool IsActive { get; set; } = true;

        public long? CreatedBy { get; set; }
        public long? UpdatedBy { get; set; }
    }
}
