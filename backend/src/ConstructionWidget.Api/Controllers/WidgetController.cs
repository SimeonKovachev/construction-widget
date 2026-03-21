using ConstructionWidget.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace ConstructionWidget.Api.Controllers;

[ApiController]
[Route("api/widget")]
public class WidgetController : ControllerBase
{
    private readonly ITenantContext _tenantContext;

    public WidgetController(ITenantContext tenantContext)
    {
        _tenantContext = tenantContext;
    }

    /// <summary>
    /// Returns public config for the widget. Called on widget init.
    /// Requires X-Tenant-ID header.
    /// </summary>
    [HttpGet("config")]
    public IActionResult GetConfig()
    {
        if (!_tenantContext.IsResolved)
            return NotFound(new { error = "Tenant not found." });

        var tenant = _tenantContext.Tenant!;
        return Ok(new
        {
            tenantId       = tenant.Id,
            tenantName     = tenant.Name,
            greeting       = tenant.WelcomeMessage ?? $"Hi! I'm the sales assistant for {tenant.Name}. How can I help you today?",
            primaryColor   = tenant.PrimaryColor,
            secondaryColor = tenant.SecondaryColor,
            logoUrl        = tenant.LogoUrl,
            position       = tenant.WidgetPosition ?? "bottom-right",
            agentName      = tenant.AgentName ?? "Sales Assistant",
            agentAvatarUrl = tenant.AgentAvatarUrl,
        });
    }
}
