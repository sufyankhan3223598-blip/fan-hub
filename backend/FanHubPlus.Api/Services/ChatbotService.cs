using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using FanHubPlus.Api.Common;
using FanHubPlus.Api.Data;
using FanHubPlus.Api.DTOs;
using FanHubPlus.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace FanHubPlus.Api.Services;

public class ChatbotSettings
{

    public string ApiKey { get; set; } = string.Empty;
    public string Endpoint { get; set; } = "https://api.openai.com/v1/chat/completions";
    public string Model { get; set; } = "gpt-4o-mini";
}

public interface IChatbotService
{
    Task<ChatResponse> ReplyAsync(ChatRequest req, int? userId);
    Task<List<ChatSessionDto>> GetHistoryAsync(int userId);
    Task ClearHistoryAsync(int userId);
}

public class ChatbotService : IChatbotService
{
    private static readonly string[] Stop = { "the", "a", "an", "is", "are", "do", "i", "how", "what", "can", "to", "my", "of", "in", "on", "for", "it", "me", "you", "does", "where", "and", "or", "with", "be", "there" };
    private static readonly string[] MainMenu = { "Guide me through Fan Hub Plus", "Recommend something", "Find events near me", "How do bookmarks work?" };

    private readonly AppDbContext _db;
    private readonly IRecommendationService _recommend;
    private readonly ChatbotSettings _settings;
    private readonly IHttpClientFactory _http;
    private readonly ILogger<ChatbotService> _logger;

    public ChatbotService(AppDbContext db, IRecommendationService recommend, IOptions<ChatbotSettings> settings,
        IHttpClientFactory http, ILogger<ChatbotService> logger)
    {
        _db = db; _recommend = recommend; _settings = settings.Value; _http = http; _logger = logger;
    }

    public async Task<ChatResponse> ReplyAsync(ChatRequest req, int? userId)
    {
        var message = (req.Message ?? string.Empty).Trim();
        if (message.Length == 0) throw new AppException("Please type a message.");
        if (message.Length > 1000) message = message[..1000];
        var session = string.IsNullOrWhiteSpace(req.SessionId) ? Guid.NewGuid().ToString("N") : Regex.Replace(req.SessionId, "[^a-zA-Z0-9-]", "");
        if (session.Length > 64) session = session[..64];

        var history = await _db.ChatbotQueries.AsNoTracking().Where(q => q.SessionId == session)
            .OrderByDescending(q => q.CreatedAt).Take(6).ToListAsync();
        var categories = await _db.Categories.AsNoTracking().OrderBy(c => c.SortOrder).ToListAsync();
        var text = message.ToLowerInvariant();

        var response = await RouteAsync(text, message, history, categories, userId);

        _db.ChatbotQueries.Add(new ChatbotQuery
        {
            UserId = userId, SessionId = session, Message = message, Response = response.Reply,
            Intent = response.OnboardingStep.HasValue ? $"Onboarding:{response.OnboardingStep}" : response.Intent
        });
        await _db.SaveChangesAsync();
        return response;
    }

