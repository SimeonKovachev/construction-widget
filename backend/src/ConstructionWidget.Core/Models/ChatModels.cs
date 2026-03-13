using System.Text.Json.Serialization;

namespace ConstructionWidget.Core.Models;

public record ChatMessage(string Role, string Content);

public record CalculatePriceArgs(
    string Category,
    double Width,
    double Height,
    string Material,
    string Unit = "ft");

// OpenAI passes these as snake_case JSON; [JsonPropertyName] maps them correctly.
// PropertyNameCaseInsensitive only ignores case, NOT underscores — so
// "customer_name" would NOT map to CustomerName without this attribute.
public record SaveLeadArgs(
    [property: JsonPropertyName("customer_name")] string CustomerName,
    [property: JsonPropertyName("phone")]          string Phone,
    [property: JsonPropertyName("requirements")]   string Requirements,
    [property: JsonPropertyName("quoted_price")]   decimal QuotedPrice,
    [property: JsonPropertyName("email")]          string? Email);

public record LoginRequest(string Email, string Password);

public record LoginResponse(string Token, Guid TenantId, string TenantName);

public record PriceListRow(
    string Category,
    string Material,
    decimal BasePrice,
    decimal PricePerSqFt,
    decimal? MinimumPrice);
