using ConstructionWidget.Core.Entities;
using ConstructionWidget.Core.Interfaces;
using ConstructionWidget.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;

namespace ConstructionWidget.Api.Controllers;

/// <summary>
/// Super-admin endpoint for provisioning new tenant accounts.
/// Protected by X-Admin-Secret header — only the platform operator can call this.
///
/// Usage (Postman / curl):
///   POST /api/admin/tenants
///   Header: X-Admin-Secret: &lt;value of AdminSecret in appsettings.json&gt;
///   Body: { "name": "Acme Fencing", "ownerEmail": "...", "password": "...", "notificationEmail": "..." }
/// </summary>
[ApiController]
[Route("api/admin/tenants")]
public class TenantsController : ControllerBase
{
    private readonly ITenantRepository _tenantRepo;
    private readonly IConfiguration _config;

    public TenantsController(ITenantRepository tenantRepo, IConfiguration config)
    {
        _tenantRepo = tenantRepo;
        _config     = config;
    }

    [HttpPost]
    public async Task<IActionResult> CreateTenant([FromBody] CreateTenantRequest req)
    {
        // ── Verify admin secret ────────────────────────────────────────────────
        var expectedSecret = _config["AdminSecret"];
        if (!string.IsNullOrEmpty(expectedSecret))
        {
            var provided = Request.Headers["X-Admin-Secret"].ToString();
            if (!string.Equals(provided, expectedSecret, StringComparison.Ordinal))
                return Unauthorized(new { error = "Invalid or missing X-Admin-Secret header." });
        }

        // ── Validate ───────────────────────────────────────────────────────────
        if (string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(new { error = "Name is required." });

        if (string.IsNullOrWhiteSpace(req.OwnerEmail))
            return BadRequest(new { error = "OwnerEmail is required." });

        if (string.IsNullOrWhiteSpace(req.Password) || req.Password.Length < 8)
            return BadRequest(new { error = "Password must be at least 8 characters." });

        // ── Duplicate email check ──────────────────────────────────────────────
        var existing = await _tenantRepo.GetByEmailAsync(req.OwnerEmail.Trim());
        if (existing is not null)
            return Conflict(new { error = $"A tenant with email '{req.OwnerEmail}' already exists." });

        // ── Create tenant ──────────────────────────────────────────────────────
        var tenant = new Tenant
        {
            Id            = Guid.NewGuid(),
            Name          = req.Name.Trim(),
            OwnerEmail    = req.OwnerEmail.Trim().ToLowerInvariant(),
            PasswordHash  = AuthService.HashPassword(req.Password),
            ApiKey        = Guid.NewGuid().ToString("N"),
            NotificationEmail = string.IsNullOrWhiteSpace(req.NotificationEmail)
                                ? req.OwnerEmail.Trim().ToLowerInvariant()
                                : req.NotificationEmail.Trim(),
            IsActive  = true,
            CreatedAt = DateTime.UtcNow
        };

        await _tenantRepo.CreateAsync(tenant);

        return Ok(new
        {
            tenantId          = tenant.Id,
            name              = tenant.Name,
            ownerEmail        = tenant.OwnerEmail,
            apiKey            = tenant.ApiKey,
            notificationEmail = tenant.NotificationEmail,
            message           = $"Tenant '{tenant.Name}' created. Send the client: login URL, their email, and the temporary password you chose."
        });
    }
}

public record CreateTenantRequest(
    string  Name,
    string  OwnerEmail,
    string  Password,
    string? NotificationEmail);
