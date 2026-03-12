using ConstructionWidget.Core.Interfaces;
using ConstructionWidget.Core.Models;
using ConstructionWidget.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;

namespace ConstructionWidget.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly ITenantRepository _tenantRepo;
    private readonly AuthService _authService;

    public AuthController(ITenantRepository tenantRepo, AuthService authService)
    {
        _tenantRepo = tenantRepo;
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var tenant = await _tenantRepo.GetByEmailAsync(request.Email);
        if (tenant is null || !AuthService.VerifyPassword(request.Password, tenant.PasswordHash))
            return Unauthorized(new { error = "Invalid email or password." });

        if (!tenant.IsActive)
            return Unauthorized(new { error = "Account is inactive." });

        var token = _authService.GenerateToken(tenant);
        return Ok(new LoginResponse(token, tenant.Id, tenant.Name));
    }
}
