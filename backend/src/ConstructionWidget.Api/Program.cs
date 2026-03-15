using System.Text;
using ConstructionWidget.Api.Hubs;
using ConstructionWidget.Api.Middleware;
using ConstructionWidget.Application.Interfaces;
using ConstructionWidget.Application.Mapping;
using ConstructionWidget.Application.Services;
using ConstructionWidget.Core.Interfaces;
using ConstructionWidget.Infrastructure.Data;
using ConstructionWidget.Infrastructure.Repositories;
using ConstructionWidget.Infrastructure.Services;
using Mapster;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using OpenAI;

var builder = WebApplication.CreateBuilder(args);

// ─── Configuration ────────────────────────────────────────────────────────────
builder.Services.Configure<OpenAiOptions>(builder.Configuration.GetSection("OpenAI"));
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<SmtpOptions>(builder.Configuration.GetSection("Smtp"));

// ─── Mapster ──────────────────────────────────────────────────────────────────
var mapsterConfig = TypeAdapterConfig.GlobalSettings;
mapsterConfig.Scan(typeof(MappingConfig).Assembly);

// ─── Database ─────────────────────────────────────────────────────────────────
// Try appsettings / env var first; fall back to Railway's DATABASE_URL
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrWhiteSpace(connectionString))
{
    var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
    if (!string.IsNullOrWhiteSpace(databaseUrl))
    {
        // Convert postgresql://user:pass@host:port/db → Npgsql key=value format
        var uri     = new Uri(databaseUrl);
        var parts   = uri.UserInfo.Split(':', 2);
        connectionString =
            $"Host={uri.Host};Port={uri.Port};" +
            $"Database={uri.AbsolutePath.TrimStart('/')};" +
            $"Username={parts[0]};Password={parts[1]};SslMode=Disable";
    }
}

if (string.IsNullOrWhiteSpace(connectionString))
    throw new InvalidOperationException(
        "No database connection string found. Set ConnectionStrings__DefaultConnection or DATABASE_URL.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// ─── Infrastructure — Repositories ───────────────────────────────────────────
builder.Services.AddScoped<ILeadRepository,         LeadRepository>();
builder.Services.AddScoped<ITenantRepository,       TenantRepository>();
builder.Services.AddScoped<IConversationRepository, ConversationRepository>();

// ─── Infrastructure — Services ────────────────────────────────────────────────
builder.Services.AddScoped<TenantContext>();
builder.Services.AddScoped<ITenantContext>(sp => sp.GetRequiredService<TenantContext>());
builder.Services.AddScoped<EstimateService>();
builder.Services.AddScoped<IEstimateService>(sp => sp.GetRequiredService<EstimateService>());
builder.Services.AddScoped<IOpenAiChatService, OpenAiChatService>();
builder.Services.AddScoped<ILeadNotificationService, LeadNotificationService>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<AuthService>();

// ─── Application — Services ───────────────────────────────────────────────────
builder.Services.AddScoped<ILeadService,       LeadService>();
builder.Services.AddScoped<ITenantService,     TenantService>();
builder.Services.AddScoped<IPriceListService,  PriceListService>();
builder.Services.AddScoped<ISuperAdminService, SuperAdminService>();

// ─── Caching + Singleton OpenAI client ───────────────────────────────────────
builder.Services.AddMemoryCache();

builder.Services.AddSingleton<OpenAIClient>(sp =>
{
    var opts = sp.GetRequiredService<IOptions<OpenAiOptions>>().Value;
    return new OpenAIClient(opts.ApiKey);
});

// ─── JWT Authentication ───────────────────────────────────────────────────────
var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? throw new InvalidOperationException("Jwt:Secret not configured");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = builder.Configuration["Jwt:Issuer"],
            ValidAudience            = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew                = TimeSpan.Zero,
            RoleClaimType            = System.Security.Claims.ClaimTypes.Role,
        };
    });

builder.Services.AddAuthorization();

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Allow all Vercel deployments + localhost for dev.
// Widget uses SignalR policy which allows any origin (embedded on customer sites).
static bool IsAllowedOrigin(string origin) =>
    origin.EndsWith(".vercel.app",  StringComparison.OrdinalIgnoreCase) ||
    origin.StartsWith("http://localhost",  StringComparison.OrdinalIgnoreCase) ||
    origin.StartsWith("https://localhost", StringComparison.OrdinalIgnoreCase);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.SetIsOriginAllowed(IsAllowedOrigin)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());

    options.AddPolicy("SignalR", policy =>
        policy.SetIsOriginAllowed(_ => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

// ─── SignalR ──────────────────────────────────────────────────────────────────
builder.Services.AddSignalR(options =>
    options.EnableDetailedErrors = builder.Environment.IsDevelopment());

// ─── MVC ──────────────────────────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// ─── Middleware pipeline ──────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseStaticFiles();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<TenantResolutionMiddleware>();

app.MapGet("/healthz", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));
app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat").RequireCors("SignalR");

// ─── Auto-migrate + seed on startup ──────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db            = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var startupLogger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    await db.Database.MigrateAsync();
    await ConstructionWidget.Infrastructure.Data.DbSeeder.SeedAsync(db, startupLogger);
}

app.Run();
