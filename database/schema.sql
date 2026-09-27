/* =====================================================================
   FAN HUB PLUS - DATABASE SCHEMA (Microsoft SQL Server)
   Mirrors the EF Core model in backend/FanHubPlus.Api/Data/AppDbContext.cs
   Usage (SSMS / sqlcmd):
     1) CREATE DATABASE FanHubPlus;   (or let this script create it)
     2) run schema.sql
     3) run seed.sql
   ===================================================================== */
IF DB_ID(N'FanHubPlus') IS NULL
    CREATE DATABASE FanHubPlus;
GO
USE FanHubPlus;
GO

/* ------------------------------------------------ IDENTITY & ACCESS */
CREATE TABLE Roles (
    Id    INT IDENTITY(1,1) CONSTRAINT PK_Roles PRIMARY KEY,
    Name  NVARCHAR(50) NOT NULL
);
CREATE UNIQUE INDEX IX_Roles_Name ON Roles(Name);

CREATE TABLE Users (
    Id                 INT IDENTITY(1,1) CONSTRAINT PK_Users PRIMARY KEY,
    FullName           NVARCHAR(100) NOT NULL,
    Email              NVARCHAR(256) NOT NULL,
    PasswordHash       NVARCHAR(500) NOT NULL,
    RoleId             INT NOT NULL CONSTRAINT FK_Users_Roles_RoleId REFERENCES Roles(Id),
    AvatarUrl          NVARCHAR(500) NULL,
    Bio                NVARCHAR(500) NULL,
    Theme              NVARCHAR(10) NOT NULL CONSTRAINT DF_Users_Theme DEFAULT N'dark',
    FontSize           NVARCHAR(10) NOT NULL CONSTRAINT DF_Users_FontSize DEFAULT N'md',
    ReduceMotion       BIT NOT NULL CONSTRAINT DF_Users_ReduceMotion DEFAULT 0,
    EmailNotifications BIT NOT NULL CONSTRAINT DF_Users_EmailNotifications DEFAULT 1,
    EmailVerified      BIT NOT NULL CONSTRAINT DF_Users_EmailVerified DEFAULT 0,
    IsBlocked          BIT NOT NULL CONSTRAINT DF_Users_IsBlocked DEFAULT 0,
    CreatedAt          DATETIME2 NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT SYSUTCDATETIME(),
    LastLoginAt        DATETIME2 NULL,
    LastActiveAt       DATETIME2 NULL
);
CREATE UNIQUE INDEX IX_Users_Email ON Users(Email);
CREATE INDEX IX_Users_RoleId ON Users(RoleId);

CREATE TABLE RefreshTokens (
    Id                  INT IDENTITY(1,1) CONSTRAINT PK_RefreshTokens PRIMARY KEY,
    UserId              INT NOT NULL CONSTRAINT FK_RefreshTokens_Users_UserId REFERENCES Users(Id) ON DELETE CASCADE,
    TokenHash           NVARCHAR(128) NOT NULL,
    ExpiresAt           DATETIME2 NOT NULL,
    CreatedAt           DATETIME2 NOT NULL,
    RevokedAt           DATETIME2 NULL,
    ReplacedByTokenHash NVARCHAR(128) NULL,
    CreatedByIp         NVARCHAR(64) NULL
);
CREATE INDEX IX_RefreshTokens_TokenHash ON RefreshTokens(TokenHash);
CREATE INDEX IX_RefreshTokens_UserId ON RefreshTokens(UserId);

CREATE TABLE PasswordResetTokens (
    Id         INT IDENTITY(1,1) CONSTRAINT PK_PasswordResetTokens PRIMARY KEY,
    UserId     INT NOT NULL CONSTRAINT FK_PasswordResetTokens_Users_UserId REFERENCES Users(Id) ON DELETE CASCADE,
    TokenHash  NVARCHAR(128) NOT NULL,
    ExpiresAt  DATETIME2 NOT NULL,
    UsedAt     DATETIME2 NULL,
    CreatedAt  DATETIME2 NOT NULL
);
CREATE INDEX IX_PasswordResetTokens_TokenHash ON PasswordResetTokens(TokenHash);
CREATE INDEX IX_PasswordResetTokens_UserId ON PasswordResetTokens(UserId);

