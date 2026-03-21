using ConstructionWidget.Core.DTOs;
using ConstructionWidget.Core.Entities;

namespace ConstructionWidget.Core.Interfaces;

public interface IConversationRepository
{
    Task<Conversation?> GetBySessionAsync(Guid tenantId, string sessionId);
    Task<Conversation>  CreateAsync(Conversation conversation);
    Task                UpdateHistoryAsync(Guid id, string messagesJson);

    // Admin queries
    Task<List<ConversationSummaryDto>> GetAllAsync(Guid tenantId, DateTime? from, DateTime? to, bool? flaggedOnly, string? search);
    Task<ConversationDetailDto?>       GetByIdAsync(Guid id, Guid tenantId);
    Task<bool>                         SetFlagAsync(Guid id, Guid tenantId, bool isFlagged);
}
