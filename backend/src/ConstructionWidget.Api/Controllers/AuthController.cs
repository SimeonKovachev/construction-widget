using ConstructionWidget.Application.DTOs;
using ConstructionWidget.Core.Interfaces;
using ConstructionWidget.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;

namespace ConstructionWidget.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly ITenantRepository _tenantRepo;
    private readonly AuthService       _authService;
    private readonly IConfiguration   _config;

    public AuthController(ITenantRepository tenantRepo, AuthService authService, IConfiguration config)
    {
        _tenantRepo  = tenantRepo;
        _authService = authService;
        _config      = config;
    }

    /// <summary>Tenant login — returns a scoped JWT for a single tenant.</summary>
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto req)
    {
        var tenant = await _tenantRepo.GetByEmailAsync(req.Email);
        if (tenant is null || !AuthService.VerifyPassword(req.Password, tenant.PasswordHash))
            return Unauthorized(new { error = "Invalid email or password." });

        if (!tenant.IsActive)
            return Unauthorized(new { error = "Account is inactive." });

        var token = _authService.GenerateToken(tenant);
        return Ok(new LoginResponseDto(token, tenant.Id, tenant.Name));
    }

    /// <summary>Super admin login — returns a JWT with role:superadmin claim.</summary>
    [HttpPost("superadmin/login")]
    public ActionResult<SuperAdminLoginResponseDto> SuperAdminLogin([FromBody] SuperAdminLoginRequestDto req)
    {
        var email    = _config["SuperAdmin:Email"]    ?? "";
        var password = _config["SuperAdmin:Password"] ?? "";

        if (!string.Equals(req.Email,    email,    StringComparison.OrdinalIgnoreCase) ||
            !string.Equals(req.Password, password, StringComparison.Ordinal))
            return Unauthorized(new { error = "Invalid super admin credentials." });

        var token = _authService.GenerateSuperAdminToken();
        return Ok(new SuperAdminLoginResponseDto(token));
    }
}
