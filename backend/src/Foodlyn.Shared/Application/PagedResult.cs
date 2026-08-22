namespace Foodlyn.Shared.Application
{
    public class PagedResult<T>
    {
        public List<T> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => PageSize <= 0 ? 0 : (int)Math.Ceiling(TotalCount / (double)PageSize);
    }

    public class PagedQuery
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? Search { get; set; }
        public string? SortBy { get; set; }
        public string? SortDir { get; set; }

        public int SafePage => Page < 1 ? 1 : Page;
        public int SafePageSize => PageSize switch
        {
            < 1 => 10,
            > 100 => 100,
            _ => PageSize,
        };
        public int Skip => (SafePage - 1) * SafePageSize;
        public bool SortAsc => !string.Equals(SortDir, "desc", StringComparison.OrdinalIgnoreCase);
    }
}
