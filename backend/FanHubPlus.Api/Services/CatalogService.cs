using FanHubPlus.Api.Common;
using FanHubPlus.Api.Data;
using FanHubPlus.Api.DTOs;
using FanHubPlus.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace FanHubPlus.Api.Services;

public interface ICatalogService
{
    Task<List<CategoryDto>> GetCategoriesAsync();
    Task<CategoryDto> GetCategoryAsync(string slug);
    Task<List<GenreDto>> GetGenresAsync(string? category);
    Task<List<TagDto>> GetTagsAsync();

    Task<PagedResult<ContentCardDto>> GetContentsAsync(ContentQuery q, bool member);
    Task<ContentDetailDto> GetContentAsync(string slug, int? userId);
    Task<List<ContentCardDto>> GetTrendingAsync(int take);

    Task<PagedResult<MediaDto>> GetMediaAsync(MediaQuery q, bool member);
    Task<MediaDto> GetMediaItemAsync(int id, int? userId);

    Task<PagedResult<CharacterCardDto>> GetCharactersAsync(CharacterQuery q);
    Task<CharacterDetailDto> GetCharacterAsync(string slug, int? userId);
    Task<List<string>> GetFandomsAsync(string? category);
}

public class CatalogService : ICatalogService
{
    private readonly AppDbContext _db;
    private readonly IActivityService _activity;

    public CatalogService(AppDbContext db, IActivityService activity)
    {
        _db = db; _activity = activity;
    }


    public async Task<List<CategoryDto>> GetCategoriesAsync()
    {
        var cats = await _db.Categories.AsNoTracking().OrderBy(c => c.SortOrder).Select(Projections.ToCategory).ToListAsync();
        var content = await _db.Contents.Where(c => c.IsPublished).GroupBy(c => c.CategoryId).Select(g => new { g.Key, N = g.Count() }).ToDictionaryAsync(x => x.Key, x => x.N);
        var chars = await _db.CharacterProfiles.GroupBy(c => c.CategoryId).Select(g => new { g.Key, N = g.Count() }).ToDictionaryAsync(x => x.Key, x => x.N);
        var media = await _db.MediaItems.Where(m => m.IsPublished).GroupBy(c => c.CategoryId).Select(g => new { g.Key, N = g.Count() }).ToDictionaryAsync(x => x.Key, x => x.N);
        var merch = await _db.MerchandiseItems.GroupBy(c => c.CategoryId).Select(g => new { g.Key, N = g.Count() }).ToDictionaryAsync(x => x.Key, x => x.N);
        foreach (var c in cats)
        {
            c.ContentCount = content.GetValueOrDefault(c.Id);
            c.CharacterCount = chars.GetValueOrDefault(c.Id);
            c.MediaCount = media.GetValueOrDefault(c.Id);
            c.MerchandiseCount = merch.GetValueOrDefault(c.Id);
        }
        return cats;
    }

    public async Task<CategoryDto> GetCategoryAsync(string slug)
    {
        var all = await GetCategoriesAsync();
        return all.FirstOrDefault(c => c.Slug == slug) ?? throw new NotFoundException("Category");
    }

