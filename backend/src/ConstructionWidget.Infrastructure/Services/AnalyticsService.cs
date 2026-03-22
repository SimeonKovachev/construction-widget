using ConstructionWidget.Core.DTOs;
using ConstructionWidget.Core.Interfaces;
using ConstructionWidget.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ConstructionWidget.Infrastructure.Services;

public class AnalyticsService : IAnalyticsService
{
    private readonly AppDbContext _db;

    public AnalyticsService(AppDbContext db) => _db = db;

    public async Task<AnalyticsDto> GetAnalyticsAsync(Guid tenantId, int days)
    {
        var cutoff = DateTime.UtcNow.AddDays(-days);

        // Base queryables (global query filter handles tenant isolation;
        // explicit TenantId kept for clarity / defense-in-depth)
        var leadsQuery         = _db.Leads.Where(l => l.TenantId == tenantId && l.CreatedAt >= cutoff);
        var conversationsQuery = _db.Conversations.Where(c => c.TenantId == tenantId && c.CreatedAt >= cutoff);

        // EF Core DbContext is NOT thread-safe — queries must run sequentially
        var leadsOverTime = await leadsQuery
            .GroupBy(l => l.CreatedAt.Date)
            .Select(g => new DateCountDto(g.Key.ToString("yyyy-MM-dd"), g.Count()))
            .OrderBy(x => x.Date)
            .ToListAsync();

        var revenueOverTime = await leadsQuery
            .GroupBy(l => l.CreatedAt.Date)
            .Select(g => new DateRevenueDto(g.Key.ToString("yyyy-MM-dd"), g.Sum(l => l.QuotedPrice)))
            .OrderBy(x => x.Date)
            .ToListAsync();

        var totalConversations = await conversationsQuery.CountAsync();
        var totalLeads         = await leadsQuery.CountAsync();

        var peakHoursRaw = await conversationsQuery
            .GroupBy(c => c.CreatedAt.Hour)
            .Select(g => new HourCountDto(g.Key, g.Count()))
            .ToListAsync();

        var topQuestions = await leadsQuery
            .Where(l => l.Requirements != null && l.Requirements != "")
            .GroupBy(l => l.Requirements)
            .Select(g => new QuestionCountDto(g.Key, g.Count()))
            .OrderByDescending(x => x.Count)
            .Take(10)
            .ToListAsync();

        var leadsByStatus = await leadsQuery
            .GroupBy(l => l.Status)
            .Select(g => new StatusCountDto(g.Key, g.Count()))
            .ToListAsync();

        var conversionRate = totalConversations > 0
            ? Math.Round((double)totalLeads / totalConversations * 100, 1)
            : 0;

        // Fill missing hours (0-23) with zero counts
        var peakHoursDict = peakHoursRaw.ToDictionary(h => h.Hour, h => h.Count);
        var peakHours = Enumerable.Range(0, 24)
            .Select(h => new HourCountDto(h, peakHoursDict.GetValueOrDefault(h, 0)))
            .ToList();

        return new AnalyticsDto(
            LeadsOverTime:      leadsOverTime,
            RevenueOverTime:    revenueOverTime,
            TotalConversations: totalConversations,
            TotalLeads:         totalLeads,
            ConversionRate:     conversionRate,
            PeakHours:          peakHours,
            TopQuestions:       topQuestions,
            LeadsByStatus:      leadsByStatus
        );
    }
}
