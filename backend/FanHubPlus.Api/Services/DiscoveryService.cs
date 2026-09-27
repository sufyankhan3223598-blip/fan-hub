using FanHubPlus.Api.Common;
using FanHubPlus.Api.Data;
using FanHubPlus.Api.DTOs;
using Microsoft.EntityFrameworkCore;

namespace FanHubPlus.Api.Services;

public interface IDiscoveryService
{
    Task<PagedResult<ArticleCardDto>> GetArticlesAsync(string? search, string? category, bool? featured, int page, int pageSize);
    Task<ArticleDetailDto> GetArticleAsync(string slug, int? userId);

    Task<PagedResult<MerchDto>> GetMerchandiseAsync(MerchQuery q);
    Task<List<MerchGroupDto>> GetMerchandiseGroupedAsync(string by);
    Task<MerchDto> GetMerchandiseItemAsync(string slug, int? userId);
    Task<List<UpcomingDto>> GetUpcomingAsync(string? category, string? type);

    Task<List<EventDto>> GetEventsAsync(EventQuery q);
    Task<EventDetailDto> GetEventAsync(string slug, int? userId);
    Task<List<string>> GetEventCitiesAsync();

    Task<SiteStatsDto> GetStatsAsync();
    Task<List<SearchResultDto>> SearchAsync(string q, int take);
    Task<HomeDto> GetHomeAsync(ICatalogService catalog);
    Task<List<FaqDto>> GetFaqsAsync();
}

public class DiscoveryService : IDiscoveryService
{
    private readonly AppDbContext _db;
    private readonly IActivityService _activity;

    public DiscoveryService(AppDbContext db, IActivityService activity)
    {
        _db = db; _activity = activity;
    }


    public async Task<PagedResult<ArticleCardDto>> GetArticlesAsync(string? search, string? category, bool? featured, int page, int pageSize)
    {
        var q = _db.Articles.AsNoTracking().Where(a => a.Status == "Published");
        if (!string.IsNullOrWhiteSpace(search)) q = q.Where(a => a.Title.Contains(search) || a.Excerpt.Contains(search));
        if (!string.IsNullOrWhiteSpace(category)) q = q.Where(a => a.Category!.Slug == category);
        if (featured == true) q = q.Where(a => a.IsFeatured);

        page = Math.Max(1, page);
        var total = await q.CountAsync();
        var ordered = q.OrderByDescending(a => a.PublishedAt).Select(Projections.ToArticleCard);

        int totalPages;
        List<ArticleCardDto> items;

        if (total <= 10)
        {
            totalPages = total > 0 ? 1 : 0;
            items = await ordered.Skip(0).Take(10).ToListAsync();
        }
        else
        {
            totalPages = 1 + (int)Math.Ceiling((total - 10) / 9.0);
            if (page == 1)
            {
                items = await ordered.Skip(0).Take(10).ToListAsync();
            }
            else
            {
                var skip = 10 + (page - 2) * 9;
                items = await ordered.Skip(skip).Take(9).ToListAsync();
            }
        }

        return new PagedResult<ArticleCardDto>
        {
            Items = items,
            Total = total,
            Page = page,
            PageSize = page == 1 ? 10 : 9,
            TotalPages = totalPages
        };
    }

    public async Task<ArticleDetailDto> GetArticleAsync(string slug, int? userId)
    {
        var a = await _db.Articles.Include(x => x.TimelineItems).Include(x => x.Category).Include(x => x.Author)
            .FirstOrDefaultAsync(x => x.Slug == slug && x.Status == "Published") ?? throw new NotFoundException("Article");
        a.ViewCount++;
        a.PopularityScore++;
        await _db.SaveChangesAsync();
        await _activity.LogViewAsync(userId, ItemTypes.Article, a.Id, a.CategoryId);
        if (userId.HasValue)
            await _activity.LogActivityAsync(userId.Value, "View", $"Read {a.Title}", ItemTypes.Article, a.Id, $"/articles/{a.Slug}");

        var member = userId.HasValue;
        var detail = new ArticleDetailDto
        {
            Id = a.Id, Title = a.Title, Slug = a.Slug, Excerpt = a.Excerpt, ImageUrl = a.ImageUrl,
            HoverImageUrl = a.HoverImageUrl, ReadMinutes = a.ReadMinutes, IsFeatured = a.IsFeatured,
            CategoryName = a.Category!.Name, CategorySlug = a.Category.Slug, AccentColor = a.Category.AccentColor,
            AuthorName = a.Author?.FullName ?? "Fan Hub Plus Editorial", ViewCount = a.ViewCount, PublishedAt = a.PublishedAt,
            Body = member ? a.Body : $"<p>{CatalogService.Teaser(a.Body, 45)}</p>",
            Locked = !member,
            Timeline = a.TimelineItems.OrderBy(t => t.SortOrder).Select(t => new TimelineItemDto
            {
                Id = t.Id, DateLabel = t.DateLabel, Title = t.Title, Description = t.Description, SortOrder = t.SortOrder
            }).Take(member ? 100 : 2).ToList()
        };
        detail.Related = await _db.Articles.AsNoTracking()
            .Where(x => x.Id != a.Id && x.Status == "Published")
            .OrderByDescending(x => x.CategoryId == a.CategoryId).ThenByDescending(x => x.PublishedAt)
            .Take(3).Select(Projections.ToArticleCard).ToListAsync();
        return detail;
    }