CREATE TABLE EmailVerificationTokens (
    Id         INT IDENTITY(1,1) CONSTRAINT PK_EmailVerificationTokens PRIMARY KEY,
    UserId     INT NOT NULL CONSTRAINT FK_EmailVerificationTokens_Users_UserId REFERENCES Users(Id) ON DELETE CASCADE,
    TokenHash  NVARCHAR(128) NOT NULL,
    ExpiresAt  DATETIME2 NOT NULL,
    UsedAt     DATETIME2 NULL,
    CreatedAt  DATETIME2 NOT NULL
);
CREATE INDEX IX_EmailVerificationTokens_TokenHash ON EmailVerificationTokens(TokenHash);
CREATE INDEX IX_EmailVerificationTokens_UserId ON EmailVerificationTokens(UserId);
GO

/* ------------------------------------------------ LOOKUPS */
CREATE TABLE Categories (
    Id             INT IDENTITY(1,1) CONSTRAINT PK_Categories PRIMARY KEY,
    Name           NVARCHAR(50) NOT NULL,
    Slug           NVARCHAR(50) NOT NULL,
    Tagline        NVARCHAR(150) NOT NULL,
    Description    NVARCHAR(1000) NOT NULL,
    AccentColor    NVARCHAR(20) NOT NULL,
    SecondaryColor NVARCHAR(20) NOT NULL,
    Icon           NVARCHAR(50) NOT NULL,
    ImageUrl       NVARCHAR(500) NOT NULL,
    HoverImageUrl  NVARCHAR(500) NOT NULL,
    SortOrder      INT NOT NULL
);
CREATE UNIQUE INDEX IX_Categories_Slug ON Categories(Slug);

CREATE TABLE UserCategories (
    UserId     INT NOT NULL CONSTRAINT FK_UserCategories_Users_UserId REFERENCES Users(Id) ON DELETE CASCADE,
    CategoryId INT NOT NULL CONSTRAINT FK_UserCategories_Categories_CategoryId REFERENCES Categories(Id) ON DELETE CASCADE,
    CONSTRAINT PK_UserCategories PRIMARY KEY (UserId, CategoryId)
);
CREATE INDEX IX_UserCategories_CategoryId ON UserCategories(CategoryId);

CREATE TABLE UserFavoriteFandoms (
    Id     INT IDENTITY(1,1) CONSTRAINT PK_UserFavoriteFandoms PRIMARY KEY,
    UserId INT NOT NULL CONSTRAINT FK_UserFavoriteFandoms_Users_UserId REFERENCES Users(Id) ON DELETE CASCADE,
    Name   NVARCHAR(100) NOT NULL
);
CREATE INDEX IX_UserFavoriteFandoms_UserId ON UserFavoriteFandoms(UserId);

CREATE TABLE Genres (
    Id   INT IDENTITY(1,1) CONSTRAINT PK_Genres PRIMARY KEY,
    Name NVARCHAR(50) NOT NULL,
    Slug NVARCHAR(50) NOT NULL
);
CREATE UNIQUE INDEX IX_Genres_Name ON Genres(Name);
CREATE UNIQUE INDEX IX_Genres_Slug ON Genres(Slug);

CREATE TABLE Tags (
    Id    INT IDENTITY(1,1) CONSTRAINT PK_Tags PRIMARY KEY,
    Name  NVARCHAR(50) NOT NULL,
    Slug  NVARCHAR(50) NOT NULL,
    Color NVARCHAR(20) NOT NULL
);
CREATE UNIQUE INDEX IX_Tags_Name ON Tags(Name);
GO

