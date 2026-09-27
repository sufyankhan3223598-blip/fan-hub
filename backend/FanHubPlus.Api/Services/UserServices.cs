using FanHubPlus.Api.Common;
using FanHubPlus.Api.Data;
using FanHubPlus.Api.DTOs;
using FanHubPlus.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace FanHubPlus.Api.Services;

public interface IProfileService
{
    Task<UserDto> UpdateProfileAsync(int userId, UpdateProfileRequest req);
    Task<UserDto> UpdatePreferencesAsync(int userId, UpdatePreferencesRequest req);
    Task<UserDto> UpdateAvatarAsync(int userId, IFormFile file);
    Task<UserDto> RemoveAvatarAsync(int userId);
}

public class ProfileService : IProfileService
{
    private readonly AppDbContext _db;
    private readonly IFileStorageService _files;
    private readonly IActivityService _activity;
    private readonly IAuthService _auth;

    public ProfileService(AppDbContext db, IFileStorageService files, IActivityService activity, IAuthService auth)
    {
        _db = db; _files = files; _activity = activity; _auth = auth;
    }

    public async Task<UserDto> UpdateProfileAsync(int userId, UpdateProfileRequest req)
    {
        var user = await _db.Users.Include(u => u.FavoriteFandoms).Include(u => u.UserCategories)
            .FirstOrDefaultAsync(u => u.Id == userId) ?? throw new NotFoundException("User");
        user.FullName = req.FullName.Trim();
        user.Bio = string.IsNullOrWhiteSpace(req.Bio) ? null : req.Bio.Trim();

        _db.UserFavoriteFandoms.RemoveRange(user.FavoriteFandoms);
        foreach (var f in req.FavoriteFandoms.Select(f => f.Trim()).Where(f => f.Length > 0).Distinct(StringComparer.OrdinalIgnoreCase).Take(20))
            _db.UserFavoriteFandoms.Add(new UserFavoriteFandom { UserId = userId, Name = f.Length > 100 ? f[..100] : f });

        _db.UserCategories.RemoveRange(user.UserCategories);
        var valid = await _db.Categories.Where(c => req.CategoryIds.Contains(c.Id)).Select(c => c.Id).ToListAsync();
        foreach (var cid in valid) _db.UserCategories.Add(new UserCategory { UserId = userId, CategoryId = cid });

        await _db.SaveChangesAsync();
        await _activity.LogActivityAsync(userId, "Profile", "Updated profile and interests", null, null, "/profile");
        return await _auth.GetUserAsync(userId);
    }

    public async Task<UserDto> UpdatePreferencesAsync(int userId, UpdatePreferencesRequest req)
    {
        var user = await _db.Users.FindAsync(userId) ?? throw new NotFoundException("User");
        user.Theme = req.Theme == "light" ? "light" : "dark";
        user.FontSize = req.FontSize is "sm" or "lg" ? req.FontSize : "md";
        user.ReduceMotion = req.ReduceMotion;
        user.EmailNotifications = req.EmailNotifications;
        await _db.SaveChangesAsync();
        return await _auth.GetUserAsync(userId);
    }

    public async Task<UserDto> UpdateAvatarAsync(int userId, IFormFile file)
    {
        var user = await _db.Users.FindAsync(userId) ?? throw new NotFoundException("User");
        user.AvatarUrl = await _files.SaveImageAsync(file, "avatars");
        await _db.SaveChangesAsync();
        await _activity.LogActivityAsync(userId, "Profile", "Uploaded a new avatar", null, null, "/profile");
        return await _auth.GetUserAsync(userId);
    }

    public async Task<UserDto> RemoveAvatarAsync(int userId)
    {
        var user = await _db.Users.FindAsync(userId) ?? throw new NotFoundException("User");
        user.AvatarUrl = null;
        await _db.SaveChangesAsync();
        return await _auth.GetUserAsync(userId);
    }
}

