using ConstructionWidget.Application.DTOs;
using ConstructionWidget.Application.Interfaces;
using ConstructionWidget.Core.Entities;
using ConstructionWidget.Core.Interfaces;
using Mapster;

namespace ConstructionWidget.Application.Services;

public class SuperAdminService : ISuperAdminService
{
    private readonly ITenantRepository _tenantRepo;
    private readonly ILeadRepository   _leadRepo;
    private readonly IPasswordHasher   _hasher;

    public SuperAdminService(
        ITenantRepository tenantRepo,
        ILeadRepository   leadRepo,
        IPasswordHasher   hasher)
    {
        _tenantRepo = tenantRepo;
        _leadRepo   = leadRepo;
        _hasher     = hasher;
    }

    public async Task<IEnumerable<TenantSummaryDto>> GetAllTenantsAsync()
    {
        var tenants   = await _tenantRepo.GetAllAsync();
        var totalLeads = await _leadRepo.CountAllTenantsAsync();

        // Per-tenant lead counts would require N queries; return totals at stats endpoint instead.
        return tenants.Select(t => new TenantSummaryDto(
            t.Id, t.Name, t.OwnerEmail, t.IsActive, 0, t.CreatedAt));
    }

    public async Task<TenantDto> CreateTenantAsync(CreateTenantDto dto)
    {
        var tenant = new Tenant
        {
            Id                = Guid.NewGuid(),
            Name              = dto.Name.Trim(),
            OwnerEmail        = dto.OwnerEmail.Trim().ToLowerInvariant(),
            PasswordHash      = _hasher.Hash(dto.Password),
            ApiKey            = Guid.NewGuid().ToString("N"),
            NotificationEmail = string.IsNullOrWhiteSpace(dto.NotificationEmail)
                                ? dto.OwnerEmail.Trim().ToLowerInvariant()
                                : dto.NotificationEmail.Trim(),
            IsActive  = true,
            CreatedAt = DateTime.UtcNow,
        };

        await _tenantRepo.CreateAsync(tenant);
        return tenant.Adapt<TenantDto>();
    }

    public Task<bool> ToggleTenantAsync(Guid id) => _tenantRepo.ToggleActiveAsync(id);

    public Task<bool> DeleteTenantAsync(Guid id) => _tenantRepo.DeleteAsync(id);

    public async Task<PlatformStatsDto> GetStatsAsync()
    {
        var tenants     = await _tenantRepo.GetAllAsync();
        var tenantList  = tenants.ToList();
        var totalLeads  = await _leadRepo.CountAllTenantsAsync();

        return new PlatformStatsDto(
            tenantList.Count,
            tenantList.Count(t => t.IsActive),
            totalLeads);
    }
}