/* ------------------------------------------------ CONTENT */
CREATE TABLE Contents (
    Id              INT IDENTITY(1,1) CONSTRAINT PK_Contents PRIMARY KEY,
    CategoryId      INT NOT NULL CONSTRAINT FK_Contents_Categories_CategoryId REFERENCES Categories(Id),
    Title           NVARCHAR(200) NOT NULL,
    Slug            NVARCHAR(220) NOT NULL,
    ContentType     NVARCHAR(20) NOT NULL,   -- Article | Video | Audio | Image
    Format          NVARCHAR(30) NOT NULL,   -- Series | Film | Game | Album ...
    Synopsis        NVARCHAR(1000) NOT NULL,
    Description     NVARCHAR(MAX) NOT NULL,
    ReleaseYear     INT NOT NULL,
    Creator         NVARCHAR(150) NOT NULL,
    Seasons         INT NULL,
    Episodes        INT NULL,
    TrailerUrl      NVARCHAR(500) NULL,
    ImageUrl        NVARCHAR(500) NOT NULL,
    HoverImageUrl   NVARCHAR(500) NOT NULL,
    BannerUrl       NVARCHAR(500) NOT NULL,
    PopularityScore INT NOT NULL CONSTRAINT DF_Contents_Popularity DEFAULT 0,
    ViewCount       INT NOT NULL CONSTRAINT DF_Contents_ViewCount DEFAULT 0,
    AverageRating   DECIMAL(3,2) NOT NULL CONSTRAINT DF_Contents_AverageRating DEFAULT 0,
    RatingCount     INT NOT NULL CONSTRAINT DF_Contents_RatingCount DEFAULT 0,
    LikeCount       INT NOT NULL CONSTRAINT DF_Contents_LikeCount DEFAULT 0,
    DislikeCount    INT NOT NULL CONSTRAINT DF_Contents_DislikeCount DEFAULT 0,
    IsFeatured      BIT NOT NULL CONSTRAINT DF_Contents_IsFeatured DEFAULT 0,
    IsPublished     BIT NOT NULL CONSTRAINT DF_Contents_IsPublished DEFAULT 1,
    CreatedAt       DATETIME2 NOT NULL CONSTRAINT DF_Contents_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt       DATETIME2 NULL
);
CREATE UNIQUE INDEX IX_Contents_Slug ON Contents(Slug);
CREATE INDEX IX_Contents_CategoryId_ReleaseYear ON Contents(CategoryId, ReleaseYear);
CREATE INDEX IX_Contents_PopularityScore ON Contents(PopularityScore);

CREATE TABLE ContentGenres (
    ContentId INT NOT NULL CONSTRAINT FK_ContentGenres_Contents_ContentId REFERENCES Contents(Id) ON DELETE CASCADE,
    GenreId   INT NOT NULL CONSTRAINT FK_ContentGenres_Genres_GenreId REFERENCES Genres(Id) ON DELETE CASCADE,
    CONSTRAINT PK_ContentGenres PRIMARY KEY (ContentId, GenreId)
);
CREATE INDEX IX_ContentGenres_GenreId ON ContentGenres(GenreId);

CREATE TABLE ContentTags (
    ContentId INT NOT NULL CONSTRAINT FK_ContentTags_Contents_ContentId REFERENCES Contents(Id) ON DELETE CASCADE,
    TagId     INT NOT NULL CONSTRAINT FK_ContentTags_Tags_TagId REFERENCES Tags(Id) ON DELETE CASCADE,
    CONSTRAINT PK_ContentTags PRIMARY KEY (ContentId, TagId)
);
CREATE INDEX IX_ContentTags_TagId ON ContentTags(TagId);

CREATE TABLE MediaItems (
    Id              INT IDENTITY(1,1) CONSTRAINT PK_MediaItems PRIMARY KEY,
    CategoryId      INT NOT NULL CONSTRAINT FK_MediaItems_Categories_CategoryId REFERENCES Categories(Id),
    ContentId       INT NULL CONSTRAINT FK_MediaItems_Contents_ContentId REFERENCES Contents(Id),
    Title           NVARCHAR(200) NOT NULL,
    MediaType       NVARCHAR(30) NOT NULL,   -- Video | Trailer | Explainer | Soundtrack | Podcast
    EmbedType       NVARCHAR(20) NOT NULL,   -- file | youtube
    Url             NVARCHAR(500) NOT NULL,
    DurationSeconds INT NOT NULL,
    Description     NVARCHAR(1000) NOT NULL,
    ImageUrl        NVARCHAR(500) NOT NULL,
    HoverImageUrl   NVARCHAR(500) NOT NULL,
    ViewCount       INT NOT NULL CONSTRAINT DF_MediaItems_ViewCount DEFAULT 0,
    PopularityScore INT NOT NULL CONSTRAINT DF_MediaItems_Popularity DEFAULT 0,
    AverageRating   DECIMAL(3,2) NOT NULL CONSTRAINT DF_MediaItems_AverageRating DEFAULT 0,
    RatingCount     INT NOT NULL CONSTRAINT DF_MediaItems_RatingCount DEFAULT 0,
    LikeCount       INT NOT NULL CONSTRAINT DF_MediaItems_LikeCount DEFAULT 0,
    DislikeCount    INT NOT NULL CONSTRAINT DF_MediaItems_DislikeCount DEFAULT 0,
    IsPublished     BIT NOT NULL CONSTRAINT DF_MediaItems_IsPublished DEFAULT 1,
    CreatedAt       DATETIME2 NOT NULL CONSTRAINT DF_MediaItems_CreatedAt DEFAULT SYSUTCDATETIME()
);
CREATE INDEX IX_MediaItems_CategoryId ON MediaItems(CategoryId);
CREATE INDEX IX_MediaItems_ContentId ON MediaItems(ContentId);

