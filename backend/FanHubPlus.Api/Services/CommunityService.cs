using FanHubPlus.Api.Common;
using FanHubPlus.Api.Data;
using FanHubPlus.Api.DTOs;
using FanHubPlus.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace FanHubPlus.Api.Services;

public interface ICommunityService
{

    Task<List<BookmarkDto>> GetBookmarksAsync(int userId, string? itemType, string? search);
    Task<BookmarkStatusDto> GetBookmarkStatusAsync(int userId, string itemType, int itemId);
    Task<BookmarkDto> AddBookmarkAsync(int userId, CreateBookmarkRequest req);
    Task<BookmarkDto> UpdateNoteAsync(int userId, int bookmarkId, string? note);
    Task RemoveBookmarkAsync(int userId, int bookmarkId);


    Task<RatingSummaryDto> RateAsync(int userId, RateRequest req);
    Task<RatingSummaryDto> GetRatingAsync(int? userId, string itemType, int itemId);


    Task<FeedbackDto> CreateFeedbackAsync(int userId, CreateFeedbackRequest req);
    Task<List<FeedbackDto>> GetMyFeedbackAsync(int userId);


    Task<SubmissionDto> CreateSubmissionAsync(int userId, CreateSubmissionRequest req);
    Task<List<SubmissionDto>> GetMySubmissionsAsync(int userId);
    Task<PagedResult<SubmissionDto>> GetApprovedSubmissionsAsync(string? category, int page, int pageSize);
    Task<SubmissionDto> GetSubmissionAsync(int id, int? userId, bool isAdmin);


    Task<List<NotificationDto>> GetNotificationsAsync(int userId);
    Task MarkReadAsync(int userId, int? id);
}

public class CommunityService : ICommunityService
{
    private readonly AppDbContext _db;
    private readonly IActivityService _activity;

    public CommunityService(AppDbContext db, IActivityService activity)
    {
        _db = db; _activity = activity;
    }


    public async Task<List<BookmarkDto>> GetBookmarksAsync(int userId, string? itemType, string? search)
    {
        var q = _db.Bookmarks.AsNoTracking().Where(b => b.UserId == userId);
        if (!string.IsNullOrWhiteSpace(itemType)) q = q.Where(b => b.ItemType == itemType);
        if (!string.IsNullOrWhiteSpace(search)) q = q.Where(b => b.Title.Contains(search) || (b.Note != null && b.Note.Contains(search)));
        return await q.OrderByDescending(b => b.CreatedAt).Select(Projections.ToBookmark).ToListAsync();
    }

    public async Task<BookmarkStatusDto> GetBookmarkStatusAsync(int userId, string itemType, int itemId)
    {
        var b = await _db.Bookmarks.AsNoTracking().FirstOrDefaultAsync(x => x.UserId == userId && x.ItemType == itemType && x.ItemId == itemId);
        return new BookmarkStatusDto { Bookmarked = b != null, BookmarkId = b?.Id, Note = b?.Note };
    }

    public async Task<BookmarkDto> AddBookmarkAsync(int userId, CreateBookmarkRequest req)
    {
        if (!ItemTypes.Bookmarkable.Contains(req.ItemType)) throw new AppException("This item type cannot be bookmarked.");
        var existing = await _db.Bookmarks.FirstOrDefaultAsync(x => x.UserId == userId && x.ItemType == req.ItemType && x.ItemId == req.ItemId);
        if (existing != null)
        {
            if (req.Note != null) { existing.Note = req.Note; existing.UpdatedAt = DateTime.UtcNow; await _db.SaveChangesAsync(); }
            return await _db.Bookmarks.AsNoTracking().Where(b => b.Id == existing.Id).Select(Projections.ToBookmark).FirstAsync();
        }

        var (title, image, url) = await ResolveItemAsync(req.ItemType, req.ItemId);
        var bookmark = new Bookmark
        {
            UserId = userId, ItemType = req.ItemType, ItemId = req.ItemId, Title = title, ImageUrl = image, Url = url,
            Note = string.IsNullOrWhiteSpace(req.Note) ? null : req.Note.Trim()
        };
        _db.Bookmarks.Add(bookmark);
        await _db.SaveChangesAsync();
        await _activity.LogActivityAsync(userId, "Bookmark", $"Bookmarked {title}", req.ItemType, req.ItemId, url);
        return await _db.Bookmarks.AsNoTracking().Where(b => b.Id == bookmark.Id).Select(Projections.ToBookmark).FirstAsync();
    }

