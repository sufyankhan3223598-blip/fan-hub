using AutoMapper;
using FanHubPlus.Api.Common;
using FanHubPlus.Api.Data;
using FanHubPlus.Api.DTOs;
using FanHubPlus.Api.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FanHubPlus.Api.Controllers.Admin;

[Route("api/admin/categories")]
public class AdminCategoriesController : AdminCrudController<Category, AdminCategoryDto>
{
    public AdminCategoriesController(AppDbContext db, IMapper mapper) : base(db, mapper) { }
    protected override IQueryable<Category> ApplySearch(IQueryable<Category> q, string s) => q.Where(x => x.Name.Contains(s) || x.Tagline.Contains(s));
    protected override async Task BeforeSaveAsync(Category e, AdminCategoryDto dto, bool isNew) =>
        e.Slug = await UniqueSlugAsync(dto.Slug, dto.Name, isNew ? 0 : e.Id);
}

[Route("api/admin/tags")]
public class AdminTagsController : AdminCrudController<Tag, AdminTagDto>
{
    public AdminTagsController(AppDbContext db, IMapper mapper) : base(db, mapper) { }
    protected override IQueryable<Tag> ApplySearch(IQueryable<Tag> q, string s) => q.Where(x => x.Name.Contains(s));
    protected override async Task BeforeSaveAsync(Tag e, AdminTagDto dto, bool isNew) =>
        e.Slug = await UniqueSlugAsync(dto.Slug, dto.Name, isNew ? 0 : e.Id);
}

[Route("api/admin/genres")]
public class AdminGenresController : AdminCrudController<Genre, AdminGenreDto>
{
    public AdminGenresController(AppDbContext db, IMapper mapper) : base(db, mapper) { }
    protected override IQueryable<Genre> ApplySearch(IQueryable<Genre> q, string s) => q.Where(x => x.Name.Contains(s));
    protected override async Task BeforeSaveAsync(Genre e, AdminGenreDto dto, bool isNew) =>
        e.Slug = await UniqueSlugAsync(dto.Slug, dto.Name, isNew ? 0 : e.Id);
}

[Route("api/admin/contents")]
public class AdminContentsController : AdminCrudController<Content, AdminContentDto>
{
    public AdminContentsController(AppDbContext db, IMapper mapper) : base(db, mapper) { }

    protected override IQueryable<Content> BaseQuery() =>
        Db.Contents.Include(c => c.Category).Include(c => c.ContentGenres).Include(c => c.ContentTags);

    protected override IQueryable<Content> ApplySearch(IQueryable<Content> q, string s) =>
        q.Where(x => x.Title.Contains(s) || x.Creator.Contains(s));

    protected override IQueryable<Content> ApplyFilters(IQueryable<Content> q, AdminListQuery f)
    {
        if (f.CategoryId.HasValue) q = q.Where(x => x.CategoryId == f.CategoryId);
        if (!string.IsNullOrWhiteSpace(f.Type)) q = q.Where(x => x.ContentType == f.Type);
        if (f.Status == "published") q = q.Where(x => x.IsPublished);
        if (f.Status == "draft") q = q.Where(x => !x.IsPublished);
        return q;
    }

    protected override async Task BeforeSaveAsync(Content e, AdminContentDto dto, bool isNew)
    {
        e.Slug = await UniqueSlugAsync(dto.Slug, dto.Title, isNew ? 0 : e.Id);
        e.Description = Html.Sanitize(dto.Description);
        if (string.IsNullOrWhiteSpace(e.BannerUrl)) e.BannerUrl = e.ImageUrl;
        if (string.IsNullOrWhiteSpace(e.HoverImageUrl)) e.HoverImageUrl = e.ImageUrl;
        e.UpdatedAt = DateTime.UtcNow;
        e.ContentGenres.Clear();
        foreach (var g in dto.GenreIds.Distinct()) e.ContentGenres.Add(new ContentGenre { GenreId = g });
        e.ContentTags.Clear();
        foreach (var t in dto.TagIds.Distinct()) e.ContentTags.Add(new ContentTag { TagId = t });
    }
}

[Route("api/admin/media")]
public class AdminMediaController : AdminCrudController<MediaItem, AdminMediaDto>
{
    public AdminMediaController(AppDbContext db, IMapper mapper) : base(db, mapper) { }

    protected override IQueryable<MediaItem> BaseQuery() =>
        Db.MediaItems.Include(m => m.Category).Include(m => m.MediaTags);

    protected override IQueryable<MediaItem> ApplySearch(IQueryable<MediaItem> q, string s) =>
        q.Where(x => x.Title.Contains(s) || x.Description.Contains(s));

    protected override IQueryable<MediaItem> ApplyFilters(IQueryable<MediaItem> q, AdminListQuery f)
    {
        if (f.CategoryId.HasValue) q = q.Where(x => x.CategoryId == f.CategoryId);
        if (!string.IsNullOrWhiteSpace(f.Type)) q = q.Where(x => x.MediaType == f.Type);
        return q;
    }

