using ConstructionWidget.Core.Entities;
using ConstructionWidget.Core.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace ConstructionWidget.Infrastructure.Data;

/// <summary>
/// Design-time factory used by EF migrations.
/// Uses a no-op TenantContext so migrations can run without HTTP context.
/// </summary>
public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        optionsBuilder.UseNpgsql(
            "Host=localhost;Database=construction_widget;Username=postgres;Password=postgres");

        return new AppDbContext(optionsBuilder.Options, new NoOpTenantContext());
    }
}

internal class NoOpTenantContext : ITenantContext
{
    public Guid TenantId => Guid.Empty;
    public Tenant? Tenant => null;
    public bool IsResolved => false;
}
