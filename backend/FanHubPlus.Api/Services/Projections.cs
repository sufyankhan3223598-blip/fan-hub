using System.Linq.Expressions;
using FanHubPlus.Api.DTOs;
using FanHubPlus.Api.Entities;

namespace FanHubPlus.Api.Services;

public static class Projections
{
    public static readonly Expression<Func<Category, CategoryDto>> ToCategory = c => new CategoryDto
    {
        Id = c.Id, Name = c.Name, Slug = c.Slug, AccentColor = c.AccentColor, Tagline = c.Tagline,
        Description = c.Description, SecondaryColor = c.SecondaryColor, Icon = c.Icon, ImageUrl = c.ImageUrl,
        HoverImageUrl = c.HoverImageUrl, SortOrder = c.SortOrder
    };

    public static readonly Expression<Func<Content, ContentCardDto>> ToContentCard = c => new ContentCardDto
    {
        Id = c.Id, Title = c.Title, Slug = c.Slug, ContentType = c.ContentType, Format = c.Format,
        ReleaseYear = c.ReleaseYear, Synopsis = c.Synopsis, ImageUrl = c.ImageUrl, HoverImageUrl = c.HoverImageUrl,
        CategoryName = c.Category!.Name, CategorySlug = c.Category.Slug, AccentColor = c.Category.AccentColor,
        AverageRating = c.AverageRating, RatingCount = c.RatingCount, PopularityScore = c.PopularityScore,
        ViewCount = c.ViewCount, IsFeatured = c.IsFeatured,
        Genres = c.ContentGenres.Select(g => g.Genre!.Name).ToList(),
        Tags = c.ContentTags.Select(t => new TagDto { Id = t.Tag!.Id, Name = t.Tag.Name, Slug = t.Tag.Slug, Color = t.Tag.Color }).ToList()
    };

    public static readonly Expression<Func<MediaItem, MediaDto>> ToMedia = m => new MediaDto
    {
        Id = m.Id, Title = m.Title, MediaType = m.MediaType, EmbedType = m.EmbedType, Url = m.Url,
        DurationSeconds = m.DurationSeconds, Description = m.Description, ImageUrl = m.ImageUrl,
        HoverImageUrl = m.HoverImageUrl, CategoryName = m.Category!.Name, CategorySlug = m.Category.Slug,
        AccentColor = m.Category.AccentColor, ViewCount = m.ViewCount, AverageRating = m.AverageRating,
        RatingCount = m.RatingCount, LikeCount = m.LikeCount, DislikeCount = m.DislikeCount, ContentId = m.ContentId,
        CreatedAt = m.CreatedAt,
        Tags = m.MediaTags.Select(t => new TagDto { Id = t.Tag!.Id, Name = t.Tag.Name, Slug = t.Tag.Slug, Color = t.Tag.Color }).ToList()
    };

    public static readonly Expression<Func<CharacterProfile, CharacterCardDto>> ToCharacterCard = c => new CharacterCardDto
    {
        Id = c.Id, Name = c.Name, Slug = c.Slug, Fandom = c.Fandom, Role = c.Role, Power = c.Power, Quote = c.Quote,
        Strength = c.Strength, Intelligence = c.Intelligence, Agility = c.Agility, Charisma = c.Charisma,
        ImageUrl = c.ImageUrl, HoverImageUrl = c.HoverImageUrl, CategoryName = c.Category!.Name,
        CategorySlug = c.Category.Slug, AccentColor = c.Category.AccentColor, ViewCount = c.ViewCount,
        PopularityScore = c.PopularityScore
    };

    public static readonly Expression<Func<Article, ArticleCardDto>> ToArticleCard = a => new ArticleCardDto
    {
        Id = a.Id, Title = a.Title, Slug = a.Slug, Excerpt = a.Excerpt, ImageUrl = a.ImageUrl,
        HoverImageUrl = a.HoverImageUrl, ReadMinutes = a.ReadMinutes, IsFeatured = a.IsFeatured,
        CategoryName = a.Category!.Name, CategorySlug = a.Category.Slug, AccentColor = a.Category.AccentColor,
        AuthorName = a.Author != null ? a.Author.FullName : "Fan Hub Plus Editorial",
        ViewCount = a.ViewCount, PublishedAt = a.PublishedAt
    };

