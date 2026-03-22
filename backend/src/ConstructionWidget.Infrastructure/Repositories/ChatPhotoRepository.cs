using ConstructionWidget.Core.Entities;
using ConstructionWidget.Core.Interfaces;
using ConstructionWidget.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ConstructionWidget.Infrastructure.Repositories;

public class ChatPhotoRepository : IChatPhotoRepository
{
    private readonly AppDbContext _db;

    public ChatPhotoRepository(AppDbContext db) => _db = db;

    public async Task<ChatPhoto> CreateAsync(ChatPhoto photo)
    {
        _db.ChatPhotos.Add(photo);
        await _db.SaveChangesAsync();
        return photo;
    }

    public async Task<List<ChatPhoto>> GetBySessionAsync(Guid tenantId, string sessionId)
        => await _db.ChatPhotos
            .Where(p => p.TenantId == tenantId && p.SessionId == sessionId)
            .OrderBy(p => p.CreatedAt)
            .ToListAsync();
}
