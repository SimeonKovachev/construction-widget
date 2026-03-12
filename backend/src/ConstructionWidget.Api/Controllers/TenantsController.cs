using ConstructionWidget.Core.Entities;
using ConstructionWidget.Core.Interfaces;
using ConstructionWidget.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;

namespace ConstructionWidget.Api.Controllers;

/// <summary>
/// Public endpoint to create tenants (onboarding).
/// In production, protect this with a super-admin secret header.
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
        _config = config;
    }

    [HttpPost]
    public async Task<IActionResult> CreateTenant([FromBody] CreateTenantRequest request)
    {
        // Simple super-admin guard
        var adminSecret = _config["AdminSecret"];
        if (!string.IsNullOrEmpty(adminSecret))
        {
            if (!Request.Headers.TryGetValue("X-Admin-Secret", out var secret) || secret != adminSecret)
                return Unauthorized(new { error = "Admin secret required." });
        }

        var existing = await _tenantRepo.GetByEmailAsync(request.OwnerEmail);
        if (existing is not null)
            return Conflict(new { error = "An account with this email already exists." });

        var tenant = new Tenant
        {
            Name = request.Name,
            OwnerEmail = request.OwnerEmail,
            PasswordHash = AuthService.HashPassword(request.Password),
            ApiKey = Guid.NewGuid().ToString("N"),
            IsActive = true
        };

        await _tenantRepo.CreateAsync(tenant);

        return CreatedAtAction(nameof(CreateTenant), new
        {
            tenant.Id,
            tenant.Name,
            tenant.OwnerEmail,
            tenant.ApiKey,
            message = "Tenant created. Use the ApiKey for widget embedding and the email/password for admin login."
        });
    }
}

public record CreateTenantRequest(string Name, string OwnerEmail, string Password);
