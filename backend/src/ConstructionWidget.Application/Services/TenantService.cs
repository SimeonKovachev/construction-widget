using ConstructionWidget.Application.DTOs;
using ConstructionWidget.Application.Interfaces;
using ConstructionWidget.Core.Interfaces;
using Mapster;

namespace ConstructionWidget.Application.Services;

public class TenantService : ITenantService
{
    private readonly ITenantRepository _tenantRepo;

    public TenantService(ITenantRepository tenantRepo) => _tenantRepo = tenantRepo;

    public async Task<TenantDto?> GetTenantAsync(Guid tenantId)
    {
        var tenant = await _tenantRepo.GetByIdAsync(tenantId);
        return tenant?.Adapt<TenantDto>();
    }

    public Task UpdateTenantAsync(Guid tenantId, UpdateTenantDto dto)
        => _tenantRepo.UpdateSettingsAsync(
            tenantId,
            dto.NotificationEmail,
            dto.SmtpHost,
            dto.SmtpPort,
            dto.SmtpUser,
            dto.SmtpPassword);
}
