using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using FanHubPlus.Api.Common;
using FanHubPlus.Api.Data;
using FanHubPlus.Api.Entities;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using MimeKit;

namespace FanHubPlus.Api.Services;

public class JwtSettings
{
    public string Issuer { get; set; } = "FanHubPlus";
    public string Audience { get; set; } = "FanHubPlusClient";
    public string Key { get; set; } = string.Empty;
    public int AccessTokenMinutes { get; set; } = 30;
    public int RefreshTokenDays { get; set; } = 7;
}

public class SmtpSettings
{
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public string User { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string From { get; set; } = "no-reply@fanhubplus.com";
    public string FromName { get; set; } = "Fan Hub Plus";
    public bool UseSsl { get; set; } = false;
}

public class AppSettings
{

    public string ClientUrl { get; set; } = "http://localhost:4200";
}

public interface ITokenService
{
    (string Token, DateTime ExpiresAt) CreateAccessToken(User user, string role);
    string CreateRandomToken();
    string Hash(string value);
}

public class TokenService : ITokenService
{
    private readonly JwtSettings _jwt;
    public TokenService(IOptions<JwtSettings> jwt) => _jwt = jwt.Value;

    public (string Token, DateTime ExpiresAt) CreateAccessToken(User user, string role)
    {
        var expires = DateTime.UtcNow.AddMinutes(_jwt.AccessTokenMinutes);
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.Role, role),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N"))
        };
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Key));
        var token = new JwtSecurityToken(
            issuer: _jwt.Issuer,
            audience: _jwt.Audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: expires,
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));
        return (new JwtSecurityTokenHandler().WriteToken(token), expires);
    }


    public string CreateRandomToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(48);
        return Convert.ToBase64String(bytes).Replace('+', '-').Replace('/', '_').TrimEnd('=');
    }


    public string Hash(string value) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
}

public interface IEmailService
{

    Task<bool> SendAsync(string to, string subject, string html);
}

public class EmailService : IEmailService
{
    private readonly SmtpSettings _smtp;
    private readonly ILogger<EmailService> _logger;
    private readonly IWebHostEnvironment _env;

    public EmailService(IOptions<SmtpSettings> smtp, ILogger<EmailService> logger, IWebHostEnvironment env)
    {
        _smtp = smtp.Value; _logger = logger; _env = env;
    }

    public async Task<bool> SendAsync(string to, string subject, string html)
    {
        if (string.IsNullOrWhiteSpace(_smtp.Host))
        {
            var dir = Path.Combine(_env.ContentRootPath, "App_Data", "emails");
            Directory.CreateDirectory(dir);
            var file = Path.Combine(dir, $"{DateTime.UtcNow:yyyyMMdd-HHmmss}-{Slug.Create(subject)}.html");
            await File.WriteAllTextAsync(file, $"To: {to} | Subject: {subject}\n{html}");
            _logger.LogInformation("SMTP not configured. Email to {To} saved to {File}", to, file);
            return false;
        }

        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_smtp.FromName, _smtp.From));
            message.To.Add(MailboxAddress.Parse(to));
            message.Subject = subject;
            var plainText = System.Text.RegularExpressions.Regex.Replace(html, "<[^>]*>", " ").Trim();
            message.Body = new BodyBuilder { HtmlBody = html, TextBody = plainText }.ToMessageBody();

            using var client = new SmtpClient();
            client.CheckCertificateRevocation = false;
            client.ServerCertificateValidationCallback = (s, c, h, e) => true;
            await client.ConnectAsync(_smtp.Host, _smtp.Port, _smtp.UseSsl ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls);
            if (!string.IsNullOrEmpty(_smtp.User))
                await client.AuthenticateAsync(_smtp.User, _smtp.Password);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
            _logger.LogInformation("Email sent successfully via MailKit to {To}", to);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "MailKit failed to send email to {To}. Attempting fallback with System.Net.Mail...", to);
            try
            {
                using var sysSmtp = new System.Net.Mail.SmtpClient(_smtp.Host, _smtp.Port);
                sysSmtp.EnableSsl = true;
                sysSmtp.Credentials = new System.Net.NetworkCredential(_smtp.User, _smtp.Password);
                var sysMsg = new System.Net.Mail.MailMessage(_smtp.From, to, subject, html) { IsBodyHtml = true };
                await sysSmtp.SendMailAsync(sysMsg);
                _logger.LogInformation("Fallback email sent successfully via System.Net.Mail to {To}", to);
                return true;
            }
            catch (Exception sysEx)
            {
                _logger.LogError(sysEx, "All email send attempts failed for {To}", to);
                return false;
            }
        }
    }

    public static string Template(string title, string body, string buttonText, string link) => $@"
<div style=""background:#07070C;padding:32px;font-family:Arial,sans-serif;color:#e5e7eb"">
  <div style=""max-width:520px;margin:auto;background:#0E0E16;border:1px solid #2a2a3a;border-radius:16px;padding:32px"">
    <h2 style=""color:#F5C86A;letter-spacing:2px;margin-top:0"">FAN HUB PLUS</h2>
    <h3 style=""color:#fff"">{title}</h3>
    <p style=""line-height:1.6"">{body}</p>
    <p><a href=""{link}"" style=""display:inline-block;background:#D4AF37;color:#07070C;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:bold"">{buttonText}</a></p>
    <p style=""font-size:12px;color:#9ca3af"">If the button does not work, copy this link: {link}</p>
  </div>
</div>";

    public static string OtpTemplate(string otp, string? name) => $@"
