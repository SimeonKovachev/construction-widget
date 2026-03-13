using ConstructionWidget.Core.Models;

namespace ConstructionWidget.Core.Interfaces;

public interface IEstimateService
{
    Task<decimal> CalculatePriceAsync(string category, double width, double height, string material, string unit = "ft");
    Task UpdatePriceListAsync(Guid tenantId, string csvContent);
    Task<PricingConfig?> GetPricingConfigAsync(Guid tenantId);

    // ── Granular inline editing ────────────────────────────────────────────────
    Task SaveGlobalsAsync(Guid tenantId, decimal markupPercentage, decimal laborFixedCost);
    Task UpsertMaterialAsync(Guid tenantId, string category, string material, decimal basePrice, decimal pricePerSqFt, decimal? minimumPrice);
    Task<bool> DeleteMaterialAsync(Guid tenantId, string category, string material);
    Task AddCategoryAsync(Guid tenantId, string category);
    Task<bool> DeleteCategoryAsync(Guid tenantId, string category);
}
