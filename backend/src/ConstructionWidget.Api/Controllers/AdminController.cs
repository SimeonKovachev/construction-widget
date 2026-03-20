using ConstructionWidget.Application.DTOs;
using ConstructionWidget.Application.Interfaces;
using ConstructionWidget.Core.Entities;
using ConstructionWidget.Core.Interfaces;
using ConstructionWidget.Core.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConstructionWidget.Api.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize]
public class AdminController : ControllerBase
{
    private readonly ITenantService            _tenantService;
    private readonly IPriceListService         _priceListService;
    private readonly ITenantContext            _tenantContext;
    private readonly ITenantDocumentRepository _documentRepo;

    public AdminController(
        ITenantService            tenantService,
        IPriceListService         priceListService,
        ITenantContext            tenantContext,
        ITenantDocumentRepository documentRepo)
    {
        _tenantService    = tenantService;
        _priceListService = priceListService;
        _tenantContext    = tenantContext;
        _documentRepo     = documentRepo;
    }

    // ── Tenant settings ────────────────────────────────────────────────────────

    [HttpGet("tenants/me")]
    public async Task<ActionResult<TenantDto>> GetMe()
    {
        var tenant = await _tenantService.GetTenantAsync(_tenantContext.TenantId);
        return tenant is null ? NotFound() : Ok(tenant);
    }

    [HttpPut("tenants/me")]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateTenantDto req)
    {
        await _tenantService.UpdateTenantAsync(_tenantContext.TenantId, req);
        return Ok(new { message = "Settings updated." });
    }

    // ── Price list ─────────────────────────────────────────────────────────────

    [HttpPost("pricelist")]
    public async Task<IActionResult> UploadPriceList(IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "No file uploaded." });

        if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "Only CSV files are accepted." });

        if (file.Length > 1_048_576)
            return BadRequest(new { error = "File too large. Max 1 MB." });

        using var reader = new StreamReader(file.OpenReadStream());
        var csvContent   = await reader.ReadToEndAsync();

        await _priceListService.UploadCsvAsync(_tenantContext.TenantId, csvContent);
        return Ok(new { message = "Price list updated successfully." });
    }

    [HttpGet("pricelist")]
    public async Task<ActionResult<PricingConfig>> GetPriceList()
    {
        var config = await _priceListService.GetConfigAsync(_tenantContext.TenantId);
        return config is null ? NotFound() : Ok(config);
    }

    [HttpPut("pricelist/globals")]
    public async Task<IActionResult> UpdateGlobals([FromBody] UpdateGlobalsDto req)
    {
        await _priceListService.UpdateGlobalsAsync(_tenantContext.TenantId, req);
        return Ok(new { message = "Global pricing updated." });
    }

    [HttpPut("pricelist/{category}/{material}")]
    public async Task<IActionResult> UpsertMaterial(
        string category, string material, [FromBody] UpsertMaterialDto req)
    {
        await _priceListService.UpsertMaterialAsync(
            _tenantContext.TenantId,
            Uri.UnescapeDataString(category),
            Uri.UnescapeDataString(material),
            req);
        return Ok(new { message = $"Material '{material}' in '{category}' saved." });
    }

    [HttpDelete("pricelist/{category}/{material}")]
    public async Task<IActionResult> DeleteMaterial(string category, string material)
    {
        var deleted = await _priceListService.DeleteMaterialAsync(
            _tenantContext.TenantId,
            Uri.UnescapeDataString(category),
            Uri.UnescapeDataString(material));
        return deleted ? NoContent() : NotFound(new { error = "Category or material not found." });
    }

    [HttpPost("pricelist/category")]
    public async Task<IActionResult> AddCategory([FromBody] AddCategoryDto req)
    {
        if (string.IsNullOrWhiteSpace(req.Category))
            return BadRequest(new { error = "Category name is required." });

        await _priceListService.AddCategoryAsync(_tenantContext.TenantId, req.Category.Trim());
        return Ok(new { message = $"Category '{req.Category}' added." });
    }

    [HttpDelete("pricelist/{category}")]
    public async Task<IActionResult> DeleteCategory(string category)
    {
        var deleted = await _priceListService.DeleteCategoryAsync(
            _tenantContext.TenantId,
            Uri.UnescapeDataString(category));
        return deleted ? NoContent() : NotFound(new { error = "Category not found." });
    }

    // ── Knowledge Base ──────────────────────────────────────────────────────

    [HttpGet("knowledge-base")]
    public async Task<ActionResult<List<TenantDocument>>> GetDocuments()
    {
        var docs = await _documentRepo.GetByTenantAsync(_tenantContext.TenantId);
        return Ok(docs);
    }

    [HttpPost("knowledge-base")]
    public async Task<ActionResult<TenantDocument>> CreateDocument([FromBody] CreateDocumentDto req)
    {
        if (string.IsNullOrWhiteSpace(req.Title))
            return BadRequest(new { error = "Title is required." });
        if (string.IsNullOrWhiteSpace(req.Content))
            return BadRequest(new { error = "Content is required." });

        var doc = await _documentRepo.CreateAsync(new TenantDocument
        {
            TenantId = _tenantContext.TenantId,
            Title    = req.Title.Trim(),
            Content  = req.Content.Trim(),
            Category = req.Category?.Trim() ?? "general",
        });

        return Ok(doc);
    }

    [HttpPut("knowledge-base/{id:guid}")]
    public async Task<ActionResult<TenantDocument>> UpdateDocument(Guid id, [FromBody] UpdateDocumentDto req)
    {
        var doc = await _documentRepo.UpdateAsync(
            id, _tenantContext.TenantId,
            req.Title, req.Content, req.Category, req.IsActive);

        return doc is null ? NotFound() : Ok(doc);
    }

    [HttpDelete("knowledge-base/{id:guid}")]
    public async Task<IActionResult> DeleteDocument(Guid id)
    {
        var deleted = await _documentRepo.DeleteAsync(id, _tenantContext.TenantId);
        return deleted ? NoContent() : NotFound();
    }
}

public record CreateDocumentDto(string Title, string Content, string? Category);
public record UpdateDocumentDto(string? Title, string? Content, string? Category, bool? IsActive);