    public async Task<List<GenreDto>> GetGenresAsync(string? category)
    {
        var q = _db.Genres.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(category))
        {
            var ids = _db.ContentGenres.Where(cg => cg.Content!.Category!.Slug == category).Select(cg => cg.GenreId);
            q = q.Where(g => ids.Contains(g.Id));
        }
        return await q.OrderBy(g => g.Name).Select(g => new GenreDto { Id = g.Id, Name = g.Name, Slug = g.Slug }).ToListAsync();
    }

    public Task<List<TagDto>> GetTagsAsync() =>
        _db.Tags.AsNoTracking().OrderBy(t => t.Name)
            .Select(t => new TagDto { Id = t.Id, Name = t.Name, Slug = t.Slug, Color = t.Color }).ToListAsync();


    public async Task<PagedResult<ContentCardDto>> GetContentsAsync(ContentQuery q, bool member)
    {
        var query = _db.Contents.AsNoTracking().Where(c => c.IsPublished);


        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var s = q.Search.Trim();
            query = query.Where(c => c.Title.Contains(s) || c.Synopsis.Contains(s) || c.Creator.Contains(s));
        }
        if (!string.IsNullOrWhiteSpace(q.Category))
        {
            var cats = q.Category.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            query = query.Where(c => cats.Contains(c.Category!.Slug));
        }
        if (q.Featured == true) query = query.Where(c => c.IsFeatured);


        var sort = "popular";
        if (member)
        {
            if (!string.IsNullOrWhiteSpace(q.Genre))
            {
                var genres = q.Genre.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                query = query.Where(c => c.ContentGenres.Any(g => genres.Contains(g.Genre!.Slug)));
            }
            if (q.YearFrom.HasValue) query = query.Where(c => c.ReleaseYear >= q.YearFrom.Value);
            if (q.YearTo.HasValue) query = query.Where(c => c.ReleaseYear <= q.YearTo.Value);
            if (!string.IsNullOrWhiteSpace(q.Type))
            {
                var types = q.Type.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                query = query.Where(c => types.Contains(c.ContentType));
            }
            if (q.MinPopularity.HasValue) query = query.Where(c => c.PopularityScore >= q.MinPopularity.Value);
            sort = (q.Sort ?? "popular").ToLowerInvariant();
        }

        query = sort switch
        {
            "latest" => query.OrderByDescending(c => c.ReleaseYear).ThenByDescending(c => c.CreatedAt),
            "az" or "alphabetical" => query.OrderBy(c => c.Title),
            "za" => query.OrderByDescending(c => c.Title),
            "rating" => query.OrderByDescending(c => c.AverageRating).ThenByDescending(c => c.RatingCount),
            "oldest" => query.OrderBy(c => c.ReleaseYear),
            _ => query.OrderByDescending(c => c.PopularityScore).ThenByDescending(c => c.ViewCount)
        };

        return await PageAsync(query.Select(Projections.ToContentCard), q.Page, q.PageSize);
    }

    public async Task<ContentDetailDto> GetContentAsync(string slug, int? userId)
    {
        var entity = await _db.Contents.FirstOrDefaultAsync(c => c.Slug == slug && c.IsPublished)
                     ?? throw new NotFoundException("Content");
        entity.ViewCount++;
        entity.PopularityScore++;
        await _db.SaveChangesAsync();
        await _activity.LogViewAsync(userId, ItemTypes.Content, entity.Id, entity.CategoryId);
        if (userId.HasValue)
            await _activity.LogActivityAsync(userId.Value, "View", $"Viewed {entity.Title}", ItemTypes.Content, entity.Id, $"/content/{entity.Slug}");

        var card = await _db.Contents.AsNoTracking().Where(c => c.Id == entity.Id).Select(Projections.ToContentCard).FirstAsync();
        var member = userId.HasValue;
        var detail = new ContentDetailDto();
        CopyCard(card, detail);
        detail.Description = member ? entity.Description : $"<p>{entity.Synopsis}</p>";
        detail.Creator = entity.Creator;
        detail.Seasons = entity.Seasons;
        detail.Episodes = entity.Episodes;
        detail.TrailerUrl = entity.TrailerUrl;
        detail.BannerUrl = entity.BannerUrl;
        detail.LikeCount = entity.LikeCount;
        detail.DislikeCount = entity.DislikeCount;
        detail.Locked = false;

        detail.Characters = await _db.CharacterProfiles.AsNoTracking().Where(c => c.ContentId == entity.Id)
            .Select(Projections.ToCharacterCard).ToListAsync();
        detail.Media = await _db.MediaItems.AsNoTracking()
            .Where(m => m.IsPublished && (m.ContentId == entity.Id || m.CategoryId == entity.CategoryId))
            .OrderByDescending(m => m.ContentId == entity.Id).ThenByDescending(m => m.ViewCount).Take(6)
            .Select(Projections.ToMedia).ToListAsync();
        foreach (var m in detail.Media) { m.Locked = false; }

        var genreIds = await _db.ContentGenres.Where(g => g.ContentId == entity.Id).Select(g => g.GenreId).ToListAsync();
        detail.Related = await _db.Contents.AsNoTracking()
            .Where(c => c.Id != entity.Id && c.IsPublished && (c.CategoryId == entity.CategoryId || c.ContentGenres.Any(g => genreIds.Contains(g.GenreId))))
            .OrderByDescending(c => c.CategoryId == entity.CategoryId)
            .ThenByDescending(c => c.ContentGenres.Count(g => genreIds.Contains(g.GenreId)))
            .ThenByDescending(c => c.PopularityScore)
            .Take(8).Select(Projections.ToContentCard).ToListAsync();
        return detail;
    }

    public Task<List<ContentCardDto>> GetTrendingAsync(int take)
    {
        var since = DateTime.UtcNow.AddDays(-14);
        var recentViews = _db.ViewLogs.Where(v => v.ItemType == ItemTypes.Content && v.ViewedAt >= since);
        return _db.Contents.AsNoTracking().Where(c => c.IsPublished)
            .OrderByDescending(c => recentViews.Count(v => v.ItemId == c.Id) * 25 + c.PopularityScore)
            .Take(take).Select(Projections.ToContentCard).ToListAsync();
    }


    public async Task<PagedResult<MediaDto>> GetMediaAsync(MediaQuery q, bool member)
    {
        var query = _db.MediaItems.AsNoTracking().Where(m => m.IsPublished);
        if (!string.IsNullOrWhiteSpace(q.Search))
            query = query.Where(m => m.Title.Contains(q.Search) || m.Description.Contains(q.Search));
        if (!string.IsNullOrWhiteSpace(q.Category))
            query = query.Where(m => m.Category!.Slug == q.Category);
        if (!string.IsNullOrWhiteSpace(q.Type))
        {
            var t = q.Type.ToLowerInvariant();
            if (t == "audio") query = query.Where(m => m.MediaType == "Soundtrack" || m.MediaType == "Podcast");
            else if (t == "video") query = query.Where(m => m.MediaType != "Soundtrack" && m.MediaType != "Podcast");
            else query = query.Where(m => m.MediaType == q.Type);
        }
        if (!string.IsNullOrWhiteSpace(q.Tag))
            query = query.Where(m => m.MediaTags.Any(t => t.Tag!.Slug == q.Tag));

        query = (q.Sort ?? "popular").ToLowerInvariant() switch
        {
            "latest" => query.OrderByDescending(m => m.CreatedAt),
            "az" => query.OrderBy(m => m.Title),
            "rating" => query.OrderByDescending(m => m.AverageRating),
            _ => query.OrderByDescending(m => m.ViewCount)
        };
        var page = await PageAsync(query.Select(Projections.ToMedia), q.Page, q.PageSize);
        foreach (var m in page.Items) { m.Locked = false; }
        return page;
    }

    public async Task<MediaDto> GetMediaItemAsync(int id, int? userId)
    {
        var entity = await _db.MediaItems.FirstOrDefaultAsync(m => m.Id == id && m.IsPublished) ?? throw new NotFoundException("Media");
        entity.ViewCount++;
        entity.PopularityScore++;
        await _db.SaveChangesAsync();
        await _activity.LogViewAsync(userId, ItemTypes.Media, entity.Id, entity.CategoryId);
        if (userId.HasValue)
            await _activity.LogActivityAsync(userId.Value, "View", $"Played {entity.Title}", ItemTypes.Media, entity.Id, $"/media/{entity.Id}");
        var dto = await _db.MediaItems.AsNoTracking().Where(m => m.Id == id).Select(Projections.ToMedia).FirstAsync();
        dto.Locked = false;
        return dto;
    }


    public async Task<PagedResult<CharacterCardDto>> GetCharactersAsync(CharacterQuery q)
    {
        var query = _db.CharacterProfiles.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(q.Search))
            query = query.Where(c => c.Name.Contains(q.Search) || c.Fandom.Contains(q.Search) || c.Power.Contains(q.Search));
        if (!string.IsNullOrWhiteSpace(q.Category))
            query = query.Where(c => c.Category!.Slug == q.Category);
        if (!string.IsNullOrWhiteSpace(q.Fandom))
            query = query.Where(c => c.Fandom == q.Fandom);
        query = (q.Sort ?? "popular").ToLowerInvariant() switch
        {
            "az" => query.OrderBy(c => c.Name),
            "latest" => query.OrderByDescending(c => c.CreatedAt),
            "strength" => query.OrderByDescending(c => c.Strength),
            _ => query.OrderByDescending(c => c.PopularityScore)
        };
        return await PageAsync(query.Select(Projections.ToCharacterCard), q.Page, q.PageSize);
    }

    public async Task<CharacterDetailDto> GetCharacterAsync(string slug, int? userId)
    {
        var entity = await _db.CharacterProfiles.FirstOrDefaultAsync(c => c.Slug == slug) ?? throw new NotFoundException("Character");
        entity.ViewCount++;
        entity.PopularityScore++;
        await _db.SaveChangesAsync();
        await _activity.LogViewAsync(userId, ItemTypes.Character, entity.Id, entity.CategoryId);
        if (userId.HasValue)
            await _activity.LogActivityAsync(userId.Value, "View", $"Viewed {entity.Name}", ItemTypes.Character, entity.Id, $"/characters/{entity.Slug}");

        var card = await _db.CharacterProfiles.AsNoTracking().Where(c => c.Id == entity.Id).Select(Projections.ToCharacterCard).FirstAsync();
        var member = userId.HasValue;
        var detail = new CharacterDetailDto
        {
            Id = card.Id, Name = card.Name, Slug = card.Slug, Fandom = card.Fandom, Role = card.Role, Power = card.Power,
            Quote = card.Quote, Strength = card.Strength, Intelligence = card.Intelligence, Agility = card.Agility,
            Charisma = card.Charisma, ImageUrl = card.ImageUrl, HoverImageUrl = card.HoverImageUrl,
            CategoryName = card.CategoryName, CategorySlug = card.CategorySlug, AccentColor = card.AccentColor,
            ViewCount = card.ViewCount, PopularityScore = card.PopularityScore,
            Bio = member ? entity.Bio : Teaser(entity.Bio), Locked = !member
        };
        if (entity.ContentId.HasValue)
            detail.Content = await _db.Contents.AsNoTracking().Where(c => c.Id == entity.ContentId).Select(Projections.ToContentCard).FirstOrDefaultAsync();
        var related = await _db.CharacterProfiles.AsNoTracking()
            .Where(c => c.Id != entity.Id && (c.Fandom == entity.Fandom || c.CategoryId == entity.CategoryId))
            .OrderByDescending(c => c.Fandom == entity.Fandom).ThenByDescending(c => c.PopularityScore)
            .Take(5).Select(Projections.ToCharacterCard).ToListAsync();

        if (related.Count < 5)
        {
            var existingIds = related.Select(r => r.Id).Append(entity.Id).ToList();
            var additional = await _db.CharacterProfiles.AsNoTracking()
                .Where(c => !existingIds.Contains(c.Id))
                .OrderByDescending(c => c.PopularityScore)
                .Take(5 - related.Count)
                .Select(Projections.ToCharacterCard)
                .ToListAsync();
            related.AddRange(additional);
        }
        detail.Related = related;
        return detail;
    }

    public async Task<List<string>> GetFandomsAsync(string? category)
    {
        var q = _db.CharacterProfiles.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(category)) q = q.Where(c => c.Category!.Slug == category);
        return await q.Select(c => c.Fandom).Distinct().OrderBy(f => f).ToListAsync();
    }


    public static async Task<PagedResult<T>> PageAsync<T>(IQueryable<T> query, int page, int pageSize)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return new PagedResult<T>(items, total, page, pageSize);
    }

    public static string Teaser(string text, int words = 22)
    {
        var plain = Html.StripTags(text);
        var parts = plain.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        return parts.Length <= words ? plain : string.Join(' ', parts.Take(words)) + "...";
    }

    private static void CopyCard(ContentCardDto s, ContentCardDto d)
    {
        d.Id = s.Id; d.Title = s.Title; d.Slug = s.Slug; d.ContentType = s.ContentType; d.Format = s.Format;
        d.ReleaseYear = s.ReleaseYear; d.Synopsis = s.Synopsis; d.ImageUrl = s.ImageUrl; d.HoverImageUrl = s.HoverImageUrl;
        d.CategoryName = s.CategoryName; d.CategorySlug = s.CategorySlug; d.AccentColor = s.AccentColor;
        d.AverageRating = s.AverageRating; d.RatingCount = s.RatingCount; d.PopularityScore = s.PopularityScore;
        d.ViewCount = s.ViewCount; d.IsFeatured = s.IsFeatured; d.Genres = s.Genres; d.Tags = s.Tags;
    }
}
