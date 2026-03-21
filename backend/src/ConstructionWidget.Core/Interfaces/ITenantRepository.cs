using ConstructionWidget.Core.Entities;

namespace ConstructionWidget.Core.Interfaces;

public interface ITenantRepository
{
    Task<Tenant?> GetByApiKeyAsync(string apiKey);
    Task<Tenant?> GetByIdAsync(Guid id);
    Task<Tenant?> GetByEmailAsync(string email);
    Task<IEnumerable<Tenant>> GetAllAsync();
    Task<Tenant>  CreateAsync(Tenant tenant);
    Task          UpdateSettingsAsync(Guid id, string? notificationEmail, string? smtpHost, int? smtpPort, string? smtpUser, string? smtpPassword,
                      string? primaryColor = null, string? secondaryColor = null, string? logoUrl = null,
                      string? welcomeMessage = null, string? widgetPosition = null, string? agentName = null, string? agentAvatarUrl = null);
    Task<bool>    ToggleActiveAsync(Guid id);
    Task<bool>    DeleteAsync(Guid id);
}
