namespace ConstructionWidget.Application.DTOs;

public record UpdateGlobalsDto(decimal MarkupPercentage, decimal LaborFixedCost);

public record UpsertMaterialDto(decimal BasePrice, decimal PricePerSqFt, decimal? MinimumPrice);

public record AddCategoryDto(string Category);