public interface IDashboardService
{
    Task<DashboardDto> GetAsync(int userId);
}

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _db;
    private readonly IAuthService _auth;
    private readonly IRecommendationService _recommend;
    private readonly IDiscoveryService _discovery;

    public DashboardService(AppDbContext db, IAuthService auth, IRecommendationService recommend, IDiscoveryService discovery)
    {
        _db = db; _auth = auth; _recommend = recommend; _discovery = discovery;
    }

    public async Task<DashboardDto> GetAsync(int userId)
    {
        var user = await _auth.GetUserAsync(userId);
        var now = DateTime.UtcNow;
        var start = now.Date.AddDays(-13);
        var prevStart = start.AddDays(-14);

        var dash = new DashboardDto
        {
            User = user,
            Greeting = now.Hour switch { < 12 => "Good morning", < 17 => "Good afternoon", _ => "Good evening" }
        };


        var acts = await _db.UserActivities.AsNoTracking().Where(a => a.UserId == userId && a.CreatedAt >= prevStart)
            .Select(a => new { a.ActivityType, a.CreatedAt }).ToListAsync();
        var days = Enumerable.Range(0, 14).Select(i => start.AddDays(i)).ToList();
        dash.ActivityLabels = days.Select(d => d.ToString("MMM d")).ToList();
        int[] Series(string type) => days.Select(d => acts.Count(a => a.ActivityType == type && a.CreatedAt.Date == d)).ToArray();
        dash.ActivitySeries = new()
        {
            new NamedSeriesDto { Name = "Views", Color = "#22D3EE", Values = Series("View").ToList() },
            new NamedSeriesDto { Name = "Bookmarks", Color = "#D4AF37", Values = Series("Bookmark").ToList() },
            new NamedSeriesDto { Name = "Ratings", Color = "#7C3AED", Values = Series("Rating").ToList() }
        };


        var bookmarks = await _db.Bookmarks.CountAsync(b => b.UserId == userId);
        var ratings = await _db.Ratings.CountAsync(r => r.UserId == userId);
        var submissions = await _db.FanSubmissions.CountAsync(s => s.UserId == userId);
        var activeDays = acts.Select(a => a.CreatedAt.Date).Distinct().OrderByDescending(d => d).ToList();
        var streak = 0;
        for (var d = now.Date; activeDays.Contains(d); d = d.AddDays(-1)) streak++;
        if (streak == 0 && activeDays.Contains(now.Date.AddDays(-1)))
            for (var d = now.Date.AddDays(-1); activeDays.Contains(d); d = d.AddDays(-1)) streak++;
        dash.Streak = streak;

        double Change(string type)
        {
            var cur = acts.Count(a => a.ActivityType == type && a.CreatedAt >= start);
            var prev = acts.Count(a => a.ActivityType == type && a.CreatedAt < start);
            return prev == 0 ? (cur > 0 ? 100 : 0) : Math.Round((cur - prev) * 100.0 / prev, 1);
        }
        dash.Kpis = new()
        {
            new KpiDto { Key = "bookmarks", Label = "Bookmarks", Value = bookmarks, Change = Change("Bookmark"), Trend = Series("Bookmark").ToList() },
            new KpiDto { Key = "ratings", Label = "Ratings", Value = ratings, Change = Change("Rating"), Trend = Series("Rating").ToList() },
            new KpiDto { Key = "submissions", Label = "Submissions", Value = submissions, Change = Change("Submission"), Trend = Series("Submission").ToList() },
            new KpiDto { Key = "streak", Label = "Day streak", Value = streak, Change = 0, Trend = days.Select(d => activeDays.Contains(d) ? 1 : 0).ToList() }
        };


        var since = now.AddDays(-30);
        var cats = await _db.Categories.AsNoTracking().OrderBy(c => c.SortOrder).ToListAsync();
        var viewsByCat = await _db.ViewLogs.AsNoTracking().Where(v => v.UserId == userId && v.ViewedAt >= since && v.CategoryId != null)
            .GroupBy(v => v.CategoryId).Select(g => new { g.Key, N = g.Count() }).ToListAsync();
        dash.CategoryBreakdown = cats.Select(c => new SliceDto
        {
            Label = c.Name, Color = c.AccentColor, Value = viewsByCat.FirstOrDefault(v => v.Key == c.Id)?.N ?? 0
        }).Where(s => s.Value > 0).OrderByDescending(s => s.Value).ToList();
        if (dash.CategoryBreakdown.Count == 0)
            dash.CategoryBreakdown = user.Categories.Select(c => new SliceDto { Label = c.Name, Color = c.AccentColor, Value = 1 }).ToList();

        dash.RecentActivity = await _db.UserActivities.AsNoTracking().Where(a => a.UserId == userId)
            .OrderByDescending(a => a.CreatedAt).Take(10).Select(Projections.ToActivity).ToListAsync();
        dash.Bookmarks = await _db.Bookmarks.AsNoTracking().Where(b => b.UserId == userId)
            .OrderByDescending(b => b.CreatedAt).Take(8).Select(Projections.ToBookmark).ToListAsync();
        dash.Recommendations = await _recommend.ForUserAsync(userId, new List<string>(), 8);
        dash.FavoriteFandomContent = await _recommend.ForFandomsAsync(user.FavoriteFandoms, 6);
        dash.Notifications = await _db.Notifications.AsNoTracking().Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt).Take(6).Select(Projections.ToNotification).ToListAsync();
        dash.UpcomingEvents = (await _discovery.GetEventsAsync(new EventQuery())).Take(4).ToList();
        return dash;
    }
}

