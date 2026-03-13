namespace ConstructionWidget.Application.DTOs;

public record TenantSummaryDto(
    Guid     Id,
    string   Name,
    string   OwnerEmail,
    bool     IsActive,
    int      LeadCount,
    DateTime CreatedAt);

public record PlatformStatsDto(
    int TotalTenants,
    int ActiveTenants,
    int TotalLeads);
