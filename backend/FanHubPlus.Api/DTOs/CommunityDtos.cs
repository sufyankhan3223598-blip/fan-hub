namespace FanHubPlus.Api.DTOs;

public class BookmarkDto
{
    public int Id { get; set; }
    public string ItemType { get; set; } = string.Empty;
    public int ItemId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateBookmarkRequest
{
    public string ItemType { get; set; } = string.Empty;
    public int ItemId { get; set; }
    public string? Note { get; set; }
}

public class UpdateNoteRequest
{
    public string? Note { get; set; }
}

public class BookmarkStatusDto
{
    public bool Bookmarked { get; set; }
    public int? BookmarkId { get; set; }
    public string? Note { get; set; }
}

public class RateRequest
{
    public string ItemType { get; set; } = string.Empty;
    public int ItemId { get; set; }
    public int? Stars { get; set; }
    public int? Thumb { get; set; }
}

public class RatingSummaryDto
{
    public string ItemType { get; set; } = string.Empty;
    public int ItemId { get; set; }
    public decimal AverageRating { get; set; }
    public int RatingCount { get; set; }
    public int LikeCount { get; set; }
    public int DislikeCount { get; set; }
    public int? MyStars { get; set; }
    public int MyThumb { get; set; }
}

public class CreateFeedbackRequest
{
    public string Type { get; set; } = "Query";
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? PageUrl { get; set; }
}

public class FeedbackDto
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? PageUrl { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? AdminNote { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class UpdateFeedbackStatusRequest
{
    public string Status { get; set; } = "Open";
    public string? AdminNote { get; set; }
}

public class CreateSubmissionRequest
{
    public int CategoryId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string SubmissionType { get; set; } = "Article";
    public string Summary { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
}

public class SubmissionDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public string? AuthorAvatarUrl { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string CategorySlug { get; set; } = string.Empty;
    public string AccentColor { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string SubmissionType { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? ReviewNote { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public int ViewCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ReviewSubmissionRequest
{
    public string Status { get; set; } = "Approved";
    public string? ReviewNote { get; set; }
}

public class BulkReviewRequest
{
    public List<int> Ids { get; set; } = new();
    public string Status { get; set; } = "Approved";
    public string? ReviewNote { get; set; }
}

public class BulkStatusRequest
{
    public List<int> Ids { get; set; } = new();
    public string Status { get; set; } = string.Empty;
}

public class BulkIdsRequest
{
    public List<int> Ids { get; set; } = new();
}

public class UpdateProfileRequest
{
    public string FullName { get; set; } = string.Empty;
    public string? Bio { get; set; }
    public List<string> FavoriteFandoms { get; set; } = new();
    public List<int> CategoryIds { get; set; } = new();
}

public class UpdatePreferencesRequest
{
    public string Theme { get; set; } = "dark";
    public string FontSize { get; set; } = "md";
    public bool ReduceMotion { get; set; }
    public bool EmailNotifications { get; set; } = true;
}

public class KpiDto
{
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public int Value { get; set; }
    public double Change { get; set; }
    public List<int> Trend { get; set; } = new();
}

public class SeriesPointDto
{
    public string Label { get; set; } = string.Empty;
    public int Value { get; set; }
}

public class NamedSeriesDto
{
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public List<int> Values { get; set; } = new();
}

public class SliceDto
{
    public string Label { get; set; } = string.Empty;
    public int Value { get; set; }
    public string Color { get; set; } = string.Empty;
}

public class ActivityDto
{
    public int Id { get; set; }
    public string ActivityType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Url { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? UserName { get; set; }
    public string? UserAvatarUrl { get; set; }
}

public class NotificationDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? Url { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class DashboardDto
{
    public UserDto User { get; set; } = new();
    public string Greeting { get; set; } = string.Empty;
    public int Streak { get; set; }
    public List<KpiDto> Kpis { get; set; } = new();
    public List<string> ActivityLabels { get; set; } = new();
    public List<NamedSeriesDto> ActivitySeries { get; set; } = new();
    public List<SliceDto> CategoryBreakdown { get; set; } = new();
    public List<ActivityDto> RecentActivity { get; set; } = new();
    public List<BookmarkDto> Bookmarks { get; set; } = new();
    public List<ContentCardDto> Recommendations { get; set; } = new();
    public List<ContentCardDto> FavoriteFandomContent { get; set; } = new();
    public List<NotificationDto> Notifications { get; set; } = new();
    public List<EventDto> UpcomingEvents { get; set; } = new();
}

public class ChatRequest
{
    public string Message { get; set; } = string.Empty;
    public string SessionId { get; set; } = string.Empty;
}

public class ChatSuggestionDto
{
    public string Title { get; set; } = string.Empty;
    public string Subtitle { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
}

public class ChatResponse
{
    public string Reply { get; set; } = string.Empty;
    public string Intent { get; set; } = string.Empty;
    public List<string> QuickReplies { get; set; } = new();
    public List<ChatSuggestionDto> Suggestions { get; set; } = new();
    public int? OnboardingStep { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class ChatHistoryItemDto
{
    public int Id { get; set; }
    public string SessionId { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Response { get; set; } = string.Empty;
    public string Intent { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string? UserName { get; set; }
}

public class ChatSessionDto
{
    public string SessionId { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
    public DateTime LastMessageAt { get; set; }
    public int MessageCount { get; set; }
    public string Preview { get; set; } = string.Empty;
    public List<ChatHistoryItemDto> Messages { get; set; } = new();
}
