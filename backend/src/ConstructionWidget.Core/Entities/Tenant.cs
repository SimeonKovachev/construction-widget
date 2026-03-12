namespace ConstructionWidget.Core.Entities;

public class Tenant
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public string PricingConfig { get; set; } = "{}";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Auth
    public string OwnerEmail { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;

    // Notifications
    public string? NotificationEmail { get; set; }
    public string? SmtpHost { get; set; }
    public int? SmtpPort { get; set; }
    public string? SmtpUser { get; set; }
    public string? SmtpPassword { get; set; }

    // Navigation
    public ICollection<Lead> Leads { get; set; } = [];
    public ICollection<Conversation> Conversations { get; set; } = [];
}
