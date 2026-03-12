using ConstructionWidget.Core.Entities;
using ConstructionWidget.Core.Interfaces;
using ConstructionWidget.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ConstructionWidget.Infrastructure.Repositories;

public class LeadRepository : ILeadRepository
{
    private readonly AppDbContext _db;

    public LeadRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<Lead> CreateAsync(Lead lead)
    {
        _db.Leads.Add(lead);
        try
        {
            await _db.SaveChangesAsync();
            return lead;
        }
        catch
        {
            // EF Core does NOT automatically detach a failed entity.
            // Without this, the Lead stays in "Added" state and will be
            // re-attempted by any subsequent SaveChangesAsync() call in the
            // same DbContext scope (e.g. SaveHistoryAsync), accumulating
            // duplicate inserts on every retry.
            _db.Entry(lead).State = Microsoft.EntityFrameworkCore.EntityState.Detached;
            throw;
        }
    }

    public async Task<IEnumerable<Lead>> GetByTenantAsync(Guid tenantId)
    {
        return await _db.Leads
            .AsNoTracking()
            .Where(l => l.TenantId == tenantId)
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync();
    }

    public async Task<Lead?> GetByIdAsync(Guid id, Guid tenantId)
    {
        return await _db.Leads
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == id && l.TenantId == tenantId);
    }
}
