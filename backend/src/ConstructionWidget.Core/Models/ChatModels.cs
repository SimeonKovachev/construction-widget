namespace ConstructionWidget.Core.Models;

public record ChatMessage(string Role, string Content);

public record CalculatePriceArgs(
    string Category,
    double Width,
    double Height,
    string Material,
    string Unit = "ft");

public record SaveLeadArgs(
    string CustomerName,
    string Phone,
    string Requirements,
    decimal QuotedPrice);

public record LoginRequest(string Email, string Password);

public record LoginResponse(string Token, Guid TenantId, string TenantName);

public record PriceListRow(
    string Category,
    string Material,
    decimal BasePrice,
    decimal PricePerSqFt,
    decimal? MinimumPrice);