    public async Task<PagedResult<MerchDto>> GetMerchandiseAsync(MerchQuery q)
    {
        var query = _db.MerchandiseItems.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(q.Search)) query = query.Where(m => m.Name.Contains(q.Search) || m.Fandom.Contains(q.Search));
        if (!string.IsNullOrWhiteSpace(q.Category)) query = query.Where(m => m.Category!.Slug == q.Category);
        if (!string.IsNullOrWhiteSpace(q.Fandom)) query = query.Where(m => m.Fandom == q.Fandom);
        if (!string.IsNullOrWhiteSpace(q.Tag)) query = query.Where(m => m.MerchandiseTags.Any(t => t.Tag!.Slug == q.Tag));
        if (q.Upcoming.HasValue) query = query.Where(m => m.IsUpcoming == q.Upcoming.Value);
        query = (q.Sort ?? "popular").ToLowerInvariant() switch
        {
            "latest" => query.OrderByDescending(m => m.CreatedAt),
            "az" => query.OrderBy(m => m.Name),
            "views" => query.OrderByDescending(m => m.ViewCount),
            _ => query.OrderByDescending(m => m.PopularityScore)
        };
        return await CatalogService.PageAsync(query.Select(Projections.ToMerch), q.Page, q.PageSize);
    }

    public async Task<List<MerchGroupDto>> GetMerchandiseGroupedAsync(string by)
    {
        var items = await _db.MerchandiseItems.AsNoTracking().OrderByDescending(m => m.PopularityScore)
            .Select(Projections.ToMerch).ToListAsync();
        if (by == "fandom")
            return items.GroupBy(i => i.Fandom).OrderBy(g => g.Key)
                .Select(g => new MerchGroupDto { Key = Slug.Create(g.Key), Label = g.Key, AccentColor = g.First().AccentColor, Items = g.ToList() })
                .ToList();
        return items.GroupBy(i => new { i.CategorySlug, i.CategoryName, i.AccentColor })
            .Select(g => new MerchGroupDto { Key = g.Key.CategorySlug, Label = g.Key.CategoryName, AccentColor = g.Key.AccentColor, Items = g.ToList() })
            .ToList();
    }

    public async Task<MerchDto> GetMerchandiseItemAsync(string slug, int? userId)
    {
        var m = await _db.MerchandiseItems.FirstOrDefaultAsync(x => x.Slug == slug) ?? throw new NotFoundException("Merchandise item");
        m.ViewCount++;
        m.PopularityScore++;
        await _db.SaveChangesAsync();
        await _activity.LogViewAsync(userId, ItemTypes.Merchandise, m.Id, m.CategoryId);
        if (userId.HasValue)
            await _activity.LogActivityAsync(userId.Value, "View", $"Viewed {m.Name}", ItemTypes.Merchandise, m.Id, $"/merchandise/{m.Slug}");
        var dto = await _db.MerchandiseItems.AsNoTracking().Where(x => x.Id == m.Id).Select(Projections.ToMerch).FirstAsync();
        if (!userId.HasValue)
        {
            dto.Locked = true;
            dto.Images = dto.Images.Take(1).ToList();
        }
        return dto;
    }

    public async Task<List<UpcomingDto>> GetUpcomingAsync(string? category, string? type)
    {
        var q = _db.UpcomingReleases.AsNoTracking().Where(u => u.ReleaseDate >= DateTime.UtcNow.Date.AddDays(-1));
        if (!string.IsNullOrWhiteSpace(category)) q = q.Where(u => u.Category!.Slug == category);
        if (!string.IsNullOrWhiteSpace(type)) q = q.Where(u => u.ReleaseType == type);
        return await q.OrderBy(u => u.ReleaseDate).Select(Projections.ToUpcoming).ToListAsync();
    }


    public async Task<List<EventDto>> GetEventsAsync(EventQuery q)
    {
        var query = _db.Events.AsNoTracking();
        if (!q.IncludePast) query = query.Where(e => e.EndDate >= DateTime.UtcNow.Date);
        if (!string.IsNullOrWhiteSpace(q.Search)) query = query.Where(e => e.Title.Contains(q.Search) || e.Venue.Contains(q.Search));
        if (!string.IsNullOrWhiteSpace(q.City)) query = query.Where(e => e.City == q.City);
        if (!string.IsNullOrWhiteSpace(q.Category)) query = query.Where(e => e.Category != null && e.Category.Slug == q.Category);
        if (!string.IsNullOrWhiteSpace(q.Type)) query = query.Where(e => e.EventType == q.Type);
        if (q.From.HasValue) query = query.Where(e => e.EndDate >= q.From.Value);
        if (q.To.HasValue) query = query.Where(e => e.StartDate <= q.To.Value);
        if (q.Highlights == true) query = query.Where(e => e.IsHighlight);

        var list = await query.OrderBy(e => e.StartDate).Select(Projections.ToEvent).ToListAsync();


        if (q.Lat.HasValue && q.Lng.HasValue)
        {
            foreach (var e in list) e.DistanceKm = Math.Round(Haversine(q.Lat.Value, q.Lng.Value, e.Latitude, e.Longitude), 1);
            if (q.RadiusKm.HasValue) list = list.Where(e => e.DistanceKm <= q.RadiusKm.Value).ToList();
            list = list.OrderBy(e => e.DistanceKm).ToList();
        }
        return list;
    }

    public async Task<EventDetailDto> GetEventAsync(string slug, int? userId)
    {
        var e = await _db.Events.FirstOrDefaultAsync(x => x.Slug == slug) ?? throw new NotFoundException("Event");
        e.ViewCount++;
        await _db.SaveChangesAsync();
        await _activity.LogViewAsync(userId, ItemTypes.Event, e.Id, e.CategoryId);
        var dto = await _db.Events.AsNoTracking().Where(x => x.Id == e.Id).Select(Projections.ToEvent).FirstAsync();
        var member = userId.HasValue;
        var detail = new EventDetailDto
        {
            Id = dto.Id, Title = dto.Title, Slug = dto.Slug, EventType = dto.EventType, Description = dto.Description,
            City = dto.City, Country = dto.Country, Venue = dto.Venue, Latitude = dto.Latitude, Longitude = dto.Longitude,
            StartDate = dto.StartDate, EndDate = dto.EndDate, TicketUrl = member ? dto.TicketUrl : string.Empty,
            ImageUrl = dto.ImageUrl, HoverImageUrl = dto.HoverImageUrl, IsHighlight = dto.IsHighlight,
            CategoryName = dto.CategoryName, CategorySlug = dto.CategorySlug, AccentColor = dto.AccentColor,
            ViewCount = dto.ViewCount, Story = member ? e.Story : $"<p>{CatalogService.Teaser(e.Story, 30)}</p>", Locked = !member
        };
        var all = await _db.Events.AsNoTracking().Where(x => x.Id != e.Id && x.EndDate >= DateTime.UtcNow.Date)
            .Select(Projections.ToEvent).ToListAsync();
        foreach (var n in all) n.DistanceKm = Math.Round(Haversine(e.Latitude, e.Longitude, n.Latitude, n.Longitude), 1);
        detail.Nearby = all.OrderBy(n => n.DistanceKm).Take(3).ToList();
        return detail;
    }

    public Task<List<string>> GetEventCitiesAsync() =>
        _db.Events.AsNoTracking().Where(e => e.EndDate >= DateTime.UtcNow.Date)
            .Select(e => e.City).Distinct().OrderBy(c => c).ToListAsync();

    public static double Haversine(double lat1, double lon1, double lat2, double lon2)
    {
        const double r = 6371;
        double dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
        double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                   Math.Cos(lat1 * Math.PI / 180) * Math.Cos(lat2 * Math.PI / 180) * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        return r * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }


    public async Task<SiteStatsDto> GetStatsAsync() => new()
    {
        Categories = await _db.Categories.CountAsync(),
        Contents = await _db.Contents.CountAsync(c => c.IsPublished),
        Characters = await _db.CharacterProfiles.CountAsync(),
        Media = await _db.MediaItems.CountAsync(m => m.IsPublished),
        Merchandise = await _db.MerchandiseItems.CountAsync(),
        Events = await _db.Events.CountAsync(e => e.EndDate >= DateTime.UtcNow.Date),
        Articles = await _db.Articles.CountAsync(a => a.Status == "Published"),
        Members = await _db.Users.CountAsync(),
        UpcomingReleases = await _db.UpcomingReleases.CountAsync(u => u.ReleaseDate >= DateTime.UtcNow.Date)
    };

    public async Task<List<SearchResultDto>> SearchAsync(string q, int take)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Trim().Length < 2) return new();
        q = q.Trim();
        var results = new List<SearchResultDto>();
        results.AddRange(await _db.Contents.AsNoTracking().Where(c => c.IsPublished && c.Title.Contains(q)).OrderByDescending(c => c.PopularityScore).Take(take)
            .Select(c => new SearchResultDto { Type = ItemTypes.Content, Id = c.Id, Title = c.Title, Subtitle = c.Category!.Name + " / " + c.Format, ImageUrl = c.ImageUrl, Url = "/content/" + c.Slug }).ToListAsync());
        results.AddRange(await _db.CharacterProfiles.AsNoTracking().Where(c => c.Name.Contains(q) || c.Fandom.Contains(q)).Take(take)
            .Select(c => new SearchResultDto { Type = ItemTypes.Character, Id = c.Id, Title = c.Name, Subtitle = c.Fandom, ImageUrl = c.ImageUrl, Url = "/characters/" + c.Slug }).ToListAsync());
        results.AddRange(await _db.Articles.AsNoTracking().Where(a => a.Status == "Published" && a.Title.Contains(q)).Take(take)
            .Select(a => new SearchResultDto { Type = ItemTypes.Article, Id = a.Id, Title = a.Title, Subtitle = "Article", ImageUrl = a.ImageUrl, Url = "/articles/" + a.Slug }).ToListAsync());
        results.AddRange(await _db.MerchandiseItems.AsNoTracking().Where(m => m.Name.Contains(q) || m.Fandom.Contains(q)).Take(take)
            .Select(m => new SearchResultDto { Type = ItemTypes.Merchandise, Id = m.Id, Title = m.Name, Subtitle = m.Fandom, ImageUrl = m.ImageUrl, Url = "/merchandise/" + m.Slug }).ToListAsync());
        results.AddRange(await _db.Events.AsNoTracking().Where(e => e.Title.Contains(q) || e.City.Contains(q)).Take(take)
            .Select(e => new SearchResultDto { Type = ItemTypes.Event, Id = e.Id, Title = e.Title, Subtitle = e.City, ImageUrl = e.ImageUrl, Url = "/events/" + e.Slug }).ToListAsync());
        results.AddRange(await _db.MediaItems.AsNoTracking().Where(m => m.IsPublished && m.Title.Contains(q)).Take(take)
            .Select(m => new SearchResultDto { Type = ItemTypes.Media, Id = m.Id, Title = m.Title, Subtitle = m.MediaType, ImageUrl = m.ImageUrl, Url = "/media/" + m.Id }).ToListAsync());
        return results;
    }

    public async Task<HomeDto> GetHomeAsync(ICatalogService catalog)
    {
        var home = new HomeDto
        {
            Categories = await catalog.GetCategoriesAsync(),
            Trending = await catalog.GetTrendingAsync(12),
            Events = await GetEventsAsync(new EventQuery()),
            Upcoming = (await GetUpcomingAsync(null, null)).Take(8).ToList(),
            Stats = await GetStatsAsync()
        };
        var featured = await _db.Contents.AsNoTracking().Where(c => c.IsPublished)
            .OrderByDescending(c => c.IsFeatured).ThenByDescending(c => c.PopularityScore)
            .Select(Projections.ToContentCard).ToListAsync();
        foreach (var cat in home.Categories)
            home.FeaturedByCategory[cat.Slug] = featured.Where(f => f.CategorySlug == cat.Slug).DistinctBy(f => f.ImageUrl).Take(2).ToList();
        return home;
    }

    public Task<List<FaqDto>> GetFaqsAsync() =>
        _db.ChatbotFaqs.AsNoTracking().Where(f => f.IsActive).OrderBy(f => f.SortOrder)
            .Select(f => new FaqDto { Id = f.Id, Category = f.Category, Question = f.Question, Answer = f.Answer }).ToListAsync();
}
