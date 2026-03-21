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

        // Run independent queries in parallel
        var leadsQuery         = _db.Leads.Where(l => l.TenantId == tenantId && l.CreatedAt >= cutoff);
        var conversationsQuery = _db.Conversations.Where(c => c.TenantId == tenantId && c.CreatedAt >= cutoff);

        var leadsOverTimeTask = leadsQuery
            .GroupBy(l => l.CreatedAt.Date)
            .Select(g => new DateCountDto(g.Key.ToString("yyyy-MM-dd"), g.Count()))
            .OrderBy(x => x.Date)
            .ToListAsync();

        var revenueOverTimeTask = leadsQuery
            .GroupBy(l => l.CreatedAt.Date)
            .Select(g => new DateRevenueDto(g.Key.ToString("yyyy-MM-dd"), g.Sum(l => l.QuotedPrice)))
            .OrderBy(x => x.Date)
            .ToListAsync();

        var totalConversationsTask = conversationsQuery.CountAsync();
        var totalLeadsTask         = leadsQuery.CountAsync();

        var peakHoursTask = conversationsQuery
            .GroupBy(c => c.CreatedAt.Hour)
            .Select(g => new HourCountDto(g.Key, g.Count()))
            .ToListAsync();

        var topQuestionsTask = leadsQuery
            .Where(l => l.Requirements != null && l.Requirements != "")
            .GroupBy(l => l.Requirements)
            .Select(g => new QuestionCountDto(g.Key, g.Count()))
            .OrderByDescending(x => x.Count)
            .Take(10)
            .ToListAsync();

        var leadsByStatusTask = leadsQuery
            .GroupBy(l => l.Status)
            .Select(g => new StatusCountDto(g.Key, g.Count()))
            .ToListAsync();

        await Task.WhenAll(
            leadsOverTimeTask, revenueOverTimeTask,
            totalConversationsTask, totalLeadsTask,
            peakHoursTask, topQuestionsTask, leadsByStatusTask);

        var totalConversations = totalConversationsTask.Result;
        var totalLeads         = totalLeadsTask.Result;
        var conversionRate     = totalConversations > 0
            ? Math.Round((double)totalLeads / totalConversations * 100, 1)
            : 0;

        // Fill missing hours (0-23) with zero counts
        var peakHoursDict = peakHoursTask.Result.ToDictionary(h => h.Hour, h => h.Count);
        var peakHours = Enumerable.Range(0, 24)
            .Select(h => new HourCountDto(h, peakHoursDict.GetValueOrDefault(h, 0)))
            .ToList();

        return new AnalyticsDto(
            LeadsOverTime:      leadsOverTimeTask.Result,
            RevenueOverTime:    revenueOverTimeTask.Result,
            TotalConversations: totalConversations,
            TotalLeads:         totalLeads,
            ConversionRate:     conversionRate,
            PeakHours:          peakHours,
            TopQuestions:       topQuestionsTask.Result,
            LeadsByStatus:      leadsByStatusTask.Result
        );
    }
}