    protected override Task BeforeSaveAsync(MediaItem e, AdminMediaDto dto, bool isNew)
    {

        if (string.IsNullOrWhiteSpace(e.HoverImageUrl)) e.HoverImageUrl = e.ImageUrl;
        if (e.Url.Contains("youtube.com/watch?v="))
            e.Url = "https://www.youtube-nocookie.com/embed/" + e.Url.Split("v=").Last().Split("&").First();
        if (e.Url.Contains("youtube.com") || e.Url.Contains("youtu.be")) e.EmbedType = "youtube";
        e.MediaTags.Clear();
        foreach (var t in dto.TagIds.Distinct()) e.MediaTags.Add(new MediaTag { TagId = t });
        return Task.CompletedTask;
    }
}

[Route("api/admin/characters")]
public class AdminCharactersController : AdminCrudController<CharacterProfile, AdminCharacterDto>
{
    public AdminCharactersController(AppDbContext db, IMapper mapper) : base(db, mapper) { }
    protected override IQueryable<CharacterProfile> BaseQuery() => Db.CharacterProfiles.Include(c => c.Category);
    protected override IQueryable<CharacterProfile> ApplySearch(IQueryable<CharacterProfile> q, string s) =>
        q.Where(x => x.Name.Contains(s) || x.Fandom.Contains(s));
    protected override IQueryable<CharacterProfile> ApplyFilters(IQueryable<CharacterProfile> q, AdminListQuery f) =>
        f.CategoryId.HasValue ? q.Where(x => x.CategoryId == f.CategoryId) : q;
    protected override async Task BeforeSaveAsync(CharacterProfile e, AdminCharacterDto dto, bool isNew)
    {
        e.Slug = await UniqueSlugAsync(dto.Slug, dto.Name, isNew ? 0 : e.Id);
        e.Strength = Math.Clamp(e.Strength, 0, 100);
        e.Intelligence = Math.Clamp(e.Intelligence, 0, 100);
        e.Agility = Math.Clamp(e.Agility, 0, 100);
        e.Charisma = Math.Clamp(e.Charisma, 0, 100);
        if (string.IsNullOrWhiteSpace(e.HoverImageUrl)) e.HoverImageUrl = e.ImageUrl;
    }
}

[Route("api/admin/articles")]
public class AdminArticlesController : AdminCrudController<Article, AdminArticleDto>
{
    public AdminArticlesController(AppDbContext db, IMapper mapper) : base(db, mapper) { }
    protected override IQueryable<Article> BaseQuery() => Db.Articles.Include(a => a.Category).Include(a => a.TimelineItems);
    protected override IQueryable<Article> ApplySearch(IQueryable<Article> q, string s) => q.Where(x => x.Title.Contains(s) || x.Excerpt.Contains(s));
    protected override IQueryable<Article> ApplyFilters(IQueryable<Article> q, AdminListQuery f)
    {
        if (f.CategoryId.HasValue) q = q.Where(x => x.CategoryId == f.CategoryId);
        if (!string.IsNullOrWhiteSpace(f.Status)) q = q.Where(x => x.Status == f.Status);
        return q;
    }
    protected override async Task BeforeSaveAsync(Article e, AdminArticleDto dto, bool isNew)
    {
        e.Slug = await UniqueSlugAsync(dto.Slug, dto.Title, isNew ? 0 : e.Id);
        e.Body = Html.Sanitize(dto.Body);
        if (isNew) e.AuthorId = User.GetUserId();
        if (e.ReadMinutes <= 0) e.ReadMinutes = Math.Max(1, Html.StripTags(e.Body).Split(' ').Length / 200);
        if (string.IsNullOrWhiteSpace(e.HoverImageUrl)) e.HoverImageUrl = e.ImageUrl;
        e.TimelineItems.Clear();
        var order = 0;
        foreach (var t in dto.Timeline.Where(t => !string.IsNullOrWhiteSpace(t.Title)))
            e.TimelineItems.Add(new ArticleTimelineItem { DateLabel = t.DateLabel, Title = t.Title, Description = t.Description, SortOrder = order++ });
    }
}

