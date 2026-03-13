using ConstructionWidget.Application.DTOs;

namespace ConstructionWidget.Application.Interfaces;

public interface ITenantService
{
    Task<TenantDto?> GetTenantAsync(Guid tenantId);
    Task             UpdateTenantAsync(Guid tenantId, UpdateTenantDto dto);
}
