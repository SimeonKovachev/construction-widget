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
    string? PrimaryColor,
    string? SecondaryColor,
    string? LogoUrl,
    string? WelcomeMessage,
    string? WidgetPosition,
    string? AgentName,
    string? AgentAvatarUrl,
    DateTime CreatedAt);

public record UpdateTenantDto(
    string? NotificationEmail,
    string? SmtpHost,
    int?    SmtpPort,
    string? SmtpUser,
    string? SmtpPassword,
    string? PrimaryColor,
    string? SecondaryColor,
    string? LogoUrl,
    string? WelcomeMessage,
    string? WidgetPosition,
    string? AgentName,
    string? AgentAvatarUrl);

public record CreateTenantDto(
    string  Name,
    string  OwnerEmail,
    string  Password,
    string? NotificationEmail);