    public static readonly Expression<Func<MerchandiseItem, MerchDto>> ToMerch = m => new MerchDto
    {
        Id = m.Id, Name = m.Name, Slug = m.Slug, Fandom = m.Fandom, Manufacturer = m.Manufacturer,
        Description = m.Description, ImageUrl = m.ImageUrl, HoverImageUrl = m.HoverImageUrl, IsUpcoming = m.IsUpcoming,
        ViewCount = m.ViewCount, PopularityScore = m.PopularityScore, CategoryName = m.Category!.Name,
        CategorySlug = m.Category.Slug, AccentColor = m.Category.AccentColor,
        Tags = m.MerchandiseTags.Select(t => new TagDto { Id = t.Tag!.Id, Name = t.Tag.Name, Slug = t.Tag.Slug, Color = t.Tag.Color }).ToList(),
        Images = m.Images.OrderBy(i => i.SortOrder).Select(i => new MerchImageDto { ImageUrl = i.ImageUrl, Caption = i.Caption }).ToList()
    };

    public static readonly Expression<Func<UpcomingRelease, UpcomingDto>> ToUpcoming = u => new UpcomingDto
    {
        Id = u.Id, Title = u.Title, ReleaseType = u.ReleaseType, ReleaseDate = u.ReleaseDate,
        IsDateConfirmed = u.IsDateConfirmed, Studio = u.Studio, Description = u.Description, ImageUrl = u.ImageUrl,
        HoverImageUrl = u.HoverImageUrl, ExternalUrl = u.ExternalUrl, CategoryName = u.Category!.Name,
        CategorySlug = u.Category.Slug, AccentColor = u.Category.AccentColor, ViewCount = u.ViewCount,
        Tags = u.UpcomingReleaseTags.Select(t => new TagDto { Id = t.Tag!.Id, Name = t.Tag.Name, Slug = t.Tag.Slug, Color = t.Tag.Color }).ToList()
    };

    public static readonly Expression<Func<Event, EventDto>> ToEvent = e => new EventDto
    {
        Id = e.Id, Title = e.Title, Slug = e.Slug, EventType = e.EventType, Description = e.Description, City = e.City,
        Country = e.Country, Venue = e.Venue, Latitude = e.Latitude, Longitude = e.Longitude, StartDate = e.StartDate,
        EndDate = e.EndDate, TicketUrl = e.TicketUrl, ImageUrl = e.ImageUrl, HoverImageUrl = e.HoverImageUrl,
        IsHighlight = e.IsHighlight, CategoryName = e.Category != null ? e.Category.Name : null,
        CategorySlug = e.Category != null ? e.Category.Slug : null,
        AccentColor = e.Category != null ? e.Category.AccentColor : "#D4AF37", ViewCount = e.ViewCount
    };

    public static readonly Expression<Func<FanSubmission, SubmissionDto>> ToSubmission = s => new SubmissionDto
    {
        Id = s.Id, UserId = s.UserId, AuthorName = s.User!.FullName, AuthorAvatarUrl = s.User.AvatarUrl,
        CategoryId = s.CategoryId, CategoryName = s.Category!.Name, CategorySlug = s.Category.Slug,
        AccentColor = s.Category.AccentColor, Title = s.Title, SubmissionType = s.SubmissionType, Summary = s.Summary,
        Body = s.Body, ImageUrl = s.ImageUrl, Status = s.Status, ReviewNote = s.ReviewNote, ReviewedAt = s.ReviewedAt,
        ViewCount = s.ViewCount, CreatedAt = s.CreatedAt
    };

    public static readonly Expression<Func<Feedback, FeedbackDto>> ToFeedback = f => new FeedbackDto
    {
        Id = f.Id, UserId = f.UserId, Name = f.Name, Email = f.Email, Type = f.Type, Subject = f.Subject,
        Message = f.Message, PageUrl = f.PageUrl, Status = f.Status, AdminNote = f.AdminNote, CreatedAt = f.CreatedAt,
        UpdatedAt = f.UpdatedAt
    };

    public static readonly Expression<Func<Bookmark, BookmarkDto>> ToBookmark = b => new BookmarkDto
    {
        Id = b.Id, ItemType = b.ItemType, ItemId = b.ItemId, Title = b.Title, ImageUrl = b.ImageUrl, Url = b.Url,
        Note = b.Note, CreatedAt = b.CreatedAt, UpdatedAt = b.UpdatedAt
    };

    public static readonly Expression<Func<UserActivity, ActivityDto>> ToActivity = a => new ActivityDto
    {
        Id = a.Id, ActivityType = a.ActivityType, Description = a.Description, Url = a.Url, CreatedAt = a.CreatedAt,
        UserName = a.User!.FullName, UserAvatarUrl = a.User.AvatarUrl
    };

    public static readonly Expression<Func<Notification, NotificationDto>> ToNotification = n => new NotificationDto
    {
        Id = n.Id, Title = n.Title, Message = n.Message, Url = n.Url, IsRead = n.IsRead, CreatedAt = n.CreatedAt
    };
}
