namespace ConstructionWidget.Infrastructure.Services;

/// <summary>
/// Simple wrapper to pass the wwwroot path from the API layer to Infrastructure
/// without Infrastructure needing a dependency on Microsoft.AspNetCore.
/// Registered as singleton in Program.cs.
/// </summary>
public class WebRootPathAccessor
{
    public string Path { get; }
    public WebRootPathAccessor(string path) => Path = path;
}