    private async Task<ChatResponse> RouteAsync(string text, string original, List<ChatbotQuery> history, List<Category> categories, int? userId)
    {

        var last = history.FirstOrDefault();
        if (last != null && last.Intent.StartsWith("Onboarding:") && !Has(text, "stop", "exit", "cancel", "quit"))
        {
            if (int.TryParse(last.Intent.Split(':')[1], out var step) && step < 4)
                return await OnboardingAsync(step + 1, text, categories, userId, history);
        }


        if (Regex.IsMatch(text, @"^(hi|hello|hey|salam|assalam|yo|good (morning|evening|afternoon))\b"))
            return new ChatResponse
            {
                Intent = "Greeting",
                Reply = userId.HasValue
                    ? "Welcome back to the multiverse! I can recommend content, answer questions about Fan Hub Plus or walk you through the features."
                    : "Hi, I'm the Fan Hub Plus assistant. Ask me anything about the platform, or let me guide you through the eight realms.",
                QuickReplies = MainMenu.ToList()
            };


        if (Has(text, "guide me", "tour", "get started", "getting started", "new here", "how to start", "onboard", "walk me"))
            return await OnboardingAsync(1, text, categories, userId, history);


        if (Has(text, "recommend", "suggest", "what should i", "something to watch", "something to play", "something to read", "similar to", " like "))
            return await RecommendAsync(text, categories, userId, history);


        var faq = await MatchFaqAsync(text);
        if (faq != null)
        {
            faq.HitCount++;
            await _db.SaveChangesAsync();
            return new ChatResponse
            {
                Intent = "Faq", Reply = faq.Answer,
                QuickReplies = new List<string> { "Recommend something", "Guide me through Fan Hub Plus", "Ask another question" }
            };
        }


        var mentioned = Mentioned(text, categories);
        if (mentioned.Count > 0)
        {
            var cat = mentioned[0];
            var picks = await _recommend.ForUserAsync(userId, new List<string> { cat.Slug }, 3);
            return new ChatResponse
            {
                Intent = "Category",
                Reply = $"{cat.Name}: {cat.Tagline}. {cat.Description} Here are a few picks to start with.",
                Suggestions = picks.Select(ToSuggestion).ToList(),
                QuickReplies = new List<string> { $"Recommend more {cat.Name}", "How do I use advanced filters?", "Find events near me" }
            };
        }


        var words = Words(text).Where(w => w.Length > 3).ToList();
        if (words.Count > 0)
        {

            var titles = await _db.Contents.AsNoTracking().Where(c => c.IsPublished)
                .Select(c => new { c.Id, c.Title, c.PopularityScore }).ToListAsync();
            var ids = titles.Where(t => words.Any(w => t.Title.Contains(w, StringComparison.OrdinalIgnoreCase)))
                .OrderByDescending(t => t.PopularityScore).Take(3).Select(t => t.Id).ToList();
            var hits = ids.Count == 0 ? new List<ContentCardDto>()
                : await _db.Contents.AsNoTracking().Where(c => ids.Contains(c.Id)).Select(Projections.ToContentCard).ToListAsync();
            if (hits.Count > 0)
                return new ChatResponse
                {
                    Intent = "Search", Reply = "Here is what I found in the library:",
                    Suggestions = hits.Select(ToSuggestion).ToList(),
                    QuickReplies = new List<string> { "Recommend something similar", "Ask another question" }
                };
        }


        var llm = await AskLlmAsync(original);
        if (llm != null)
            return new ChatResponse { Intent = "Llm", Reply = llm, QuickReplies = MainMenu.ToList() };


        return new ChatResponse
        {
            Intent = "Fallback",
            Reply = "I'm not sure about that yet. I can help with accounts, bookmarks, ratings, events, merchandise, fan submissions and recommendations. You can also send the question through the Feedback page.",
            QuickReplies = MainMenu.ToList()
        };
    }


    private async Task<ChatResponse> OnboardingAsync(int step, string text, List<Category> categories, int? userId, List<ChatbotQuery> history)
    {
        switch (step)
        {
            case 1:
                return new ChatResponse
                {
                    Intent = "Onboarding", OnboardingStep = 1,
                    Reply = "Step 1 of 4 - Welcome aboard! Fan Hub Plus is split into eight realms. Which ones are you into? Pick one or more.",
                    QuickReplies = categories.Select(c => c.Name).Append("Skip").ToList()
                };
            case 2:
            {
                var picked = Mentioned(text, categories);
                var saved = false;
                if (picked.Count > 0 && userId.HasValue)
                {
                    var existing = await _db.UserCategories.Where(u => u.UserId == userId).Select(u => u.CategoryId).ToListAsync();
                    foreach (var c in picked.Where(c => !existing.Contains(c.Id)))
                        _db.UserCategories.Add(new UserCategory { UserId = userId.Value, CategoryId = c.Id });
                    await _db.SaveChangesAsync();
                    saved = true;
                }
                var recs = await _recommend.ForUserAsync(userId, picked.Select(p => p.Slug).ToList(), 3);
                var names = picked.Count > 0 ? string.Join(", ", picked.Select(p => p.Name)) : "every realm";
                return new ChatResponse
                {
                    Intent = "Onboarding", OnboardingStep = 2,
                    Reply = $"Step 2 of 4 - Great taste! Based on {names}, here are three picks. Tap the bookmark icon on any card to save it and add a personal note." +
                            (saved ? " I also added these realms to your interests." : ""),
                    Suggestions = recs.Select(ToSuggestion).ToList(),
                    QuickReplies = new List<string> { "Next", "Stop tour" }
                };
            }
            case 3:
                return new ChatResponse
                {
                    Intent = "Onboarding", OnboardingStep = 3,
                    Reply = "Step 3 of 4 - Use the Explorer to filter by category, genre, release year, popularity and content type, then sort by latest, most popular or A-Z. Your Dashboard collects your activity, favorite fandoms, bookmarks and recommendations.",
                    QuickReplies = new List<string> { "Next", "Stop tour" }
                };
            default:
                return new ChatResponse
                {
                    Intent = "Onboarding", OnboardingStep = 4,
                    Reply = "Step 4 of 4 - Open Events to find conventions, meetups and screenings near you on the map and calendar. You can rate media, submit your own fan content for review and send feedback anytime. " +
                            (userId.HasValue ? "You're all set - enjoy the multiverse!" : "Create a free account to unlock full details, playback, bookmarks and personalized picks."),
                    QuickReplies = userId.HasValue
                        ? new List<string> { "Recommend something", "Find events near me" }
                        : new List<string> { "How do I create an account?", "Recommend something" }
                };
        }
    }


