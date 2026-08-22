using Foodlyn.Modules.Ordering.Application.DTOs;

namespace Foodlyn.Modules.Ordering.Application.Services
{
    public interface IOrderNotifier
    {
        Task OrderCreatedAsync(OrderDto order);
        Task OrderUpdatedAsync(OrderDto order);
    }
}
