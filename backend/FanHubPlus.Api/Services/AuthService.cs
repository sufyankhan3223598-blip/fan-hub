using FanHubPlus.Api.Common;
using FanHubPlus.Api.Data;
using FanHubPlus.Api.DTOs;
using FanHubPlus.Api.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace FanHubPlus.Api.Services;

public interface IAuthService
{
    Task<(AuthResponse Auth, string? DevLink)> RegisterAsync(RegisterRequest req, string? ip);
    Task<AuthResponse> LoginAsync(LoginRequest req, string? ip);
    Task<AuthResponse> RefreshAsync(string refreshToken, string? ip);
    Task LogoutAsync(string refreshToken);
    Task<MessageResponse> ForgotPasswordAsync(string email);
    Task<MessageResponse> ResetPasswordAsync(ResetPasswordRequest req);
    Task<MessageResponse> VerifyEmailAsync(string token);
    Task<MessageResponse> ResendVerificationAsync(int userId);
    Task<MessageResponse> ResendVerificationByEmailAsync(string email);
    Task<string> SendRegistrationOtpAsync(SendOtpRequest req);
    Task<AuthResponse> RegisterWithOtpAsync(RegisterWithOtpRequest req, string? ip);
    Task<string> SendVerificationOtpAsync(string email);
    Task<MessageResponse> VerifyOtpAsync(VerifyOtpRequest req);
    Task ChangePasswordAsync(int userId, ChangePasswordRequest req);
    Task<UserDto> GetUserAsync(int userId);
}

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly ITokenService _tokens;
    private readonly IEmailService _email;
    private readonly IActivityService _activity;
    private readonly IOtpService _otp;
    private readonly JwtSettings _jwt;
    private readonly AppSettings _app;
    private readonly IWebHostEnvironment _env;
    private readonly PasswordHasher<User> _hasher = new();

    public AuthService(AppDbContext db, ITokenService tokens, IEmailService email, IActivityService activity,
        IOtpService otp, IOptions<JwtSettings> jwt, IOptions<AppSettings> app, IWebHostEnvironment env)
    {
        _db = db; _tokens = tokens; _email = email; _activity = activity; _otp = otp; _jwt = jwt.Value; _app = app.Value; _env = env;
    }

    public async Task<(AuthResponse Auth, string? DevLink)> RegisterAsync(RegisterRequest req, string? ip)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        if (await _db.Users.AnyAsync(u => u.Email == email))
            throw new AppException("An account with this email already exists.", 409);

        var userRole = await _db.Roles.FirstAsync(r => r.Name == Roles.User);
        var user = new User { FullName = req.FullName.Trim(), Email = email, RoleId = userRole.Id, EmailVerified = false };
        user.PasswordHash = _hasher.HashPassword(user, req.Password);

        var validCats = await _db.Categories.Where(c => req.CategoryIds.Contains(c.Id)).Select(c => c.Id).ToListAsync();
        foreach (var cid in validCats) user.UserCategories.Add(new UserCategory { CategoryId = cid });

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var devLink = await SendVerificationAsync(user);

        _db.Notifications.Add(new Notification
        {
            UserId = user.Id, Title = "Verify Your Email Address",
            Message = $"We sent an email verification notification to {user.Email}. Click here to verify your account.",
            Url = devLink != null ? $"/verify-email?token={Uri.EscapeDataString(devLink.Split("token=")[1])}" : "/dashboard"
        });
        await _db.SaveChangesAsync();

        var auth = await IssueTokensAsync(user, userRole.Name, ip);
        await _activity.LogActivityAsync(user.Id, "Register", "Joined Fan Hub Plus");
        return (auth, devLink);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest req, string? ip)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Email == email);
        if (user == null) throw new AppException("Invalid email or password.", 401);

        var result = _hasher.VerifyHashedPassword(user, user.PasswordHash, req.Password);
        if (result == PasswordVerificationResult.Failed) throw new AppException("Invalid email or password.", 401);
        if (user.IsBlocked) throw new AppException("This account has been blocked. Please contact support.", 403);
        if (result == PasswordVerificationResult.SuccessRehashNeeded) user.PasswordHash = _hasher.HashPassword(user, req.Password);

        user.LastLoginAt = DateTime.UtcNow;
        user.LastActiveAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _activity.LogActivityAsync(user.Id, "Login", "Signed in");
        return await IssueTokensAsync(user, user.Role!.Name, ip);
    }

    public async Task<AuthResponse> RefreshAsync(string refreshToken, string? ip)
    {
        var hash = _tokens.Hash(refreshToken);
        var stored = await _db.RefreshTokens.Include(t => t.User).ThenInclude(u => u!.Role)
            .FirstOrDefaultAsync(t => t.TokenHash == hash);
        if (stored == null || stored.RevokedAt != null || stored.ExpiresAt <= DateTime.UtcNow)
            throw new AppException("Session expired. Please sign in again.", 401);
        if (stored.User!.IsBlocked) throw new AppException("This account has been blocked.", 403);


        var auth = await IssueTokensAsync(stored.User, stored.User.Role!.Name, ip);
        stored.RevokedAt = DateTime.UtcNow;
        stored.ReplacedByTokenHash = _tokens.Hash(auth.RefreshToken);
        stored.User.LastActiveAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return auth;
    }

    public async Task LogoutAsync(string refreshToken)
    {
        var hash = _tokens.Hash(refreshToken);
        var stored = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash);
        if (stored != null && stored.RevokedAt == null)
        {
            stored.RevokedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }
    }

    public async Task<MessageResponse> ForgotPasswordAsync(string email)
    {
        const string generic = "If an account exists for that email, a reset link has been sent.";
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email.Trim().ToLowerInvariant());
        if (user == null) return new MessageResponse(generic);

        var raw = _tokens.CreateRandomToken();
        _db.PasswordResetTokens.Add(new PasswordResetToken
        {
            UserId = user.Id, TokenHash = _tokens.Hash(raw), ExpiresAt = DateTime.UtcNow.AddMinutes(30)
        });
        await _db.SaveChangesAsync();

        var link = $"{_app.ClientUrl.TrimEnd('/')}/reset-password?token={Uri.EscapeDataString(raw)}";
        var sent = await _email.SendAsync(user.Email, "Reset your Fan Hub Plus password",
            EmailService.Template("Password reset", $"Hi {user.FullName}, click the button below to choose a new password. The link expires in 30 minutes.", "Reset password", link));
        return new MessageResponse(generic, !sent && _env.IsDevelopment() ? link : null);
    }

    public async Task<MessageResponse> ResetPasswordAsync(ResetPasswordRequest req)
    {
        var hash = _tokens.Hash(req.Token);
        var token = await _db.PasswordResetTokens.Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == hash);
        if (token == null || token.UsedAt != null || token.ExpiresAt <= DateTime.UtcNow)
            throw new AppException("This reset link is invalid or has expired.", 400);

        token.UsedAt = DateTime.UtcNow;
        token.User!.PasswordHash = _hasher.HashPassword(token.User, req.Password);


        var sessions = await _db.RefreshTokens.Where(r => r.UserId == token.UserId && r.RevokedAt == null).ToListAsync();
        foreach (var s in sessions) s.RevokedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _activity.LogActivityAsync(token.UserId, "Security", "Password was reset");
        return new MessageResponse("Your password has been reset. You can now sign in.");
    }

    public async Task<MessageResponse> VerifyEmailAsync(string rawToken)
    {
        var hash = _tokens.Hash(rawToken);
        var token = await _db.EmailVerificationTokens.Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == hash);
        if (token == null || token.UsedAt != null || token.ExpiresAt <= DateTime.UtcNow)
            throw new AppException("This verification link is invalid or has expired.", 400);
        token.UsedAt = DateTime.UtcNow;
        token.User!.EmailVerified = true;
        await _db.SaveChangesAsync();
        return new MessageResponse("Email verified. Welcome to the multiverse!");
    }

    public async Task<MessageResponse> ResendVerificationAsync(int userId)
    {
        var user = await _db.Users.FindAsync(userId) ?? throw new NotFoundException("User");
        if (user.EmailVerified) return new MessageResponse("Your email is already verified.");
        var link = await SendVerificationAsync(user);
        return new MessageResponse("A new verification link has been sent.", link);
    }

    public async Task<MessageResponse> ResendVerificationByEmailAsync(string email)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email.Trim().ToLowerInvariant());
        if (user == null) return new MessageResponse("If an account exists with this email, a verification link has been sent.");
        if (user.EmailVerified) return new MessageResponse("This email address is already verified.");
        var link = await SendVerificationAsync(user);
        return new MessageResponse("A verification notification and link have been sent to your email.", link);
    }

    public async Task<string> SendRegistrationOtpAsync(SendOtpRequest req)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
            throw new AppException("Please provide a valid email address.", 400);

        if (await _db.Users.AnyAsync(u => u.Email == email))
            throw new AppException("An account with this email already exists.", 409);

        var code = _otp.GenerateOtp(email);
        var sent = await _email.SendAsync(email, "Your Fan Hub Plus Verification Code",
            EmailService.OtpTemplate(code, req.FullName));

        if (!sent)
            throw new AppException("Failed to deliver verification code to your email. Please check your email or try again later.", 500);

        return "A 6-digit verification code has been sent to your email.";
    }

    public async Task<AuthResponse> RegisterWithOtpAsync(RegisterWithOtpRequest req, string? ip)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        if (await _db.Users.AnyAsync(u => u.Email == email))
            throw new AppException("An account with this email already exists.", 409);

        if (string.IsNullOrWhiteSpace(req.Otp) || !_otp.VerifyOtp(email, req.Otp))
            throw new AppException("Invalid or expired verification code. Please check your email and try again.", 400);

        var userRole = await _db.Roles.FirstAsync(r => r.Name == Roles.User);
        var user = new User
        {
            FullName = req.FullName.Trim(),
            Email = email,
            RoleId = userRole.Id,
            EmailVerified = true
        };
        user.PasswordHash = _hasher.HashPassword(user, req.Password);

        var validCats = await _db.Categories.Where(c => req.CategoryIds.Contains(c.Id)).Select(c => c.Id).ToListAsync();
        foreach (var cid in validCats) user.UserCategories.Add(new UserCategory { CategoryId = cid });

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        _db.Notifications.Add(new Notification
        {
            UserId = user.Id,
            Title = "Welcome to Fan Hub Plus",
            Message = "Your email is verified! Explore the eight realms and personalize your multiverse experience.",
            Url = "/dashboard"
        });
        await _db.SaveChangesAsync();

        var auth = await IssueTokensAsync(user, userRole.Name, ip);
        await _activity.LogActivityAsync(user.Id, "Register", "Joined and email verified via OTP");
        return auth;
    }

    public async Task<string> SendVerificationOtpAsync(string email)
    {
        var cleanEmail = email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == cleanEmail);
        if (user == null) return "If an account exists, a verification code has been sent.";
        if (user.EmailVerified) return "This account is already verified.";

        var code = _otp.GenerateOtp(cleanEmail);
        var sent = await _email.SendAsync(cleanEmail, "Your Fan Hub Plus Verification Code",
            EmailService.OtpTemplate(code, user.FullName));

        if (!sent)
            throw new AppException("Failed to deliver verification code to your email. Please try again later.", 500);

        return "A 6-digit verification code has been sent to your email.";
    }

    public async Task<MessageResponse> VerifyOtpAsync(VerifyOtpRequest req)
    {
        var cleanEmail = req.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == cleanEmail);
        if (user == null) throw new NotFoundException("User");
        if (user.EmailVerified) return new MessageResponse("Account is already verified.");

        if (!_otp.VerifyOtp(cleanEmail, req.Otp))
            throw new AppException("Invalid or expired verification code.", 400);

        user.EmailVerified = true;
        await _db.SaveChangesAsync();
        await _activity.LogActivityAsync(user.Id, "Security", "Email verified via OTP");
        return new MessageResponse("Email verified successfully. Welcome to the multiverse!");
    }

    public async Task ChangePasswordAsync(int userId, ChangePasswordRequest req)
    {
        var user = await _db.Users.FindAsync(userId) ?? throw new NotFoundException("User");
        if (_hasher.VerifyHashedPassword(user, user.PasswordHash, req.CurrentPassword) == PasswordVerificationResult.Failed)
            throw new AppException("Your current password is incorrect.");
        user.PasswordHash = _hasher.HashPassword(user, req.NewPassword);
        await _db.SaveChangesAsync();
        await _activity.LogActivityAsync(userId, "Security", "Changed password");
    }

    public async Task<UserDto> GetUserAsync(int userId)
    {
        var user = await _db.Users.AsNoTracking()
            .Include(u => u.Role)
            .Include(u => u.FavoriteFandoms)
            .Include(u => u.UserCategories).ThenInclude(uc => uc.Category)
            .FirstOrDefaultAsync(u => u.Id == userId) ?? throw new NotFoundException("User");
        return ToDto(user);
    }


    private async Task<string?> SendVerificationAsync(User user)
    {
        var raw = _tokens.CreateRandomToken();
        _db.EmailVerificationTokens.Add(new EmailVerificationToken
        {
            UserId = user.Id, TokenHash = _tokens.Hash(raw), ExpiresAt = DateTime.UtcNow.AddHours(24)
        });
        await _db.SaveChangesAsync();
        var link = $"{_app.ClientUrl.TrimEnd('/')}/verify-email?token={Uri.EscapeDataString(raw)}";
        var sent = await _email.SendAsync(user.Email, "Verify your Fan Hub Plus email",
            EmailService.Template("Confirm your email", $"Hi {user.FullName}, confirm your email address to secure your account.", "Verify email", link));
        return !sent && _env.IsDevelopment() ? link : null;
    }

    private async Task<AuthResponse> IssueTokensAsync(User user, string role, string? ip)
    {
        var (access, expires) = _tokens.CreateAccessToken(user, role);
        var refresh = _tokens.CreateRandomToken();
        _db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id, TokenHash = _tokens.Hash(refresh),
            ExpiresAt = DateTime.UtcNow.AddDays(_jwt.RefreshTokenDays), CreatedByIp = ip
        });
        await _db.SaveChangesAsync();
        return new AuthResponse { AccessToken = access, RefreshToken = refresh, ExpiresAt = expires, User = await GetUserAsync(user.Id) };
    }

    public static UserDto ToDto(User u) => new()
    {
        Id = u.Id,
        FullName = u.FullName,
        Email = u.Email,
        Role = u.Role?.Name ?? Roles.User,
        AvatarUrl = u.AvatarUrl,
        Bio = u.Bio,
        Theme = u.Theme,
        FontSize = u.FontSize,
        ReduceMotion = u.ReduceMotion,
        EmailNotifications = u.EmailNotifications,
        EmailVerified = u.EmailVerified,
        CreatedAt = u.CreatedAt,
        FavoriteFandoms = u.FavoriteFandoms.Select(f => f.Name).ToList(),
        Categories = u.UserCategories.Where(uc => uc.Category != null)
            .Select(uc => new CategoryLiteDto { Id = uc.Category!.Id, Name = uc.Category.Name, Slug = uc.Category.Slug, AccentColor = uc.Category.AccentColor })
            .ToList()
    };
}
