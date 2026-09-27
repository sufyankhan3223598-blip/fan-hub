using FanHubPlus.Api.Common;
using FanHubPlus.Api.DTOs;
using FanHubPlus.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace FanHubPlus.Api.Controllers;

[ApiController]
[Route("api/auth")]
[EnableRateLimiting("auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;
    public AuthController(IAuthService auth) => _auth = auth;

    private string? Ip => HttpContext.Connection.RemoteIpAddress?.ToString();

    [HttpPost("register")]
    public async Task<ActionResult<object>> Register([FromBody] RegisterRequest req)
    {
        var (auth, devLink) = await _auth.RegisterAsync(req, Ip);
        return Ok(new { auth.AccessToken, auth.RefreshToken, auth.ExpiresAt, auth.User, devLink });
    }

    [HttpPost("send-registration-otp")]
    public async Task<ActionResult<MessageResponse>> SendRegistrationOtp([FromBody] SendOtpRequest req)
    {
        var message = await _auth.SendRegistrationOtpAsync(req);
        return Ok(new MessageResponse(message));
    }

    [HttpPost("register-with-otp")]
    public Task<AuthResponse> RegisterWithOtp([FromBody] RegisterWithOtpRequest req) => _auth.RegisterWithOtpAsync(req, Ip);

    [HttpPost("send-verification-otp")]
    public async Task<ActionResult<MessageResponse>> SendVerificationOtp([FromBody] ForgotPasswordRequest req)
    {
        var message = await _auth.SendVerificationOtpAsync(req.Email);
        return Ok(new MessageResponse(message));
    }

    [HttpPost("verify-otp")]
    public Task<MessageResponse> VerifyOtp([FromBody] VerifyOtpRequest req) => _auth.VerifyOtpAsync(req);

    [HttpPost("login")]
    public Task<AuthResponse> Login([FromBody] LoginRequest req) => _auth.LoginAsync(req, Ip);

    [HttpPost("refresh")]
    public Task<AuthResponse> Refresh([FromBody] RefreshRequest req) => _auth.RefreshAsync(req.RefreshToken, Ip);

    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] RefreshRequest req)
    {
        await _auth.LogoutAsync(req.RefreshToken);
        return NoContent();
    }

    [HttpPost("forgot-password")]
    public Task<MessageResponse> Forgot([FromBody] ForgotPasswordRequest req) => _auth.ForgotPasswordAsync(req.Email);

    [HttpPost("reset-password")]
    public Task<MessageResponse> Reset([FromBody] ResetPasswordRequest req) => _auth.ResetPasswordAsync(req);

    [HttpPost("verify-email")]
    public Task<MessageResponse> Verify([FromBody] VerifyEmailRequest req) => _auth.VerifyEmailAsync(req.Token);

    [HttpPost("resend-verification-email")]
    public Task<MessageResponse> ResendByEmail([FromBody] ForgotPasswordRequest req) => _auth.ResendVerificationByEmailAsync(req.Email);

    [Authorize]
    [HttpPost("resend-verification")]
    public Task<MessageResponse> Resend() => _auth.ResendVerificationAsync(User.RequireUserId());

    [Authorize]
    [HttpGet("me")]
    public Task<UserDto> Me() => _auth.GetUserAsync(User.RequireUserId());

    [Authorize]
    [HttpPut("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req)
    {
        await _auth.ChangePasswordAsync(User.RequireUserId(), req);
        return NoContent();
    }
}