public interface IRecommendationService
{
    Task<List<ContentCardDto>> ForUserAsync(int? userId, List<string> contextCategorySlugs, int take);
    Task<List<ContentCardDto>> ForFandomsAsync(List<string> fandoms, int take);
}

public class RecommendationService : IRecommendationService
{
    private readonly AppDbContext _db;
    public RecommendationService(AppDbContext db) => _db = db;

    public async Task<List<ContentCardDto>> ForUserAsync(int? userId, List<string> contextCategorySlugs, int take)
    {
        var interestIds = new List<int>();
        var likedGenreIds = new List<int>();
        var seen = new List<int>();
        if (userId.HasValue)
        {
            interestIds = await _db.UserCategories.Where(u => u.UserId == userId).Select(u => u.CategoryId).ToListAsync();
            var liked = _db.Ratings.Where(r => r.UserId == userId && r.ItemType == ItemTypes.Content && (r.Stars >= 4 || r.Thumb == 1)).Select(r => r.ItemId);
            likedGenreIds = await _db.ContentGenres.Where(g => liked.Contains(g.ContentId)).Select(g => g.GenreId).Distinct().ToListAsync();
            seen = await _db.ViewLogs.Where(v => v.UserId == userId && v.ItemType == ItemTypes.Content).Select(v => v.ItemId).Distinct().ToListAsync();
        }
        var contextIds = contextCategorySlugs.Count == 0
            ? new List<int>()
            : await _db.Categories.Where(c => contextCategorySlugs.Contains(c.Slug)).Select(c => c.Id).ToListAsync();

        var candidates = await _db.Contents.AsNoTracking().Where(c => c.IsPublished)
            .Select(c => new
            {
                c.Id, c.CategoryId, c.PopularityScore,
                GenreIds = c.ContentGenres.Select(g => g.GenreId).ToList()
            }).ToListAsync();

        var ranked = candidates
            .Select(c => new
            {
                c.Id,
                Score = (contextIds.Contains(c.CategoryId) ? 600 : 0)
                        + (interestIds.Contains(c.CategoryId) ? 300 : 0)
                        + c.GenreIds.Count(g => likedGenreIds.Contains(g)) * 120
                        + c.PopularityScore / 4
                        - (seen.Contains(c.Id) ? 350 : 0)
            })
            .OrderByDescending(c => c.Score).Take(take).Select(c => c.Id).ToList();

        var cards = await _db.Contents.AsNoTracking().Where(c => ranked.Contains(c.Id)).Select(Projections.ToContentCard).ToListAsync();
        return cards.OrderBy(c => ranked.IndexOf(c.Id)).ToList();
    }

    public async Task<List<ContentCardDto>> ForFandomsAsync(List<string> fandoms, int take)
    {
        if (fandoms.Count == 0) return new();
        var list = new List<ContentCardDto>();
        foreach (var f in fandoms.Take(6))
        {
            var match = await _db.Contents.AsNoTracking().Where(c => c.IsPublished && c.Title.Contains(f))
                .OrderByDescending(c => c.PopularityScore).Select(Projections.ToContentCard).FirstOrDefaultAsync();
            if (match != null && list.All(l => l.Id != match.Id)) list.Add(match);
        }
        return list.Take(take).ToList();
    }
}
