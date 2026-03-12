using ConstructionWidget.Core.Entities;

namespace ConstructionWidget.Core.Interfaces;

public interface ILeadRepository
{
    Task<Lead> CreateAsync(Lead lead);
    Task<IEnumerable<Lead>> GetByTenantAsync(Guid tenantId);
    Task<Lead?> GetByIdAsync(Guid id, Guid tenantId);
}
