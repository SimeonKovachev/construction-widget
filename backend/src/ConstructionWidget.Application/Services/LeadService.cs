using ConstructionWidget.Application.DTOs;
using ConstructionWidget.Application.Interfaces;
using ConstructionWidget.Core.Interfaces;
using Mapster;

namespace ConstructionWidget.Application.Services;

public class LeadService : ILeadService
{
    private readonly ILeadRepository _leadRepo;

    public LeadService(ILeadRepository leadRepo) => _leadRepo = leadRepo;

    public async Task<IEnumerable<LeadDto>> GetLeadsAsync(Guid tenantId)
    {
        var leads = await _leadRepo.GetByTenantAsync(tenantId);
        return leads.Select(l => l.Adapt<LeadDto>());
    }

    public async Task<LeadDto?> GetLeadAsync(Guid id, Guid tenantId)
    {
        var lead = await _leadRepo.GetByIdAsync(id, tenantId);
        return lead?.Adapt<LeadDto>();
    }

    public async Task<LeadDto?> UpdateLeadAsync(Guid id, Guid tenantId, UpdateLeadDto dto)
    {
        var updated = await _leadRepo.UpdateAsync(id, tenantId, dto.Email, dto.Status, dto.Notes);
        return updated?.Adapt<LeadDto>();
    }

    public Task<bool> DeleteLeadAsync(Guid id, Guid tenantId)
        => _leadRepo.DeleteAsync(id, tenantId);
}