    private async Task<ChatResponse> RecommendAsync(string text, List<Category> categories, int? userId, List<ChatbotQuery> history)
    {

        var context = Mentioned(text, categories);
        if (context.Count == 0)
            foreach (var h in history)
            {
                context = Mentioned(h.Message.ToLowerInvariant(), categories);
                if (context.Count > 0) break;
            }


        var likeMatch = Regex.Match(text, @"(?:like|similar to)\s+(.+)$");
        string? seedTitle = null;
        if (likeMatch.Success)
        {
            var phrase = likeMatch.Groups[1].Value.Trim(' ', '?', '!', '.');
            var seed = await _db.Contents.AsNoTracking().Include(c => c.Category)
                .FirstOrDefaultAsync(c => c.Title.Contains(phrase));
            if (seed != null)
            {
                seedTitle = seed.Title;
                context = context.Prepend(seed.Category!).DistinctBy(c => c.Id).ToList();
            }
        }

        var picks = await _recommend.ForUserAsync(userId, context.Select(c => c.Slug).ToList(), 12);
        if (seedTitle != null) picks = picks.Where(p => p.Title != seedTitle).ToList();
        picks = picks.Take(4).ToList();

        var reason = seedTitle != null ? $"Fans of {seedTitle} also enjoy these:"
            : context.Count > 0 ? $"Top {string.Join(" & ", context.Select(c => c.Name))} picks for you:"
            : userId.HasValue ? "Based on your interests and activity, you might enjoy:" : "Here are some of the most popular picks right now:";
        if (!userId.HasValue) reason += " (Sign in for recommendations tuned to your profile.)";

        return new ChatResponse
        {
            Intent = "Recommend", Reply = reason,
            Suggestions = picks.Select(ToSuggestion).ToList(),
            QuickReplies = categories.Where(c => context.All(x => x.Id != c.Id)).Take(3).Select(c => $"Recommend {c.Name}").Append("Guide me through Fan Hub Plus").ToList()
        };
    }


