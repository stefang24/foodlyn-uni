namespace Foodlyn.Modules.Ordering.Application.DTOs
{
    public class TableSessionDto
    {
        public long Id { get; set; }
        public long RestaurantId { get; set; }
        public long TableId { get; set; }
        public int TableNumber { get; set; }
        public string? TableLabel { get; set; }
        public int PartySize { get; set; }
        public string OwnerKind { get; set; } = string.Empty;
        public long? OwnerUserId { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime OpenedAt { get; set; }
        public List<TableSessionCartLineDto> CartLines { get; set; } = new();
    }

    public class TableSessionCartLineDto
    {
        public long Id { get; set; }
        public string LineKey { get; set; } = string.Empty;
        public long MenuItemId { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; }
        public string? Notes { get; set; }
        public string? ImageUrl { get; set; }
        public string? AddedByLabel { get; set; }
        public List<TableSessionCartLineModifierDto> Modifiers { get; set; } = new();
    }

    public class TableSessionCartLineModifierDto
    {
        public long Id { get; set; }
        public long? MenuItemModifierId { get; set; }
        public string GroupName { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
    }

    public class ScanQrDto
    {
        public Guid QrToken { get; set; }
        public double? CustomerLatitude { get; set; }
        public double? CustomerLongitude { get; set; }
    }

    public class ScanResultDto
    {
        public long RestaurantId { get; set; }
        public long TableId { get; set; }
        public int TableNumber { get; set; }
        public string? TableLabel { get; set; }
        public string RestaurantName { get; set; } = string.Empty;
        public string? RestaurantLogoUrl { get; set; }

        public TableSessionDto? ExistingSession { get; set; }

        public bool IsOwnerOfExisting { get; set; }

        public bool BlockedByOtherUser { get; set; }

        public long? MyActiveOrderId { get; set; }

        public bool ShouldLogoutForGuestJoin { get; set; }

        public bool BlockedByActiveOrder { get; set; }

        public long? JoinableOrderId { get; set; }
    }

    public class TableAccessDto
    {
        public long RestaurantId { get; set; }
        public long TableId { get; set; }

        public bool HasOpenSession { get; set; }

        public string? SessionOwnerKind { get; set; }

        public bool IsSessionMember { get; set; }

        public bool BlockedByOtherUser { get; set; }

        public bool BlockedByActiveOrder { get; set; }

        public bool CanStartFresh { get; set; }

        public long? JoinableOrderId { get; set; }
    }

    public class StartSessionDto
    {
        public Guid QrToken { get; set; }
        public double? CustomerLatitude { get; set; }
        public double? CustomerLongitude { get; set; }
        public bool AsGuest { get; set; }
        public int PartySize { get; set; } = 1;
    }

    public class AddCartLineDto
    {
        public long MenuItemId { get; set; }
        public int Quantity { get; set; } = 1;
        public string? Notes { get; set; }
        public List<long> ModifierIds { get; set; } = new();
    }

    public class UpdateCartLineQuantityDto
    {
        public int Quantity { get; set; }
    }
}
