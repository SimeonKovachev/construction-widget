using ConstructionWidget.Application.DTOs;
using ConstructionWidget.Application.Interfaces;
using ConstructionWidget.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConstructionWidget.Api.Controllers;

[ApiController]
[Route("api/admin/leads")]
[Authorize]
public class LeadsController : ControllerBase
{
    private readonly ILeadService   _leadService;
    private readonly ITenantContext _tenantContext;

    public LeadsController(ILeadService leadService, ITenantContext tenantContext)
    {
        _leadService   = leadService;
        _tenantContext = tenantContext;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<LeadDto>>> GetLeads()
        => Ok(await _leadService.GetLeadsAsync(_tenantContext.TenantId));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<LeadDto>> GetLead(Guid id)
    {
        var lead = await _leadService.GetLeadAsync(id, _tenantContext.TenantId);
        return lead is null ? NotFound() : Ok(lead);
    }

    [HttpPatch("{id:guid}")]
    public async Task<ActionResult<LeadDto>> UpdateLead(Guid id, [FromBody] UpdateLeadDto req)
    {
        var result = await _leadService.UpdateLeadAsync(id, _tenantContext.TenantId, req);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteLead(Guid id)
    {
        var deleted = await _leadService.DeleteLeadAsync(id, _tenantContext.TenantId);
        return deleted ? NoContent() : NotFound();
    }
}
