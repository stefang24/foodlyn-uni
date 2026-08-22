namespace Foodlyn.Shared.Application
{
    public class SystemLogQuery : PagedQuery
    {
        public string? Level { get; set; }
        public int? StatusCode { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }
}
