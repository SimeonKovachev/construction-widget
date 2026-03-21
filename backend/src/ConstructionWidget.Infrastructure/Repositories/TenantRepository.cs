using ConstructionWidget.Core.Entities;
using ConstructionWidget.Core.Interfaces;
using ConstructionWidget.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ConstructionWidget.Infrastructure.Repositories;

public class TenantRepository : ITenantRepository
{
    private readonly AppDbContext _db;

    public TenantRepository(AppDbContext db) => _db = db;

    public async Task<Tenant?> GetByApiKeyAsync(string apiKey)
        => await _db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.ApiKey == apiKey && t.IsActive);

    public async Task<Tenant?> GetByIdAsync(Guid id)
        => await _db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Id == id);

    public async Task<Tenant?> GetByEmailAsync(string email)
        => await _db.Tenants.AsNoTracking()
               .FirstOrDefaultAsync(t => t.OwnerEmail.ToLower() == email.ToLower());

    public async Task<IEnumerable<Tenant>> GetAllAsync()
        => await _db.Tenants.AsNoTracking()
               .OrderByDescending(t => t.CreatedAt)
               .ToListAsync();

    public async Task<Tenant> CreateAsync(Tenant tenant)
    {
        _db.Tenants.Add(tenant);
        await _db.SaveChangesAsync();
        return tenant;
    }

    public async Task UpdateSettingsAsync(
        Guid id, string? notificationEmail, string? smtpHost, int? smtpPort, string? smtpUser, string? smtpPassword,
        string? primaryColor = null, string? secondaryColor = null, string? logoUrl = null,
        string? welcomeMessage = null, string? widgetPosition = null, string? agentName = null, string? agentAvatarUrl = null)
    {
        var tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.Id == id);
        if (tenant is null) return;

        if (notificationEmail is not null) tenant.NotificationEmail = notificationEmail;
        if (smtpHost          is not null) tenant.SmtpHost          = smtpHost;
        if (smtpPort.HasValue)             tenant.SmtpPort          = smtpPort;
        if (smtpUser          is not null) tenant.SmtpUser          = smtpUser;
        if (smtpPassword      is not null) tenant.SmtpPassword      = smtpPassword;
        if (primaryColor      is not null) tenant.PrimaryColor      = primaryColor;
        if (secondaryColor    is not null) tenant.SecondaryColor    = secondaryColor;
        if (logoUrl           is not null) tenant.LogoUrl           = logoUrl;
        if (welcomeMessage    is not null) tenant.WelcomeMessage    = welcomeMessage;
        if (widgetPosition    is not null) tenant.WidgetPosition    = widgetPosition;
        if (agentName         is not null) tenant.AgentName         = agentName;
        if (agentAvatarUrl    is not null) tenant.AgentAvatarUrl    = agentAvatarUrl;

        await _db.SaveChangesAsync();
    }

    public async Task<bool> ToggleActiveAsync(Guid id)
    {
        var updated = await _db.Tenants
            .Where(t => t.Id == id)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.IsActive, t => !t.IsActive));
        return updated > 0;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var deleted = await _db.Tenants.Where(t => t.Id == id).ExecuteDeleteAsync();
        return deleted > 0;
    }
}
