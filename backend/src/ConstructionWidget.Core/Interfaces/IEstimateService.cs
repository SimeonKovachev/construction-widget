using ConstructionWidget.Core.Models;

namespace ConstructionWidget.Core.Interfaces;

public interface IEstimateService
{
    Task<decimal> CalculatePriceAsync(string category, double width, double height, string material, string unit = "ft");
    Task UpdatePriceListAsync(Guid tenantId, string csvContent);
    Task<PricingConfig?> GetPricingConfigAsync(Guid tenantId);
}