CREATE TABLE MediaTags (
    MediaItemId INT NOT NULL CONSTRAINT FK_MediaTags_MediaItems_MediaItemId REFERENCES MediaItems(Id) ON DELETE CASCADE,
    TagId       INT NOT NULL CONSTRAINT FK_MediaTags_Tags_TagId REFERENCES Tags(Id) ON DELETE CASCADE,
    CONSTRAINT PK_MediaTags PRIMARY KEY (MediaItemId, TagId)
);
CREATE INDEX IX_MediaTags_TagId ON MediaTags(TagId);

CREATE TABLE CharacterProfiles (
    Id              INT IDENTITY(1,1) CONSTRAINT PK_CharacterProfiles PRIMARY KEY,
    CategoryId      INT NOT NULL CONSTRAINT FK_CharacterProfiles_Categories_CategoryId REFERENCES Categories(Id),
    ContentId       INT NULL CONSTRAINT FK_CharacterProfiles_Contents_ContentId REFERENCES Contents(Id),
    Name            NVARCHAR(120) NOT NULL,
    Slug            NVARCHAR(140) NOT NULL,
    Fandom          NVARCHAR(120) NOT NULL,
    Role            NVARCHAR(60) NOT NULL,
    Power           NVARCHAR(150) NOT NULL,
    Quote           NVARCHAR(300) NOT NULL,
    Bio             NVARCHAR(2000) NOT NULL,
    Strength        INT NOT NULL,
    Intelligence    INT NOT NULL,
    Agility         INT NOT NULL,
    Charisma        INT NOT NULL,
    ImageUrl        NVARCHAR(500) NOT NULL,
    HoverImageUrl   NVARCHAR(500) NOT NULL,
    ViewCount       INT NOT NULL CONSTRAINT DF_CharacterProfiles_ViewCount DEFAULT 0,
    PopularityScore INT NOT NULL CONSTRAINT DF_CharacterProfiles_Popularity DEFAULT 0,
    CreatedAt       DATETIME2 NOT NULL CONSTRAINT DF_CharacterProfiles_CreatedAt DEFAULT SYSUTCDATETIME()
);
CREATE UNIQUE INDEX IX_CharacterProfiles_Slug ON CharacterProfiles(Slug);
CREATE INDEX IX_CharacterProfiles_CategoryId ON CharacterProfiles(CategoryId);
CREATE INDEX IX_CharacterProfiles_ContentId ON CharacterProfiles(ContentId);

CREATE TABLE Articles (
    Id              INT IDENTITY(1,1) CONSTRAINT PK_Articles PRIMARY KEY,
    CategoryId      INT NOT NULL CONSTRAINT FK_Articles_Categories_CategoryId REFERENCES Categories(Id),
    AuthorId        INT NULL CONSTRAINT FK_Articles_Users_AuthorId REFERENCES Users(Id) ON DELETE SET NULL,
    Title           NVARCHAR(200) NOT NULL,
    Slug            NVARCHAR(220) NOT NULL,
    Excerpt         NVARCHAR(500) NOT NULL,
    Body            NVARCHAR(MAX) NOT NULL,
    ImageUrl        NVARCHAR(500) NOT NULL,
    HoverImageUrl   NVARCHAR(500) NOT NULL,
    ReadMinutes     INT NOT NULL,
    IsFeatured      BIT NOT NULL CONSTRAINT DF_Articles_IsFeatured DEFAULT 0,
    Status          NVARCHAR(20) NOT NULL CONSTRAINT DF_Articles_Status DEFAULT N'Published',
    ViewCount       INT NOT NULL CONSTRAINT DF_Articles_ViewCount DEFAULT 0,
    PopularityScore INT NOT NULL CONSTRAINT DF_Articles_Popularity DEFAULT 0,
    PublishedAt     DATETIME2 NOT NULL,
    CreatedAt       DATETIME2 NOT NULL CONSTRAINT DF_Articles_CreatedAt DEFAULT SYSUTCDATETIME()
);
CREATE UNIQUE INDEX IX_Articles_Slug ON Articles(Slug);
CREATE INDEX IX_Articles_CategoryId ON Articles(CategoryId);
CREATE INDEX IX_Articles_AuthorId ON Articles(AuthorId);

