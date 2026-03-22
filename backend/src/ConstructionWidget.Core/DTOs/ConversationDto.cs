namespace ConstructionWidget.Core.DTOs;

public record ConversationSummaryDto(
    Guid     Id,
    string   SessionId,
    int      MessageCount,
    string?  FirstUserMessage,
    bool     IsFlagged,
    bool     HasLead,
    string?  LeadStatus,
    string?  CustomerName,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record ConversationDetailDto(
    Guid                    Id,
    string                  SessionId,
    List<ConversationMsgDto> Messages,
    bool                    IsFlagged,
    bool                    HasLead,
    string?                 LeadStatus,
    string?                 CustomerName,
    DateTime                CreatedAt,
    DateTime                UpdatedAt
);

public record ConversationMsgDto(
    string Role,
    string Content,
    string? Type = "text",
    string? ImageUrl = null,
    List<string>? ImageUrls = null
);