[Route("api/admin/merchandise")]
public class AdminMerchandiseController : AdminCrudController<MerchandiseItem, AdminMerchDto>
{
    public AdminMerchandiseController(AppDbContext db, IMapper mapper) : base(db, mapper) { }
    protected override IQueryable<MerchandiseItem> BaseQuery() =>
        Db.MerchandiseItems.Include(m => m.Category).Include(m => m.MerchandiseTags).Include(m => m.Images);
    protected override IQueryable<MerchandiseItem> ApplySearch(IQueryable<MerchandiseItem> q, string s) =>
        q.Where(x => x.Name.Contains(s) || x.Fandom.Contains(s) || x.Manufacturer.Contains(s));
    protected override IQueryable<MerchandiseItem> ApplyFilters(IQueryable<MerchandiseItem> q, AdminListQuery f)
    {
        if (f.CategoryId.HasValue) q = q.Where(x => x.CategoryId == f.CategoryId);
        if (f.Status == "upcoming") q = q.Where(x => x.IsUpcoming);
        return q;
    }
    protected override async Task BeforeSaveAsync(MerchandiseItem e, AdminMerchDto dto, bool isNew)
    {
        e.Slug = await UniqueSlugAsync(dto.Slug, dto.Name, isNew ? 0 : e.Id);
        if (string.IsNullOrWhiteSpace(e.HoverImageUrl)) e.HoverImageUrl = e.ImageUrl;
        e.MerchandiseTags.Clear();
        foreach (var t in dto.TagIds.Distinct()) e.MerchandiseTags.Add(new MerchandiseTag { TagId = t });
        e.Images.Clear();
        var urls = dto.GalleryUrls.Where(u => !string.IsNullOrWhiteSpace(u)).ToList();
        if (urls.Count == 0) urls = new List<string> { e.ImageUrl, e.HoverImageUrl };
        var i = 0;
        foreach (var u in urls) e.Images.Add(new MerchandiseImage { ImageUrl = u, Caption = $"{e.Name} - view {i + 1}", SortOrder = i++ });
    }
}

[Route("api/admin/upcoming")]
public class AdminUpcomingController : AdminCrudController<UpcomingRelease, AdminUpcomingDto>
{
    public AdminUpcomingController(AppDbContext db, IMapper mapper) : base(db, mapper) { }
    protected override IQueryable<UpcomingRelease> BaseQuery() => Db.UpcomingReleases.Include(u => u.Category).Include(u => u.UpcomingReleaseTags);
    protected override IQueryable<UpcomingRelease> ApplySearch(IQueryable<UpcomingRelease> q, string s) => q.Where(x => x.Title.Contains(s) || x.Studio.Contains(s));
    protected override IQueryable<UpcomingRelease> ApplyFilters(IQueryable<UpcomingRelease> q, AdminListQuery f)
    {
        if (f.CategoryId.HasValue) q = q.Where(x => x.CategoryId == f.CategoryId);
        if (!string.IsNullOrWhiteSpace(f.Type)) q = q.Where(x => x.ReleaseType == f.Type);
        return q;
    }
    protected override Task BeforeSaveAsync(UpcomingRelease e, AdminUpcomingDto dto, bool isNew)
    {
        if (string.IsNullOrWhiteSpace(e.HoverImageUrl)) e.HoverImageUrl = e.ImageUrl;
        e.UpcomingReleaseTags.Clear();
        foreach (var t in dto.TagIds.Distinct()) e.UpcomingReleaseTags.Add(new UpcomingReleaseTag { TagId = t });
        return Task.CompletedTask;
    }
}

[Route("api/admin/events")]
public class AdminEventsController : AdminCrudController<Event, AdminEventDto>
{
    public AdminEventsController(AppDbContext db, IMapper mapper) : base(db, mapper) { }
    protected override IQueryable<Event> BaseQuery() => Db.Events.Include(e => e.Category);
    protected override IQueryable<Event> ApplySearch(IQueryable<Event> q, string s) => q.Where(x => x.Title.Contains(s) || x.City.Contains(s) || x.Venue.Contains(s));
    protected override IQueryable<Event> ApplyFilters(IQueryable<Event> q, AdminListQuery f)
    {
        if (f.CategoryId.HasValue) q = q.Where(x => x.CategoryId == f.CategoryId);
        if (!string.IsNullOrWhiteSpace(f.Type)) q = q.Where(x => x.EventType == f.Type);
        return q;
    }
    protected override async Task BeforeSaveAsync(Event e, AdminEventDto dto, bool isNew)
    {
        e.Slug = await UniqueSlugAsync(dto.Slug, dto.Title, isNew ? 0 : e.Id);
        e.Story = Html.Sanitize(dto.Story);
        if (e.EndDate < e.StartDate) e.EndDate = e.StartDate;
        if (string.IsNullOrWhiteSpace(e.HoverImageUrl)) e.HoverImageUrl = e.ImageUrl;
    }
}

[Route("api/admin/faqs")]
public class AdminFaqsController : AdminCrudController<ChatbotFaq, AdminFaqDto>
{
    public AdminFaqsController(AppDbContext db, IMapper mapper) : base(db, mapper) { }
    protected override IQueryable<ChatbotFaq> ApplySearch(IQueryable<ChatbotFaq> q, string s) =>
        q.Where(x => x.Question.Contains(s) || x.Answer.Contains(s) || x.Keywords.Contains(s));
    protected override IQueryable<ChatbotFaq> ApplyFilters(IQueryable<ChatbotFaq> q, AdminListQuery f) =>
        string.IsNullOrWhiteSpace(f.Type) ? q : q.Where(x => x.Category == f.Type);
    protected override Task BeforeSaveAsync(ChatbotFaq e, AdminFaqDto dto, bool isNew)
    {
        e.Keywords = string.Join(",", dto.Keywords.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).Select(k => k.ToLowerInvariant()));
        return Task.CompletedTask;
    }
}