    public async Task<BookmarkDto> UpdateNoteAsync(int userId, int bookmarkId, string? note)
    {
        var b = await _db.Bookmarks.FirstOrDefaultAsync(x => x.Id == bookmarkId && x.UserId == userId) ?? throw new NotFoundException("Bookmark");
        b.Note = string.IsNullOrWhiteSpace(note) ? null : note.Trim();
        b.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _activity.LogActivityAsync(userId, "Note", $"Updated note on {b.Title}", b.ItemType, b.ItemId, b.Url);
        return await _db.Bookmarks.AsNoTracking().Where(x => x.Id == b.Id).Select(Projections.ToBookmark).FirstAsync();
    }

    public async Task RemoveBookmarkAsync(int userId, int bookmarkId)
    {
        var b = await _db.Bookmarks.FirstOrDefaultAsync(x => x.Id == bookmarkId && x.UserId == userId) ?? throw new NotFoundException("Bookmark");
        _db.Bookmarks.Remove(b);
        await _db.SaveChangesAsync();
    }


    private async Task<(string Title, string Image, string Url)> ResolveItemAsync(string type, int id)
    {
        (string, string, string)? r = type switch
        {
            ItemTypes.Content => await _db.Contents.Where(x => x.Id == id).Select(x => ValueTuple.Create(x.Title, x.ImageUrl, "/content/" + x.Slug)).FirstOrDefaultAsync(),
            ItemTypes.Character => await _db.CharacterProfiles.Where(x => x.Id == id).Select(x => ValueTuple.Create(x.Name, x.ImageUrl, "/characters/" + x.Slug)).FirstOrDefaultAsync(),
            ItemTypes.Media => await _db.MediaItems.Where(x => x.Id == id).Select(x => ValueTuple.Create(x.Title, x.ImageUrl, "/media/" + x.Id)).FirstOrDefaultAsync(),
            ItemTypes.Merchandise => await _db.MerchandiseItems.Where(x => x.Id == id).Select(x => ValueTuple.Create(x.Name, x.ImageUrl, "/merchandise/" + x.Slug)).FirstOrDefaultAsync(),
            ItemTypes.Article => await _db.Articles.Where(x => x.Id == id).Select(x => ValueTuple.Create(x.Title, x.ImageUrl, "/articles/" + x.Slug)).FirstOrDefaultAsync(),
            ItemTypes.Event => await _db.Events.Where(x => x.Id == id).Select(x => ValueTuple.Create(x.Title, x.ImageUrl, "/events/" + x.Slug)).FirstOrDefaultAsync(),
            _ => null
        };
        if (r == null || string.IsNullOrEmpty(r.Value.Item1)) throw new NotFoundException(type);
        return r.Value;
    }


