namespace Foodlyn.Shared.Domain
{
    public class SystemLog : BaseEntity
    {
        public string Level { get; set; } = "Error";
        public int? StatusCode { get; set; }
        public string Message { get; set; } = string.Empty;
        public string? ExceptionType { get; set; }
        public string? StackTrace { get; set; }
        public string? Path { get; set; }
        public string? Method { get; set; }
        public string? QueryString { get; set; }
        public long? UserId { get; set; }
        public string? Username { get; set; }
        public string? UserRole { get; set; }
        public long? RestaurantId { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public string? Source { get; set; }
    }
}
