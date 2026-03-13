using ConstructionWidget.Application.DTOs;

namespace ConstructionWidget.Application.Interfaces;

public interface ILeadService
{
    Task<IEnumerable<LeadDto>> GetLeadsAsync(Guid tenantId);
    Task<LeadDto?>             GetLeadAsync(Guid id, Guid tenantId);
    Task<LeadDto?>             UpdateLeadAsync(Guid id, Guid tenantId, UpdateLeadDto dto);
    Task<bool>                 DeleteLeadAsync(Guid id, Guid tenantId);
}