    public async Task<RatingSummaryDto> RateAsync(int userId, RateRequest req)
    {
        if (!ItemTypes.Rateable.Contains(req.ItemType)) throw new AppException("Only content and media can be rated.");
        if (req.Stars is < 1 or > 5) throw new AppException("Stars must be between 1 and 5.");
        if (req.Thumb is < -1 or > 1) throw new AppException("Thumb must be -1, 0 or 1.");
        await ResolveItemAsync(req.ItemType, req.ItemId);

        var rating = await _db.Ratings.FirstOrDefaultAsync(r => r.UserId == userId && r.ItemType == req.ItemType && r.ItemId == req.ItemId);
        if (rating == null)
        {
            rating = new Rating { UserId = userId, ItemType = req.ItemType, ItemId = req.ItemId };
            _db.Ratings.Add(rating);
        }
        else rating.UpdatedAt = DateTime.UtcNow;
        if (req.Stars.HasValue) rating.Stars = req.Stars;
        if (req.Thumb.HasValue) rating.Thumb = req.Thumb.Value;
        await _db.SaveChangesAsync();

        await RecalculateAsync(req.ItemType, req.ItemId);
        var (title, _, url) = await ResolveItemAsync(req.ItemType, req.ItemId);
        await _activity.LogActivityAsync(userId, "Rating", $"Rated {title}", req.ItemType, req.ItemId, url);
        return await GetRatingAsync(userId, req.ItemType, req.ItemId);
    }


    private async Task RecalculateAsync(string type, int id)
    {
        var rows = _db.Ratings.Where(r => r.ItemType == type && r.ItemId == id);
        var starRows = rows.Where(r => r.Stars != null);
        var count = await starRows.CountAsync();
        var avg = count == 0 ? 0m : (decimal)await starRows.AverageAsync(r => (double)r.Stars!.Value);
        var likes = await rows.CountAsync(r => r.Thumb == 1);
        var dislikes = await rows.CountAsync(r => r.Thumb == -1);

        if (type == ItemTypes.Content)
        {
            var c = await _db.Contents.FindAsync(id);
            if (c != null)
            {

                c.AverageRating = Math.Round(count == 0 ? c.AverageRating : avg, 2);
                c.RatingCount = Math.Max(count, c.RatingCount);
                c.LikeCount = Math.Max(likes, c.LikeCount);
                c.DislikeCount = Math.Max(dislikes, c.DislikeCount);
            }
        }
        else
        {
            var m = await _db.MediaItems.FindAsync(id);
            if (m != null)
            {
                m.AverageRating = Math.Round(count == 0 ? m.AverageRating : avg, 2);
                m.RatingCount = Math.Max(count, m.RatingCount);
                m.LikeCount = Math.Max(likes, m.LikeCount);
                m.DislikeCount = Math.Max(dislikes, m.DislikeCount);
            }
        }
        await _db.SaveChangesAsync();
    }

    public async Task<RatingSummaryDto> GetRatingAsync(int? userId, string itemType, int itemId)
    {
        var dto = new RatingSummaryDto { ItemType = itemType, ItemId = itemId };
        if (itemType == ItemTypes.Content)
        {
            var c = await _db.Contents.AsNoTracking().FirstOrDefaultAsync(x => x.Id == itemId) ?? throw new NotFoundException("Content");
            dto.AverageRating = c.AverageRating; dto.RatingCount = c.RatingCount; dto.LikeCount = c.LikeCount; dto.DislikeCount = c.DislikeCount;
        }
        else
        {
            var m = await _db.MediaItems.AsNoTracking().FirstOrDefaultAsync(x => x.Id == itemId) ?? throw new NotFoundException("Media");
            dto.AverageRating = m.AverageRating; dto.RatingCount = m.RatingCount; dto.LikeCount = m.LikeCount; dto.DislikeCount = m.DislikeCount;
        }
        if (userId.HasValue)
        {
            var mine = await _db.Ratings.AsNoTracking().FirstOrDefaultAsync(r => r.UserId == userId && r.ItemType == itemType && r.ItemId == itemId);
            dto.MyStars = mine?.Stars;
            dto.MyThumb = mine?.Thumb ?? 0;
        }
        return dto;
    }


    public async Task<FeedbackDto> CreateFeedbackAsync(int userId, CreateFeedbackRequest req)
    {
        var user = await _db.Users.FindAsync(userId) ?? throw new NotFoundException("User");
        var f = new Feedback
        {
            UserId = userId, Name = user.FullName, Email = user.Email, Type = req.Type, Subject = req.Subject.Trim(),
            Message = req.Message.Trim(), PageUrl = req.PageUrl, Status = "Open"
        };
        _db.Feedback.Add(f);
        await _db.SaveChangesAsync();
        await _activity.LogActivityAsync(userId, "Feedback", $"Sent {req.Type.ToLowerInvariant()} feedback: {f.Subject}", null, f.Id, "/feedback");
        return await _db.Feedback.AsNoTracking().Where(x => x.Id == f.Id).Select(Projections.ToFeedback).FirstAsync();
    }

