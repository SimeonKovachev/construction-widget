namespace ConstructionWidget.Core.DTOs;

public record AnalyticsDto(
    List<DateCountDto>     LeadsOverTime,
    List<DateRevenueDto>   RevenueOverTime,
    int                    TotalConversations,
    int                    TotalLeads,
    double                 ConversionRate,
    List<HourCountDto>     PeakHours,
    List<QuestionCountDto> TopQuestions,
    List<StatusCountDto>   LeadsByStatus
);

public record DateCountDto(string Date, int Count);
public record DateRevenueDto(string Date, decimal Revenue);
public record HourCountDto(int Hour, int Count);
public record QuestionCountDto(string Question, int Count);
public record StatusCountDto(string Status, int Count);
