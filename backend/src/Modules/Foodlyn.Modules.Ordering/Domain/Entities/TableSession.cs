using Foodlyn.Shared.Domain;

namespace Foodlyn.Modules.Ordering.Domain.Entities
{
    public class TableSession : BaseEntity
    {
        public long RestaurantId { get; set; }
        public long TableId { get; set; }
        public int TableNumber { get; set; }
        public string? TableLabel { get; set; }

        public int PartySize { get; set; } = 1;

        public TableSessionOwner OwnerKind { get; set; } = TableSessionOwner.Guest;
        public long? OwnerUserId { get; set; }

        public TableSessionStatus Status { get; set; } = TableSessionStatus.Open;
        public DateTime OpenedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ClosedAt { get; set; }

        public List<TableSessionCartLine> CartLines { get; set; } = new();
    }

    public class TableSessionCartLine : BaseEntity
    {
        public long TableSessionId { get; set; }
        public string LineKey { get; set; } = string.Empty;

        public long MenuItemId { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public int Quantity { get; set; }
        public string? Notes { get; set; }
        public string? ImageUrl { get; set; }

        public string? AddedByLabel { get; set; }
        public long? AddedByUserId { get; set; }
        public string? AddedBySessionId { get; set; }

        public TableSession Session { get; set; } = null!;
        public List<TableSessionCartLineModifier> Modifiers { get; set; } = new();
    }

    public class TableSessionCartLineModifier : BaseEntity
    {
        public long TableSessionCartLineId { get; set; }
        public long? MenuItemModifierId { get; set; }
        public string GroupName { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }

        public TableSessionCartLine Line { get; set; } = null!;
    }

    public enum TableSessionOwner
    {
        Guest = 0,
        User = 1,
    }

    public enum TableSessionStatus
    {
        Open = 0,
        Closed = 1,
    }
}
