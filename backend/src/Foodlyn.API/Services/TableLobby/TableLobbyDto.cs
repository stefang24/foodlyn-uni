namespace Foodlyn.API.Services.TableLobby
{
    public class TableLobbyDto
    {
        public long TableId { get; set; }
        public long RestaurantId { get; set; }
        public string Stage { get; set; } = TableLobbyStages.Choice;
        public long? SessionId { get; set; }
        public long? OrderId { get; set; }
        public string? QrToken { get; set; }
    }

    public static class TableLobbyStages
    {
        public const string Choice = "Choice";
        public const string PartySize = "PartySize";
        public const string Menu = "Menu";
        public const string Tracking = "Tracking";
        public const string UserLocked = "UserLocked";
    }
}
