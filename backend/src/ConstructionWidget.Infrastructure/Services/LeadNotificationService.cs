using ConstructionWidget.Core.Entities;
using ConstructionWidget.Core.Interfaces;
using FluentEmail.Core;
using FluentEmail.Smtp;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net.Mail;
using System.Text;

namespace ConstructionWidget.Infrastructure.Services;

public class SmtpOptions
{
    public string Host { get; set; } = "localhost";
    public int Port { get; set; } = 587;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromEmail { get; set; } = "noreply@saleswidget.com";
    public string FromName { get; set; } = "Sales Widget";
}

public class LeadNotificationService : ILeadNotificationService
{
    private readonly SmtpOptions _globalSmtp;
    private readonly ILogger<LeadNotificationService> _logger;

    public LeadNotificationService(
        IOptions<SmtpOptions> smtpOptions,
        ILogger<LeadNotificationService> logger)
    {
        _globalSmtp = smtpOptions.Value;
        _logger = logger;
    }

    public async Task NotifyLeadAsync(Lead lead, Tenant tenant)
    {
        if (string.IsNullOrWhiteSpace(tenant.NotificationEmail))
        {
            _logger.LogWarning(
                "No notification email configured for tenant {TenantId} ({TenantName}). Skipping.",
                tenant.Id, tenant.Name);
            return;
        }

        var sender = BuildSmtpSender(tenant);
        var fromName = !string.IsNullOrEmpty(tenant.SmtpUser) ? tenant.Name : _globalSmtp.FromName;

        try
        {
            var fluentEmail = FluentEmail.Core.Email
                .From(_globalSmtp.FromEmail, fromName)
                .To(tenant.NotificationEmail)
                .Subject($"New Lead: {lead.CustomerName} — {tenant.Name}")
                .Body(BuildEmailBody(lead, tenant), isHtml: true);

            var result = await sender.SendAsync(fluentEmail);

            if (!result.Successful)
                throw new InvalidOperationException(
                    $"Email failed: {string.Join(", ", result.ErrorMessages)}");

            _logger.LogInformation(
                "Lead notification sent to {Email} for tenant {TenantId}",
                tenant.NotificationEmail, tenant.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to send lead notification for tenant {TenantId}", tenant.Id);
            throw;
        }
    }

    private SmtpSender BuildSmtpSender(Tenant tenant)
    {
        var host = tenant.SmtpHost ?? _globalSmtp.Host;
        var port = tenant.SmtpPort ?? _globalSmtp.Port;
        var user = tenant.SmtpUser ?? _globalSmtp.Username;
        var pass = tenant.SmtpPassword ?? _globalSmtp.Password;

        return new SmtpSender(() =>
        {
            var client = new SmtpClient(host, port)
            {
                EnableSsl = port != 25,
                DeliveryMethod = SmtpDeliveryMethod.Network
            };

            if (!string.IsNullOrEmpty(user))
                client.Credentials = new System.Net.NetworkCredential(user, pass);

            return client;
        });
    }

    private static string BuildEmailBody(Lead lead, Tenant tenant)
    {
        var sb = new StringBuilder();
        sb.AppendLine("<!DOCTYPE html><html><body style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px'>");
        sb.AppendLine($"<h2 style='color:#2563eb'>🔔 New Lead for {tenant.Name}</h2>");
        sb.AppendLine("<table style='width:100%;border-collapse:collapse'>");
        sb.AppendLine(Row("Customer Name", lead.CustomerName));
        sb.AppendLine(Row("Phone", lead.Phone));
        sb.AppendLine(Row("Requirements", lead.Requirements));
        sb.AppendLine(Row("Quoted Price", $"<strong>${lead.QuotedPrice:F2}</strong>"));
        sb.AppendLine(Row("Date", lead.CreatedAt.ToString("f")));
        sb.AppendLine("</table>");
        sb.AppendLine("<p style='color:#6b7280;margin-top:20px;font-size:12px'>This notification was sent by Sales Widget.</p>");
        sb.AppendLine("</body></html>");
        return sb.ToString();
    }

    private static string Row(string label, string value) =>
        $"<tr><td style='padding:8px;border-bottom:1px solid #e5e7eb;color:#6b7280;width:140px'>{label}</td>" +
        $"<td style='padding:8px;border-bottom:1px solid #e5e7eb'>{value}</td></tr>";
}
