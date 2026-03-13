using ConstructionWidget.Application.DTOs;
using ConstructionWidget.Core.Entities;
using Mapster;

namespace ConstructionWidget.Application.Mapping;

public class MappingConfig : IRegister
{
    public void Register(TypeAdapterConfig config)
    {
        config.NewConfig<Lead, LeadDto>();
        config.NewConfig<Tenant, TenantDto>();
    }
}
