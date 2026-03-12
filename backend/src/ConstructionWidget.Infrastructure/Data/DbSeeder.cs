using ConstructionWidget.Core.Entities;
using ConstructionWidget.Core.Models;
using ConstructionWidget.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace ConstructionWidget.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db, ILogger logger)
    {
        if (await db.Tenants.AnyAsync())
        {
            logger.LogInformation("Database already seeded. Skipping.");
            return;
        }

        logger.LogInformation("Seeding demo tenant...");

        var demoConfig = new PricingConfig
        {
            MarkupPercentage = 15,
            LaborFixedCost = 75,
            Categories = new()
            {
                ["windows"] = new CategoryPricing
                {
                    Materials = new()
                    {
                        ["vinyl"] = new MaterialPricing { BasePrice = 150, PricePerSqFt = 8.5m, MinimumPrice = 250 },
                        ["aluminum"] = new MaterialPricing { BasePrice = 200, PricePerSqFt = 12m, MinimumPrice = 350 },
                        ["wood"] = new MaterialPricing { BasePrice = 300, PricePerSqFt = 18m, MinimumPrice = 450 }
                    }
                },
                ["doors"] = new CategoryPricing
                {
                    Materials = new()
                    {
                        ["steel"] = new MaterialPricing { BasePrice = 400, PricePerSqFt = 20m, MinimumPrice = 500 },
                        ["fiberglass"] = new MaterialPricing { BasePrice = 500, PricePerSqFt = 25m, MinimumPrice = 650 },
                        ["wood"] = new MaterialPricing { BasePrice = 450, PricePerSqFt = 22m, MinimumPrice = 550 }
                    }
                },
                ["fencing"] = new CategoryPricing
                {
                    Materials = new()
                    {
                        ["vinyl"] = new MaterialPricing { BasePrice = 80, PricePerSqFt = 5m, MinimumPrice = 150 },
                        ["aluminum"] = new MaterialPricing { BasePrice = 100, PricePerSqFt = 7m, MinimumPrice = 200 },
                        ["wood"] = new MaterialPricing { BasePrice = 60, PricePerSqFt = 4m, MinimumPrice = 120 }
                    }
                }
            }
        };

        var demoTenant = new Tenant
        {
            Id = Guid.NewGuid(),
            Name = "Acme Windows & Doors",
            OwnerEmail = "admin@acme-windows.com",
            PasswordHash = AuthService.HashPassword("Demo1234!"),
            ApiKey = Guid.NewGuid().ToString("N"),
            PricingConfig = JsonSerializer.Serialize(demoConfig),
            NotificationEmail = "admin@acme-windows.com",
            IsActive = true
        };

        db.Tenants.Add(demoTenant);
        await db.SaveChangesAsync();

        logger.LogInformation("Demo tenant seeded:");
        logger.LogInformation("  Email:    admin@acme-windows.com");
        logger.LogInformation("  Password: Demo1234!");
        logger.LogInformation("  API Key:  {ApiKey}", demoTenant.ApiKey);
        logger.LogInformation("  Tenant ID: {Id}", demoTenant.Id);
    }
}