    public Task<List<FeedbackDto>> GetMyFeedbackAsync(int userId) =>
        _db.Feedback.AsNoTracking().Where(f => f.UserId == userId).OrderByDescending(f => f.CreatedAt)
            .Select(Projections.ToFeedback).ToListAsync();


    public async Task<SubmissionDto> CreateSubmissionAsync(int userId, CreateSubmissionRequest req)
    {
        if (!await _db.Categories.AnyAsync(c => c.Id == req.CategoryId)) throw new AppException("Please choose a valid category.");
        var s = new FanSubmission
        {
            UserId = userId, CategoryId = req.CategoryId, Title = req.Title.Trim(), SubmissionType = req.SubmissionType,
            Summary = req.Summary.Trim(), Body = Html.Sanitize(req.Body), ImageUrl = req.ImageUrl, Status = "Pending"
        };
        _db.FanSubmissions.Add(s);
        await _db.SaveChangesAsync();
        await _activity.LogActivityAsync(userId, "Submission", $"Submitted {s.Title}", ItemTypes.Submission, s.Id, "/submissions/mine");
        await _activity.NotifyAsync(userId, "Submission received", $"'{s.Title}' is awaiting admin review.", "/submissions/mine");
        return await _db.FanSubmissions.AsNoTracking().Where(x => x.Id == s.Id).Select(Projections.ToSubmission).FirstAsync();
    }

    public Task<List<SubmissionDto>> GetMySubmissionsAsync(int userId) =>
        _db.FanSubmissions.AsNoTracking().Where(s => s.UserId == userId).OrderByDescending(s => s.CreatedAt)
            .Select(Projections.ToSubmission).ToListAsync();

    public Task<PagedResult<SubmissionDto>> GetApprovedSubmissionsAsync(string? category, int page, int pageSize)
    {
        var q = _db.FanSubmissions.AsNoTracking().Where(s => s.Status == "Approved");
        if (!string.IsNullOrWhiteSpace(category)) q = q.Where(s => s.Category!.Slug == category);
        return CatalogService.PageAsync(q.OrderByDescending(s => s.ReviewedAt).Select(Projections.ToSubmission), page, pageSize);
    }

    public async Task<SubmissionDto> GetSubmissionAsync(int id, int? userId, bool isAdmin)
    {
        var s = await _db.FanSubmissions.FirstOrDefaultAsync(x => x.Id == id) ?? throw new NotFoundException("Submission");
        if (s.Status != "Approved" && !isAdmin && s.UserId != userId) throw new NotFoundException("Submission");
        if (s.Status == "Approved") { s.ViewCount++; await _db.SaveChangesAsync(); }
        var dto = await _db.FanSubmissions.AsNoTracking().Where(x => x.Id == id).Select(Projections.ToSubmission).FirstAsync();
        if (!userId.HasValue) dto.Body = $"<p>{CatalogService.Teaser(dto.Body, 40)}</p>";
        return dto;
    }


    public Task<List<NotificationDto>> GetNotificationsAsync(int userId) =>
        _db.Notifications.AsNoTracking().Where(n => n.UserId == userId).OrderByDescending(n => n.CreatedAt).Take(30)
            .Select(Projections.ToNotification).ToListAsync();

    public async Task MarkReadAsync(int userId, int? id)
    {
        var q = _db.Notifications.Where(n => n.UserId == userId && !n.IsRead);
        if (id.HasValue) q = q.Where(n => n.Id == id.Value);
        foreach (var n in await q.ToListAsync()) n.IsRead = true;
        await _db.SaveChangesAsync();
    }
}
