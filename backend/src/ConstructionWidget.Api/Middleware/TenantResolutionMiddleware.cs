using System.IdentityModel.Tokens.Jwt;
using ConstructionWidget.Core.Interfaces;
using ConstructionWidget.Infrastructure.Services;

namespace ConstructionWidget.Api.Middleware;

public class TenantResolutionMiddleware
{
    private readonly RequestDelegate _next;

    private static readonly HashSet<string> SkippedPaths = new(StringComparer.OrdinalIgnoreCase)
    {
        "/api/auth/login",
        // NOTE: /api/admin/tenants intentionally removed — those endpoints
        //       resolve their tenant from the JWT claim and must NOT be skipped.
        "/healthz",
        "/hubs/chat",
        "/widget.js"
    };

    public TenantResolutionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, ITenantRepository tenantRepo, TenantContext tenantContext)
    {
        var path = context.Request.Path.Value ?? "";

        // Skip paths that don't need tenant resolution
        if (ShouldSkip(path))
        {
            // For SignalR hub, try to resolve from query param (optional)
            if (path.StartsWith("/hubs/", StringComparison.OrdinalIgnoreCase))
                await TryResolveFromQueryAsync(context, tenantRepo, tenantContext);

            await _next(context);
            return;
        }

        // Try X-Tenant-ID header first
        if (context.Request.Headers.TryGetValue("X-Tenant-ID", out var tenantIdStr)
            && Guid.TryParse(tenantIdStr, out var tenantId))
        {
            var tenant = await tenantRepo.GetByIdAsync(tenantId);
            if (tenant is { IsActive: true })
            {
                tenantContext.SetTenant(tenant);
                await _next(context);
                return;
            }
        }

        // Try X-API-Key header
        if (context.Request.Headers.TryGetValue("X-API-Key", out var apiKey))
        {
            var tenant = await tenantRepo.GetByApiKeyAsync(apiKey!);
            if (tenant is { IsActive: true })
            {
                tenantContext.SetTenant(tenant);
                await _next(context);
                return;
            }
        }

        // Try JWT claim (for admin dashboard calls that also carry tenant context)
        if (TryGetTenantIdFromJwt(context, out var jwtTenantId))
        {
            var tenant = await tenantRepo.GetByIdAsync(jwtTenantId);
            if (tenant is { IsActive: true })
            {
                tenantContext.SetTenant(tenant);
                await _next(context);
                return;
            }
        }

        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        await context.Response.WriteAsJsonAsync(new { error = "Tenant not found or inactive." });
    }

    private static async Task TryResolveFromQueryAsync(
        HttpContext context, ITenantRepository tenantRepo, TenantContext tenantContext)
    {
        if (context.Request.Query.TryGetValue("tenantId", out var qTenantId)
            && Guid.TryParse(qTenantId, out var tenantId))
        {
            var tenant = await tenantRepo.GetByIdAsync(tenantId);
            if (tenant is { IsActive: true })
                tenantContext.SetTenant(tenant);
        }
    }

    private static bool TryGetTenantIdFromJwt(HttpContext context, out Guid tenantId)
    {
        tenantId = Guid.Empty;
        var authHeader = context.Request.Headers.Authorization.ToString();
        if (!authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            return false;

        var token = authHeader["Bearer ".Length..].Trim();
        try
        {
            var handler = new JwtSecurityTokenHandler();
            if (!handler.CanReadToken(token)) return false;
            var jwt = handler.ReadJwtToken(token);
            var claim = jwt.Claims.FirstOrDefault(c => c.Type == "tenantId");
            return claim is not null && Guid.TryParse(claim.Value, out tenantId);
        }
        catch { return false; }
    }

    private static bool ShouldSkip(string path)
    {
        foreach (var skip in SkippedPaths)
            if (path.StartsWith(skip, StringComparison.OrdinalIgnoreCase))
                return true;
        return path.StartsWith("/hubs/", StringComparison.OrdinalIgnoreCase)
               || path.EndsWith(".js", StringComparison.OrdinalIgnoreCase)
               || path.EndsWith(".css", StringComparison.OrdinalIgnoreCase);
    }
}
