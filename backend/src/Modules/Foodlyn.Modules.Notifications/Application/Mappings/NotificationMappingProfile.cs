using Foodlyn.Modules.Notifications.Application.DTOs;
using Foodlyn.Modules.Notifications.Domain.Entities;
using Mapster;

namespace Foodlyn.Modules.Notifications.Application.Mappings
{
    public class NotificationMappingProfile : IRegister
    {
        public void Register(TypeAdapterConfig config)
        {
            config.NewConfig<Notification, NotificationDto>();
        }
    }
}
