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
        _leadRepo = leadRepo;
        _tenantContext = tenantContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetLeads()
    {
        var leads = await _leadRepo.GetByTenantAsync(_tenantContext.TenantId);
        return Ok(leads.Select(l => new
        {
            l.Id,
            l.CustomerName,
            l.Phone,
            l.Requirements,
            l.QuotedPrice,
            l.CreatedAt
        }));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetLead(Guid id)
    {
        var lead = await _leadRepo.GetByIdAsync(id, _tenantContext.TenantId);
        if (lead is null) return NotFound();

        return Ok(new
        {
            lead.Id,
            lead.CustomerName,
            lead.Phone,
            lead.Requirements,
            lead.QuotedPrice,
            lead.CreatedAt
        });
    }
}
