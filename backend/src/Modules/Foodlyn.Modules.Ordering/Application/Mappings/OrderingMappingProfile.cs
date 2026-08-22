using Foodlyn.Modules.Ordering.Application.DTOs;
using Foodlyn.Modules.Ordering.Domain.Entities;
using Mapster;

namespace Foodlyn.Modules.Ordering.Application.Mappings
{
    public class OrderingMappingProfile : IRegister
    {
        public void Register(TypeAdapterConfig config)
        {
            config.NewConfig<Order, OrderDto>()
                .Map(d => d.Status, s => s.Status.ToString())
                .Map(d => d.PaymentMethod, s => s.PaymentMethod.HasValue ? s.PaymentMethod.Value.ToString() : null);

            config.NewConfig<OrderItem, OrderItemDto>();
            config.NewConfig<OrderItemModifier, OrderItemModifierDto>();
        }
    }
}
