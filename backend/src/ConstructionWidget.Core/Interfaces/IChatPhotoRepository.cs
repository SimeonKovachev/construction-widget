using ConstructionWidget.Core.Entities;

namespace ConstructionWidget.Core.Interfaces;

public interface IChatPhotoRepository
{
    Task<ChatPhoto> CreateAsync(ChatPhoto photo);
    Task<List<ChatPhoto>> GetBySessionAsync(Guid tenantId, string sessionId);
}
