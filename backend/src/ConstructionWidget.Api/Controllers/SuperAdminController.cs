using ConstructionWidget.Application.DTOs;
using ConstructionWidget.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConstructionWidget.Api.Controllers;

/// <summary>
/// Super admin operations — protected by JWT with role:superadmin.
/// Login via POST /api/auth/superadmin/login to obtain the token.
/// </summary>
[ApiController]
[Route("api/superadmin")]
[Authorize(Roles = "superadmin")]
public class SuperAdminController : ControllerBase
{
    private readonly ISuperAdminService _superAdminService;

    public SuperAdminController(ISuperAdminService superAdminService)
        => _superAdminService = superAdminService;

    [HttpGet("stats")]
    public async Task<ActionResult<PlatformStatsDto>> GetStats()
        => Ok(await _superAdminService.GetStatsAsync());

    [HttpGet("tenants")]
    public async Task<ActionResult<IEnumerable<TenantSummaryDto>>> GetTenants()
        => Ok(await _superAdminService.GetAllTenantsAsync());

    [HttpPost("tenants")]
    public async Task<ActionResult<TenantDto>> CreateTenant([FromBody] CreateTenantDto req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(new { error = "Name is required." });

        if (string.IsNullOrWhiteSpace(req.OwnerEmail))
            return BadRequest(new { error = "OwnerEmail is required." });

        if (string.IsNullOrWhiteSpace(req.Password) || req.Password.Length < 8)
            return BadRequest(new { error = "Password must be at least 8 characters." });

        return Ok(await _superAdminService.CreateTenantAsync(req));
    }

    [HttpPut("tenants/{id:guid}/toggle")]
    public async Task<IActionResult> ToggleTenant(Guid id)
    {
        var ok = await _superAdminService.ToggleTenantAsync(id);
        return ok ? Ok(new { message = "Tenant status toggled." }) : NotFound();
    }

    [HttpDelete("tenants/{id:guid}")]
    public async Task<IActionResult> DeleteTenant(Guid id)
    {
        var ok = await _superAdminService.DeleteTenantAsync(id);
        return ok ? NoContent() : NotFound();
    }
}
