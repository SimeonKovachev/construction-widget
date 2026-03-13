using ConstructionWidget.Application.DTOs;
using ConstructionWidget.Application.Interfaces;
using ConstructionWidget.Core.Interfaces;
using ConstructionWidget.Core.Models;

namespace ConstructionWidget.Application.Services;

public class PriceListService : IPriceListService
{
    private readonly IEstimateService _estimateService;

    public PriceListService(IEstimateService estimateService) => _estimateService = estimateService;

    public Task<PricingConfig?> GetConfigAsync(Guid tenantId)
        => _estimateService.GetPricingConfigAsync(tenantId);

    public Task UploadCsvAsync(Guid tenantId, string csvContent)
        => _estimateService.UpdatePriceListAsync(tenantId, csvContent);

    public Task UpdateGlobalsAsync(Guid tenantId, UpdateGlobalsDto dto)
        => _estimateService.SaveGlobalsAsync(tenantId, dto.MarkupPercentage, dto.LaborFixedCost);

    public Task UpsertMaterialAsync(Guid tenantId, string category, string material, UpsertMaterialDto dto)
        => _estimateService.UpsertMaterialAsync(tenantId, category, material, dto.BasePrice, dto.PricePerSqFt, dto.MinimumPrice);

    public Task<bool> DeleteMaterialAsync(Guid tenantId, string category, string material)
        => _estimateService.DeleteMaterialAsync(tenantId, category, material);

    public Task AddCategoryAsync(Guid tenantId, string category)
        => _estimateService.AddCategoryAsync(tenantId, category);

    public Task<bool> DeleteCategoryAsync(Guid tenantId, string category)
        => _estimateService.DeleteCategoryAsync(tenantId, category);
}
