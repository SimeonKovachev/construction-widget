using System.Runtime.CompilerServices;
using ConstructionWidget.Core.Interfaces;
using ConstructionWidget.Infrastructure.Services;
using Microsoft.AspNetCore.SignalR;

namespace ConstructionWidget.Api.Hubs;

public class ChatHub : Hub
{
    private readonly IOpenAiChatService _chatService;
    private readonly TenantContext _tenantContext;   // concrete — can call SetTenant
    private readonly ITenantRepository _tenantRepo;

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
    /// WHY we resolve tenant here (not in OnConnectedAsync):
    /// SignalR creates a NEW DI scope per hub-method invocation, so any state
    /// written to a scoped service in OnConnectedAsync is discarded before
    /// SendMessage runs.  We read the tenantId from the persistent HTTP context
    /// (the WebSocket upgrade request URL) inside this method instead.
    /// </summary>
    public async IAsyncEnumerable<string> SendMessage(
        string sessionId,
        string message,
        [EnumeratorCancellation] CancellationToken ct)
    {
        // ── Resolve tenant for this invocation scope ──────────────────────────
        if (!_tenantContext.IsResolved)
        {
            var tenantIdStr = Context.GetHttpContext()
                                     ?.Request.Query["tenantId"]
                                     .ToString();

            if (Guid.TryParse(tenantIdStr, out var tenantId))
            {
                var tenant = await _tenantRepo.GetByIdAsync(tenantId);
                if (tenant is { IsActive: true })
                    _tenantContext.SetTenant(tenant);
            }
        }

        if (!_tenantContext.IsResolved)
        {
            yield return "[Error: Tenant not configured. Please check your widget setup.]";
            yield break;
        }

        if (string.IsNullOrWhiteSpace(message))
            yield break;

        // ── Stream AI response ────────────────────────────────────────────────
        await foreach (var chunk in _chatService.StreamResponseAsync(
                           _tenantContext.TenantId, sessionId, message, ct))
        {
            yield return chunk;
        }
    }
}
