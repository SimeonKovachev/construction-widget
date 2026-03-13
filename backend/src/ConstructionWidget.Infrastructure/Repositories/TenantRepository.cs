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
        Guid id, string? notificationEmail, string? smtpHost, int? smtpPort, string? smtpUser, string? smtpPassword)
    {
        var tenant = await _db.Tenants.FirstOrDefaultAsync(t => t.Id == id);
        if (tenant is null) return;

        if (notificationEmail is not null) tenant.NotificationEmail = notificationEmail;
        if (smtpHost          is not null) tenant.SmtpHost          = smtpHost;
        if (smtpPort.HasValue)             tenant.SmtpPort          = smtpPort;
        if (smtpUser          is not null) tenant.SmtpUser          = smtpUser;
        if (smtpPassword      is not null) tenant.SmtpPassword      = smtpPassword;

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
