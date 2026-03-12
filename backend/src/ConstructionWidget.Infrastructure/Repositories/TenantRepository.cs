using ConstructionWidget.Core.Entities;
using ConstructionWidget.Core.Interfaces;
using ConstructionWidget.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ConstructionWidget.Infrastructure.Repositories;

public class TenantRepository : ITenantRepository
{
    private readonly AppDbContext _db;

    public TenantRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<Tenant?> GetByApiKeyAsync(string apiKey)
        => await _db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.ApiKey == apiKey && t.IsActive);

    public async Task<Tenant?> GetByIdAsync(Guid id)
        => await _db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Id == id);

    public async Task<Tenant?> GetByEmailAsync(string email)
        => await _db.Tenants.AsNoTracking()
               .FirstOrDefaultAsync(t => t.OwnerEmail.ToLower() == email.ToLower());

    public async Task<Tenant> CreateAsync(Tenant tenant)
    {
        _db.Tenants.Add(tenant);
        await _db.SaveChangesAsync();
        return tenant;
    }

    public async Task UpdateAsync(Tenant tenant)
    {
        _db.Tenants.Update(tenant);
        await _db.SaveChangesAsync();
    }
}
