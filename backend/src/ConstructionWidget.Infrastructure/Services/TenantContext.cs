using ConstructionWidget.Core.Entities;
using ConstructionWidget.Core.Interfaces;

namespace ConstructionWidget.Infrastructure.Services;

public class TenantContext : ITenantContext
{
    private Guid _tenantId;
    private Tenant? _tenant;

    public Guid TenantId => _tenantId;
    public Tenant? Tenant => _tenant;
    public bool IsResolved => _tenantId != Guid.Empty;

    public void SetTenant(Tenant tenant)
    {
        _tenantId = tenant.Id;
        _tenant = tenant;
    }
}
