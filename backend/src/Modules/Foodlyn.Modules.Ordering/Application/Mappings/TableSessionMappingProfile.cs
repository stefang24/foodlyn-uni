using Foodlyn.Modules.Ordering.Application.DTOs;
using Foodlyn.Modules.Ordering.Domain.Entities;
using Mapster;

namespace Foodlyn.Modules.Ordering.Application.Mappings
{
    public class TableSessionMappingProfile : IRegister
    {
        public void Register(TypeAdapterConfig config)
        {
            config.NewConfig<TableSession, TableSessionDto>()
                .Map(d => d.OwnerKind, s => s.OwnerKind.ToString())
                .Map(d => d.Status, s => s.Status.ToString())
                .Map(d => d.CartLines, s => s.CartLines
                    .OrderBy(l => l.CreatedAt)
                    .ThenBy(l => l.Id)
                    .ToList());

            config.NewConfig<TableSessionCartLine, TableSessionCartLineDto>();
            config.NewConfig<TableSessionCartLineModifier, TableSessionCartLineModifierDto>();
        }
    }
}
