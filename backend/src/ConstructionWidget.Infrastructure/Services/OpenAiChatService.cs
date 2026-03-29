using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using ConstructionWidget.Core.Entities;
using ConstructionWidget.Core.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using OpenAI;
using OpenAI.Chat;
using CalculatePriceArgs       = ConstructionWidget.Core.Models.CalculatePriceArgs;
using SaveLeadArgs             = ConstructionWidget.Core.Models.SaveLeadArgs;
using RequestCallbackArgs      = ConstructionWidget.Core.Models.RequestCallbackArgs;

namespace ConstructionWidget.Infrastructure.Services;

public class OpenAiOptions
{
    public string ApiKey { get; set; } = string.Empty;
    public string Model  { get; set; } = "gpt-4o";
}

public class OpenAiChatService : IOpenAiChatService
{
    private readonly IConversationRepository      _conversationRepo;
    private readonly EstimateService              _estimateService;
    private readonly ILeadRepository              _leadRepo;
    private readonly ILeadNotificationService     _notificationService;
    private readonly ITenantRepository            _tenantRepo;
    private readonly ITenantDocumentRepository    _documentRepo;
    private readonly OpenAIClient                 _openAiClient;
    private readonly OpenAiOptions                _options;
    private readonly ILogger<OpenAiChatService>   _logger;
    private readonly string                       _webRootPath;

    private const int MaxToolRounds = 6;
    private bool _leadSavedThisRequest = false;
    private List<string>? _pendingImageUrls;  // set during streaming for SaveHistory

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

    private static readonly ChatTool RequestCallbackTool = ChatTool.CreateFunctionTool(
        "request_callback",
        "Request a callback from a real team member. Call this when the customer wants to speak to a real person, manager, or get a phone callback.",
        BinaryData.FromString("""
        {
          "type": "object",
          "properties": {
            "customer_name": { "type": "string",  "description": "Customer's name (if provided)" },
            "phone":         { "type": "string",  "description": "Customer's phone number (if provided)" },
            "email":         { "type": "string",  "description": "Customer's email (if provided)" },
            "reason":        { "type": "string",  "description": "Why the customer wants a callback — brief summary of conversation context" }
          },
          "required": ["reason"]
        }
        """));

    /// <param name="webRootPath">
    /// Absolute path to wwwroot — registered in Program.cs via
    /// <c>builder.Services.AddSingleton(env.WebRootPath)</c> so Infrastructure
    /// doesn't depend on Microsoft.AspNetCore.Hosting.
    /// </param>
    public OpenAiChatService(
        IConversationRepository    conversationRepo,
        EstimateService            estimateService,
        ILeadRepository            leadRepo,
        ILeadNotificationService   notificationService,
        ITenantRepository          tenantRepo,
        ITenantDocumentRepository  documentRepo,
        OpenAIClient               openAiClient,
        IOptions<OpenAiOptions>    options,
        ILogger<OpenAiChatService> logger,
        WebRootPathAccessor        webRootPathAccessor)
    {
        _conversationRepo    = conversationRepo;
        _estimateService     = estimateService;
        _leadRepo            = leadRepo;
        _notificationService = notificationService;
        _tenantRepo          = tenantRepo;
        _documentRepo        = documentRepo;
        _openAiClient        = openAiClient;
        _options             = options.Value;
        _logger              = logger;
        _webRootPath         = webRootPathAccessor.Path;
    }