CREATE TABLE ArticleTimelineItems (
    Id          INT IDENTITY(1,1) CONSTRAINT PK_ArticleTimelineItems PRIMARY KEY,
    ArticleId   INT NOT NULL CONSTRAINT FK_ArticleTimelineItems_Articles_ArticleId REFERENCES Articles(Id) ON DELETE CASCADE,
    DateLabel   NVARCHAR(50) NOT NULL,
    Title       NVARCHAR(150) NOT NULL,
    Description NVARCHAR(500) NOT NULL,
    SortOrder   INT NOT NULL
);
CREATE INDEX IX_ArticleTimelineItems_ArticleId ON ArticleTimelineItems(ArticleId);
GO

/* ------------------------------------------------ MERCHANDISE (display only) */
CREATE TABLE MerchandiseItems (
    Id              INT IDENTITY(1,1) CONSTRAINT PK_MerchandiseItems PRIMARY KEY,
    CategoryId      INT NOT NULL CONSTRAINT FK_MerchandiseItems_Categories_CategoryId REFERENCES Categories(Id),
    Name            NVARCHAR(200) NOT NULL,
    Slug            NVARCHAR(220) NOT NULL,
    Fandom          NVARCHAR(120) NOT NULL,
    Manufacturer    NVARCHAR(120) NOT NULL,
    Description     NVARCHAR(1000) NOT NULL,
    ImageUrl        NVARCHAR(500) NOT NULL,
    HoverImageUrl   NVARCHAR(500) NOT NULL,
    IsUpcoming      BIT NOT NULL CONSTRAINT DF_MerchandiseItems_IsUpcoming DEFAULT 0,
    ViewCount       INT NOT NULL CONSTRAINT DF_MerchandiseItems_ViewCount DEFAULT 0,
    PopularityScore INT NOT NULL CONSTRAINT DF_MerchandiseItems_Popularity DEFAULT 0,
    CreatedAt       DATETIME2 NOT NULL CONSTRAINT DF_MerchandiseItems_CreatedAt DEFAULT SYSUTCDATETIME()
);
CREATE UNIQUE INDEX IX_MerchandiseItems_Slug ON MerchandiseItems(Slug);
CREATE INDEX IX_MerchandiseItems_CategoryId ON MerchandiseItems(CategoryId);

CREATE TABLE MerchandiseImages (
    Id                INT IDENTITY(1,1) CONSTRAINT PK_MerchandiseImages PRIMARY KEY,
    MerchandiseItemId INT NOT NULL CONSTRAINT FK_MerchandiseImages_MerchandiseItems_MerchandiseItemId REFERENCES MerchandiseItems(Id) ON DELETE CASCADE,
    ImageUrl          NVARCHAR(500) NOT NULL,
    Caption           NVARCHAR(200) NOT NULL,
    SortOrder         INT NOT NULL
);
CREATE INDEX IX_MerchandiseImages_MerchandiseItemId ON MerchandiseImages(MerchandiseItemId);

CREATE TABLE MerchandiseTags (
    MerchandiseItemId INT NOT NULL CONSTRAINT FK_MerchandiseTags_MerchandiseItems_MerchandiseItemId REFERENCES MerchandiseItems(Id) ON DELETE CASCADE,
    TagId             INT NOT NULL CONSTRAINT FK_MerchandiseTags_Tags_TagId REFERENCES Tags(Id) ON DELETE CASCADE,
    CONSTRAINT PK_MerchandiseTags PRIMARY KEY (MerchandiseItemId, TagId)
);
CREATE INDEX IX_MerchandiseTags_TagId ON MerchandiseTags(TagId);

