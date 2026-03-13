namespace ConstructionWidget.Core.Entities;

public class Lead
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Requirements { get; set; } = string.Empty;
    public decimal QuotedPrice { get; set; }

    /// <summary>Lead lifecycle status: new | contacted | quoted | converted | lost</summary>
    public string Status { get; set; } = "new";

    /// <summary>Internal admin notes — not visible to the customer</summary>
    public string? Notes { get; set; }

    /// <summary>JSON blob for business-specific extra fields collected by the AI</summary>
    public string? ExtrasJson { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation
    public Tenant Tenant { get; set; } = null!;
}
