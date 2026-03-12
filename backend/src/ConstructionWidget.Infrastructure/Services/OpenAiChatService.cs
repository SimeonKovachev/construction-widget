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
    private readonly OpenAIClient              _openAiClient;   // singleton — injected, not newed
    private readonly OpenAiOptions             _options;
    private readonly ILogger<OpenAiChatService> _logger;

    private const int MaxToolRounds = 6;

    // Scoped per SignalR invocation — prevents save_lead being called more than once.
    private bool _leadSavedThisRequest = false;

    // ── save_lead tool schema never changes ───────────────────────────────────
    private static readonly ChatTool SaveLeadTool = ChatTool.CreateFunctionTool(
        "save_lead",
        "Save the customer's contact details and the quoted price as a lead. " +
        "Call this EXACTLY ONCE per conversation — only after you have BOTH the customer's name AND phone number.",
        BinaryData.FromString("""
        {
          "type": "object",
          "properties": {
            "customer_name": { "type": "string", "description": "Customer's full name" },
            "phone":         { "type": "string", "description": "Customer's phone number" },
            "requirements":  { "type": "string", "description": "Brief summary of what the customer wants" },
            "quoted_price":  { "type": "number", "description": "The price that was quoted to the customer" }
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
        OpenAIClient openAiClient,             // singleton registered in Program.cs
        IOptions<OpenAiOptions> options,
        ILogger<OpenAiChatService> logger)
    {
        _db                  = db;
        _estimateService     = estimateService;
        _leadRepo            = leadRepo;
        _notificationService = notificationService;
        _tenantContext       = tenantContext;
        _openAiClient        = openAiClient;
        _options             = options.Value;
        _logger              = logger;
    }

    // ── Build dynamic system prompt + calculate_price tool from tenant's price list ─
    private async Task<(string systemPrompt, ChatTool calculatePriceTool)> BuildChatContextAsync(Guid tenantId)
    {
        // GetPricingConfigAsync is now cached — no DB hit after first call per tenant
        var config = await _estimateService.GetPricingConfigAsync(tenantId);

        var sb = new StringBuilder();
        sb.Append("You are a professional, friendly sales assistant. ");
        sb.Append("Start by greeting the customer warmly. ");
        sb.Append("Do NOT immediately ask for product details — let the conversation flow naturally. ");
        sb.Append("Only ask for dimensions and material when the customer expresses interest in a quote. ");

        string categoryDescription;

        if (config?.Categories is { Count: > 0 } cats)
        {
            sb.AppendLine("The available product catalog is:");
            foreach (var (cat, catPricing) in cats)
            {
                var materials = string.Join(", ", catPricing.Materials.Keys);
                sb.AppendLine($"- Category \"{cat}\": available materials: {materials}");
            }
            sb.Append("Only quote products that exist in the catalog above. ");
            sb.Append("If the customer asks for something not in the catalog, say it is not available. ");

            categoryDescription = "Product category. Available: " +
                string.Join(", ", cats.Keys.Select(k => $"\"{k}\""));
        }
        else
        {
            sb.Append("No product catalog has been configured yet. ");
            sb.Append("If the customer asks for a price quote, politely explain that pricing is not set up yet. ");
            categoryDescription = "Product category (e.g. \"windows\", \"doors\", \"fencing\")";
        }

        sb.Append("When you have category, material, width, height, and unit — call 'calculate_price' immediately. ");
        sb.Append("After quoting the price, ask for the customer's name and phone number to lock in the offer. ");
        sb.Append("Call 'save_lead' EXACTLY ONCE — only after you have both name and phone. Never call it more than once. ");
        sb.Append("Be concise, warm, and professional.");

        var safeDesc = categoryDescription.Replace("\\", "\\\\").Replace("\"", "\\\"");

        var calculatePriceTool = ChatTool.CreateFunctionTool(
            "calculate_price",
            "Calculate the price for a product. Call this as soon as you have all five required values.",
            BinaryData.FromString($@"{{
  ""type"": ""object"",
  ""properties"": {{
    ""category"": {{ ""type"": ""string"", ""description"": ""{safeDesc}"" }},
    ""width"":    {{ ""type"": ""number"", ""description"": ""Width of the product (numeric value only — no units)"" }},
    ""height"":   {{ ""type"": ""number"", ""description"": ""Height of the product (numeric value only — no units)"" }},
    ""material"": {{ ""type"": ""string"", ""description"": ""Material type matching one of the configured materials for the chosen category"" }},
    ""unit"":     {{ ""type"": ""string"", ""enum"": [""mm"", ""cm"", ""m"", ""ft"", ""in""], ""description"": ""Unit of measurement the customer used"" }}
  }},
  ""required"": [""category"", ""width"", ""height"", ""material"", ""unit""]
}}"));

        return (sb.ToString(), calculatePriceTool);
    }

    // ── Main streaming entry point ────────────────────────────────────────────
    public async IAsyncEnumerable<string> StreamResponseAsync(
        Guid tenantId,
        string sessionId,
        string userMessage,
        [EnumeratorCancellation] CancellationToken ct = default)
    {
        var (systemPrompt, calculatePriceTool) = await BuildChatContextAsync(tenantId);

        // LoadHistoryAsync now returns the Conversation entity too — we pass it to
        // SaveHistoryAsync so it doesn't need to re-query the same row.
        var (history, existingConv) = await LoadHistoryAsync(tenantId, sessionId, systemPrompt);
        history.Add(new UserChatMessage(userMessage));

        // Reuse the singleton OpenAI client — no new HTTP client setup per message
        var chatClient  = _openAiClient.GetChatClient(_options.Model);
        var chatOptions = new ChatCompletionOptions
        {
            Tools = { calculatePriceTool, SaveLeadTool }
        };

        // Tool-call loop — runs until the model produces a final text reply
        for (int round = 0; round < MaxToolRounds && !ct.IsCancellationRequested; round++)
        {
            var textBuffer = new StringBuilder();
            var toolMap    = new Dictionary<int, ToolCallBuffer>();
            var finishReason = ChatFinishReason.Stop;

            // ── Stream one completion ────────────────────────────────────────
            await foreach (var update in chatClient.CompleteChatStreamingAsync(
                               history, chatOptions, ct))
            {
                foreach (var part in update.ContentUpdate)
                {
                    if (!string.IsNullOrEmpty(part.Text))
                    {
                        textBuffer.Append(part.Text);
                        yield return part.Text;
                    }
                }

                // Accumulate tool-call deltas by index.
                // BinaryData.ToString() crashes when internal byte[] is null on empty chunks.
                // Use ToArray() + length check to avoid that.
                foreach (var td in update.ToolCallUpdates)
                {
                    if (!toolMap.TryGetValue(td.Index, out var buf))
                        toolMap[td.Index] = buf = new ToolCallBuffer();

                    if (!string.IsNullOrEmpty(td.ToolCallId))   buf.Id   = td.ToolCallId;
                    if (!string.IsNullOrEmpty(td.FunctionName)) buf.Name = td.FunctionName;

                    if (td.FunctionArgumentsUpdate is { } argData)
                    {
                        var bytes = argData.ToArray();
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
                if (textBuffer.Length > 0)
                    history.Add(new AssistantChatMessage(textBuffer.ToString()));

                var toolCalls = toolMap
                    .OrderBy(kv => kv.Key)
                    .Select(kv => ChatToolCall.CreateFunctionToolCall(
                        kv.Value.Id,
                        kv.Value.Name,
                        BinaryData.FromString(kv.Value.Args.ToString())))
                    .ToArray();

                history.Add(new AssistantChatMessage(toolCalls));

                foreach (var kv in toolMap.OrderBy(x => x.Key))
                {
                    var toolName = kv.Value.Name;
                    var toolId   = kv.Value.Id;
                    var argsJson = kv.Value.Args.ToString();

                    _logger.LogInformation("Executing tool '{Tool}' with args: {Args}", toolName, argsJson);

                    var result = await ExecuteToolAsync(tenantId, toolName, argsJson, ct);
                    history.Add(new ToolChatMessage(toolId, result));

                    yield return $"\n\n[Tool: {toolName}]\n";
                }

                continue;
            }

            // ── Normal finish ────────────────────────────────────────────────
            if (textBuffer.Length > 0)
                history.Add(new AssistantChatMessage(textBuffer.ToString()));

            break;
        }

        // Pass existingConv so SaveHistoryAsync doesn't re-query the same row
        await SaveHistoryAsync(tenantId, sessionId, history, existingConv);
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
                    if (_leadSavedThisRequest)
                        return "Lead was already saved for this customer in this session. Do not call save_lead again.";

                    var args = JsonSerializer.Deserialize<SaveLeadArgs>(
                        argsJson,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                    if (args is null)
                        return "Error: could not parse save_lead arguments.";

                    if (string.IsNullOrWhiteSpace(args.CustomerName))
                        return "Error: customer_name is missing. Please ask the customer for their full name before saving.";

                    if (string.IsNullOrWhiteSpace(args.Phone))
                        return "Error: phone is missing. Please ask the customer for their phone number before saving.";

                    var lead = await _leadRepo.CreateAsync(new Lead
                    {
                        TenantId     = tenantId,
                        CustomerName = args.CustomerName,
                        Phone        = args.Phone,
                        Requirements = args.Requirements ?? string.Empty,
                        QuotedPrice  = args.QuotedPrice,
                    });

                    _leadSavedThisRequest = true;

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

    /// <summary>
    /// Loads conversation history and returns the tracked <see cref="Conversation"/> entity.
    /// The entity is passed directly to <see cref="SaveHistoryAsync"/> so that method
    /// does not need to re-query the same row — eliminating one DB round-trip per message.
    /// </summary>
    private async Task<(List<ChatMessage> Messages, Conversation? Entity)> LoadHistoryAsync(
        Guid tenantId, string sessionId, string systemPrompt)
    {
        var conversation = await _db.Conversations
            .FirstOrDefaultAsync(c => c.TenantId == tenantId && c.SessionId == sessionId);

        var messages = new List<ChatMessage> { new SystemChatMessage(systemPrompt) };

        if (conversation is null)
            return (messages, null);

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
            _logger.LogWarning(ex,
                "Failed to deserialize conversation history for session {SessionId}", sessionId);
        }

        return (messages, conversation);
    }

    private async Task SaveHistoryAsync(
        Guid tenantId, string sessionId, List<ChatMessage> messages,
        Conversation? existingConv)   // passed from LoadHistoryAsync — no re-query needed
    {
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
            }
        }

        var json = JsonSerializer.Serialize(stored);

        try
        {
            if (existingConv is null)
            {
                // New conversation — no query needed, just insert
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
                // Existing conversation — entity is already tracked, just update fields
                existingConv.MessagesJson = json;
                existingConv.UpdatedAt    = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to save conversation history for session {SessionId}", sessionId);
        }
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    private sealed class ToolCallBuffer
    {
        public string        Id   { get; set; } = "";
        public string        Name { get; set; } = "";
        public StringBuilder Args { get; }      = new();
    }

    private record StoredMessage(string Role, string Content);
}