CREATE TABLE UpcomingReleases (
    Id              INT IDENTITY(1,1) CONSTRAINT PK_UpcomingReleases PRIMARY KEY,
    CategoryId      INT NOT NULL CONSTRAINT FK_UpcomingReleases_Categories_CategoryId REFERENCES Categories(Id),
    Title           NVARCHAR(200) NOT NULL,
    ReleaseType     NVARCHAR(30) NOT NULL,
    ReleaseDate     DATETIME2 NOT NULL,
    IsDateConfirmed BIT NOT NULL,
    Studio          NVARCHAR(150) NOT NULL,
    Description     NVARCHAR(1000) NOT NULL,
    ImageUrl        NVARCHAR(500) NOT NULL,
    HoverImageUrl   NVARCHAR(500) NOT NULL,
    ExternalUrl     NVARCHAR(500) NULL,
    ViewCount       INT NOT NULL CONSTRAINT DF_UpcomingReleases_ViewCount DEFAULT 0,
    CreatedAt       DATETIME2 NOT NULL CONSTRAINT DF_UpcomingReleases_CreatedAt DEFAULT SYSUTCDATETIME()
);
CREATE INDEX IX_UpcomingReleases_ReleaseDate ON UpcomingReleases(ReleaseDate);
CREATE INDEX IX_UpcomingReleases_CategoryId ON UpcomingReleases(CategoryId);

CREATE TABLE UpcomingReleaseTags (
    UpcomingReleaseId INT NOT NULL CONSTRAINT FK_UpcomingReleaseTags_UpcomingReleases_UpcomingReleaseId REFERENCES UpcomingReleases(Id) ON DELETE CASCADE,
    TagId             INT NOT NULL CONSTRAINT FK_UpcomingReleaseTags_Tags_TagId REFERENCES Tags(Id) ON DELETE CASCADE,
    CONSTRAINT PK_UpcomingReleaseTags PRIMARY KEY (UpcomingReleaseId, TagId)
);
CREATE INDEX IX_UpcomingReleaseTags_TagId ON UpcomingReleaseTags(TagId);
GO

/* ------------------------------------------------ EVENTS */
CREATE TABLE Events (
    Id            INT IDENTITY(1,1) CONSTRAINT PK_Events PRIMARY KEY,
    CategoryId    INT NULL CONSTRAINT FK_Events_Categories_CategoryId REFERENCES Categories(Id) ON DELETE SET NULL,
    Title         NVARCHAR(200) NOT NULL,
    Slug          NVARCHAR(220) NOT NULL,
    EventType     NVARCHAR(30) NOT NULL,   -- Convention | Meetup | Screening | Premiere | Release
    Description   NVARCHAR(1000) NOT NULL,
    Story         NVARCHAR(MAX) NOT NULL,
    City          NVARCHAR(100) NOT NULL,
    Country       NVARCHAR(100) NOT NULL,
    Venue         NVARCHAR(200) NOT NULL,
    Latitude      FLOAT NOT NULL,
    Longitude     FLOAT NOT NULL,
    StartDate     DATETIME2 NOT NULL,
    EndDate       DATETIME2 NOT NULL,
    TicketUrl     NVARCHAR(500) NOT NULL,
    ImageUrl      NVARCHAR(500) NOT NULL,
    HoverImageUrl NVARCHAR(500) NOT NULL,
    IsHighlight   BIT NOT NULL CONSTRAINT DF_Events_IsHighlight DEFAULT 0,
    ViewCount     INT NOT NULL CONSTRAINT DF_Events_ViewCount DEFAULT 0,
    CreatedAt     DATETIME2 NOT NULL CONSTRAINT DF_Events_CreatedAt DEFAULT SYSUTCDATETIME()
);
CREATE UNIQUE INDEX IX_Events_Slug ON Events(Slug);
CREATE INDEX IX_Events_City_StartDate ON Events(City, StartDate);
CREATE INDEX IX_Events_CategoryId ON Events(CategoryId);
GO

