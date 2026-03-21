using ConstructionWidget.Core.DTOs;

namespace ConstructionWidget.Core.Interfaces;

public interface IAnalyticsService
{
    Task<AnalyticsDto> GetAnalyticsAsync(Guid tenantId, int days);
}
