using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using ConstructionWidget.Core.Entities;
using ConstructionWidget.Core.Interfaces;
using ConstructionWidget.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OpenAI;
using OpenAI.Chat;
using CalculatePriceArgs = ConstructionWidget.Core.Models.CalculatePriceArgs;
using SaveLeadArgs       = ConstructionWidget.Core.Models.SaveLeadArgs;

namespace ConstructionWidget.Infrastructure.Services;

public class OpenAiOptions
{
    public string ApiKey { get; set; } = string.Empty;
    public string Model  { get; set; } = "gpt-4o";
}

public class OpenAiChatService : IOpenAiChatService
{
    private readonly AppDbContext              _db;
    private readonly EstimateService           _estimateService;
    private readonly ILeadRepository           _leadRepo;
    private readonly ILeadNotificationService  _notificationService;
    private readonly ITenantContext            _tenantContext;
    private readonly OpenAiOptions             _options;
    private readonly ILogger<OpenAiChatService> _logger;

    private const int MaxToolRounds = 6; // prevent infinite loops

    // ── System prompt ────────────────────────────────────────────────────────
    private const string SystemPrompt =
        "You are a professional sales assistant for a construction/manufacturing company. " +
        "Your goal is to help customers get an instant price quote for windows, doors, or fencing. " +
        "Always ask for the product category and material if not provided. " +
        "Always ask for the dimensions. Detect the unit the customer uses (mm, cm, m, ft, in) " +
        "and pass it exactly to the calculate_price tool. " +
        "Use the 'calculate_price' tool as soon as you have: category, material, width, height, unit. " +
        "After quoting the price, ask for the customer's Name and Phone number to lock in the offer. " +
        "Use the 'save_lead' tool once you have both name and phone. " +
        "Be concise, friendly, and professional.";

    // ── Tools ────────────────────────────────────────────────────────────────
    private static readonly ChatTool CalculatePriceTool = ChatTool.CreateFunctionTool(
        "calculate_price",
        "Calculate the price for a product based on its dimensions and material. " +
        "Call this as soon as you have the required information.",
        BinaryData.FromString("""
        {
          "type": "object",
          "properties": {
            "category": {
              "type": "string",
              "description": "Product category: 'windows', 'doors', or 'fencing'"
            },
            "width": {
              "type": "number",
              "description": "Width of the product (numeric value, no units)"
            },
            "height": {
              "type": "number",
              "description": "Height of the product (numeric value, no units)"
            },
            "material": {
              "type": "string",
              "description": "Material type, e.g. 'vinyl', 'aluminum', 'wood', 'steel', 'fiberglass'"
            },
            "unit": {
              "type": "string",
              "enum": ["mm", "cm", "m", "ft", "in"],
              "description": "Unit of measurement provided by the customer"
            }
          },
          "required": ["category", "width", "height", "material", "unit"]
        }
        """));

    private static readonly ChatTool SaveLeadTool = ChatTool.CreateFunctionTool(
        "save_lead",
        "Save the customer's contact details and the quoted price as a lead. " +
        "Call this only after you have the customer's name AND phone number.",
        BinaryData.FromString("""
        {
          "type": "object",
          "properties": {
            "customer_name": {
              "type": "string",
              "description": "Customer's full name"
            },
            "phone": {
              "type": "string",
              "description": "Customer's phone number"
            },
            "requirements": {
              "type": "string",
              "description": "Brief summary of what the customer wants (product, size, material)"
            },
            "quoted_price": {
              "type": "number",
              "description": "The price that was quoted to the customer"
            }
          },
          "required": ["customer_name", "phone", "requirements", "quoted_price"]
        }
        """));

    // ── Constructor ───────────────────────────────────────────────────────────
    public OpenAiChatService(
        AppDbContext db,
        EstimateService estimateService,
        ILeadRepository leadRepo,
        ILeadNotificationService notificationService,
        ITenantContext tenantContext,
        IOptions<OpenAiOptions> options,
        ILogger<OpenAiChatService> logger)
    {
        _db                  = db;
        _estimateService     = estimateService;
        _leadRepo            = leadRepo;
        _notificationService = notificationService;
        _tenantContext       = tenantContext;
        _options             = options.Value;
        _logger              = logger;
    }

