using FanHubPlus.Api.DTOs;
using FluentValidation;

namespace FanHubPlus.Api.Validators;

public static class Rules
{

    public static IRuleBuilderOptions<T, string> StrongPassword<T>(this IRuleBuilder<T, string> rule) =>
        rule.NotEmpty().MinimumLength(8).MaximumLength(100)
            .Matches("[A-Z]").WithMessage("Password must contain an uppercase letter.")
            .Matches("[a-z]").WithMessage("Password must contain a lowercase letter.")
            .Matches("[0-9]").WithMessage("Password must contain a number.")
            .Matches("[^a-zA-Z0-9]").WithMessage("Password must contain a symbol.");
}

public class RegisterValidator : AbstractValidator<RegisterRequest>
{
    public RegisterValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MinimumLength(2).MaximumLength(100);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Password).StrongPassword();
        RuleFor(x => x.ConfirmPassword).Equal(x => x.Password).WithMessage("Passwords do not match.");
    }
}

public class LoginValidator : AbstractValidator<LoginRequest>
{
    public LoginValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public class ForgotValidator : AbstractValidator<ForgotPasswordRequest>
{
    public ForgotValidator() => RuleFor(x => x.Email).NotEmpty().EmailAddress();
}

public class ResetValidator : AbstractValidator<ResetPasswordRequest>
{
    public ResetValidator()
    {
        RuleFor(x => x.Token).NotEmpty();
        RuleFor(x => x.Password).StrongPassword();
        RuleFor(x => x.ConfirmPassword).Equal(x => x.Password).WithMessage("Passwords do not match.");
    }
}

public class ChangePasswordValidator : AbstractValidator<ChangePasswordRequest>
{
    public ChangePasswordValidator()
    {
        RuleFor(x => x.CurrentPassword).NotEmpty();
        RuleFor(x => x.NewPassword).StrongPassword().NotEqual(x => x.CurrentPassword).WithMessage("Choose a different password.");
    }
}

public class FeedbackValidator : AbstractValidator<CreateFeedbackRequest>
{
    public FeedbackValidator()
    {
        RuleFor(x => x.Type).Must(t => t is "Bug" or "Suggestion" or "Query").WithMessage("Type must be Bug, Suggestion or Query.");
        RuleFor(x => x.Subject).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Message).NotEmpty().MinimumLength(10).MaximumLength(2000);
    }
}

public class SubmissionValidator : AbstractValidator<CreateSubmissionRequest>
{
    public SubmissionValidator()
    {
        RuleFor(x => x.CategoryId).GreaterThan(0);
        RuleFor(x => x.Title).NotEmpty().MinimumLength(5).MaximumLength(200);
        RuleFor(x => x.SubmissionType).Must(t => t is "Article" or "Fan Art" or "Cosplay" or "Theory" or "Review");
        RuleFor(x => x.Summary).NotEmpty().MaximumLength(500);
        RuleFor(x => x.Body).NotEmpty().MinimumLength(30);
    }
}

public class ProfileValidator : AbstractValidator<UpdateProfileRequest>
{
    public ProfileValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MinimumLength(2).MaximumLength(100);
        RuleFor(x => x.Bio).MaximumLength(500);
        RuleFor(x => x.FavoriteFandoms).Must(f => f.Count <= 20).WithMessage("Up to 20 favorite fandoms.");
    }
}

public class BookmarkValidator : AbstractValidator<CreateBookmarkRequest>
{
    public BookmarkValidator()
    {
        RuleFor(x => x.ItemType).NotEmpty();
        RuleFor(x => x.ItemId).GreaterThan(0);
        RuleFor(x => x.Note).MaximumLength(1000);
    }
}

public class ChatValidator : AbstractValidator<ChatRequest>
{
    public ChatValidator()
    {
        RuleFor(x => x.Message).NotEmpty().MaximumLength(1000);
        RuleFor(x => x.SessionId).MaximumLength(64);
    }
}

public class AdminContentValidator : AbstractValidator<AdminContentDto>
{
    public AdminContentValidator()
    {
        RuleFor(x => x.CategoryId).GreaterThan(0);
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.ContentType).Must(t => t is "Article" or "Video" or "Audio" or "Image");
        RuleFor(x => x.Synopsis).NotEmpty().MaximumLength(1000);
        RuleFor(x => x.ReleaseYear).InclusiveBetween(1900, 2100);
        RuleFor(x => x.ImageUrl).NotEmpty();
    }
}

public class AdminMediaValidator : AbstractValidator<AdminMediaDto>
{
    public AdminMediaValidator()
    {
        RuleFor(x => x.CategoryId).GreaterThan(0);
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Url).NotEmpty().MaximumLength(500);
        RuleFor(x => x.ImageUrl).NotEmpty();
    }
}

public class AdminCharacterValidator : AbstractValidator<AdminCharacterDto>
{
    public AdminCharacterValidator()
    {
        RuleFor(x => x.CategoryId).GreaterThan(0);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Fandom).NotEmpty();
        RuleFor(x => x.ImageUrl).NotEmpty();
    }
}

public class AdminArticleValidator : AbstractValidator<AdminArticleDto>
{
    public AdminArticleValidator()
    {
        RuleFor(x => x.CategoryId).GreaterThan(0);
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Excerpt).NotEmpty().MaximumLength(500);
        RuleFor(x => x.Body).NotEmpty();
        RuleFor(x => x.ImageUrl).NotEmpty();
    }
}

public class AdminMerchValidator : AbstractValidator<AdminMerchDto>
{
    public AdminMerchValidator()
    {
        RuleFor(x => x.CategoryId).GreaterThan(0);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.ImageUrl).NotEmpty();
    }
}

public class AdminUpcomingValidator : AbstractValidator<AdminUpcomingDto>
{
    public AdminUpcomingValidator()
    {
        RuleFor(x => x.CategoryId).GreaterThan(0);
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.ReleaseType).NotEmpty();
        RuleFor(x => x.ImageUrl).NotEmpty();
    }
}

public class AdminEventValidator : AbstractValidator<AdminEventDto>
{
    public AdminEventValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.City).NotEmpty();
        RuleFor(x => x.Latitude).InclusiveBetween(-90, 90);
        RuleFor(x => x.Longitude).InclusiveBetween(-180, 180);
        RuleFor(x => x.EndDate).GreaterThanOrEqualTo(x => x.StartDate);
        RuleFor(x => x.ImageUrl).NotEmpty();
    }
}

public class AdminFaqValidator : AbstractValidator<AdminFaqDto>
{
    public AdminFaqValidator()
    {
        RuleFor(x => x.Question).NotEmpty().MaximumLength(300);
        RuleFor(x => x.Answer).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.Keywords).NotEmpty().MaximumLength(500);
    }
}

public class AdminCategoryValidator : AbstractValidator<AdminCategoryDto>
{
    public AdminCategoryValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(50);
        RuleFor(x => x.AccentColor).Matches("^#[0-9A-Fa-f]{6}$");
        RuleFor(x => x.SecondaryColor).Matches("^#[0-9A-Fa-f]{6}$");
    }
}
