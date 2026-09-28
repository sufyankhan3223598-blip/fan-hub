using FanHubPlus.Api.Common;
using FanHubPlus.Api.DTOs;
using FanHubPlus.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FanHubPlus.Api.Controllers.Admin;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = Roles.Admin)]
public class AdminController : ControllerBase
{
    private readonly IAdminService _admin;
    private readonly IFileStorageService _files;

    public AdminController(IAdminService admin, IFileStorageService files)
    {
        _admin = admin; _files = files;
    }

    [HttpGet("overview")]
    public Task<AdminOverviewDto> Overview() => _admin.GetOverviewAsync();

    [HttpGet("analytics")]
    public Task<AnalyticsDto> Analytics([FromQuery] DateTime? from, [FromQuery] DateTime? to) => _admin.GetAnalyticsAsync(from, to);


    [HttpGet("users")]
    public Task<PagedResult<AdminUserDto>> Users([FromQuery] AdminListQuery q) => _admin.GetUsersAsync(q);

    [HttpPut("users/{id:int}/role")]
    public async Task<IActionResult> SetRole(int id, [FromBody] SetRoleRequest req)
    {
        await _admin.SetRoleAsync(User.RequireUserId(), id, req.Role);
        return NoContent();
    }

    [HttpPut("users/{id:int}/block")]
    public async Task<IActionResult> Block(int id, [FromBody] SetBlockedRequest req)
    {
        await _admin.SetBlockedAsync(User.RequireUserId(), new[] { id }, req.Blocked);
        return NoContent();
    }

    [HttpPost("users/bulk-block")]
    public async Task<IActionResult> BulkBlock([FromBody] BulkBlockRequest req)
    {
        await _admin.SetBlockedAsync(User.RequireUserId(), req.Ids, req.Blocked);
        return NoContent();
    }

    [HttpPost("users/bulk-delete")]
    public async Task<IActionResult> BulkDeleteUsers([FromBody] BulkIdsRequest req)
    {
        await _admin.DeleteUsersAsync(User.RequireUserId(), req.Ids);
        return NoContent();
    }


    [HttpGet("submissions")]
    public Task<PagedResult<SubmissionDto>> Submissions([FromQuery] AdminListQuery q) => _admin.GetSubmissionsAsync(q);

    [HttpPut("submissions/{id:int}/review")]
    public async Task<IActionResult> Review(int id, [FromBody] ReviewSubmissionRequest req)
    {
        await _admin.ReviewSubmissionsAsync(User.RequireUserId(), new[] { id }, req.Status, req.ReviewNote);
        return NoContent();
    }

    [HttpPost("submissions/bulk-review")]
    public async Task<IActionResult> BulkReview([FromBody] BulkReviewRequest req)
    {
        await _admin.ReviewSubmissionsAsync(User.RequireUserId(), req.Ids, req.Status, req.ReviewNote);
        return NoContent();
    }

    [HttpPost("submissions/bulk-delete")]
    public async Task<IActionResult> BulkDeleteSubmissions([FromBody] BulkIdsRequest req)
    {
        await _admin.DeleteSubmissionsAsync(req.Ids);
        return NoContent();
    }


    [HttpGet("feedback")]
    public Task<PagedResult<FeedbackDto>> Feedback([FromQuery] AdminListQuery q) => _admin.GetFeedbackAsync(q);

    [HttpPut("feedback/{id:int}")]
    public async Task<IActionResult> UpdateFeedback(int id, [FromBody] UpdateFeedbackStatusRequest req)
    {
        await _admin.UpdateFeedbackAsync(new[] { id }, req.Status, req.AdminNote);
        return NoContent();
    }

    [HttpPost("feedback/bulk-status")]
    public async Task<IActionResult> BulkFeedback([FromBody] BulkStatusRequest req)
    {
        await _admin.UpdateFeedbackAsync(req.Ids, req.Status, null);
        return NoContent();
    }

    [HttpPost("feedback/bulk-delete")]
    public async Task<IActionResult> BulkDeleteFeedback([FromBody] BulkIdsRequest req)
    {
        await _admin.DeleteFeedbackAsync(req.Ids);
        return NoContent();
    }


    [HttpGet("chatbot-queries")]
    public Task<PagedResult<ChatHistoryItemDto>> ChatbotQueries([FromQuery] AdminListQuery q) => _admin.GetChatbotQueriesAsync(q);


    [HttpPost("uploads")]
    [RequestSizeLimit(3 * 1024 * 1024)]
    public async Task<ActionResult<object>> Upload(IFormFile file, [FromQuery] string folder = "content")
    {
        var url = await _files.SaveImageAsync(file, folder);
        return Ok(new { url });
    }

    [HttpPost("upload-media")]
    [RequestSizeLimit(200 * 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = 200 * 1024 * 1024)]
    public async Task<ActionResult<object>> UploadMedia(IFormFile file, [FromQuery] string folder = "media")
    {
        var url = await _files.SaveMediaAsync(file, folder);
        return Ok(new { url });
    }
}
