namespace FanHubPlus.Api.Entities;

public class Category : IEntity
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Tagline { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string AccentColor { get; set; } = "#D4AF37";
    public string SecondaryColor { get; set; } = "#7C3AED";
    public string Icon { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string HoverImageUrl { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}

public class Genre : IEntity
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
}

public class Tag : IEntity
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Color { get; set; } = "#D4AF37";
}

public class Content : IEntity
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public Category? Category { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string ContentType { get; set; } = "Video";
    public string Format { get; set; } = string.Empty;
    public string Synopsis { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int ReleaseYear { get; set; }
    public string Creator { get; set; } = string.Empty;
    public int? Seasons { get; set; }
    public int? Episodes { get; set; }
    public string? TrailerUrl { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string HoverImageUrl { get; set; } = string.Empty;
    public string BannerUrl { get; set; } = string.Empty;
    public int PopularityScore { get; set; }
    public int ViewCount { get; set; }
    public decimal AverageRating { get; set; }
    public int RatingCount { get; set; }
    public int LikeCount { get; set; }
    public int DislikeCount { get; set; }
    public bool IsFeatured { get; set; }
    public bool IsPublished { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<ContentGenre> ContentGenres { get; set; } = new List<ContentGenre>();
    public ICollection<ContentTag> ContentTags { get; set; } = new List<ContentTag>();
}

public class ContentGenre
{
    public int ContentId { get; set; }
    public Content? Content { get; set; }
    public int GenreId { get; set; }
    public Genre? Genre { get; set; }
}

public class ContentTag
{
    public int ContentId { get; set; }
    public Content? Content { get; set; }
    public int TagId { get; set; }
    public Tag? Tag { get; set; }
}

public class MediaItem : IEntity
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public Category? Category { get; set; }
    public int? ContentId { get; set; }
    public Content? Content { get; set; }
    public string Title { get; set; } = string.Empty;
    public string MediaType { get; set; } = "Video";
    public string EmbedType { get; set; } = "file";
    public string Url { get; set; } = string.Empty;
    public int DurationSeconds { get; set; }
    public string Description { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string HoverImageUrl { get; set; } = string.Empty;
    public int ViewCount { get; set; }
    public int PopularityScore { get; set; }
    public decimal AverageRating { get; set; }
    public int RatingCount { get; set; }
    public int LikeCount { get; set; }
    public int DislikeCount { get; set; }
    public bool IsPublished { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<MediaTag> MediaTags { get; set; } = new List<MediaTag>();
}

public class MediaTag
{
    public int MediaItemId { get; set; }
    public MediaItem? MediaItem { get; set; }
    public int TagId { get; set; }
    public Tag? Tag { get; set; }
}

public class CharacterProfile : IEntity
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public Category? Category { get; set; }
    public int? ContentId { get; set; }
    public Content? Content { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Fandom { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Power { get; set; } = string.Empty;
    public string Quote { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public int Strength { get; set; }
    public int Intelligence { get; set; }
    public int Agility { get; set; }
    public int Charisma { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string HoverImageUrl { get; set; } = string.Empty;
    public int ViewCount { get; set; }
    public int PopularityScore { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Article : IEntity
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public Category? Category { get; set; }
    public int? AuthorId { get; set; }
    public User? Author { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Excerpt { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string HoverImageUrl { get; set; } = string.Empty;
    public int ReadMinutes { get; set; }
    public bool IsFeatured { get; set; }
    public string Status { get; set; } = "Published";
    public int ViewCount { get; set; }
    public int PopularityScore { get; set; }
    public DateTime PublishedAt { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<ArticleTimelineItem> TimelineItems { get; set; } = new List<ArticleTimelineItem>();
}

public class ArticleTimelineItem : IEntity
{
    public int Id { get; set; }
    public int ArticleId { get; set; }
    public Article? Article { get; set; }
    public string DateLabel { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}

public class MerchandiseItem : IEntity
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public Category? Category { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Fandom { get; set; } = string.Empty;
    public string Manufacturer { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string HoverImageUrl { get; set; } = string.Empty;
    public bool IsUpcoming { get; set; }
    public int ViewCount { get; set; }
    public int PopularityScore { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<MerchandiseImage> Images { get; set; } = new List<MerchandiseImage>();
    public ICollection<MerchandiseTag> MerchandiseTags { get; set; } = new List<MerchandiseTag>();
}

public class MerchandiseImage : IEntity
{
    public int Id { get; set; }
    public int MerchandiseItemId { get; set; }
    public MerchandiseItem? MerchandiseItem { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string Caption { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}

public class MerchandiseTag
{
    public int MerchandiseItemId { get; set; }
    public MerchandiseItem? MerchandiseItem { get; set; }
    public int TagId { get; set; }
    public Tag? Tag { get; set; }
}

public class UpcomingRelease : IEntity
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public Category? Category { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ReleaseType { get; set; } = string.Empty;
    public DateTime ReleaseDate { get; set; }
    public bool IsDateConfirmed { get; set; }
    public string Studio { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string HoverImageUrl { get; set; } = string.Empty;
    public string? ExternalUrl { get; set; }
    public int ViewCount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<UpcomingReleaseTag> UpcomingReleaseTags { get; set; } = new List<UpcomingReleaseTag>();
}

public class UpcomingReleaseTag
{
    public int UpcomingReleaseId { get; set; }
    public UpcomingRelease? UpcomingRelease { get; set; }
    public int TagId { get; set; }
    public Tag? Tag { get; set; }
}

public class Event : IEntity
{
    public int Id { get; set; }
    public int? CategoryId { get; set; }
    public Category? Category { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string EventType { get; set; } = "Convention";
    public string Description { get; set; } = string.Empty;
    public string Story { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string Venue { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public string TicketUrl { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string HoverImageUrl { get; set; } = string.Empty;
    public bool IsHighlight { get; set; }
    public int ViewCount { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