/* ------------------------------------------------ COMMUNITY */
CREATE TABLE Bookmarks (
    Id        INT IDENTITY(1,1) CONSTRAINT PK_Bookmarks PRIMARY KEY,
    UserId    INT NOT NULL CONSTRAINT FK_Bookmarks_Users_UserId REFERENCES Users(Id) ON DELETE CASCADE,
    ItemType  NVARCHAR(30) NOT NULL,   -- Content | Character | Media | Merchandise | Article | Event
    ItemId    INT NOT NULL,
    Title     NVARCHAR(200) NOT NULL,
    ImageUrl  NVARCHAR(500) NOT NULL,
    Url       NVARCHAR(500) NOT NULL,
    Note      NVARCHAR(1000) NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Bookmarks_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL
);
CREATE UNIQUE INDEX IX_Bookmarks_UserId_ItemType_ItemId ON Bookmarks(UserId, ItemType, ItemId);

CREATE TABLE Ratings (
    Id        INT IDENTITY(1,1) CONSTRAINT PK_Ratings PRIMARY KEY,
    UserId    INT NOT NULL CONSTRAINT FK_Ratings_Users_UserId REFERENCES Users(Id) ON DELETE CASCADE,
    ItemType  NVARCHAR(30) NOT NULL,   -- Content | Media
    ItemId    INT NOT NULL,
    Stars     INT NULL CONSTRAINT CK_Ratings_Stars CHECK (Stars BETWEEN 1 AND 5),
    Thumb     INT NOT NULL CONSTRAINT CK_Ratings_Thumb CHECK (Thumb IN (-1, 0, 1)),
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Ratings_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL
);
CREATE UNIQUE INDEX IX_Ratings_UserId_ItemType_ItemId ON Ratings(UserId, ItemType, ItemId);
CREATE INDEX IX_Ratings_ItemType_ItemId ON Ratings(ItemType, ItemId);

CREATE TABLE ChatbotFaqs (
    Id        INT IDENTITY(1,1) CONSTRAINT PK_ChatbotFaqs PRIMARY KEY,
    Category  NVARCHAR(50) NOT NULL,
    Question  NVARCHAR(300) NOT NULL,
    Answer    NVARCHAR(2000) NOT NULL,
    Keywords  NVARCHAR(500) NOT NULL,
    IsActive  BIT NOT NULL CONSTRAINT DF_ChatbotFaqs_IsActive DEFAULT 1,
    SortOrder INT NOT NULL CONSTRAINT DF_ChatbotFaqs_SortOrder DEFAULT 0,
    HitCount  INT NOT NULL CONSTRAINT DF_ChatbotFaqs_HitCount DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_ChatbotFaqs_CreatedAt DEFAULT SYSUTCDATETIME()
);

CREATE TABLE ChatbotQueries (
    Id        INT IDENTITY(1,1) CONSTRAINT PK_ChatbotQueries PRIMARY KEY,
    UserId    INT NULL CONSTRAINT FK_ChatbotQueries_Users_UserId REFERENCES Users(Id) ON DELETE SET NULL,
    SessionId NVARCHAR(64) NOT NULL,
    Message   NVARCHAR(1000) NOT NULL,
    Response  NVARCHAR(MAX) NOT NULL,
    Intent    NVARCHAR(50) NOT NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_ChatbotQueries_CreatedAt DEFAULT SYSUTCDATETIME()
);
CREATE INDEX IX_ChatbotQueries_SessionId ON ChatbotQueries(SessionId);
CREATE INDEX IX_ChatbotQueries_CreatedAt ON ChatbotQueries(CreatedAt);
CREATE INDEX IX_ChatbotQueries_UserId ON ChatbotQueries(UserId);

CREATE TABLE Feedback (
    Id        INT IDENTITY(1,1) CONSTRAINT PK_Feedback PRIMARY KEY,
    UserId    INT NULL CONSTRAINT FK_Feedback_Users_UserId REFERENCES Users(Id) ON DELETE SET NULL,
    Name      NVARCHAR(100) NOT NULL,
    Email     NVARCHAR(256) NOT NULL,
    Type      NVARCHAR(20) NOT NULL CONSTRAINT CK_Feedback_Type CHECK (Type IN (N'Bug', N'Suggestion', N'Query')),
    Subject   NVARCHAR(200) NOT NULL,
    Message   NVARCHAR(2000) NOT NULL,
    PageUrl   NVARCHAR(500) NULL,
    Status    NVARCHAR(20) NOT NULL CONSTRAINT DF_Feedback_Status DEFAULT N'Open',
    AdminNote NVARCHAR(1000) NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Feedback_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL
);
CREATE INDEX IX_Feedback_UserId ON Feedback(UserId);

