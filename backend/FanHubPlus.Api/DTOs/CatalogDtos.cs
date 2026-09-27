namespace FanHubPlus.Api.DTOs;

public class CategoryLiteDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string AccentColor { get; set; } = string.Empty;
}

public class CategoryDto : CategoryLiteDto
{
    public string Tagline { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string SecondaryColor { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string HoverImageUrl { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public int ContentCount { get; set; }
    public int CharacterCount { get; set; }
    public int MediaCount { get; set; }
    public int MerchandiseCount { get; set; }
    public int TotalItems => ContentCount + CharacterCount + MediaCount + MerchandiseCount;
}

public class TagDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
}

public class GenreDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
}

public class ContentQuery
{
    public string? Search { get; set; }
    public string? Category { get; set; }
    public string? Genre { get; set; }
    public int? YearFrom { get; set; }
    public int? YearTo { get; set; }
    public string? Type { get; set; }
    public int? MinPopularity { get; set; }
    public string? Sort { get; set; }
    public bool? Featured { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 12;
}

public class ContentCardDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public string Format { get; set; } = string.Empty;
    public int ReleaseYear { get; set; }
    public string Synopsis { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string HoverImageUrl { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public string CategorySlug { get; set; } = string.Empty;
    public string AccentColor { get; set; } = string.Empty;
    public decimal AverageRating { get; set; }
    public int RatingCount { get; set; }
    public int PopularityScore { get; set; }
    public int ViewCount { get; set; }
    public bool IsFeatured { get; set; }
    public List<string> Genres { get; set; } = new();
    public List<TagDto> Tags { get; set; } = new();
}

public class ContentDetailDto : ContentCardDto
{
    public string Description { get; set; } = string.Empty;
    public string Creator { get; set; } = string.Empty;
    public int? Seasons { get; set; }
    public int? Episodes { get; set; }
    public string? TrailerUrl { get; set; }
    public string BannerUrl { get; set; } = string.Empty;
    public int LikeCount { get; set; }
    public int DislikeCount { get; set; }

    public bool Locked { get; set; }
    public List<CharacterCardDto> Characters { get; set; } = new();
    public List<MediaDto> Media { get; set; } = new();
    public List<ContentCardDto> Related { get; set; } = new();
}

public class MediaQuery
{
    public string? Search { get; set; }
    public string? Category { get; set; }
    public string? Type { get; set; }
    public string? Tag { get; set; }
    public string? Sort { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 12;
}

public class MediaDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string MediaType { get; set; } = string.Empty;
    public string EmbedType { get; set; } = string.Empty;
    public string? Url { get; set; }
    public int DurationSeconds { get; set; }
    public string Description { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string HoverImageUrl { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public string CategorySlug { get; set; } = string.Empty;
    public string AccentColor { get; set; } = string.Empty;
    public int ViewCount { get; set; }
    public decimal AverageRating { get; set; }
    public int RatingCount { get; set; }
    public int LikeCount { get; set; }
    public int DislikeCount { get; set; }
    public bool Locked { get; set; }
    public int? ContentId { get; set; }
    public List<TagDto> Tags { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class CharacterQuery
{
    public string? Search { get; set; }
    public string? Category { get; set; }
    public string? Fandom { get; set; }
    public string? Sort { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 12;
}

public class CharacterCardDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Fandom { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Power { get; set; } = string.Empty;
    public string Quote { get; set; } = string.Empty;
    public int Strength { get; set; }
    public int Intelligence { get; set; }
    public int Agility { get; set; }
    public int Charisma { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string HoverImageUrl { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public string CategorySlug { get; set; } = string.Empty;
    public string AccentColor { get; set; } = string.Empty;
    public int ViewCount { get; set; }
    public int PopularityScore { get; set; }
}

public class CharacterDetailDto : CharacterCardDto
{
    public string Bio { get; set; } = string.Empty;
    public bool Locked { get; set; }
    public ContentCardDto? Content { get; set; }
    public List<CharacterCardDto> Related { get; set; } = new();
}

public class ArticleCardDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Excerpt { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string HoverImageUrl { get; set; } = string.Empty;
    public int ReadMinutes { get; set; }
    public bool IsFeatured { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string CategorySlug { get; set; } = string.Empty;
    public string AccentColor { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public int ViewCount { get; set; }
    public DateTime PublishedAt { get; set; }
    public bool IsFanSubmission { get; set; }
}

public class TimelineItemDto
{
    public int Id { get; set; }
    public string DateLabel { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int SortOrder { get; set; }
}

public class ArticleDetailDto : ArticleCardDto
{
    public string Body { get; set; } = string.Empty;
    public bool Locked { get; set; }
    public List<TimelineItemDto> Timeline { get; set; } = new();
    public List<ArticleCardDto> Related { get; set; } = new();
}

public class MerchQuery
{
    public string? Search { get; set; }
    public string? Category { get; set; }
    public string? Fandom { get; set; }
    public string? Tag { get; set; }
    public string? Sort { get; set; }
    public bool? Upcoming { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 12;
}

public class MerchImageDto
{
    public string ImageUrl { get; set; } = string.Empty;
    public string Caption { get; set; } = string.Empty;
}

public class MerchDto
{
    public int Id { get; set; }
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
    public string CategoryName { get; set; } = string.Empty;
    public string CategorySlug { get; set; } = string.Empty;
    public string AccentColor { get; set; } = string.Empty;
    public List<TagDto> Tags { get; set; } = new();
    public List<MerchImageDto> Images { get; set; } = new();
    public bool Locked { get; set; }
}

public class MerchGroupDto
{
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string AccentColor { get; set; } = string.Empty;
    public List<MerchDto> Items { get; set; } = new();
}

public class UpcomingDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ReleaseType { get; set; } = string.Empty;
    public DateTime ReleaseDate { get; set; }
    public bool IsDateConfirmed { get; set; }
    public string Studio { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string HoverImageUrl { get; set; } = string.Empty;
    public string? ExternalUrl { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string CategorySlug { get; set; } = string.Empty;
    public string AccentColor { get; set; } = string.Empty;
    public int ViewCount { get; set; }
    public List<TagDto> Tags { get; set; } = new();
}

public class EventQuery
{
    public string? Search { get; set; }
    public string? City { get; set; }
    public string? Category { get; set; }
    public string? Type { get; set; }
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
    public double? Lat { get; set; }
    public double? Lng { get; set; }
    public double? RadiusKm { get; set; }
    public bool? Highlights { get; set; }
    public bool IncludePast { get; set; }
}

public class EventDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
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
    public string? CategoryName { get; set; }
    public string? CategorySlug { get; set; }
    public string AccentColor { get; set; } = "#D4AF37";
    public int ViewCount { get; set; }
    public double? DistanceKm { get; set; }
}

public class EventDetailDto : EventDto
{
    public string Story { get; set; } = string.Empty;
    public bool Locked { get; set; }
    public List<EventDto> Nearby { get; set; } = new();
}

public class SiteStatsDto
{
    public int Categories { get; set; }
    public int Contents { get; set; }
    public int Characters { get; set; }
    public int Media { get; set; }
    public int Merchandise { get; set; }
    public int Events { get; set; }
    public int Articles { get; set; }
    public int Members { get; set; }
    public int UpcomingReleases { get; set; }
}

public class SearchResultDto
{
    public string Type { get; set; } = string.Empty;
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Subtitle { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
}

public class HomeDto
{
    public List<CategoryDto> Categories { get; set; } = new();
    public Dictionary<string, List<ContentCardDto>> FeaturedByCategory { get; set; } = new();
    public List<ContentCardDto> Trending { get; set; } = new();
    public List<EventDto> Events { get; set; } = new();
    public List<UpcomingDto> Upcoming { get; set; } = new();
    public SiteStatsDto Stats { get; set; } = new();
}

public class FaqDto
{
    public int Id { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
}
