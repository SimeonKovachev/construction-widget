using ConstructionWidget.Core.Entities;
using ConstructionWidget.Core.Interfaces;
using ConstructionWidget.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ConstructionWidget.Infrastructure.Repositories;

public class TenantDocumentRepository : ITenantDocumentRepository
{
    private readonly AppDbContext _db;

    public TenantDocumentRepository(AppDbContext db) => _db = db;

    public async Task<List<TenantDocument>> GetByTenantAsync(Guid tenantId)
        => await _db.TenantDocuments
            .AsNoTracking()
            .Where(d => d.TenantId == tenantId)
            .OrderBy(d => d.Category)
            .ThenByDescending(d => d.CreatedAt)
            .ToListAsync();

    public async Task<List<TenantDocument>> GetActiveByTenantAsync(Guid tenantId)
        => await _db.TenantDocuments
            .AsNoTracking()
            .Where(d => d.TenantId == tenantId && d.IsActive)
            .OrderBy(d => d.Category)
            .ToListAsync();

    public async Task<TenantDocument?> GetByIdAsync(Guid id, Guid tenantId)
        => await _db.TenantDocuments
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == id && d.TenantId == tenantId);

    public async Task<TenantDocument> CreateAsync(TenantDocument doc)
    {
        _db.TenantDocuments.Add(doc);
        await _db.SaveChangesAsync();
        return doc;
    }

    public async Task<TenantDocument?> UpdateAsync(
        Guid id, Guid tenantId, string? title, string? content, string? category, bool? isActive)
    {
        var doc = await _db.TenantDocuments
            .FirstOrDefaultAsync(d => d.Id == id && d.TenantId == tenantId);

        if (doc is null) return null;

        if (title    is not null) doc.Title    = title;
        if (content  is not null) doc.Content  = content;
        if (category is not null) doc.Category = category;
        if (isActive.HasValue)    doc.IsActive = isActive.Value;
        doc.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return doc;
    }

    public async Task<bool> DeleteAsync(Guid id, Guid tenantId)
    {
        var deleted = await _db.TenantDocuments
            .Where(d => d.Id == id && d.TenantId == tenantId)
            .ExecuteDeleteAsync();
        return deleted > 0;
    }
}
