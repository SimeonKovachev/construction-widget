namespace ConstructionWidget.Application.DTOs;

public record LeadDto(
    Guid     Id,
    Guid     TenantId,
    string   CustomerName,
    string   Phone,
    string?  Email,
    string   Requirements,
    decimal  QuotedPrice,
    string   Status,
    string?  Notes,
    string?  ExtrasJson,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public record UpdateLeadDto(
    string? Email,
    string? Status,
    string? Notes);
