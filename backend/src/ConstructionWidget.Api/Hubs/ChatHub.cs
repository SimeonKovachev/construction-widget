using System.Runtime.CompilerServices;
using System.Text.Json;
using ConstructionWidget.Core.Entities;
using ConstructionWidget.Core.Interfaces;
using ConstructionWidget.Infrastructure.Services;
using Microsoft.AspNetCore.SignalR;

namespace ConstructionWidget.Api.Hubs;

public class ChatHub : Hub
{
    private readonly IOpenAiChatService _chatService;
    private readonly TenantContext      _tenantContext;   // concrete — can call SetTenant
    private readonly ITenantRepository  _tenantRepo;

    public ChatHub(
        IOpenAiChatService chatService,
        TenantContext tenantContext,
        ITenantRepository tenantRepo)
    {
        _chatService   = chatService;
        _tenantContext = tenantContext;
        _tenantRepo    = tenantRepo;
    }

    /// <summary>
    /// Streams AI response chunks for a typewriter effect.
    ///
    /// WHY we resolve tenant here (not OnConnectedAsync):
    ///   SignalR creates a NEW DI scope per hub-method invocation, so any state
    ///   written in OnConnectedAsync is discarded before SendMessage runs.
    ///
    /// WHY we cache in Context.Items:
    ///   HubCallerContext.Items persists for the ENTIRE WebSocket connection lifetime.
    ///   Storing the resolved Tenant there means the DB lookup happens ONCE per
    ///   WebSocket connection, not once per message — a meaningful saving on
    ///   multi-turn chats where the user sends several messages.
    /// </summary>
    public async IAsyncEnumerable<string> SendMessage(
        string sessionId,
        string message,
        string? imageUrlsJson,
        [EnumeratorCancellation] CancellationToken ct)
    {
        // ── Resolve tenant — DB only on first message per connection ──────────
        if (!Context.Items.ContainsKey("Tenant"))
        {
            var tenantIdStr = Context.GetHttpContext()
                                     ?.Request.Query["tenantId"]
                                     .ToString();

            if (Guid.TryParse(tenantIdStr, out var tenantId))
            {
                var tenant = await _tenantRepo.GetByIdAsync(tenantId);
                if (tenant is { IsActive: true })
                    Context.Items["Tenant"] = tenant;   // cached for all future messages
            }
        }

        if (Context.Items["Tenant"] is not Tenant resolvedTenant)
        {
            yield return "[Error: Tenant not configured. Please check your widget setup.]";
            yield break;
        }

        // Set on the scoped TenantContext for this DI scope
        _tenantContext.SetTenant(resolvedTenant);

        if (string.IsNullOrWhiteSpace(message) && string.IsNullOrWhiteSpace(imageUrlsJson))
            yield break;

        // Parse image URLs if provided
        List<string>? imageUrls = null;
        if (!string.IsNullOrWhiteSpace(imageUrlsJson))
        {
            try { imageUrls = JsonSerializer.Deserialize<List<string>>(imageUrlsJson); }
            catch { /* invalid JSON — ignore */ }
        }

        // ── Stream AI response ────────────────────────────────────────────────
        await foreach (var chunk in _chatService.StreamResponseAsync(
                           resolvedTenant.Id, sessionId, message, imageUrls, ct))
        {
            yield return chunk;
        }
    }
}
