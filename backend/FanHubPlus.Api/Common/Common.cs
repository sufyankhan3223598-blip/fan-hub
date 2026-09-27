using System.Globalization;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;

namespace FanHubPlus.Api.Common;

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    private int? _totalPages;
    public int TotalPages
    {
        get => _totalPages ?? (PageSize == 0 ? 0 : (int)Math.Ceiling(Total / (double)PageSize));
        set => _totalPages = value;
    }

    public PagedResult() { }
    public PagedResult(List<T> items, int total, int page, int pageSize)
    {
        Items = items; Total = total; Page = page; PageSize = pageSize;
    }
}

public static class Roles
{
    public const string Visitor = "Visitor";
    public const string User = "User";
    public const string Admin = "Admin";
}

public static class ItemTypes
{
    public const string Content = "Content";
    public const string Character = "Character";
    public const string Media = "Media";
    public const string Merchandise = "Merchandise";
    public const string Article = "Article";
    public const string Event = "Event";
    public const string Upcoming = "Upcoming";
    public const string Submission = "Submission";

    public static readonly string[] Bookmarkable = { Content, Character, Media, Merchandise, Article, Event };
    public static readonly string[] Rateable = { Content, Media };
}

public class AppException : Exception
{
    public int StatusCode { get; }
    public AppException(string message, int statusCode = 400) : base(message) => StatusCode = statusCode;
}

public class NotFoundException : AppException
{
    public NotFoundException(string what) : base($"{what} was not found.", 404) { }
}

public static class ClaimsExtensions
{

    public static int? GetUserId(this ClaimsPrincipal user)
    {
        var raw = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub");
        return int.TryParse(raw, out var id) ? id : null;
    }

    public static int RequireUserId(this ClaimsPrincipal user) =>
        user.GetUserId() ?? throw new AppException("Authentication required.", 401);

    public static bool IsMember(this ClaimsPrincipal user) => user.Identity?.IsAuthenticated == true;
}

public static class Slug
{

    public static string Create(string text)
    {
        var normalized = text.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder();
        foreach (var c in normalized)
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark) sb.Append(c);
        var s = sb.ToString().ToLowerInvariant().Replace("&", "and");
        s = Regex.Replace(s, "[^a-z0-9]+", "-").Trim('-');
        return string.IsNullOrEmpty(s) ? Guid.NewGuid().ToString("N")[..8] : s;
    }
}

public static class Html
{





    public static string Sanitize(string? html)
    {
        if (string.IsNullOrWhiteSpace(html)) return string.Empty;
        var s = Regex.Replace(html, @"<\s*(script|style|iframe|object|embed|form)[^>]*>.*?<\s*/\s*\1\s*>", "", RegexOptions.IgnoreCase | RegexOptions.Singleline);
        s = Regex.Replace(s, @"<\s*(script|style|iframe|object|embed|form|link|meta)[^>]*>", "", RegexOptions.IgnoreCase);
        s = Regex.Replace(s, @"\son\w+\s*=\s*(""[^""]*""|'[^']*'|[^\s>]+)", "", RegexOptions.IgnoreCase);
        s = Regex.Replace(s, @"(href|src)\s*=\s*([""'])\s*javascript:[^""']*\2", "$1=\"#\"", RegexOptions.IgnoreCase);
        return s.Trim();
    }

    public static string StripTags(string? html) =>
        string.IsNullOrEmpty(html) ? string.Empty : Regex.Replace(html, "<[^>]+>", " ").Replace("  ", " ").Trim();
}
