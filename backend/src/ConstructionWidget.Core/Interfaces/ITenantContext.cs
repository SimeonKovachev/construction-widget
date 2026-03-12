using ConstructionWidget.Core.Entities;

namespace ConstructionWidget.Core.Interfaces;

public interface ITenantContext
{
    Guid TenantId { get; }
    Tenant? Tenant { get; }
    bool IsResolved { get; }
}
