using System.Text.Json;
using ConstructionWidget.Core.DTOs;
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

    // ── Admin queries ────────────────────────────────────────────────────────

    public async Task<List<ConversationSummaryDto>> GetAllAsync(
        Guid tenantId, DateTime? from, DateTime? to, bool? flaggedOnly, string? search)
    {
        var query = _db.Conversations
            .Where(c => c.TenantId == tenantId)
            .AsQueryable();

        if (from.HasValue)
            query = query.Where(c => c.CreatedAt >= from.Value);
        if (to.HasValue)
            query = query.Where(c => c.CreatedAt <= to.Value);
        if (flaggedOnly == true)
            query = query.Where(c => c.IsFlagged);
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(c => c.MessagesJson.Contains(search));

        var conversations = await query
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        // Batch-load leads that match these sessions
        var sessionIds = conversations.Select(c => c.SessionId).ToList();
        var leads = await _db.Leads
            .Where(l => l.TenantId == tenantId && l.SessionId != null && sessionIds.Contains(l.SessionId!))
            .Select(l => new { l.SessionId, l.Status, l.CustomerName })
            .ToListAsync();

        var leadsBySession = leads.ToDictionary(l => l.SessionId!);

        return conversations.Select(c =>
        {
            var msgs = ParseMessages(c.MessagesJson);
            var firstUser = msgs.FirstOrDefault(m => m.Role == "user")?.Content;
            leadsBySession.TryGetValue(c.SessionId, out var lead);

            return new ConversationSummaryDto(
                Id:               c.Id,
                SessionId:        c.SessionId,
                MessageCount:     msgs.Count,
                FirstUserMessage: Truncate(firstUser, 120),
                IsFlagged:        c.IsFlagged,
                HasLead:          lead is not null,
                LeadStatus:       lead?.Status,
                CustomerName:     lead?.CustomerName,
                CreatedAt:        c.CreatedAt,
                UpdatedAt:        c.UpdatedAt
            );
        }).ToList();
    }

    public async Task<ConversationDetailDto?> GetByIdAsync(Guid id, Guid tenantId)
    {
        var conv = await _db.Conversations
            .FirstOrDefaultAsync(c => c.Id == id && c.TenantId == tenantId);

        if (conv is null) return null;

        var lead = await _db.Leads
            .Where(l => l.TenantId == tenantId && l.SessionId == conv.SessionId)
            .Select(l => new { l.Status, l.CustomerName })
            .FirstOrDefaultAsync();

        var msgs = ParseMessages(conv.MessagesJson);

        return new ConversationDetailDto(
            Id:           conv.Id,
            SessionId:    conv.SessionId,
            Messages:     msgs,
            IsFlagged:    conv.IsFlagged,
            HasLead:      lead is not null,
            LeadStatus:   lead?.Status,
            CustomerName: lead?.CustomerName,
            CreatedAt:    conv.CreatedAt,
            UpdatedAt:    conv.UpdatedAt
        );
    }

    public async Task<bool> SetFlagAsync(Guid id, Guid tenantId, bool isFlagged)
    {
        var rows = await _db.Conversations
            .Where(c => c.Id == id && c.TenantId == tenantId)
            .ExecuteUpdateAsync(s => s.SetProperty(c => c.IsFlagged, isFlagged));

        return rows > 0;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static List<ConversationMsgDto> ParseMessages(string json)
    {
        try
        {
            var messages = JsonSerializer.Deserialize<List<JsonMessage>>(json, JsonOpts);
            return messages?.Select(m => new ConversationMsgDto(
                m.Role ?? "unknown",
                m.Content ?? "",
                m.Type ?? "text",
                m.ImageUrl,
                m.ImageUrls
            )).ToList() ?? [];
        }
        catch
        {
            return [];
        }
    }

    private static string? Truncate(string? text, int maxLength)
        => text is null ? null
           : text.Length <= maxLength ? text
           : text[..maxLength] + "…";

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private sealed class JsonMessage
    {
        public string? Role { get; set; }
        public string? Content { get; set; }
        public string? Type { get; set; }
        public string? ImageUrl { get; set; }
        public List<string>? ImageUrls { get; set; }
    }
}