    private async Task<ChatbotFaq?> MatchFaqAsync(string text)
    {
        var faqs = await _db.ChatbotFaqs.Where(f => f.IsActive).ToListAsync();
        var words = Words(text);
        ChatbotFaq? best = null;
        var bestScore = 0;
        foreach (var f in faqs)
        {
            var score = 0;
            foreach (var k in f.Keywords.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                if (Regex.IsMatch(text, $@"\b{Regex.Escape(k.ToLowerInvariant())}")) score += k.Contains(' ') ? 4 : 3;
            var qWords = Words(f.Question.ToLowerInvariant()).Select(Stem).ToList();
            score += words.Select(Stem).Count(w => qWords.Contains(w));
            if (score > bestScore) { bestScore = score; best = f; }
        }
        return bestScore >= 3 ? best : null;
    }


    private async Task<string?> AskLlmAsync(string message)
    {
        if (string.IsNullOrWhiteSpace(_settings.ApiKey)) return null;
        try
        {
            var faqs = await _db.ChatbotFaqs.AsNoTracking().Where(f => f.IsActive).Take(40)
                .Select(f => f.Question + " " + f.Answer).ToListAsync();
            var payload = new
            {
                model = _settings.Model,
                messages = new object[]
                {
                    new { role = "system", content = "You are the Fan Hub Plus assistant for a fandom platform (Anime, Gaming, Movies, TV Shows, K-Pop, Comics, Manga, Cosplay). Answer briefly. Merchandise is display-only. Knowledge base:\n" + string.Join("\n", faqs) },
                    new { role = "user", content = message }
                },
                max_tokens = 250
            };
            var client = _http.CreateClient();
            using var request = new HttpRequestMessage(HttpMethod.Post, _settings.Endpoint)
            {
                Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _settings.ApiKey);
            using var res = await client.SendAsync(request);
            if (!res.IsSuccessStatusCode) return null;
            using var doc = JsonDocument.Parse(await res.Content.ReadAsStringAsync());
            return doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "LLM fallback failed");
            return null;
        }
    }


    public async Task<List<ChatSessionDto>> GetHistoryAsync(int userId)
    {
        var rows = await _db.ChatbotQueries.AsNoTracking().Where(q => q.UserId == userId)
            .OrderByDescending(q => q.CreatedAt).Take(300).ToListAsync();
        return rows.GroupBy(r => r.SessionId).Select(g => new ChatSessionDto
        {
            SessionId = g.Key,
            StartedAt = g.Min(x => x.CreatedAt),
            LastMessageAt = g.Max(x => x.CreatedAt),
            MessageCount = g.Count(),
            Preview = g.OrderBy(x => x.CreatedAt).First().Message,
            Messages = g.OrderBy(x => x.CreatedAt).Select(x => new ChatHistoryItemDto
            {
                Id = x.Id, SessionId = x.SessionId, Message = x.Message, Response = x.Response, Intent = x.Intent, CreatedAt = x.CreatedAt
            }).ToList()
        }).OrderByDescending(s => s.LastMessageAt).ToList();
    }

    public async Task ClearHistoryAsync(int userId)
    {

        var rows = await _db.ChatbotQueries.Where(q => q.UserId == userId).ToListAsync();
        foreach (var r in rows) r.UserId = null;
        await _db.SaveChangesAsync();
    }


    private static string Stem(string w) => w.Length > 4 && w.EndsWith('s') ? w[..^1] : w;

    private static bool Has(string text, params string[] needles) => needles.Any(n => text.Contains(n));

    private static List<string> Words(string text) =>
        Regex.Split(text, "[^a-z0-9-]+").Where(w => w.Length > 1 && !Stop.Contains(w)).Distinct().ToList();

    private static List<Category> Mentioned(string text, List<Category> categories)
    {
        var aliases = new Dictionary<string, string[]>
        {
            ["anime"] = new[] { "anime" },
            ["gaming"] = new[] { "gaming", "game", "games", "gamer" },
            ["movies"] = new[] { "movie", "movies", "film", "films", "cinema" },
            ["tv-shows"] = new[] { "tv", "show", "shows", "series" },
            ["k-pop"] = new[] { "k-pop", "kpop", "k pop", "idol" },
            ["comics"] = new[] { "comic", "comics", "graphic novel" },
            ["manga"] = new[] { "manga" },
            ["cosplay"] = new[] { "cosplay", "costume", "cosplayer" }
        };
        return categories.Where(c =>
            (aliases.TryGetValue(c.Slug, out var a) ? a : new[] { c.Name.ToLowerInvariant() })
            .Any(k => Regex.IsMatch(text, $@"(^|[^a-z]){Regex.Escape(k)}($|[^a-z])"))).ToList();
    }

    private static ChatSuggestionDto ToSuggestion(ContentCardDto c) => new()
    {
        Title = c.Title, Subtitle = $"{c.CategoryName} / {c.Format} / {c.ReleaseYear}", ImageUrl = c.ImageUrl, Url = $"/content/{c.Slug}"
    };
}
