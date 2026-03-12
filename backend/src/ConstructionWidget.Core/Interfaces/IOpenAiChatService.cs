namespace ConstructionWidget.Core.Interfaces;

public interface IOpenAiChatService
{
    IAsyncEnumerable<string> StreamResponseAsync(
        Guid tenantId,
        string sessionId,
        string userMessage,
        CancellationToken ct = default);
}
