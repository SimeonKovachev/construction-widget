using ConstructionWidget.Core.Entities;
using ConstructionWidget.Core.Interfaces;
using ConstructionWidget.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ConstructionWidget.Infrastructure.Repositories;

public class LeadRepository : ILeadRepository
{
    private readonly AppDbContext _db;

    public LeadRepository(AppDbContext db) => _db = db;

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
            // Detach failed entity to prevent duplicate inserts on subsequent SaveChanges calls.
            _db.Entry(lead).State = EntityState.Detached;
            throw;
        }
    }

    public async Task<IEnumerable<Lead>> GetByTenantAsync(Guid tenantId)
        => await _db.Leads
            .AsNoTracking()
            .Where(l => l.TenantId == tenantId)
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync();

    public async Task<Lead?> GetByIdAsync(Guid id, Guid tenantId)
        => await _db.Leads
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == id && l.TenantId == tenantId);

    /// <summary>
    /// Applies a partial update in a single DB round-trip. Null arguments are left unchanged.
    /// Returns the updated entity, or null if not found.
    /// </summary>
    public async Task<Lead?> UpdateAsync(Guid id, Guid tenantId, string? email, string? status, string? notes)
    {
        var lead = await _db.Leads
            .FirstOrDefaultAsync(l => l.Id == id && l.TenantId == tenantId);

        if (lead is null) return null;

        if (email  is not null) lead.Email  = email;
        if (status is not null) lead.Status = status;
        if (notes  is not null) lead.Notes  = notes;
        lead.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return lead;
    }

    public async Task<bool> DeleteAsync(Guid id, Guid tenantId)
    {
        var deleted = await _db.Leads
            .Where(l => l.Id == id && l.TenantId == tenantId)
            .ExecuteDeleteAsync();
        return deleted > 0;
    }

    /// <summary>Returns true if a lead already exists for this widget session — prevents duplicate saves.</summary>
    public async Task<bool> ExistsBySessionAsync(Guid tenantId, string sessionId)
        => await _db.Leads.AnyAsync(l => l.TenantId == tenantId && l.SessionId == sessionId);

    /// <summary>Count all leads across all tenants — bypasses the global query filter.</summary>
    public async Task<int> CountAllTenantsAsync()
        => await _db.Leads.IgnoreQueryFilters().CountAsync();
}
