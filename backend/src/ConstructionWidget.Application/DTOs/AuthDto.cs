namespace ConstructionWidget.Application.DTOs;

public record LoginRequestDto(string Email, string Password);

public record LoginResponseDto(string Token, Guid TenantId, string TenantName);

public record SuperAdminLoginRequestDto(string Email, string Password);

public record SuperAdminLoginResponseDto(string Token);
