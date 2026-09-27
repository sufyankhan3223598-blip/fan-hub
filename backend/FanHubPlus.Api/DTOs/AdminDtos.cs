namespace FanHubPlus.Api.DTOs;

public class AdminListQuery
{
    public string? Search { get; set; }
    public string? Sort { get; set; } = "Id";
    public string? Dir { get; set; } = "desc";
    public int? CategoryId { get; set; }
    public string? Status { get; set; }
    public string? Type { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class AdminCategoryDto
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

public class AdminTagDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Color { get; set; } = "#D4AF37";
}

public class AdminGenreDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
}

public class AdminContentDto
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string? CategoryName { get; set; }
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
    public bool IsFeatured { get; set; }
    public bool IsPublished { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public List<int> GenreIds { get; set; } = new();
    public List<int> TagIds { get; set; } = new();
}

public class AdminMediaDto
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public int? ContentId { get; set; }
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
    public bool IsPublished { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public List<int> TagIds { get; set; } = new();
}

public class AdminCharacterDto
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public int? ContentId { get; set; }
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
    public DateTime CreatedAt { get; set; }
}

public class AdminArticleDto
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Excerpt { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string HoverImageUrl { get; set; } = string.Empty;
    public int ReadMinutes { get; set; } = 5;
    public bool IsFeatured { get; set; }
    public string Status { get; set; } = "Published";
    public int ViewCount { get; set; }
    public DateTime PublishedAt { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; }
    public List<TimelineItemDto> Timeline { get; set; } = new();
}

public class AdminMerchDto
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string? CategoryName { get; set; }
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
    public DateTime CreatedAt { get; set; }
    public List<int> TagIds { get; set; } = new();
    public List<string> GalleryUrls { get; set; } = new();
}

public class AdminUpcomingDto
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ReleaseType { get; set; } = string.Empty;
    public DateTime ReleaseDate { get; set; } = DateTime.UtcNow.AddMonths(1);
    public bool IsDateConfirmed { get; set; }
    public string Studio { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string HoverImageUrl { get; set; } = string.Empty;
    public string? ExternalUrl { get; set; }
    public int ViewCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<int> TagIds { get; set; } = new();
}

public class AdminEventDto
{
    public int Id { get; set; }
    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }
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
    public DateTime StartDate { get; set; } = DateTime.UtcNow.AddDays(30);
    public DateTime EndDate { get; set; } = DateTime.UtcNow.AddDays(31);
    public string TicketUrl { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string HoverImageUrl { get; set; } = string.Empty;
    public bool IsHighlight { get; set; }
    public int ViewCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AdminFaqDto
{
    public int Id { get; set; }
    public string Category { get; set; } = "Platform";
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
    public string Keywords { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
    public int HitCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AdminUserDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public bool EmailVerified { get; set; }
    public bool IsBlocked { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public DateTime? LastActiveAt { get; set; }
    public int BookmarkCount { get; set; }
    public int SubmissionCount { get; set; }
}

public class SetRoleRequest
{
    public string Role { get; set; } = "User";
}

public class SetBlockedRequest
{
    public bool Blocked { get; set; }
}

public class BulkBlockRequest
{
    public List<int> Ids { get; set; } = new();
    public bool Blocked { get; set; }
}

public class TopItemDto
{
    public string ItemType { get; set; } = string.Empty;
    public int ItemId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public string AccentColor { get; set; } = string.Empty;
    public int Views { get; set; }
    public int PopularityScore { get; set; }
    public string Url { get; set; } = string.Empty;
}

public class AdminOverviewDto
{
    public List<KpiDto> Kpis { get; set; } = new();
    public List<string> TrafficLabels { get; set; } = new();
    public List<NamedSeriesDto> TrafficSeries { get; set; } = new();
    public List<SliceDto> PopularCategories { get; set; } = new();
    public List<TopItemDto> TopContent { get; set; } = new();
    public List<ActivityDto> LiveActivity { get; set; } = new();
    public List<EventDto> Events { get; set; } = new();
    public List<SubmissionDto> ModerationQueue { get; set; } = new();
    public List<FeedbackDto> OpenFeedback { get; set; } = new();
}

public class AnalyticsDto
{
    public DateTime From { get; set; }
    public DateTime To { get; set; }
    public List<string> Labels { get; set; } = new();
    public List<int> ActiveUsers { get; set; } = new();
    public List<int> Views { get; set; } = new();
    public List<int> ChatbotQueries { get; set; } = new();
    public List<int> NewUsers { get; set; } = new();
    public int TotalActiveUsers { get; set; }
    public int TotalViews { get; set; }
    public int TotalChatbotQueries { get; set; }
    public int TotalNewUsers { get; set; }
    public List<SliceDto> PopularCategories { get; set; } = new();
    public List<SliceDto> ViewsByType { get; set; } = new();
    public List<SliceDto> ChatbotIntents { get; set; } = new();
    public List<SliceDto> FeedbackByType { get; set; } = new();
    public List<TopItemDto> MostViewed { get; set; } = new();
    public List<TopItemDto> MostViewedMerchandise { get; set; } = new();
    public List<FaqHitDto> TopFaqs { get; set; } = new();
}

public class FaqHitDto
{
    public string Question { get; set; } = string.Empty;
    public int Hits { get; set; }
}
