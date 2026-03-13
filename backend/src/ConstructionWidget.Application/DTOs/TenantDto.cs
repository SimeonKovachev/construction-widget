namespace ConstructionWidget.Application.DTOs;

public record TenantDto(
    Guid    Id,
    string  Name,
    string  OwnerEmail,
    string  ApiKey,
    bool    IsActive,
    string? NotificationEmail,
    string? SmtpHost,
    int?    SmtpPort,
    string? SmtpUser,
    DateTime CreatedAt);

public record UpdateTenantDto(
    string? NotificationEmail,
    string? SmtpHost,
    int?    SmtpPort,
    string? SmtpUser,
    string? SmtpPassword);

public record CreateTenantDto(
    string  Name,
    string  OwnerEmail,
    string  Password,
    string? NotificationEmail);
