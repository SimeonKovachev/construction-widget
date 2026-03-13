using ConstructionWidget.Core.Entities;
using ConstructionWidget.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConstructionWidget.Api.Controllers;

[ApiController]
[Route("api/admin/leads")]
[Authorize]
public class LeadsController : ControllerBase
{
    private readonly ILeadRepository _leadRepo;
    private readonly ITenantContext _tenantContext;

    public LeadsController(ILeadRepository leadRepo, ITenantContext tenantContext)
    {
        _leadRepo      = leadRepo;
        _tenantContext = tenantContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetLeads()
    {
        var leads = await _leadRepo.GetByTenantAsync(_tenantContext.TenantId);
        return Ok(leads.Select(MapToDto));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetLead(Guid id)
    {
        var lead = await _leadRepo.GetByIdAsync(id, _tenantContext.TenantId);
        if (lead is null) return NotFound();
        return Ok(MapToDto(lead));
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> UpdateLead(Guid id, [FromBody] UpdateLeadRequest req)
    {
        var existing = await _leadRepo.GetByIdAsync(id, _tenantContext.TenantId);
        if (existing is null) return NotFound();

        // Apply only the fields the caller provided (null = keep existing value)
        var patch = new Lead
        {
            Id       = existing.Id,
            TenantId = existing.TenantId,
            Email    = req.Email    ?? existing.Email,
            Status   = req.Status   ?? existing.Status,
            Notes    = req.Notes    ?? existing.Notes,
        };

        var result = await _leadRepo.UpdateAsync(patch);
        if (result is null) return NotFound();

        // Re-fetch full record to return the complete DTO
        var full = await _leadRepo.GetByIdAsync(id, _tenantContext.TenantId);
        return Ok(MapToDto(full!));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteLead(Guid id)
    {
        var deleted = await _leadRepo.DeleteAsync(id, _tenantContext.TenantId);
        if (!deleted) return NotFound();
        return NoContent();
    }

    // ── Shared DTO mapper ──────────────────────────────────────────────────────
    private static object MapToDto(Lead l) => new
    {
        l.Id,
        l.CustomerName,
        l.Phone,
        l.Email,
        l.Requirements,
        l.QuotedPrice,
        l.Status,
        l.Notes,
        l.ExtrasJson,
        l.CreatedAt,
        l.UpdatedAt
    };
}

public record UpdateLeadRequest(
    string? Email,
    string? Status,
    string? Notes);