<div style=""background:#07070C;padding:32px;font-family:Arial,sans-serif;color:#e5e7eb"">
  <div style=""max-width:520px;margin:auto;background:#0E0E16;border:1px solid #2a2a3a;border-radius:16px;padding:32px;text-align:center"">
    <h2 style=""color:#F5C86A;letter-spacing:2px;margin-top:0"">FAN HUB PLUS</h2>
    <h3 style=""color:#ffffff;font-size:22px"">Email Verification Code</h3>
    <p style=""line-height:1.6;color:#d1d5db"">Hi {name ?? "Fan"}, enter the 6-digit verification code below to confirm your email address and activate your account:</p>
    <div style=""margin:24px auto;padding:16px;background:#14141e;border:2px dashed #F5C86A;border-radius:12px;font-size:36px;font-weight:900;letter-spacing:10px;color:#F5C86A;display:inline-block"">
      {otp}
    </div>
    <p style=""font-size:13px;color:#9ca3af;margin-top:20px"">This verification code is valid for <strong>15 minutes</strong>. If you did not request this, please disregard this email.</p>
  </div>
</div>";
}

public interface IOtpService
{
    string GenerateOtp(string email);
    bool VerifyOtp(string email, string otp);
    string? GetDevOtp(string email);
}

public class OtpService : IOtpService
{
    private class OtpEntry
    {
        public string Code { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
    }

    private readonly System.Collections.Concurrent.ConcurrentDictionary<string, OtpEntry> _otps = new(StringComparer.OrdinalIgnoreCase);

    public string GenerateOtp(string email)
    {
        var code = System.Security.Cryptography.RandomNumberGenerator.GetInt32(100000, 1000000).ToString("D6");
        _otps[email.Trim().ToLowerInvariant()] = new OtpEntry
        {
            Code = code,
            ExpiresAt = DateTime.UtcNow.AddMinutes(15)
        };
        return code;
    }

    public bool VerifyOtp(string email, string otp)
    {
        var key = email.Trim().ToLowerInvariant();
        if (_otps.TryGetValue(key, out var entry))
        {
            if (entry.ExpiresAt > DateTime.UtcNow && string.Equals(entry.Code, otp.Trim(), StringComparison.Ordinal))
            {
                _otps.TryRemove(key, out _);
                return true;
            }
        }
        return false;
    }

    public string? GetDevOtp(string email)
    {
        var key = email.Trim().ToLowerInvariant();
        if (_otps.TryGetValue(key, out var entry) && entry.ExpiresAt > DateTime.UtcNow)
        {
            return entry.Code;
        }
        return null;
    }
}

public interface IFileStorageService
{
    Task<string> SaveImageAsync(IFormFile file, string folder);
}

public class FileStorageService : IFileStorageService
{
    private static readonly string[] Allowed = { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
    private const long MaxBytes = 2 * 1024 * 1024;
    private readonly IWebHostEnvironment _env;

    public FileStorageService(IWebHostEnvironment env) => _env = env;

    public async Task<string> SaveImageAsync(IFormFile file, string folder)
    {
        if (file.Length == 0) throw new AppException("The file is empty.");
        if (file.Length > MaxBytes) throw new AppException("Images must be 2 MB or smaller.");
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!Allowed.Contains(ext) || !file.ContentType.StartsWith("image/"))
            throw new AppException("Only JPG, PNG, WEBP or GIF images are allowed.");


        await using (var peek = file.OpenReadStream())
        {
            var header = new byte[12];
            var read = await peek.ReadAsync(header.AsMemory(0, 12));
            if (read < 4 || !LooksLikeImage(header)) throw new AppException("The uploaded file is not a valid image.");
        }

        var root = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
        var dir = Path.Combine(root, "uploads", Slug.Create(folder));
        Directory.CreateDirectory(dir);
        var name = $"{Guid.NewGuid():N}{ext}";
        await using var stream = File.Create(Path.Combine(dir, name));
        await file.CopyToAsync(stream);
        return $"/uploads/{Slug.Create(folder)}/{name}";
    }

    private static bool LooksLikeImage(byte[] h) =>
        (h[0] == 0xFF && h[1] == 0xD8) ||
        (h[0] == 0x89 && h[1] == 0x50 && h[2] == 0x4E && h[3] == 0x47) ||
        (h[0] == 0x47 && h[1] == 0x49 && h[2] == 0x46) ||
        (h[0] == 0x52 && h[1] == 0x49 && h[2] == 0x46 && h[3] == 0x46 && h[8] == 0x57 && h[9] == 0x45);
}

public interface IActivityService
{
    Task LogViewAsync(int? userId, string itemType, int itemId, int? categoryId);
    Task LogActivityAsync(int userId, string type, string description, string? itemType = null, int? itemId = null, string? url = null);
    Task NotifyAsync(int userId, string title, string message, string? url = null);
}

public class ActivityService : IActivityService
{
    private readonly AppDbContext _db;
    public ActivityService(AppDbContext db) => _db = db;

    public async Task LogViewAsync(int? userId, string itemType, int itemId, int? categoryId)
    {
        _db.ViewLogs.Add(new ViewLog { UserId = userId, ItemType = itemType, ItemId = itemId, CategoryId = categoryId });
        if (userId.HasValue)
        {
            var user = await _db.Users.FindAsync(userId.Value);
            if (user != null) user.LastActiveAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync();
    }

    public async Task LogActivityAsync(int userId, string type, string description, string? itemType = null, int? itemId = null, string? url = null)
    {
        _db.UserActivities.Add(new UserActivity
        {
            UserId = userId, ActivityType = type, Description = description.Length > 300 ? description[..300] : description,
            ItemType = itemType, ItemId = itemId, Url = url
        });
        await _db.SaveChangesAsync();
    }

    public async Task NotifyAsync(int userId, string title, string message, string? url = null)
    {
        _db.Notifications.Add(new Notification { UserId = userId, Title = title, Message = message, Url = url });
        await _db.SaveChangesAsync();
    }
}
