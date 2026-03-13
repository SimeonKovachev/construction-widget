using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ConstructionWidget.Core.Entities;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace ConstructionWidget.Infrastructure.Services;

public class JwtOptions
{
    public string Secret        { get; set; } = string.Empty;
    public string Issuer        { get; set; } = "ConstructionWidget";
    public string Audience      { get; set; } = "ConstructionWidgetAdmin";
    public int    ExpiryMinutes { get; set; } = 480;
}

public class AuthService
{
    private readonly JwtOptions _jwt;

    public AuthService(IOptions<JwtOptions> jwt) => _jwt = jwt.Value;

    public string GenerateToken(Tenant tenant)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, tenant.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, tenant.OwnerEmail),
            new Claim("tenantId",   tenant.Id.ToString()),
            new Claim("tenantName", tenant.Name),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };
        return BuildToken(claims);
    }

    public string GenerateSuperAdminToken()
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, "superadmin"),
            new Claim(ClaimTypes.Role, "superadmin"),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };
        return BuildToken(claims);
    }

    private string BuildToken(IEnumerable<Claim> claims)
    {
        var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer:            _jwt.Issuer,
            audience:          _jwt.Audience,
            claims:            claims,
            expires:           DateTime.UtcNow.AddMinutes(_jwt.ExpiryMinutes),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public static string HashPassword(string password) =>
        BCrypt.Net.BCrypt.HashPassword(password, BCrypt.Net.BCrypt.GenerateSalt(12));

    public static bool VerifyPassword(string password, string hash) =>
        BCrypt.Net.BCrypt.Verify(password, hash);
}