    // ── Main streaming entry point ────────────────────────────────────────────
    public async IAsyncEnumerable<string> StreamResponseAsync(
        Guid tenantId,
        string sessionId,
        string userMessage,
        [EnumeratorCancellation] CancellationToken ct = default)
    {
        var history    = await LoadHistoryAsync(tenantId, sessionId);
        history.Add(new UserChatMessage(userMessage));

        var chatClient = new OpenAIClient(_options.ApiKey)
                             .GetChatClient(_options.Model);

        var chatOptions = new ChatCompletionOptions
        {
            Tools = { CalculatePriceTool, SaveLeadTool }
        };

        // Tool-call loop — runs until the model produces a final text reply
        for (int round = 0; round < MaxToolRounds && !ct.IsCancellationRequested; round++)
        {
            var textBuffer = new StringBuilder();

            // key = toolCall index (0, 1, 2…), value = accumulated buffers
            var toolMap = new Dictionary<int, ToolCallBuffer>();

            var finishReason = ChatFinishReason.Stop;

            // ── Stream one completion ────────────────────────────────────────
            await foreach (var update in chatClient.CompleteChatStreamingAsync(
                               history, chatOptions, ct))
            {
                // 1. Stream text tokens straight to the client
                foreach (var part in update.ContentUpdate)
                {
                    if (!string.IsNullOrEmpty(part.Text))
                    {
                        textBuffer.Append(part.Text);
                        yield return part.Text;
                    }
                }

                // 2. Accumulate tool-call deltas by index
                //    FIX: BinaryData.ToString() crashes when internal byte[] is null.
                //         Use ToArray() first and only convert if bytes are present.
                foreach (var td in update.ToolCallUpdates)
                {
                    if (!toolMap.TryGetValue(td.Index, out var buf))
                        toolMap[td.Index] = buf = new ToolCallBuffer();

                    if (!string.IsNullOrEmpty(td.ToolCallId))   buf.Id   = td.ToolCallId;
                    if (!string.IsNullOrEmpty(td.FunctionName)) buf.Name = td.FunctionName;

                    if (td.FunctionArgumentsUpdate is { } argData)
                    {
                        var bytes = argData.ToArray(); // never throws
                        if (bytes.Length > 0)
                            buf.Args.Append(Encoding.UTF8.GetString(bytes));
                    }
                }

                if (update.FinishReason.HasValue)
                    finishReason = update.FinishReason.Value;
            }

            // ── Handle tool calls ────────────────────────────────────────────
            if (finishReason == ChatFinishReason.ToolCalls && toolMap.Count > 0)
            {
                // Add any leading text the model emitted before the tool call
                if (textBuffer.Length > 0)
                    history.Add(new AssistantChatMessage(textBuffer.ToString()));

                // Build the assistant tool-call message
                var toolCalls = toolMap
                    .OrderBy(kv => kv.Key)
                    .Select(kv => ChatToolCall.CreateFunctionToolCall(
                        kv.Value.Id,
                        kv.Value.Name,
                        BinaryData.FromString(kv.Value.Args.ToString())))
                    .ToArray();

                history.Add(new AssistantChatMessage(toolCalls));

                // Execute each tool and add its result
                foreach (var kv in toolMap.OrderBy(x => x.Key))
                {
                    var toolName = kv.Value.Name;
                    var toolId   = kv.Value.Id;
                    var argsJson = kv.Value.Args.ToString();

                    _logger.LogInformation("Executing tool '{Tool}' with args: {Args}", toolName, argsJson);

                    var result = await ExecuteToolAsync(tenantId, toolName, argsJson, ct);
                    history.Add(new ToolChatMessage(toolId, result));

                    // Let the widget know a tool ran (filtered by client)
                    yield return $"\n\n[Tool: {toolName}]\n";
                }

                // Loop again to get the model's response after the tool results
                continue;
            }

            // ── Normal finish (Stop / Length) ────────────────────────────────
            if (textBuffer.Length > 0)
                history.Add(new AssistantChatMessage(textBuffer.ToString()));

            break;
        }

        await SaveHistoryAsync(tenantId, sessionId, history);
    }

