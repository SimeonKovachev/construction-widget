using ConstructionWidget.Core.Entities;
using ConstructionWidget.Core.Interfaces;
using ConstructionWidget.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ConstructionWidget.Infrastructure.Repositories;

public class ConversationRepository : IConversationRepository
{
    private readonly AppDbContext _db;

    public ConversationRepository(AppDbContext db) => _db = db;

    public async Task<Conversation?> GetBySessionAsync(Guid tenantId, string sessionId)
        => await _db.Conversations
            .FirstOrDefaultAsync(c => c.TenantId == tenantId && c.SessionId == sessionId);

    public async Task<Conversation> CreateAsync(Conversation conversation)
    {
        _db.Conversations.Add(conversation);
        await _db.SaveChangesAsync();
        return conversation;
    }

    public async Task UpdateHistoryAsync(Guid id, string messagesJson)
    {
        await _db.Conversations
            .Where(c => c.Id == id)
            .ExecuteUpdateAsync(s => s
                .SetProperty(c => c.MessagesJson, messagesJson)
                .SetProperty(c => c.UpdatedAt, DateTime.UtcNow));
    }
}
