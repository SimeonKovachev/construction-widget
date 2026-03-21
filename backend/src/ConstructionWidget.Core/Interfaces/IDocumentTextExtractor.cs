namespace ConstructionWidget.Core.Interfaces;

public interface IDocumentTextExtractor
{
    Task<string> ExtractTextAsync(Stream fileStream, string fileName);
}