CREATE TABLE FanSubmissions (
    Id             INT IDENTITY(1,1) CONSTRAINT PK_FanSubmissions PRIMARY KEY,
    UserId         INT NOT NULL CONSTRAINT FK_FanSubmissions_Users_UserId REFERENCES Users(Id) ON DELETE CASCADE,
    CategoryId     INT NOT NULL CONSTRAINT FK_FanSubmissions_Categories_CategoryId REFERENCES Categories(Id),
    Title          NVARCHAR(200) NOT NULL,
    SubmissionType NVARCHAR(30) NOT NULL,
    Summary        NVARCHAR(500) NOT NULL,
    Body           NVARCHAR(MAX) NOT NULL,
    ImageUrl       NVARCHAR(500) NULL,
    Status         NVARCHAR(20) NOT NULL CONSTRAINT DF_FanSubmissions_Status DEFAULT N'Pending',
    ReviewNote     NVARCHAR(1000) NULL,
    ReviewedById   INT NULL CONSTRAINT FK_FanSubmissions_Users_ReviewedById REFERENCES Users(Id),
    ReviewedAt     DATETIME2 NULL,
    ViewCount      INT NOT NULL CONSTRAINT DF_FanSubmissions_ViewCount DEFAULT 0,
    CreatedAt      DATETIME2 NOT NULL CONSTRAINT DF_FanSubmissions_CreatedAt DEFAULT SYSUTCDATETIME()
);
CREATE INDEX IX_FanSubmissions_Status ON FanSubmissions(Status);
CREATE INDEX IX_FanSubmissions_UserId ON FanSubmissions(UserId);
CREATE INDEX IX_FanSubmissions_CategoryId ON FanSubmissions(CategoryId);
CREATE INDEX IX_FanSubmissions_ReviewedById ON FanSubmissions(ReviewedById);

CREATE TABLE ViewLogs (
    Id         INT IDENTITY(1,1) CONSTRAINT PK_ViewLogs PRIMARY KEY,
    UserId     INT NULL CONSTRAINT FK_ViewLogs_Users_UserId REFERENCES Users(Id) ON DELETE SET NULL,
    ItemType   NVARCHAR(30) NOT NULL,
    ItemId     INT NOT NULL,
    CategoryId INT NULL,
    ViewedAt   DATETIME2 NOT NULL CONSTRAINT DF_ViewLogs_ViewedAt DEFAULT SYSUTCDATETIME()
);
CREATE INDEX IX_ViewLogs_ViewedAt ON ViewLogs(ViewedAt);
CREATE INDEX IX_ViewLogs_ItemType_ItemId ON ViewLogs(ItemType, ItemId);
CREATE INDEX IX_ViewLogs_UserId ON ViewLogs(UserId);

CREATE TABLE UserActivities (
    Id           INT IDENTITY(1,1) CONSTRAINT PK_UserActivities PRIMARY KEY,
    UserId       INT NOT NULL CONSTRAINT FK_UserActivities_Users_UserId REFERENCES Users(Id) ON DELETE CASCADE,
    ActivityType NVARCHAR(30) NOT NULL,
    Description  NVARCHAR(300) NOT NULL,
    ItemType     NVARCHAR(30) NULL,
    ItemId       INT NULL,
    Url          NVARCHAR(500) NULL,
    CreatedAt    DATETIME2 NOT NULL CONSTRAINT DF_UserActivities_CreatedAt DEFAULT SYSUTCDATETIME()
);
CREATE INDEX IX_UserActivities_UserId_CreatedAt ON UserActivities(UserId, CreatedAt);

CREATE TABLE Notifications (
    Id        INT IDENTITY(1,1) CONSTRAINT PK_Notifications PRIMARY KEY,
    UserId    INT NOT NULL CONSTRAINT FK_Notifications_Users_UserId REFERENCES Users(Id) ON DELETE CASCADE,
    Title     NVARCHAR(150) NOT NULL,
    Message   NVARCHAR(500) NOT NULL,
    Url       NVARCHAR(500) NULL,
    IsRead    BIT NOT NULL CONSTRAINT DF_Notifications_IsRead DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Notifications_CreatedAt DEFAULT SYSUTCDATETIME()
);
CREATE INDEX IX_Notifications_UserId_IsRead ON Notifications(UserId, IsRead);
GO
