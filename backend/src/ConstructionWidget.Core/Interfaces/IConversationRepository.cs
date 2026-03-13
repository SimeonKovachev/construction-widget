using ConstructionWidget.Core.Entities;

namespace ConstructionWidget.Core.Interfaces;

public interface IConversationRepository
{
    Task<Conversation?> GetBySessionAsync(Guid tenantId, string sessionId);
    Task<Conversation>  CreateAsync(Conversation conversation);
    Task                UpdateHistoryAsync(Guid id, string messagesJson);
}
