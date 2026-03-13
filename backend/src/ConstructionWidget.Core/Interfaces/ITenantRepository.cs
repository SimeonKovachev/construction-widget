using ConstructionWidget.Core.Entities;

namespace ConstructionWidget.Core.Interfaces;

public interface ITenantRepository
{
    Task<Tenant?> GetByApiKeyAsync(string apiKey);
    Task<Tenant?> GetByIdAsync(Guid id);
    Task<Tenant?> GetByEmailAsync(string email);
    Task<IEnumerable<Tenant>> GetAllAsync();
    Task<Tenant>  CreateAsync(Tenant tenant);
    Task          UpdateSettingsAsync(Guid id, string? notificationEmail, string? smtpHost, int? smtpPort, string? smtpUser, string? smtpPassword);
    Task<bool>    ToggleActiveAsync(Guid id);
    Task<bool>    DeleteAsync(Guid id);
}
