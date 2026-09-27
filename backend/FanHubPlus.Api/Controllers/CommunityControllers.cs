using FanHubPlus.Api.Common;
using FanHubPlus.Api.DTOs;
using FanHubPlus.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FanHubPlus.Api.Controllers;

[ApiController]
[Route("api/bookmarks")]
[Authorize]
public class BookmarksController : ControllerBase
{
    private readonly ICommunityService _svc;
    public BookmarksController(ICommunityService svc) => _svc = svc;

    [HttpGet] public Task<List<BookmarkDto>> List([FromQuery] string? type, [FromQuery] string? search) => _svc.GetBookmarksAsync(User.RequireUserId(), type, search);
    [HttpGet("status")] public Task<BookmarkStatusDto> Status([FromQuery] string itemType, [FromQuery] int itemId) => _svc.GetBookmarkStatusAsync(User.RequireUserId(), itemType, itemId);
    [HttpPost] public Task<BookmarkDto> Add([FromBody] CreateBookmarkRequest req) => _svc.AddBookmarkAsync(User.RequireUserId(), req);
    [HttpPut("{id:int}/note")] public Task<BookmarkDto> Note(int id, [FromBody] UpdateNoteRequest req) => _svc.UpdateNoteAsync(User.RequireUserId(), id, req.Note);

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Remove(int id)
    {
        await _svc.RemoveBookmarkAsync(User.RequireUserId(), id);
        return NoContent();
    }
}

[ApiController]
[Route("api/ratings")]
public class RatingsController : ControllerBase
{
    private readonly ICommunityService _svc;
    public RatingsController(ICommunityService svc) => _svc = svc;

    [HttpGet] public Task<RatingSummaryDto> Get([FromQuery] string itemType, [FromQuery] int itemId) => _svc.GetRatingAsync(User.GetUserId(), itemType, itemId);
    [Authorize, HttpPost] public Task<RatingSummaryDto> Rate([FromBody] RateRequest req) => _svc.RateAsync(User.RequireUserId(), req);
}

[ApiController]
[Route("api/feedback")]
[Authorize]
public class FeedbackController : ControllerBase
{
    private readonly ICommunityService _svc;
    public FeedbackController(ICommunityService svc) => _svc = svc;

    [HttpPost] public Task<FeedbackDto> Create([FromBody] CreateFeedbackRequest req) => _svc.CreateFeedbackAsync(User.RequireUserId(), req);
    [HttpGet("mine")] public Task<List<FeedbackDto>> Mine() => _svc.GetMyFeedbackAsync(User.RequireUserId());
}

[ApiController]
[Route("api/submissions")]
public class SubmissionsController : ControllerBase
{
    private readonly ICommunityService _svc;
    public SubmissionsController(ICommunityService svc) => _svc = svc;


    [HttpGet] public Task<PagedResult<SubmissionDto>> Approved([FromQuery] string? category, [FromQuery] int page = 1, [FromQuery] int pageSize = 9) =>
        _svc.GetApprovedSubmissionsAsync(category, page, pageSize);

    [HttpGet("{id:int}")] public Task<SubmissionDto> Detail(int id) => _svc.GetSubmissionAsync(id, User.GetUserId(), User.IsInRole(Roles.Admin));
    [Authorize, HttpGet("mine")] public Task<List<SubmissionDto>> Mine() => _svc.GetMySubmissionsAsync(User.RequireUserId());
    [Authorize, HttpPost] public Task<SubmissionDto> Create([FromBody] CreateSubmissionRequest req) => _svc.CreateSubmissionAsync(User.RequireUserId(), req);
}

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly ICommunityService _svc;
    public NotificationsController(ICommunityService svc) => _svc = svc;

    [HttpGet] public Task<List<NotificationDto>> List() => _svc.GetNotificationsAsync(User.RequireUserId());

    [HttpPost("{id:int}/read")]
    public async Task<IActionResult> Read(int id) { await _svc.MarkReadAsync(User.RequireUserId(), id); return NoContent(); }

    [HttpPost("read-all")]
    public async Task<IActionResult> ReadAll() { await _svc.MarkReadAsync(User.RequireUserId(), null); return NoContent(); }
}

[ApiController]
[Route("api/profile")]
[Authorize]
public class ProfileController : ControllerBase
{
    private readonly IProfileService _profile;
    private readonly IAuthService _auth;
    private readonly IFileStorageService _files;

    public ProfileController(IProfileService profile, IAuthService auth, IFileStorageService files)
    {
        _profile = profile; _auth = auth; _files = files;
    }

    [HttpGet] public Task<UserDto> Get() => _auth.GetUserAsync(User.RequireUserId());
    [HttpPut] public Task<UserDto> Update([FromBody] UpdateProfileRequest req) => _profile.UpdateProfileAsync(User.RequireUserId(), req);
    [HttpPut("preferences")] public Task<UserDto> Preferences([FromBody] UpdatePreferencesRequest req) => _profile.UpdatePreferencesAsync(User.RequireUserId(), req);

    [HttpPost("avatar")]
    [RequestSizeLimit(3 * 1024 * 1024)]
    public Task<UserDto> Avatar(IFormFile file) => _profile.UpdateAvatarAsync(User.RequireUserId(), file);

    [HttpDelete("avatar")] public Task<UserDto> RemoveAvatar() => _profile.RemoveAvatarAsync(User.RequireUserId());


    [HttpPost("uploads")]
    [RequestSizeLimit(3 * 1024 * 1024)]
    public async Task<ActionResult<object>> Upload(IFormFile file) => Ok(new { url = await _files.SaveImageAsync(file, "submissions") });
}

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dash;
    public DashboardController(IDashboardService dash) => _dash = dash;

    [HttpGet] public Task<DashboardDto> Get() => _dash.GetAsync(User.RequireUserId());
}

[ApiController]
[Route("api/chatbot")]
public class ChatbotController : ControllerBase
{
    private readonly IChatbotService _bot;
    public ChatbotController(IChatbotService bot) => _bot = bot;


    [HttpPost("message")] public Task<ChatResponse> Message([FromBody] ChatRequest req) => _bot.ReplyAsync(req, User.GetUserId());

    [Authorize, HttpGet("history")] public Task<List<ChatSessionDto>> History() => _bot.GetHistoryAsync(User.RequireUserId());

    [Authorize, HttpDelete("history")]
    public async Task<IActionResult> Clear() { await _bot.ClearHistoryAsync(User.RequireUserId()); return NoContent(); }
}
