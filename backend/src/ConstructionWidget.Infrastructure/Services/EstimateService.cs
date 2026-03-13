using System.Globalization;
using ConstructionWidget.Core.Interfaces;
using ConstructionWidget.Core.Models;
using ConstructionWidget.Infrastructure.Data;
using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace ConstructionWidget.Infrastructure.Services;

public class EstimateService : IEstimateService
{
    private readonly AppDbContext _db;
    private readonly ITenantContext _tenantContext;
    private readonly IMemoryCache _cache;
    private readonly ILogger<EstimateService> _logger;

    // Cache entries survive 15 minutes of inactivity.
    // Evicted immediately on UpdatePriceListAsync so admin uploads apply instantly.
    private static readonly MemoryCacheEntryOptions PricingCacheOptions =
        new() { SlidingExpiration = TimeSpan.FromMinutes(15) };

    private static readonly Dictionary<string, double> UnitToFeet = new(StringComparer.OrdinalIgnoreCase)
    {
        ["mm"] = 1.0 / 304.8,
        ["cm"] = 1.0 / 30.48,
        ["m"]  = 3.28084,
        ["ft"] = 1.0,
        ["in"] = 1.0 / 12.0
    };

    public EstimateService(
        AppDbContext db,
        ITenantContext tenantContext,
        IMemoryCache cache,
        ILogger<EstimateService> logger)
    {
        _db            = db;
        _tenantContext = tenantContext;
        _cache         = cache;
        _logger        = logger;
    }

    public async Task<decimal> CalculatePriceAsync(
        string category, double width, double height, string material, string unit = "ft")
    {
        if (!UnitToFeet.TryGetValue(unit, out var factor))
            factor = 1.0;

        var widthFt  = width  * factor;
        var heightFt = height * factor;
        var sqFt     = (decimal)(widthFt * heightFt);

        // Share the cached PricingConfig — previously CalculatePriceAsync made its OWN
        // DB query even though BuildChatContextAsync had just loaded the same data.
        var tenantId = _tenantContext.TenantId;
        var config   = await GetPricingConfigAsync(tenantId)
            ?? throw new InvalidOperationException($"Tenant {tenantId} not found");

        if (config.Categories.Count == 0)
            throw new InvalidOperationException(
                "No price list has been configured yet. Please upload a CSV price list in the admin dashboard.");

        var categoryKey = config.Categories.Keys
            .FirstOrDefault(k => k.Equals(category, StringComparison.OrdinalIgnoreCase));

        if (categoryKey is null)
        {
            var available = string.Join(", ", config.Categories.Keys);
            throw new InvalidOperationException(
                $"Category '{category}' not found. Available categories: {available}.");
        }

        var materialKey = config.Categories[categoryKey].Materials.Keys
            .FirstOrDefault(k => k.Equals(material, StringComparison.OrdinalIgnoreCase));

        if (materialKey is null)
        {
            var available = string.Join(", ", config.Categories[categoryKey].Materials.Keys);
            throw new InvalidOperationException(
                $"Material '{material}' not found in category '{category}'. Available materials: {available}.");
        }

        var pricing    = config.Categories[categoryKey].Materials[materialKey];
        var rawPrice   = pricing.BasePrice + sqFt * pricing.PricePerSqFt;
        var withLabor  = rawPrice + config.LaborFixedCost;
        var withMarkup = withLabor * (1 + config.MarkupPercentage / 100m);
        var final      = pricing.MinimumPrice.HasValue
            ? Math.Max(withMarkup, pricing.MinimumPrice.Value)
            : withMarkup;

        return Math.Round(final, 2);
    }

    public async Task UpdatePriceListAsync(Guid tenantId, string csvContent)
    {
        var config = new PricingConfig();

        var csvConfig = new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HasHeaderRecord   = true,
            MissingFieldFound = null
        };

        using var reader = new StringReader(csvContent);
        using var csv    = new CsvReader(reader, csvConfig);
        await csv.ReadAsync();
        csv.ReadHeader();

        while (await csv.ReadAsync())
        {
            var category = csv.GetField("Category")?.Trim() ?? "";
            var material = csv.GetField("Material")?.Trim() ?? "";

            if (string.Equals(category, "GLOBAL", StringComparison.OrdinalIgnoreCase))
            {
                if (string.Equals(material, "MarkupPercentage", StringComparison.OrdinalIgnoreCase))
                    config.MarkupPercentage = ParseDecimal(csv.GetField("BasePrice"));
                else if (string.Equals(material, "LaborFixedCost", StringComparison.OrdinalIgnoreCase))
                    config.LaborFixedCost = ParseDecimal(csv.GetField("BasePrice"));
                continue;
            }

            if (string.IsNullOrEmpty(category) || string.IsNullOrEmpty(material))
                continue;

            if (!config.Categories.TryGetValue(category, out var categoryPricing))
            {
                categoryPricing = new CategoryPricing();
                config.Categories[category] = categoryPricing;
            }

            var minPriceStr = csv.GetField("MinimumPrice");
            decimal? minPrice = string.IsNullOrEmpty(minPriceStr)
                ? null
                : decimal.Parse(minPriceStr, CultureInfo.InvariantCulture);

            categoryPricing.Materials[material] = new MaterialPricing
            {
                BasePrice    = ParseDecimal(csv.GetField("BasePrice")),
                PricePerSqFt = ParseDecimal(csv.GetField("PricePerSqFt")),
                MinimumPrice = minPrice
            };
        }

