using System.Text;
using ConstructionWidget.Core.Interfaces;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using UglyToad.PdfPig;

namespace ConstructionWidget.Infrastructure.Services;

public class DocumentTextExtractor : IDocumentTextExtractor
{
    public Task<string> ExtractTextAsync(Stream fileStream, string fileName)
    {
        var extension = Path.GetExtension(fileName)?.ToLowerInvariant();

        return extension switch
        {
            ".pdf"  => Task.Run(() => ExtractFromPdf(fileStream)),
            ".docx" => Task.Run(() => ExtractFromDocx(fileStream)),
            _       => throw new ArgumentException($"Unsupported file type: {extension}. Only .pdf and .docx are supported.")
        };
    }

    private static string ExtractFromPdf(Stream stream)
    {
        using var document = PdfDocument.Open(stream);
        var sb = new StringBuilder();

        foreach (var page in document.GetPages())
        {
            var text = page.Text;
            if (!string.IsNullOrWhiteSpace(text))
            {
                sb.AppendLine(text.Trim());
                sb.AppendLine();
            }
        }

        return sb.ToString().Trim();
    }

    private static string ExtractFromDocx(Stream stream)
    {
        using var document = WordprocessingDocument.Open(stream, false);
        var body = document.MainDocumentPart?.Document?.Body;
        if (body is null) return string.Empty;

        var sb = new StringBuilder();

        foreach (var paragraph in body.Descendants<Paragraph>())
        {
            var text = paragraph.InnerText;
            if (!string.IsNullOrWhiteSpace(text))
            {
                sb.AppendLine(text.Trim());
            }
        }

        return sb.ToString().Trim();
    }
}