    // ── Tool execution ────────────────────────────────────────────────────────
    private async Task<string> ExecuteToolAsync(
        Guid tenantId, string toolName, string argsJson, CancellationToken ct)
    {
        try
        {
            switch (toolName)
            {
                case "calculate_price":
                {
                    var args = JsonSerializer.Deserialize<CalculatePriceArgs>(
                        argsJson,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                    if (args is null)
                        return "Error: could not parse calculate_price arguments.";

                    var price = await _estimateService.CalculatePriceAsync(
                        args.Category, args.Width, args.Height, args.Material, args.Unit);

                    return $"Calculated price: ${price:F2}. " +
                           $"(Category: {args.Category}, {args.Width}x{args.Height} {args.Unit}, " +
                           $"Material: {args.Material})";
                }

                case "save_lead":
                {
                    var args = JsonSerializer.Deserialize<SaveLeadArgs>(
                        argsJson,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                    if (args is null)
                        return "Error: could not parse save_lead arguments.";

                    var lead = await _leadRepo.CreateAsync(new Lead
                    {
                        TenantId     = tenantId,
                        CustomerName = args.CustomerName,
                        Phone        = args.Phone,
                        Requirements = args.Requirements,
                        QuotedPrice  = args.QuotedPrice,
                    });

                    // Fire-and-forget notification (never crash the chat)
                    var tenant = await _db.Tenants.FindAsync(new object[] { tenantId }, ct);
                    if (tenant is not null)
                    {
                        _ = Task.Run(async () =>
                        {
                            try { await _notificationService.NotifyLeadAsync(lead, tenant); }
                            catch (Exception ex)
                            {
                                _logger.LogWarning(ex,
                                    "Lead notification failed for tenant {TenantId}", tenantId);
                            }
                        }, CancellationToken.None);
                    }

                    return $"Lead saved successfully. The customer '{args.CustomerName}' " +
                           $"({args.Phone}) has been recorded and will be contacted shortly.";
                }

                default:
                    return $"Unknown tool: {toolName}";
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Tool '{Tool}' failed with args: {Args}", toolName, argsJson);
            return $"Tool error ({toolName}): {ex.Message}";
        }
    }

    // ── History persistence ───────────────────────────────────────────────────

    private async Task<List<ChatMessage>> LoadHistoryAsync(Guid tenantId, string sessionId)
    {
        var conversation = await _db.Conversations
            .FirstOrDefaultAsync(c => c.TenantId == tenantId && c.SessionId == sessionId);

        var messages = new List<ChatMessage> { new SystemChatMessage(SystemPrompt) };

        if (conversation is null)
            return messages;

        try
        {
            var stored = JsonSerializer.Deserialize<List<StoredMessage>>(conversation.MessagesJson) ?? [];
            foreach (var m in stored)
            {
                switch (m.Role)
                {
                    case "user":
                        messages.Add(new UserChatMessage(m.Content));
                        break;
                    case "assistant" when !string.IsNullOrEmpty(m.Content):
                        messages.Add(new AssistantChatMessage(m.Content));
                        break;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to deserialize conversation history for session {SessionId}", sessionId);
        }

        return messages;
    }

    private async Task SaveHistoryAsync(Guid tenantId, string sessionId, List<ChatMessage> messages)
    {
        // Save user + assistant text turns only (tool messages are transient execution details)
        var stored = new List<StoredMessage>();
        foreach (var m in messages.Skip(1)) // skip system prompt
        {
            switch (m)
            {
                case UserChatMessage u when u.Content.Count > 0:
                    stored.Add(new StoredMessage("user", u.Content[0].Text));
                    break;

                case AssistantChatMessage a when a.Content.Count > 0 && !string.IsNullOrWhiteSpace(a.Content[0].Text):
                    stored.Add(new StoredMessage("assistant", a.Content[0].Text));
                    break;

                // AssistantChatMessage with ToolCalls (Content.Count == 0) → skip
                // ToolChatMessage → skip
                // These are regenerated fresh on each conversation turn
            }
        }

        var json = JsonSerializer.Serialize(stored);

        try
        {
            var conversation = await _db.Conversations
                .FirstOrDefaultAsync(c => c.TenantId == tenantId && c.SessionId == sessionId);

            if (conversation is null)
            {
                _db.Conversations.Add(new Conversation
                {
                    TenantId     = tenantId,
                    SessionId    = sessionId,
                    MessagesJson = json,
                    CreatedAt    = DateTime.UtcNow,
                    UpdatedAt    = DateTime.UtcNow,
                });
            }
            else
            {
                conversation.MessagesJson = json;
                conversation.UpdatedAt    = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save conversation history for session {SessionId}", sessionId);
        }
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    /// <summary>Mutable buffer for accumulating streaming tool-call deltas.</summary>
    private sealed class ToolCallBuffer
    {
        public string        Id   { get; set; } = "";
        public string        Name { get; set; } = "";
        public StringBuilder Args { get; }      = new();
    }

    private record StoredMessage(string Role, string Content);
}