    private async Task<(string systemPrompt, ChatTool calculatePriceTool)> BuildChatContextAsync(Guid tenantId)
    {
        var config = await _estimateService.GetPricingConfigAsync(tenantId);
        var sb     = new StringBuilder();

        // ── Core personality ──────────────────────────────────────────────────
        sb.AppendLine("You are a warm, friendly, and empathetic sales assistant — think of yourself as a real person chatting with a customer, NOT a calculator or FAQ bot.");
        sb.AppendLine("Write like a real human: short sentences, natural language, no bullet lists, no walls of text.");
        sb.AppendLine("Keep every response to 2-3 sentences max unless you are giving a detailed multi-item price breakdown.");
        sb.AppendLine("Match the customer's energy — if they are casual, be casual. If formal, be formal.");
        sb.AppendLine("Never start two consecutive responses with the same word. Vary your openings.");
        sb.AppendLine();

        // ── Product catalog ──────────────────────────────────────────────────
        string categoryDescription;

        if (config?.Categories is { Count: > 0 } cats)
        {
            sb.AppendLine("The available product catalog is:");
            foreach (var (cat, catPricing) in cats)
                sb.AppendLine($"- Category \"{cat}\": available materials: {string.Join(", ", catPricing.Materials.Keys)}");

            sb.AppendLine("Only quote products that exist in the catalog above. If the customer asks for something not in the catalog, let them know it is not available and suggest what IS available.");
            categoryDescription = "Product category. Available: " +
                string.Join(", ", cats.Keys.Select(k => $"\"{k}\""));
        }
        else
        {
            sb.AppendLine("No product catalog has been configured yet. If asked for a price quote, politely explain that pricing is not set up yet and offer to connect them with the team.");
            categoryDescription = "Product category (e.g. \"windows\", \"doors\", \"fencing\")";
        }
        sb.AppendLine();

        // ── Knowledge base (company documents) ──────────────────────────────
        var docs = await _documentRepo.GetActiveByTenantAsync(tenantId);
        if (docs.Count > 0)
        {
            sb.AppendLine("=== COMPANY KNOWLEDGE BASE ===");
            sb.AppendLine("Use the following company information to answer customer questions accurately. If a question is NOT covered below, say you are not sure about the specifics and offer to have a team member follow up.");
            sb.AppendLine();
            foreach (var doc in docs)
            {
                sb.AppendLine($"--- {doc.Title} ---");
                sb.AppendLine(doc.Content);
                sb.AppendLine();
            }
        }

        // ── Quoting flow ─────────────────────────────────────────────────────
        sb.AppendLine("=== QUOTING FLOW ===");
        sb.AppendLine("When the customer wants a price quote, gather the product details naturally through conversation — do not interrogate them with a list of fields.");
        sb.AppendLine("Once you have category, material, width, height, and unit — call 'calculate_price' immediately.");
        sb.AppendLine("Present the price confidently with brief value context (e.g. 'That includes premium-grade materials and professional finishing').");
        sb.AppendLine("After quoting, send ONE message asking for: full name, phone number, email (optional), and any delivery or scheduling preferences.");
        sb.AppendLine("Wait for their reply, then call 'save_lead' EXACTLY ONCE. Include delivery preferences in the 'requirements' field.");
        sb.AppendLine("After save_lead succeeds, send one warm closing message and stop. Do NOT ask more questions or call save_lead again.");
        sb.AppendLine();

        // ── General questions ─────────────────────────────────────────────────
        sb.AppendLine("=== GENERAL QUESTIONS ===");
        sb.AppendLine("Customers may ask about products, materials, warranties, installation, delivery, or other topics without wanting a quote.");
        sb.AppendLine("Answer helpfully using the knowledge base above if available. If not covered, give general helpful information and offer to connect them with the team for specifics.");
        sb.AppendLine("Do NOT force every conversation into the quoting flow. Let the customer guide the conversation.");
        sb.AppendLine();

        // ── Objection handling ────────────────────────────────────────────────
        sb.AppendLine("=== OBJECTION HANDLING ===");
        sb.AppendLine("If the customer says the price is too high or expresses shock:");
        sb.AppendLine("1. Empathize FIRST: 'I completely understand — that is a significant investment.'");
        sb.AppendLine("2. Briefly explain what is included (quality materials, craftsmanship, etc.).");
        sb.AppendLine("3. Suggest alternatives: different material, fewer units, or smaller dimensions.");
        sb.AppendLine("4. Ask about their budget range so you can find something that works.");
        sb.AppendLine("5. Offer to have a manager reach out with a custom deal.");
        sb.AppendLine("NEVER just re-quote the same price they already rejected. NEVER repeat information they have already seen.");
        sb.AppendLine();

        // ── Rejection handling ────────────────────────────────────────────────
        sb.AppendLine("=== REJECTION HANDLING ===");
        sb.AppendLine("If the customer says 'no', 'I don't want anything', 'not interested', or any clear rejection:");
        sb.AppendLine("Accept IMMEDIATELY. Say something like: 'No problem at all! We are here whenever you need us. Have a great day!'");
        sb.AppendLine("Do NOT push alternatives, do NOT re-quote, do NOT try to convince them. ONE warm goodbye and stop.");
        sb.AppendLine("If the customer rejects TWICE, stop completely. No more selling.");
        sb.AppendLine();

        // ── Escalation to real person ─────────────────────────────────────────
        sb.AppendLine("=== ESCALATION ===");
        sb.AppendLine("If the customer asks to talk to a real person, speak to a manager, get a phone call, or says 'I want a human':");
        sb.AppendLine("1. Ask for their name and phone number (if you do not already have them).");
        sb.AppendLine("2. Call 'request_callback' with their details and a brief reason.");
        sb.AppendLine("3. Confirm: 'Absolutely! I have passed your details to our team — someone will reach out to you shortly.'");
        sb.AppendLine();

        // ── Photo analysis ───────────────────────────────────────────────────
        sb.AppendLine("=== PHOTO ANALYSIS ===");
        sb.AppendLine("Customers may send photos of their current windows, doors, fencing, or other products.");
        sb.AppendLine("When you receive a photo:");
        sb.AppendLine("1. Describe what you see briefly (type of product, condition, approximate style).");
        sb.AppendLine("2. If asked about dimensions, explain that exact measurements require a tape measure, but offer your best visual estimate if possible.");
        sb.AppendLine("3. Use the photo context to make better product recommendations.");
        sb.AppendLine("4. If the photo is unclear or not related to the products, acknowledge it politely and ask for clarification.");
        sb.AppendLine("Never say 'I cannot view images' — you CAN see photos sent by customers.");
        sb.AppendLine();

        // ── Emotional intelligence ────────────────────────────────────────────
        sb.AppendLine("=== EMOTIONAL INTELLIGENCE ===");
        sb.AppendLine("If the customer uses ALL CAPS, lots of exclamation marks, or sounds frustrated/angry:");
        sb.AppendLine("Acknowledge their feelings BEFORE responding to the content: 'I hear you, and I am sorry for the frustration.'");
        sb.AppendLine("Never be defensive. Never argue. Stay calm, professional, and helpful.");
        sb.AppendLine("If the customer insults prices or the company, stay professional and offer solutions or escalation.");

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
        List<string>? imageUrls = null,
        [EnumeratorCancellation] CancellationToken ct = default)
    {
        var (systemPrompt, calculatePriceTool) = await BuildChatContextAsync(tenantId);
        var (history, existingConv)            = await LoadHistoryAsync(tenantId, sessionId, systemPrompt);

        // Build user message with optional image content parts (gpt-4o vision)
        var userParts = new List<ChatMessageContentPart>();

        if (!string.IsNullOrWhiteSpace(userMessage))
            userParts.Add(ChatMessageContentPart.CreateTextPart(userMessage));

        if (imageUrls is { Count: > 0 })
        {
            foreach (var imageUrl in imageUrls)
            {
                try
                {
                    var fullPath = Path.Combine(_webRootPath, imageUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                    if (File.Exists(fullPath))
                    {
                        var bytes     = await File.ReadAllBytesAsync(fullPath, ct);
                        var mediaType = GetMediaType(fullPath);
                        userParts.Add(ChatMessageContentPart.CreateImagePart(
                            BinaryData.FromBytes(bytes), mediaType));
                    }
                }
                catch (Exception ex) { _logger.LogWarning(ex, "Failed to read image {Url}", imageUrl); }
            }

            // Store image metadata for history serialization
            _pendingImageUrls = imageUrls;
        }

        if (userParts.Count == 0)
            userParts.Add(ChatMessageContentPart.CreateTextPart(userMessage ?? ""));

        history.Add(new UserChatMessage(userParts));

        var chatClient  = _openAiClient.GetChatClient(_options.Model);
        var chatOptions = new ChatCompletionOptions { Tools = { calculatePriceTool, SaveLeadTool, RequestCallbackTool } };

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

                case "request_callback":
                {
                    var args = JsonSerializer.Deserialize<RequestCallbackArgs>(
                        argsJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (args is null) return "Error: could not parse request_callback arguments.";

                    // Save as escalated lead so it appears prominently in admin dashboard
                    var lead = await _leadRepo.CreateAsync(new Lead
                    {
                        TenantId     = tenantId,
                        SessionId    = sessionId,
                        CustomerName = args.CustomerName ?? "Callback Request",
                        Phone        = args.Phone ?? string.Empty,
                        Email        = string.IsNullOrWhiteSpace(args.Email) ? null : args.Email,
                        Requirements = $"[CALLBACK REQUEST] {args.Reason}",
                        QuotedPrice  = 0,
                        Status       = "escalated",
                    });

                    // Send urgent email notification to admin
                    var tenant = await _tenantRepo.GetByIdAsync(tenantId);
                    if (tenant is not null)
                    {
                        _ = Task.Run(async () =>
                        {
                            try { await _notificationService.NotifyLeadAsync(lead, tenant); }
                            catch (Exception ex) { _logger.LogWarning(ex, "Callback notification failed for {TenantId}", tenantId); }
                        }, CancellationToken.None);
                    }

                    return "Callback request saved and team notified. A team member will reach out to the customer shortly.";
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
                if (m.Role == "user")
                {
                    if (m.Type == "image" && m.ImageUrls is { Count: > 0 })
                    {
                        // Historical image: include text reference so AI remembers photos were shared
                        var text = string.IsNullOrWhiteSpace(m.Content) || m.Content == "📷 Photo uploaded"
                            ? $"[Customer sent {m.ImageUrls.Count} photo(s)]"
                            : m.Content;
                        messages.Add(new UserChatMessage(text));
                    }
                    else
                    {
                        messages.Add(new UserChatMessage(m.Content));
                    }
                }
                else if (m.Role == "assistant" && !string.IsNullOrEmpty(m.Content))
                {
                    messages.Add(new AssistantChatMessage(m.Content));
                }
            }
        }
        catch (Exception ex) { _logger.LogWarning(ex, "Failed to deserialize history {SessionId}", sessionId); }

        return (messages, conversation);
    }

    private async Task SaveHistoryAsync(
        Guid tenantId, string sessionId, List<ChatMessage> messages, Conversation? existingConv)
    {
        var stored = new List<StoredMessage>();

        try
        {
            var userMessages = messages.Skip(1).OfType<UserChatMessage>().ToList();
            var lastUserMsg  = userMessages.LastOrDefault();

            foreach (var m in messages.Skip(1))
            {
                if (m is UserChatMessage u)
                {
                    var text = ExtractText(u.Content);

                    // Attach image URLs to the last user message in this request
                    if (ReferenceEquals(m, lastUserMsg) && _pendingImageUrls is { Count: > 0 })
                    {
                        stored.Add(new StoredMessage("user", text, "image", _pendingImageUrls));
                        continue;
                    }

                    stored.Add(new StoredMessage("user", text));
                }
                else if (m is AssistantChatMessage a)
                {
                    var text = ExtractText(a.Content);
                    if (!string.IsNullOrWhiteSpace(text))
                        stored.Add(new StoredMessage("assistant", text));
                }
                // ToolChatMessage and other types are intentionally skipped
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to build stored messages for {SessionId} — saving raw fallback", sessionId);
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

    private record StoredMessage(string Role, string Content, string? Type = "text", List<string>? ImageUrls = null);

    private static string ExtractText(IList<ChatMessageContentPart>? parts)
    {
        if (parts is null || parts.Count == 0) return string.Empty;
        var sb = new StringBuilder();
        foreach (var p in parts)
        {
            try { if (p.Text is { Length: > 0 } t) sb.Append(t); }
            catch { /* image or unknown part — skip */ }
        }
        return sb.ToString().Trim();
    }

    private static string GetMediaType(string filePath)
    {
        var ext = Path.GetExtension(filePath).ToLowerInvariant();
        return ext switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png"            => "image/png",
            ".webp"           => "image/webp",
            ".gif"            => "image/gif",
            _                 => "image/jpeg",
        };
    }
}
