using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using FanHubPlus.Api.Data;
using FanHubPlus.Api.Mapping;
using FanHubPlus.Api.Middleware;
using FanHubPlus.Api.Repositories;
using FanHubPlus.Api.Services;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((ctx, cfg) => cfg
    .ReadFrom.Configuration(ctx.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("Logs/fanhubplus-.log", rollingInterval: RollingInterval.Day, retainedFileCountLimit: 14));

builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<SmtpSettings>(builder.Configuration.GetSection("Smtp"));
builder.Services.Configure<AppSettings>(builder.Configuration.GetSection("App"));
builder.Services.Configure<ChatbotSettings>(builder.Configuration.GetSection("Chatbot"));
var jwt = builder.Configuration.GetSection("Jwt").Get<JwtSettings>() ?? new JwtSettings();
if (string.IsNullOrWhiteSpace(jwt.Key) || jwt.Key.Length < 32)
    throw new InvalidOperationException("Jwt:Key must be at least 32 characters (appsettings.json).");

builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"), sql =>
    {
        sql.EnableRetryOnFailure(3);

        sql.UseCompatibilityLevel(120);
        sql.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
    }));

builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IFileStorageService, FileStorageService>();
builder.Services.AddScoped<IActivityService, ActivityService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ICatalogService, CatalogService>();
builder.Services.AddScoped<IDiscoveryService, DiscoveryService>();
builder.Services.AddScoped<ICommunityService, CommunityService>();
builder.Services.AddScoped<IProfileService, ProfileService>();
builder.Services.AddScoped<IRecommendationService, RecommendationService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IChatbotService, ChatbotService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddHttpClient();
builder.Services.AddAutoMapper(typeof(MappingProfile));
builder.Services.AddMemoryCache();
builder.Services.AddSingleton<IOtpService, OtpService>();
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(o =>
{
    o.ValueLengthLimit = int.MaxValue;
    o.MultipartBodyLengthLimit = 200L * 1024 * 1024;
    o.MemoryBufferThreshold = int.MaxValue;
});
builder.Services.Configure<IISServerOptions>(options =>
{
    options.MaxRequestBodySize = 200L * 1024 * 1024;
});

builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.Never);
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();
builder.Services.Configure<ApiBehaviorOptions>(o =>
{

    o.InvalidModelStateResponseFactory = ctx =>
    {
        var errors = ctx.ModelState.Where(e => e.Value?.Errors.Count > 0)
            .ToDictionary(e => e.Key.Length == 0 ? "request" : char.ToLowerInvariant(e.Key[0]) + e.Key[1..], e => e.Value!.Errors.Select(x => x.ErrorMessage).ToArray());
        var first = errors.Values.SelectMany(v => v).FirstOrDefault() ?? "Invalid request.";
        return new BadRequestObjectResult(new { status = 400, message = first, errors });
    };
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.MapInboundClaims = true;
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwt.Issuer,
            ValidateAudience = true,
            ValidAudience = jwt.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = 429;
    o.AddFixedWindowLimiter("auth", l =>
    {
        l.PermitLimit = 20;
        l.Window = TimeSpan.FromMinutes(1);
        l.QueueLimit = 0;
    });
});

var origins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? new[] { "http://localhost:4200" };
builder.Services.AddCors(o => o.AddPolicy("client", p => p.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Fan Hub Plus API", Version = "v1", Description = "Fandom Universe platform API" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Paste the access token returned by /api/auth/login"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } },
            Array.Empty<string>()
        }
    });
    var xml = Path.Combine(AppContext.BaseDirectory, "FanHubPlus.Api.xml");
    if (File.Exists(xml)) c.IncludeXmlComments(xml);
});

builder.Services.AddResponseCompression(o => o.EnableForHttps = true);

var app = builder.Build();

app.UseMiddleware<ExceptionMiddleware>();
app.UseSerilogRequestLogging();
app.UseResponseCompression();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Fan Hub Plus API v1");
    c.DocumentTitle = "Fan Hub Plus API";
});

var contentTypeProvider = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider();
contentTypeProvider.Mappings[".m4a"] = "audio/mp4";
contentTypeProvider.Mappings[".jfif"] = "image/jpeg";
contentTypeProvider.Mappings[".webp"] = "image/webp";

app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions
{
    ContentTypeProvider = contentTypeProvider,
    OnPrepareResponse = ctx =>
    {
        if (ctx.File.Name.EndsWith(".webp") || ctx.File.Name.EndsWith(".mp4") || ctx.File.Name.EndsWith(".mp3") || ctx.File.Name.EndsWith(".m4a") || ctx.File.Name.EndsWith(".glb") || ctx.File.Name.EndsWith(".jfif"))
            ctx.Context.Response.Headers.CacheControl = "public,max-age=604800";
    }
});

app.UseCors("client");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/api/health", () => Results.Ok(new { status = "ok", time = DateTime.UtcNow }));

app.MapFallback(async ctx =>
{
    var index = Path.Combine(app.Environment.WebRootPath ?? "wwwroot", "index.html");
    if (!ctx.Request.Path.StartsWithSegments("/api") && File.Exists(index))
    {
        ctx.Response.ContentType = "text/html";
        await ctx.Response.SendFileAsync(index);
    }
    else ctx.Response.StatusCode = 404;
});

try
{
    await DbSeeder.InitializeAsync(app.Services, app.Logger);
}
catch (Exception ex)
{
    app.Logger.LogError(ex, "Database initialization failed. Check ConnectionStrings:DefaultConnection in appsettings.json.");
}

app.Run();

public partial class Program { }
