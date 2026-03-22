namespace ConstructionWidget.Core.Interfaces;

public interface IOpenAiChatService
{
    IAsyncEnumerable<string> StreamResponseAsync(
        Guid tenantId,
        string sessionId,
        string userMessage,
        List<string>? imageUrls = null,
        CancellationToken ct = default);
}
