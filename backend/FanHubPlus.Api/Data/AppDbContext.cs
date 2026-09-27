using FanHubPlus.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace FanHubPlus.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Role> Roles => Set<Role>();
    public DbSet<User> Users => Set<User>();
    public DbSet<UserCategory> UserCategories => Set<UserCategory>();
    public DbSet<UserFavoriteFandom> UserFavoriteFandoms => Set<UserFavoriteFandom>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
    public DbSet<EmailVerificationToken> EmailVerificationTokens => Set<EmailVerificationToken>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Genre> Genres => Set<Genre>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<Content> Contents => Set<Content>();
    public DbSet<ContentGenre> ContentGenres => Set<ContentGenre>();
    public DbSet<ContentTag> ContentTags => Set<ContentTag>();
    public DbSet<MediaItem> MediaItems => Set<MediaItem>();
    public DbSet<MediaTag> MediaTags => Set<MediaTag>();
    public DbSet<CharacterProfile> CharacterProfiles => Set<CharacterProfile>();
    public DbSet<Article> Articles => Set<Article>();
    public DbSet<ArticleTimelineItem> ArticleTimelineItems => Set<ArticleTimelineItem>();
    public DbSet<MerchandiseItem> MerchandiseItems => Set<MerchandiseItem>();
    public DbSet<MerchandiseImage> MerchandiseImages => Set<MerchandiseImage>();
    public DbSet<MerchandiseTag> MerchandiseTags => Set<MerchandiseTag>();
    public DbSet<UpcomingRelease> UpcomingReleases => Set<UpcomingRelease>();
    public DbSet<UpcomingReleaseTag> UpcomingReleaseTags => Set<UpcomingReleaseTag>();
    public DbSet<Event> Events => Set<Event>();
    public DbSet<Bookmark> Bookmarks => Set<Bookmark>();
    public DbSet<Rating> Ratings => Set<Rating>();
    public DbSet<ChatbotFaq> ChatbotFaqs => Set<ChatbotFaq>();
    public DbSet<ChatbotQuery> ChatbotQueries => Set<ChatbotQuery>();
    public DbSet<Feedback> Feedback => Set<Feedback>();
    public DbSet<FanSubmission> FanSubmissions => Set<FanSubmission>();
    public DbSet<ViewLog> ViewLogs => Set<ViewLog>();
    public DbSet<UserActivity> UserActivities => Set<UserActivity>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);


        b.Entity<Role>(e =>
        {
            e.ToTable("Roles");
            e.Property(x => x.Name).HasMaxLength(50).IsRequired();
            e.HasIndex(x => x.Name).IsUnique();
        });

        b.Entity<User>(e =>
        {
            e.ToTable("Users");
            e.Property(x => x.FullName).HasMaxLength(100).IsRequired();
            e.Property(x => x.Email).HasMaxLength(256).IsRequired();
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.PasswordHash).HasMaxLength(500).IsRequired();
            e.Property(x => x.AvatarUrl).HasMaxLength(500);
            e.Property(x => x.Bio).HasMaxLength(500);
            e.Property(x => x.Theme).HasMaxLength(10);
            e.Property(x => x.FontSize).HasMaxLength(10);
            e.HasOne(x => x.Role).WithMany(r => r.Users).HasForeignKey(x => x.RoleId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<UserCategory>(e =>
        {
            e.ToTable("UserCategories");
            e.HasKey(x => new { x.UserId, x.CategoryId });
            e.HasOne(x => x.User).WithMany(u => u.UserCategories).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Category).WithMany().HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<UserFavoriteFandom>(e =>
        {
            e.ToTable("UserFavoriteFandoms");
            e.Property(x => x.Name).HasMaxLength(100).IsRequired();
            e.HasOne(x => x.User).WithMany(u => u.FavoriteFandoms).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<RefreshToken>(e =>
        {
            e.ToTable("RefreshTokens");
            e.Ignore(x => x.IsActive);
            e.Property(x => x.TokenHash).HasMaxLength(128).IsRequired();
            e.Property(x => x.ReplacedByTokenHash).HasMaxLength(128);
            e.Property(x => x.CreatedByIp).HasMaxLength(64);
            e.HasIndex(x => x.TokenHash);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<PasswordResetToken>(e =>
        {
            e.ToTable("PasswordResetTokens");
            e.Property(x => x.TokenHash).HasMaxLength(128).IsRequired();
            e.HasIndex(x => x.TokenHash);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<EmailVerificationToken>(e =>
        {
            e.ToTable("EmailVerificationTokens");
            e.Property(x => x.TokenHash).HasMaxLength(128).IsRequired();
            e.HasIndex(x => x.TokenHash);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });


        b.Entity<Category>(e =>
        {
            e.ToTable("Categories");
            e.Property(x => x.Name).HasMaxLength(50).IsRequired();
            e.Property(x => x.Slug).HasMaxLength(50).IsRequired();
            e.HasIndex(x => x.Slug).IsUnique();
            e.Property(x => x.Tagline).HasMaxLength(150);
            e.Property(x => x.Description).HasMaxLength(1000);
            e.Property(x => x.AccentColor).HasMaxLength(20);
            e.Property(x => x.SecondaryColor).HasMaxLength(20);
            e.Property(x => x.Icon).HasMaxLength(50);
            e.Property(x => x.ImageUrl).HasMaxLength(500);
            e.Property(x => x.HoverImageUrl).HasMaxLength(500);
        });

        b.Entity<Genre>(e =>
        {
            e.ToTable("Genres");
            e.Property(x => x.Name).HasMaxLength(50).IsRequired();
            e.Property(x => x.Slug).HasMaxLength(50).IsRequired();
            e.HasIndex(x => x.Name).IsUnique();
            e.HasIndex(x => x.Slug).IsUnique();
        });

        b.Entity<Tag>(e =>
        {
            e.ToTable("Tags");
            e.Property(x => x.Name).HasMaxLength(50).IsRequired();
            e.Property(x => x.Slug).HasMaxLength(50).IsRequired();
            e.Property(x => x.Color).HasMaxLength(20);
            e.HasIndex(x => x.Name).IsUnique();
        });

        b.Entity<Content>(e =>
        {
            e.ToTable("Contents");
            e.Property(x => x.Title).HasMaxLength(200).IsRequired();
            e.Property(x => x.Slug).HasMaxLength(220).IsRequired();
            e.HasIndex(x => x.Slug).IsUnique();
            e.Property(x => x.ContentType).HasMaxLength(20);
            e.Property(x => x.Format).HasMaxLength(30);
            e.Property(x => x.Synopsis).HasMaxLength(1000);
            e.Property(x => x.Creator).HasMaxLength(150);
            e.Property(x => x.TrailerUrl).HasMaxLength(500);
            e.Property(x => x.ImageUrl).HasMaxLength(500);
            e.Property(x => x.HoverImageUrl).HasMaxLength(500);
            e.Property(x => x.BannerUrl).HasMaxLength(500);
            e.Property(x => x.AverageRating).HasPrecision(3, 2);
            e.HasIndex(x => new { x.CategoryId, x.ReleaseYear });
            e.HasIndex(x => x.PopularityScore);
            e.HasOne(x => x.Category).WithMany().HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<ContentGenre>(e =>
        {
            e.ToTable("ContentGenres");
            e.HasKey(x => new { x.ContentId, x.GenreId });
            e.HasOne(x => x.Content).WithMany(c => c.ContentGenres).HasForeignKey(x => x.ContentId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Genre).WithMany().HasForeignKey(x => x.GenreId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<ContentTag>(e =>
        {
            e.ToTable("ContentTags");
            e.HasKey(x => new { x.ContentId, x.TagId });
            e.HasOne(x => x.Content).WithMany(c => c.ContentTags).HasForeignKey(x => x.ContentId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Tag).WithMany().HasForeignKey(x => x.TagId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<MediaItem>(e =>
        {
            e.ToTable("MediaItems");
            e.Property(x => x.Title).HasMaxLength(200).IsRequired();
            e.Property(x => x.MediaType).HasMaxLength(30);
            e.Property(x => x.EmbedType).HasMaxLength(20);
            e.Property(x => x.Url).HasMaxLength(500).IsRequired();
            e.Property(x => x.Description).HasMaxLength(1000);
            e.Property(x => x.ImageUrl).HasMaxLength(500);
            e.Property(x => x.HoverImageUrl).HasMaxLength(500);
            e.Property(x => x.AverageRating).HasPrecision(3, 2);
            e.HasOne(x => x.Category).WithMany().HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Content).WithMany().HasForeignKey(x => x.ContentId).OnDelete(DeleteBehavior.NoAction);
        });

        b.Entity<MediaTag>(e =>
        {
            e.ToTable("MediaTags");
            e.HasKey(x => new { x.MediaItemId, x.TagId });
            e.HasOne(x => x.MediaItem).WithMany(m => m.MediaTags).HasForeignKey(x => x.MediaItemId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Tag).WithMany().HasForeignKey(x => x.TagId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<CharacterProfile>(e =>
        {
            e.ToTable("CharacterProfiles");
            e.Property(x => x.Name).HasMaxLength(120).IsRequired();
            e.Property(x => x.Slug).HasMaxLength(140).IsRequired();
            e.HasIndex(x => x.Slug).IsUnique();
            e.Property(x => x.Fandom).HasMaxLength(120);
            e.Property(x => x.Role).HasMaxLength(60);
            e.Property(x => x.Power).HasMaxLength(150);
            e.Property(x => x.Quote).HasMaxLength(300);
            e.Property(x => x.Bio).HasMaxLength(2000);
            e.Property(x => x.ImageUrl).HasMaxLength(500);
            e.Property(x => x.HoverImageUrl).HasMaxLength(500);
            e.HasOne(x => x.Category).WithMany().HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Content).WithMany().HasForeignKey(x => x.ContentId).OnDelete(DeleteBehavior.NoAction);
        });

        b.Entity<Article>(e =>
        {
            e.ToTable("Articles");
            e.Property(x => x.Title).HasMaxLength(200).IsRequired();
            e.Property(x => x.Slug).HasMaxLength(220).IsRequired();
            e.HasIndex(x => x.Slug).IsUnique();
            e.Property(x => x.Excerpt).HasMaxLength(500);
            e.Property(x => x.ImageUrl).HasMaxLength(500);
            e.Property(x => x.HoverImageUrl).HasMaxLength(500);
            e.Property(x => x.Status).HasMaxLength(20);
            e.HasOne(x => x.Category).WithMany().HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(x => x.Author).WithMany().HasForeignKey(x => x.AuthorId).OnDelete(DeleteBehavior.SetNull);
        });

        b.Entity<ArticleTimelineItem>(e =>
        {
            e.ToTable("ArticleTimelineItems");
            e.Property(x => x.DateLabel).HasMaxLength(50);
            e.Property(x => x.Title).HasMaxLength(150);
            e.Property(x => x.Description).HasMaxLength(500);
            e.HasOne(x => x.Article).WithMany(a => a.TimelineItems).HasForeignKey(x => x.ArticleId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<MerchandiseItem>(e =>
        {
            e.ToTable("MerchandiseItems");
            e.Property(x => x.Name).HasMaxLength(200).IsRequired();
            e.Property(x => x.Slug).HasMaxLength(220).IsRequired();
            e.HasIndex(x => x.Slug).IsUnique();
            e.Property(x => x.Fandom).HasMaxLength(120);
            e.Property(x => x.Manufacturer).HasMaxLength(120);
            e.Property(x => x.Description).HasMaxLength(1000);
            e.Property(x => x.ImageUrl).HasMaxLength(500);
            e.Property(x => x.HoverImageUrl).HasMaxLength(500);
            e.HasOne(x => x.Category).WithMany().HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<MerchandiseImage>(e =>
        {
            e.ToTable("MerchandiseImages");
            e.Property(x => x.ImageUrl).HasMaxLength(500).IsRequired();
            e.Property(x => x.Caption).HasMaxLength(200);
            e.HasOne(x => x.MerchandiseItem).WithMany(m => m.Images).HasForeignKey(x => x.MerchandiseItemId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<MerchandiseTag>(e =>
        {
            e.ToTable("MerchandiseTags");
            e.HasKey(x => new { x.MerchandiseItemId, x.TagId });
            e.HasOne(x => x.MerchandiseItem).WithMany(m => m.MerchandiseTags).HasForeignKey(x => x.MerchandiseItemId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Tag).WithMany().HasForeignKey(x => x.TagId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<UpcomingRelease>(e =>
        {
            e.ToTable("UpcomingReleases");
            e.Property(x => x.Title).HasMaxLength(200).IsRequired();
            e.Property(x => x.ReleaseType).HasMaxLength(30);
            e.Property(x => x.Studio).HasMaxLength(150);
            e.Property(x => x.Description).HasMaxLength(1000);
            e.Property(x => x.ImageUrl).HasMaxLength(500);
            e.Property(x => x.HoverImageUrl).HasMaxLength(500);
            e.Property(x => x.ExternalUrl).HasMaxLength(500);
            e.HasIndex(x => x.ReleaseDate);
            e.HasOne(x => x.Category).WithMany().HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<UpcomingReleaseTag>(e =>
        {
            e.ToTable("UpcomingReleaseTags");
            e.HasKey(x => new { x.UpcomingReleaseId, x.TagId });
            e.HasOne(x => x.UpcomingRelease).WithMany(u => u.UpcomingReleaseTags).HasForeignKey(x => x.UpcomingReleaseId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Tag).WithMany().HasForeignKey(x => x.TagId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Event>(e =>
        {
            e.ToTable("Events");
            e.Property(x => x.Title).HasMaxLength(200).IsRequired();
            e.Property(x => x.Slug).HasMaxLength(220).IsRequired();
            e.HasIndex(x => x.Slug).IsUnique();
            e.Property(x => x.EventType).HasMaxLength(30);
            e.Property(x => x.Description).HasMaxLength(1000);
            e.Property(x => x.City).HasMaxLength(100);
            e.Property(x => x.Country).HasMaxLength(100);
            e.Property(x => x.Venue).HasMaxLength(200);
            e.Property(x => x.TicketUrl).HasMaxLength(500);
            e.Property(x => x.ImageUrl).HasMaxLength(500);
            e.Property(x => x.HoverImageUrl).HasMaxLength(500);
            e.HasIndex(x => new { x.City, x.StartDate });
            e.HasOne(x => x.Category).WithMany().HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.SetNull);
        });


        b.Entity<Bookmark>(e =>
        {
            e.ToTable("Bookmarks");
            e.Property(x => x.ItemType).HasMaxLength(30).IsRequired();
            e.Property(x => x.Title).HasMaxLength(200);
            e.Property(x => x.ImageUrl).HasMaxLength(500);
            e.Property(x => x.Url).HasMaxLength(500);
            e.Property(x => x.Note).HasMaxLength(1000);
            e.HasIndex(x => new { x.UserId, x.ItemType, x.ItemId }).IsUnique();
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Rating>(e =>
        {
            e.ToTable("Ratings");
            e.Property(x => x.ItemType).HasMaxLength(30).IsRequired();
            e.HasIndex(x => new { x.UserId, x.ItemType, x.ItemId }).IsUnique();
            e.HasIndex(x => new { x.ItemType, x.ItemId });
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<ChatbotFaq>(e =>
        {
            e.ToTable("ChatbotFaqs");
            e.Property(x => x.Category).HasMaxLength(50);
            e.Property(x => x.Question).HasMaxLength(300).IsRequired();
            e.Property(x => x.Answer).HasMaxLength(2000).IsRequired();
            e.Property(x => x.Keywords).HasMaxLength(500);
        });

        b.Entity<ChatbotQuery>(e =>
        {
            e.ToTable("ChatbotQueries");
            e.Property(x => x.SessionId).HasMaxLength(64);
            e.Property(x => x.Message).HasMaxLength(1000);
            e.Property(x => x.Intent).HasMaxLength(50);
            e.HasIndex(x => x.SessionId);
            e.HasIndex(x => x.CreatedAt);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.SetNull);
        });

        b.Entity<Feedback>(e =>
        {
            e.ToTable("Feedback");
            e.Property(x => x.Name).HasMaxLength(100);
            e.Property(x => x.Email).HasMaxLength(256);
            e.Property(x => x.Type).HasMaxLength(20);
            e.Property(x => x.Subject).HasMaxLength(200);
            e.Property(x => x.Message).HasMaxLength(2000);
            e.Property(x => x.PageUrl).HasMaxLength(500);
            e.Property(x => x.Status).HasMaxLength(20);
            e.Property(x => x.AdminNote).HasMaxLength(1000);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.SetNull);
        });

        b.Entity<FanSubmission>(e =>
        {
            e.ToTable("FanSubmissions");
            e.Property(x => x.Title).HasMaxLength(200).IsRequired();
            e.Property(x => x.SubmissionType).HasMaxLength(30);
            e.Property(x => x.Summary).HasMaxLength(500);
            e.Property(x => x.ImageUrl).HasMaxLength(500);
            e.Property(x => x.Status).HasMaxLength(20);
            e.Property(x => x.ReviewNote).HasMaxLength(1000);
            e.HasIndex(x => x.Status);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.ReviewedBy).WithMany().HasForeignKey(x => x.ReviewedById).OnDelete(DeleteBehavior.NoAction);
            e.HasOne(x => x.Category).WithMany().HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
        });

        b.Entity<ViewLog>(e =>
        {
            e.ToTable("ViewLogs");
            e.Property(x => x.ItemType).HasMaxLength(30).IsRequired();
            e.HasIndex(x => x.ViewedAt);
            e.HasIndex(x => new { x.ItemType, x.ItemId });
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.SetNull);
        });

        b.Entity<UserActivity>(e =>
        {
            e.ToTable("UserActivities");
            e.Property(x => x.ActivityType).HasMaxLength(30);
            e.Property(x => x.Description).HasMaxLength(300);
            e.Property(x => x.ItemType).HasMaxLength(30);
            e.Property(x => x.Url).HasMaxLength(500);
            e.HasIndex(x => new { x.UserId, x.CreatedAt });
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        b.Entity<Notification>(e =>
        {
            e.ToTable("Notifications");
            e.Property(x => x.Title).HasMaxLength(150);
            e.Property(x => x.Message).HasMaxLength(500);
            e.Property(x => x.Url).HasMaxLength(500);
            e.HasIndex(x => new { x.UserId, x.IsRead });
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
