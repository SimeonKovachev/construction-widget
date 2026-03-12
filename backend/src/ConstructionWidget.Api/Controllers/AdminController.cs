using ConstructionWidget.Core.Entities;
using ConstructionWidget.Core.Interfaces;
using ConstructionWidget.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConstructionWidget.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize]
public class AdminController : ControllerBase
{
    private readonly ITenantRepository _tenantRepo;
    private readonly IEstimateService _estimateService;
    private readonly ITenantContext _tenantContext;

    public AdminController(
        ITenantRepository tenantRepo,
        IEstimateService estimateService,
        ITenantContext tenantContext)
    {
        _tenantRepo = tenantRepo;
        _estimateService = estimateService;
        _tenantContext = tenantContext;
    }

    [HttpGet("tenants/me")]
    public async Task<IActionResult> GetMe()
    {
        var tenant = await _tenantRepo.GetByIdAsync(_tenantContext.TenantId);
        if (tenant is null) return NotFound();

        return Ok(new
        {
            tenant.Id,
            tenant.Name,
            tenant.OwnerEmail,
            tenant.ApiKey,
            tenant.IsActive,
            tenant.NotificationEmail,
            tenant.CreatedAt
        });
    }

    [HttpPut("tenants/me")]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateTenantRequest req)
    {
        var tenant = await _tenantRepo.GetByIdAsync(_tenantContext.TenantId);
        if (tenant is null) return NotFound();

        // Re-fetch tracked entity
        var tracked = await GetTrackedTenantAsync(tenant.Id);
        if (tracked is null) return NotFound();

        if (!string.IsNullOrWhiteSpace(req.NotificationEmail))
            tracked.NotificationEmail = req.NotificationEmail;
        if (!string.IsNullOrWhiteSpace(req.SmtpHost))
            tracked.SmtpHost = req.SmtpHost;
        if (req.SmtpPort.HasValue)
            tracked.SmtpPort = req.SmtpPort;
        if (!string.IsNullOrWhiteSpace(req.SmtpUser))
            tracked.SmtpUser = req.SmtpUser;
        if (!string.IsNullOrWhiteSpace(req.SmtpPassword))
            tracked.SmtpPassword = req.SmtpPassword;

        await _tenantRepo.UpdateAsync(tracked);
        return Ok(new { message = "Tenant updated." });
    }

    [HttpPost("pricelist")]
    public async Task<IActionResult> UploadPriceList(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No file uploaded." });

        if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "Only CSV files are accepted." });

        if (file.Length > 1_048_576) // 1 MB limit
            return BadRequest(new { error = "File too large. Max 1 MB." });

        using var reader = new StreamReader(file.OpenReadStream());
        var csvContent = await reader.ReadToEndAsync();

        await _estimateService.UpdatePriceListAsync(_tenantContext.TenantId, csvContent);
        return Ok(new { message = "Price list updated successfully." });
    }

    [HttpGet("pricelist")]
    public async Task<IActionResult> GetPriceList()
    {
        var config = await _estimateService.GetPricingConfigAsync(_tenantContext.TenantId);
        if (config is null) return NotFound();
        return Ok(config);
    }

    // Needed for tracked update
    private async Task<Tenant?> GetTrackedTenantAsync(Guid id)
    {
        // This bypasses AsNoTracking in repo — OK here since we control the context scope
        return await _tenantRepo.GetByIdAsync(id) is { } t
            ? new Tenant
            {
                Id = t.Id, Name = t.Name, ApiKey = t.ApiKey, PricingConfig = t.PricingConfig,
                IsActive = t.IsActive, CreatedAt = t.CreatedAt, OwnerEmail = t.OwnerEmail,
                PasswordHash = t.PasswordHash, NotificationEmail = t.NotificationEmail,
                SmtpHost = t.SmtpHost, SmtpPort = t.SmtpPort, SmtpUser = t.SmtpUser,
                SmtpPassword = t.SmtpPassword
            }
            : null;
    }
}

public record UpdateTenantRequest(
    string? NotificationEmail,
    string? SmtpHost,
    int? SmtpPort,
    string? SmtpUser,
    string? SmtpPassword);
