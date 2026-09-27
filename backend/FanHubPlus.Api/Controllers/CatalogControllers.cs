using FanHubPlus.Api.Common;
using FanHubPlus.Api.DTOs;
using FanHubPlus.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace FanHubPlus.Api.Controllers;

[ApiController]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private readonly ICatalogService _catalog;
    public CategoriesController(ICatalogService catalog) => _catalog = catalog;

    [HttpGet] public Task<List<CategoryDto>> All() => _catalog.GetCategoriesAsync();
    [HttpGet("{slug}")] public Task<CategoryDto> One(string slug) => _catalog.GetCategoryAsync(slug);
}

[ApiController]
[Route("api/contents")]
public class ContentsController : ControllerBase
{
    private readonly ICatalogService _catalog;
    public ContentsController(ICatalogService catalog) => _catalog = catalog;


    [HttpGet] public Task<PagedResult<ContentCardDto>> List([FromQuery] ContentQuery q) => _catalog.GetContentsAsync(q, User.IsMember());
    [HttpGet("trending")] public Task<List<ContentCardDto>> Trending([FromQuery] int take = 12) => _catalog.GetTrendingAsync(Math.Clamp(take, 1, 30));
    [HttpGet("{slug}")] public Task<ContentDetailDto> Detail(string slug) => _catalog.GetContentAsync(slug, User.GetUserId());
}

[ApiController]
[Route("api/media")]
public class MediaController : ControllerBase
{
    private readonly ICatalogService _catalog;
    public MediaController(ICatalogService catalog) => _catalog = catalog;

    [HttpGet] public Task<PagedResult<MediaDto>> List([FromQuery] MediaQuery q) => _catalog.GetMediaAsync(q, User.IsMember());
    [HttpGet("{id:int}")] public Task<MediaDto> Detail(int id) => _catalog.GetMediaItemAsync(id, User.GetUserId());
}

[ApiController]
[Route("api/characters")]
public class CharactersController : ControllerBase
{
    private readonly ICatalogService _catalog;
    public CharactersController(ICatalogService catalog) => _catalog = catalog;

    [HttpGet] public Task<PagedResult<CharacterCardDto>> List([FromQuery] CharacterQuery q) => _catalog.GetCharactersAsync(q);
    [HttpGet("fandoms")] public Task<List<string>> Fandoms([FromQuery] string? category) => _catalog.GetFandomsAsync(category);
    [HttpGet("{slug}")] public Task<CharacterDetailDto> Detail(string slug) => _catalog.GetCharacterAsync(slug, User.GetUserId());
}

[ApiController]
[Route("api/articles")]
public class ArticlesController : ControllerBase
{
    private readonly IDiscoveryService _discovery;
    public ArticlesController(IDiscoveryService discovery) => _discovery = discovery;

    [HttpGet]
    public Task<PagedResult<ArticleCardDto>> List([FromQuery] string? search, [FromQuery] string? category, [FromQuery] bool? featured,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 9) => _discovery.GetArticlesAsync(search, category, featured, page, pageSize);

    [HttpGet("{slug}")] public Task<ArticleDetailDto> Detail(string slug) => _discovery.GetArticleAsync(slug, User.GetUserId());
}

[ApiController]
[Route("api/merchandise")]
public class MerchandiseController : ControllerBase
{
    private readonly IDiscoveryService _discovery;
    public MerchandiseController(IDiscoveryService discovery) => _discovery = discovery;

    [HttpGet] public Task<PagedResult<MerchDto>> List([FromQuery] MerchQuery q) => _discovery.GetMerchandiseAsync(q);
    [HttpGet("grouped")] public Task<List<MerchGroupDto>> Grouped([FromQuery] string by = "category") => _discovery.GetMerchandiseGroupedAsync(by);

    [HttpGet("{slug}")] public Task<MerchDto> Detail(string slug) => _discovery.GetMerchandiseItemAsync(slug, User.GetUserId());
}

[ApiController]
[Route("api/upcoming")]
public class UpcomingController : ControllerBase
{
    private readonly IDiscoveryService _discovery;
    public UpcomingController(IDiscoveryService discovery) => _discovery = discovery;

    [HttpGet] public Task<List<UpcomingDto>> List([FromQuery] string? category, [FromQuery] string? type) => _discovery.GetUpcomingAsync(category, type);
}

[ApiController]
[Route("api/events")]
public class EventsController : ControllerBase
{
    private readonly IDiscoveryService _discovery;
    public EventsController(IDiscoveryService discovery) => _discovery = discovery;


    [HttpGet] public Task<List<EventDto>> List([FromQuery] EventQuery q) => _discovery.GetEventsAsync(q);
    [HttpGet("cities")] public Task<List<string>> Cities() => _discovery.GetEventCitiesAsync();
    [HttpGet("{slug}")] public Task<EventDetailDto> Detail(string slug) => _discovery.GetEventAsync(slug, User.GetUserId());
}

[ApiController]
[Route("api/site")]
public class SiteController : ControllerBase
{
    private readonly IDiscoveryService _discovery;
    private readonly ICatalogService _catalog;

    public SiteController(IDiscoveryService discovery, ICatalogService catalog)
    {
        _discovery = discovery; _catalog = catalog;
    }

    [HttpGet("home")] public Task<HomeDto> Home() => _discovery.GetHomeAsync(_catalog);
    [HttpGet("stats")] public Task<SiteStatsDto> Stats() => _discovery.GetStatsAsync();
    [HttpGet("search")] public Task<List<SearchResultDto>> Search([FromQuery] string q, [FromQuery] int take = 4) => _discovery.SearchAsync(q, Math.Clamp(take, 1, 10));
    [HttpGet("faqs")] public Task<List<FaqDto>> Faqs() => _discovery.GetFaqsAsync();
    [HttpGet("genres")] public Task<List<GenreDto>> Genres([FromQuery] string? category) => _catalog.GetGenresAsync(category);
    [HttpGet("tags")] public Task<List<TagDto>> Tags() => _catalog.GetTagsAsync();
}
