using ConstructionWidget.Application.DTOs;

namespace ConstructionWidget.Application.Interfaces;

public interface ISuperAdminService
{
    Task<IEnumerable<TenantSummaryDto>> GetAllTenantsAsync();
    Task<TenantDto>                     CreateTenantAsync(CreateTenantDto dto);
    Task<bool>                          ToggleTenantAsync(Guid id);
    Task<bool>                          DeleteTenantAsync(Guid id);
    Task<PlatformStatsDto>              GetStatsAsync();
}
