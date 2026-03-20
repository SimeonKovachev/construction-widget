using ConstructionWidget.Core.Entities;
using ConstructionWidget.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ConstructionWidget.Infrastructure.Data;

public class AppDbContext : DbContext
{
    private readonly ITenantContext _tenantContext;

    public AppDbContext(DbContextOptions<AppDbContext> options, ITenantContext tenantContext)
        : base(options)
    {
        _tenantContext = tenantContext;
    }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<Lead> Leads => Set<Lead>();
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<TenantDocument> TenantDocuments => Set<TenantDocument>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Tenant>(e =>
        {
            e.HasKey(t => t.Id);
            e.HasIndex(t => t.ApiKey).IsUnique();
            e.HasIndex(t => t.OwnerEmail).IsUnique();
            e.Property(t => t.PricingConfig).HasColumnType("jsonb");
        });

        modelBuilder.Entity<Lead>(e =>
        {
            e.HasKey(l => l.Id);
            e.HasIndex(l => l.TenantId);
            e.HasIndex(l => l.Status);
            e.HasIndex(l => new { l.TenantId, l.CreatedAt });
            e.HasIndex(l => l.SessionId);
            e.Property(l => l.QuotedPrice).HasPrecision(18, 2);
            e.HasOne(l => l.Tenant).WithMany(t => t.Leads).HasForeignKey(l => l.TenantId);

            // Multi-tenancy filter
            e.HasQueryFilter(l => !_tenantContext.IsResolved || l.TenantId == _tenantContext.TenantId);
        });

        modelBuilder.Entity<Conversation>(e =>
        {
            e.HasKey(c => c.Id);
            e.HasIndex(c => new { c.TenantId, c.SessionId }).IsUnique();
            e.HasIndex(c => c.CreatedAt);
            e.HasOne(c => c.Tenant).WithMany(t => t.Conversations).HasForeignKey(c => c.TenantId);

            // Multi-tenancy filter
            e.HasQueryFilter(c => !_tenantContext.IsResolved || c.TenantId == _tenantContext.TenantId);
        });

        modelBuilder.Entity<TenantDocument>(e =>
        {
            e.HasKey(d => d.Id);
            e.HasIndex(d => d.TenantId);
            e.HasIndex(d => new { d.TenantId, d.IsActive });
            e.HasOne(d => d.Tenant).WithMany().HasForeignKey(d => d.TenantId);

            // Multi-tenancy filter
            e.HasQueryFilter(d => !_tenantContext.IsResolved || d.TenantId == _tenantContext.TenantId);
        });
    }
}
