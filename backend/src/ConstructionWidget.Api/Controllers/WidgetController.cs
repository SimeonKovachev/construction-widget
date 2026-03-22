using System.Text.Json;
using ConstructionWidget.Core.Entities;
using ConstructionWidget.Core.Interfaces;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;

namespace ConstructionWidget.Api.Controllers;

[ApiController]
[Route("api/widget")]
[EnableCors("SignalR")]   // Widget runs on any customer site — needs open CORS
public class WidgetController : ControllerBase
{
    private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg",
        "image/png",
        "image/webp",
    };

    private const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5 MB

    private readonly ITenantContext        _tenantContext;
    private readonly IChatPhotoRepository  _photoRepo;
    private readonly IConversationRepository _conversationRepo;
    private readonly IWebHostEnvironment   _env;

    public WidgetController(
        ITenantContext          tenantContext,
        IChatPhotoRepository    photoRepo,
        IConversationRepository conversationRepo,
        IWebHostEnvironment     env)
    {
        _tenantContext    = tenantContext;
        _photoRepo        = photoRepo;
        _conversationRepo = conversationRepo;
        _env              = env;
    }

    /// <summary>
    /// Returns public config for the widget. Called on widget init.
    /// Requires X-Tenant-ID header.
    /// </summary>
    [HttpGet("config")]
    public IActionResult GetConfig()
    {
        if (!_tenantContext.IsResolved)
            return NotFound(new { error = "Tenant not found." });

        var tenant = _tenantContext.Tenant!;
        return Ok(new
        {
            tenantId       = tenant.Id,
            tenantName     = tenant.Name,
            greeting       = tenant.WelcomeMessage ?? $"Hi! I'm the sales assistant for {tenant.Name}. How can I help you today?",
            primaryColor   = tenant.PrimaryColor,
            secondaryColor = tenant.SecondaryColor,
            logoUrl        = tenant.LogoUrl,
            position       = tenant.WidgetPosition ?? "bottom-right",
            agentName      = tenant.AgentName ?? "Sales Assistant",
            agentAvatarUrl = tenant.AgentAvatarUrl,
        });
    }

    /// <summary>
    /// Upload a photo from the chat widget. Saves file to disk and
    /// appends an image message + assistant acknowledgment to conversation history.
    /// </summary>
    [HttpPost("photos")]
    [RequestSizeLimit(MaxFileSizeBytes + 1024)] // small buffer for form fields
    public async Task<IActionResult> UploadPhoto(IFormFile file, [FromForm] string sessionId)
    {
        if (!_tenantContext.IsResolved)
            return NotFound(new { error = "Tenant not found." });

        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No file uploaded." });

        if (file.Length > MaxFileSizeBytes)
            return BadRequest(new { error = "File too large. Maximum size is 5 MB." });

        if (!AllowedContentTypes.Contains(file.ContentType))
            return BadRequest(new { error = "Only JPEG, PNG, and WebP images are allowed." });

        if (string.IsNullOrWhiteSpace(sessionId))
            return BadRequest(new { error = "sessionId is required." });

        var tenantId = _tenantContext.TenantId;

        // ── Save file to disk ────────────────────────────────────────────────
        var ext            = Path.GetExtension(file.FileName)?.ToLowerInvariant() ?? ".jpg";
        var storedFileName = $"{Guid.NewGuid()}{ext}";
        var uploadDir      = Path.Combine(_env.WebRootPath, "uploads", tenantId.ToString());

        Directory.CreateDirectory(uploadDir);

        var filePath = Path.Combine(uploadDir, storedFileName);
        await using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // ── Create ChatPhoto entity ──────────────────────────────────────────
        var photo = await _photoRepo.CreateAsync(new ChatPhoto
        {
            TenantId       = tenantId,
            SessionId      = sessionId,
            FileName       = file.FileName,
            StoredFileName = storedFileName,
            ContentType    = file.ContentType,
            FileSizeBytes  = file.Length,
        });

        var imageUrl = $"/uploads/{tenantId}/{storedFileName}";

        // ── Append image message to conversation history ─────────────────────
        await AppendPhotoToConversationAsync(tenantId, sessionId, imageUrl);

        return Ok(new { imageUrl, photoId = photo.Id });
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────

    private async Task AppendPhotoToConversationAsync(Guid tenantId, string sessionId, string imageUrl)
    {
        var conversation = await _conversationRepo.GetBySessionAsync(tenantId, sessionId);

        var userMsg = new { role = "user", content = "📷 Photo uploaded", type = "image", imageUrl };
        var botMsg  = new { role = "assistant", content = "Thanks! I've received your photo. Our team will review it along with your inquiry.", type = "text", imageUrl = (string?)null };

        List<object> messages;

        if (conversation is null)
        {
            messages = new List<object> { userMsg, botMsg };
            await _conversationRepo.CreateAsync(new Conversation
            {
                TenantId     = tenantId,
                SessionId    = sessionId,
                MessagesJson = JsonSerializer.Serialize(messages),
                CreatedAt    = DateTime.UtcNow,
                UpdatedAt    = DateTime.UtcNow,
            });
        }
        else
        {
            messages = JsonSerializer.Deserialize<List<object>>(conversation.MessagesJson) ?? [];
            messages.Add(userMsg);
            messages.Add(botMsg);
            await _conversationRepo.UpdateHistoryAsync(conversation.Id, JsonSerializer.Serialize(messages));
        }
    }
}
