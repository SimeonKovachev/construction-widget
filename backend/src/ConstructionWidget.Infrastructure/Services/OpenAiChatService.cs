using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using ConstructionWidget.Core.Entities;
using ConstructionWidget.Core.Interfaces;
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
    private readonly IConversationRepository    _conversationRepo;
    private readonly EstimateService            _estimateService;
    private readonly ILeadRepository            _leadRepo;
    private readonly ILeadNotificationService   _notificationService;
    private readonly ITenantRepository          _tenantRepo;
    private readonly OpenAIClient               _openAiClient;
    private readonly OpenAiOptions              _options;
    private readonly ILogger<OpenAiChatService> _logger;

    private const int MaxToolRounds = 6;
    private bool _leadSavedThisRequest = false;

    private static readonly ChatTool SaveLeadTool = ChatTool.CreateFunctionTool(
        "save_lead",
        "Save the customer's contact details and the quoted price as a lead. " +
        "Call this EXACTLY ONCE per conversation — only after you have BOTH the customer's name AND phone number.",
        BinaryData.FromString("""
        {
          "type": "object",
          "properties": {
            "customer_name": { "type": "string",  "description": "Customer's full name" },
            "phone":         { "type": "string",  "description": "Customer's phone number" },
            "email":         { "type": "string",  "description": "Customer's email address (optional — only include if provided)" },
            "requirements":  { "type": "string",  "description": "Full summary of what the customer wants, including any delivery or scheduling preferences" },
            "quoted_price":  { "type": "number",  "description": "The price that was quoted to the customer" }
          },
          "required": ["customer_name", "phone", "requirements", "quoted_price"]
        }
        """));

    public OpenAiChatService(
        IConversationRepository    conversationRepo,
        EstimateService            estimateService,
        ILeadRepository            leadRepo,
        ILeadNotificationService   notificationService,
        ITenantRepository          tenantRepo,
        OpenAIClient               openAiClient,
        IOptions<OpenAiOptions>    options,
        ILogger<OpenAiChatService> logger)
    {
        _conversationRepo    = conversationRepo;
        _estimateService     = estimateService;
        _leadRepo            = leadRepo;
        _notificationService = notificationService;
        _tenantRepo          = tenantRepo;
        _openAiClient        = openAiClient;
        _options             = options.Value;
        _logger              = logger;
    }

    private async Task<(string systemPrompt, ChatTool calculatePriceTool)> BuildChatContextAsync(Guid tenantId)
    {
        var config = await _estimateService.GetPricingConfigAsync(tenantId);
        var sb     = new StringBuilder();

        sb.Append("You are a professional, friendly sales assistant. ");
        sb.Append("Start by greeting the customer warmly. ");
        sb.Append("Do NOT immediately ask for product details — let the conversation flow naturally. ");
        sb.Append("Only ask for dimensions and material when the customer expresses interest in a quote. ");

        string categoryDescription;

        if (config?.Categories is { Count: > 0 } cats)
        {
            sb.AppendLine("The available product catalog is:");
            foreach (var (cat, catPricing) in cats)
                sb.AppendLine($"- Category \"{cat}\": available materials: {string.Join(", ", catPricing.Materials.Keys)}");

            sb.Append("Only quote products that exist in the catalog above. ");
            sb.Append("If the customer asks for something not in the catalog, say it is not available. ");
            categoryDescription = "Product category. Available: " +
                string.Join(", ", cats.Keys.Select(k => $"\"{k}\""));
        }
        else
        {
            sb.Append("No product catalog has been configured yet. ");
            sb.Append("If asked for a price quote, politely explain that pricing is not set up yet. ");
            categoryDescription = "Product category (e.g. \"windows\", \"doors\", \"fencing\")";
        }

        sb.Append("When you have category, material, width, height, and unit — call 'calculate_price' immediately. ");
        sb.Append("After quoting the price, send ONE message asking for: full name, phone number, email address (optional), and any delivery or scheduling preferences. ");
        sb.Append("Wait for the customer's reply, then call 'save_lead' EXACTLY ONCE — include any delivery preferences in the 'requirements' field. ");
        sb.Append("After calling save_lead, confirm the lead is saved and wish them well. Do NOT ask any more questions and do NOT call save_lead again. ");
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
    ""material"": {{ ""type"": ""string"", ""description"": ""Material type matching one of the configured materials"" }},
    ""unit"":     {{ ""type"": ""string"", ""enum"": [""mm"", ""cm"", ""m"", ""ft"", ""in""], ""description"": ""Unit of measurement"" }}
  }},
  ""required"": [""category"", ""width"", ""height"", ""material"", ""unit""]
}}"));

        return (sb.ToString(), calculatePriceTool);
    }

    public async IAsyncEnumerable<string> StreamResponseAsync(
        Guid tenantId, string sessionId, string userMessage,
        [EnumeratorCancellation] CancellationToken ct = default)
    {
        var (systemPrompt, calculatePriceTool) = await BuildChatContextAsync(tenantId);
        var (history, existingConv)            = await LoadHistoryAsync(tenantId, sessionId, systemPrompt);
        history.Add(new UserChatMessage(userMessage));

        var chatClient  = _openAiClient.GetChatClient(_options.Model);
        var chatOptions = new ChatCompletionOptions { Tools = { calculatePriceTool, SaveLeadTool } };

        for (int round = 0; round < MaxToolRounds && !ct.IsCancellationRequested; round++)
        {
            var textBuffer   = new StringBuilder();
            var toolMap      = new Dictionary<int, ToolCallBuffer>();
            var finishReason = ChatFinishReason.Stop;

            await foreach (var update in chatClient.CompleteChatStreamingAsync(history, chatOptions, ct))
            {
                foreach (var part in update.ContentUpdate)
                {
                    if (!string.IsNullOrEmpty(part.Text))
                    {
                        textBuffer.Append(part.Text);
                        yield return part.Text;
                    }
                }

                foreach (var td in update.ToolCallUpdates)
                {
                    if (!toolMap.TryGetValue(td.Index, out var buf))
                        toolMap[td.Index] = buf = new ToolCallBuffer();

                    if (!string.IsNullOrEmpty(td.ToolCallId))   buf.Id   = td.ToolCallId;
                    if (!string.IsNullOrEmpty(td.FunctionName)) buf.Name = td.FunctionName;

                    if (td.FunctionArgumentsUpdate is { } argData)
                    {
                        var bytes = argData.ToArray();
                        if (bytes.Length > 0) buf.Args.Append(Encoding.UTF8.GetString(bytes));
                    }
                }

                if (update.FinishReason.HasValue) finishReason = update.FinishReason.Value;
            }

            if (finishReason == ChatFinishReason.ToolCalls && toolMap.Count > 0)
            {
                if (textBuffer.Length > 0)
                    history.Add(new AssistantChatMessage(textBuffer.ToString()));

                var toolCalls = toolMap.OrderBy(kv => kv.Key)
                    .Select(kv => ChatToolCall.CreateFunctionToolCall(
                        kv.Value.Id, kv.Value.Name, BinaryData.FromString(kv.Value.Args.ToString())))
                    .ToArray();

                history.Add(new AssistantChatMessage(toolCalls));

                foreach (var kv in toolMap.OrderBy(x => x.Key))
                {
                    _logger.LogInformation("Tool '{Tool}' args: {Args}", kv.Value.Name, kv.Value.Args);
                    var result = await ExecuteToolAsync(tenantId, sessionId, kv.Value.Name, kv.Value.Args.ToString(), ct);
                    history.Add(new ToolChatMessage(kv.Value.Id, result));
                    yield return $"\n\n[Tool: {kv.Value.Name}]\n";
                }
                continue;
            }

            if (textBuffer.Length > 0) history.Add(new AssistantChatMessage(textBuffer.ToString()));
            break;
        }

        await SaveHistoryAsync(tenantId, sessionId, history, existingConv);
    }

    private async Task<string> ExecuteToolAsync(
        Guid tenantId, string sessionId, string toolName, string argsJson, CancellationToken ct)
    {
        try
        {
            switch (toolName)
            {
                case "calculate_price":
                {
                    var args = JsonSerializer.Deserialize<CalculatePriceArgs>(
                        argsJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (args is null) return "Error: could not parse calculate_price arguments.";

                    var price = await _estimateService.CalculatePriceAsync(
                        args.Category, args.Width, args.Height, args.Material, args.Unit);

                    return $"Calculated price: ${price:F2}. (Category: {args.Category}, " +
                           $"{args.Width}x{args.Height} {args.Unit}, Material: {args.Material})";
                }

                case "save_lead":
                {
                    if (_leadSavedThisRequest) return "Lead already saved. Do not call save_lead again.";

                    // Session-level dedup: prevent double-saves across multiple request scopes
                    if (await _leadRepo.ExistsBySessionAsync(tenantId, sessionId))
                    {
                        _leadSavedThisRequest = true;
                        return "Lead already saved for this session. Do not call save_lead again.";
                    }

                    var args = JsonSerializer.Deserialize<SaveLeadArgs>(
                        argsJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (args is null)                                 return "Error: could not parse save_lead arguments.";
                    if (string.IsNullOrWhiteSpace(args.CustomerName)) return "Error: customer_name is missing.";
                    if (string.IsNullOrWhiteSpace(args.Phone))        return "Error: phone is missing.";

                    var lead = await _leadRepo.CreateAsync(new Lead
                    {
                        TenantId     = tenantId,
                        SessionId    = sessionId,
                        CustomerName = args.CustomerName,
                        Phone        = args.Phone,
                        Email        = string.IsNullOrWhiteSpace(args.Email) ? null : args.Email,
                        Requirements = args.Requirements ?? string.Empty,
                        QuotedPrice  = args.QuotedPrice,
                    });

                    _leadSavedThisRequest = true;

                    var tenant = await _tenantRepo.GetByIdAsync(tenantId);
                    if (tenant is not null)
                    {
                        _ = Task.Run(async () =>
                        {
                            try { await _notificationService.NotifyLeadAsync(lead, tenant); }
                            catch (Exception ex) { _logger.LogWarning(ex, "Notification failed for {TenantId}", tenantId); }
                        }, CancellationToken.None);
                    }

                    return $"Lead saved for '{args.CustomerName}' ({args.Phone}).";
                }

                default: return $"Unknown tool: {toolName}";
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Tool '{Tool}' failed", toolName);
            return $"Tool error ({toolName}): {ex.Message}";
        }
    }

    private async Task<(List<ChatMessage> Messages, Conversation? Entity)> LoadHistoryAsync(
        Guid tenantId, string sessionId, string systemPrompt)
    {
        var conversation = await _conversationRepo.GetBySessionAsync(tenantId, sessionId);
        var messages     = new List<ChatMessage> { new SystemChatMessage(systemPrompt) };

        if (conversation is null) return (messages, null);

        try
        {
            var stored = JsonSerializer.Deserialize<List<StoredMessage>>(conversation.MessagesJson) ?? [];
            foreach (var m in stored)
            {
                if (m.Role == "user") messages.Add(new UserChatMessage(m.Content));
                else if (m.Role == "assistant" && !string.IsNullOrEmpty(m.Content))
                    messages.Add(new AssistantChatMessage(m.Content));
            }
        }
        catch (Exception ex) { _logger.LogWarning(ex, "Failed to deserialize history {SessionId}", sessionId); }

        return (messages, conversation);
    }

    private async Task SaveHistoryAsync(
        Guid tenantId, string sessionId, List<ChatMessage> messages, Conversation? existingConv)
    {
        var stored = new List<StoredMessage>();
        foreach (var m in messages.Skip(1))
        {
            if (m is UserChatMessage u && u.Content.Count > 0)
                stored.Add(new StoredMessage("user", u.Content[0].Text));
            else if (m is AssistantChatMessage a && a.Content.Count > 0 && !string.IsNullOrWhiteSpace(a.Content[0].Text))
                stored.Add(new StoredMessage("assistant", a.Content[0].Text));
        }

        var json = JsonSerializer.Serialize(stored);
        try
        {
            if (existingConv is null)
                await _conversationRepo.CreateAsync(new Conversation
                {
                    TenantId     = tenantId,
                    SessionId    = sessionId,
                    MessagesJson = json,
                    CreatedAt    = DateTime.UtcNow,
                    UpdatedAt    = DateTime.UtcNow,
                });
            else
                await _conversationRepo.UpdateHistoryAsync(existingConv.Id, json);
        }
        catch (Exception ex) { _logger.LogError(ex, "Failed to save history {SessionId}", sessionId); }
    }

    private sealed class ToolCallBuffer
    {
        public string        Id   { get; set; } = "";
        public string        Name { get; set; } = "";
        public StringBuilder Args { get; }      = new();
    }

    private record StoredMessage(string Role, string Content);
}
