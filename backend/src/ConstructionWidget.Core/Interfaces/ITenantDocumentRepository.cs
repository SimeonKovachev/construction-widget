using ConstructionWidget.Core.Entities;

namespace ConstructionWidget.Core.Interfaces;

public interface ITenantDocumentRepository
{
    Task<List<TenantDocument>> GetByTenantAsync(Guid tenantId);
    Task<List<TenantDocument>> GetActiveByTenantAsync(Guid tenantId);
    Task<TenantDocument?> GetByIdAsync(Guid id, Guid tenantId);
    Task<TenantDocument> CreateAsync(TenantDocument doc);
    Task<TenantDocument?> UpdateAsync(Guid id, Guid tenantId, string? title, string? content, string? category, bool? isActive);
    Task<bool> DeleteAsync(Guid id, Guid tenantId);
}