        var tenant = await _db.Tenants.FindAsync(tenantId)
            ?? throw new InvalidOperationException($"Tenant {tenantId} not found");

        tenant.PricingConfig = JsonSerializer.Serialize(config);
        await _db.SaveChangesAsync();

        // Evict the cached config so the AI picks up new pricing on the next message.
        _cache.Remove(PricingCacheKey(tenantId));
        _logger.LogInformation("Price list updated for tenant {TenantId}; cache evicted.", tenantId);
    }

    public async Task<PricingConfig?> GetPricingConfigAsync(Guid tenantId)
    {
        var key = PricingCacheKey(tenantId);

        // Fast path — return cached parsed object, skip DB entirely
        if (_cache.TryGetValue(key, out PricingConfig? cached))
            return cached;

        // Cache miss — fetch from DB, parse, and cache
        var tenant = await _db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Id == tenantId);
        if (tenant is null) return null;

        var config = ParseConfig(tenant.PricingConfig);
        _cache.Set(key, config, PricingCacheOptions);
        return config;
    }

    // ── Granular inline editing ───────────────────────────────────────────────

    public async Task SaveGlobalsAsync(Guid tenantId, decimal markupPercentage, decimal laborFixedCost)
    {
        var config = await GetPricingConfigAsync(tenantId) ?? new PricingConfig();
        config.MarkupPercentage = markupPercentage;
        config.LaborFixedCost   = laborFixedCost;
        await PersistConfigAsync(tenantId, config);
    }

    public async Task UpsertMaterialAsync(
        Guid tenantId, string category, string material,
        decimal basePrice, decimal pricePerSqFt, decimal? minimumPrice)
    {
        var config = await GetPricingConfigAsync(tenantId) ?? new PricingConfig();

        if (!config.Categories.ContainsKey(category))
            config.Categories[category] = new CategoryPricing();

        config.Categories[category].Materials[material] = new MaterialPricing
        {
            BasePrice    = basePrice,
            PricePerSqFt = pricePerSqFt,
            MinimumPrice = minimumPrice
        };

        await PersistConfigAsync(tenantId, config);
    }

    public async Task<bool> DeleteMaterialAsync(Guid tenantId, string category, string material)
    {
        var config = await GetPricingConfigAsync(tenantId);
        if (config is null) return false;

        if (!config.Categories.TryGetValue(category, out var cat)) return false;
        if (!cat.Materials.Remove(material)) return false;

        await PersistConfigAsync(tenantId, config);
        return true;
    }

    public async Task AddCategoryAsync(Guid tenantId, string category)
    {
        var config = await GetPricingConfigAsync(tenantId) ?? new PricingConfig();

        if (!config.Categories.ContainsKey(category))
            config.Categories[category] = new CategoryPricing();

        await PersistConfigAsync(tenantId, config);
    }

    public async Task<bool> DeleteCategoryAsync(Guid tenantId, string category)
    {
        var config = await GetPricingConfigAsync(tenantId);
        if (config is null) return false;

        if (!config.Categories.Remove(category)) return false;

        await PersistConfigAsync(tenantId, config);
        return true;
    }

    /// <summary>
    /// Saves the given PricingConfig to DB and evicts the cache.
    /// All granular-edit methods funnel through here.
    /// </summary>
    private async Task PersistConfigAsync(Guid tenantId, PricingConfig config)
    {
        var tenant = await _db.Tenants.FindAsync(tenantId)
            ?? throw new InvalidOperationException($"Tenant {tenantId} not found");

        tenant.PricingConfig = JsonSerializer.Serialize(config);
        await _db.SaveChangesAsync();

        _cache.Remove(PricingCacheKey(tenantId));
        _logger.LogInformation("Price list updated for tenant {TenantId} (granular edit); cache evicted.", tenantId);
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    private static string PricingCacheKey(Guid tenantId) => $"pricing:{tenantId}";

    private static PricingConfig ParseConfig(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return new PricingConfig();

        return JsonSerializer.Deserialize<PricingConfig>(
            json,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
            ?? new PricingConfig();
    }

    private static decimal ParseDecimal(string? value)
        => decimal.TryParse(value, NumberStyles.Any, CultureInfo.InvariantCulture, out var d) ? d : 0m;
}
