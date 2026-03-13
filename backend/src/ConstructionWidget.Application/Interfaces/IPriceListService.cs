using ConstructionWidget.Application.DTOs;
using ConstructionWidget.Core.Models;

namespace ConstructionWidget.Application.Interfaces;

public interface IPriceListService
{
    Task<PricingConfig?> GetConfigAsync(Guid tenantId);
    Task                 UploadCsvAsync(Guid tenantId, string csvContent);
    Task                 UpdateGlobalsAsync(Guid tenantId, UpdateGlobalsDto dto);
    Task                 UpsertMaterialAsync(Guid tenantId, string category, string material, UpsertMaterialDto dto);
    Task<bool>           DeleteMaterialAsync(Guid tenantId, string category, string material);
    Task                 AddCategoryAsync(Guid tenantId, string category);
    Task<bool>           DeleteCategoryAsync(Guid tenantId, string category);
}
