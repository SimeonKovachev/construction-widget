using ConstructionWidget.Core.Entities;

namespace ConstructionWidget.Core.Interfaces;

public interface ILeadRepository
{
    Task<Lead>               CreateAsync(Lead lead);
    Task<IEnumerable<Lead>>  GetByTenantAsync(Guid tenantId);
    Task<Lead?>              GetByIdAsync(Guid id, Guid tenantId);
    Task<Lead?>              UpdateAsync(Guid id, Guid tenantId, string? email, string? status, string? notes);
    Task<bool>               DeleteAsync(Guid id, Guid tenantId);
    Task<bool>               ExistsBySessionAsync(Guid tenantId, string sessionId);
    Task<int>                CountAllTenantsAsync();
}
