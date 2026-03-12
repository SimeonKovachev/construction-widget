namespace ConstructionWidget.Core.Models;

public class PricingConfig
{
    public Dictionary<string, CategoryPricing> Categories { get; set; } = new();

    /// <summary>Global markup applied after base + labor cost. e.g. 15.0 = 15%</summary>
    public decimal MarkupPercentage { get; set; } = 0;

    /// <summary>Fixed labor cost added per estimate in dollars.</summary>
    public decimal LaborFixedCost { get; set; } = 0;
}

public class CategoryPricing
{
    public Dictionary<string, MaterialPricing> Materials { get; set; } = new();
}

public class MaterialPricing
{
    public decimal BasePrice { get; set; }
    public decimal PricePerSqFt { get; set; }
    public decimal? MinimumPrice { get; set; }
}
