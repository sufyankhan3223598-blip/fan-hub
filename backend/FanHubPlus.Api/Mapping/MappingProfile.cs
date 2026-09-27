using AutoMapper;
using FanHubPlus.Api.DTOs;
using FanHubPlus.Api.Entities;

namespace FanHubPlus.Api.Mapping;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Category, AdminCategoryDto>();
        CreateMap<AdminCategoryDto, Category>().ForMember(d => d.Id, o => o.Ignore());

        CreateMap<Tag, AdminTagDto>();
        CreateMap<AdminTagDto, Tag>().ForMember(d => d.Id, o => o.Ignore());

        CreateMap<Genre, AdminGenreDto>();
        CreateMap<AdminGenreDto, Genre>().ForMember(d => d.Id, o => o.Ignore());

        CreateMap<Content, AdminContentDto>()
            .ForMember(d => d.GenreIds, o => o.MapFrom(s => s.ContentGenres.Select(g => g.GenreId)))
            .ForMember(d => d.TagIds, o => o.MapFrom(s => s.ContentTags.Select(t => t.TagId)));
        CreateMap<AdminContentDto, Content>()
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.ViewCount, o => o.Ignore())
            .ForMember(d => d.AverageRating, o => o.Ignore())
            .ForMember(d => d.CreatedAt, o => o.Ignore())
            .ForMember(d => d.Category, o => o.Ignore())
            .ForMember(d => d.ContentGenres, o => o.Ignore())
            .ForMember(d => d.ContentTags, o => o.Ignore());

        CreateMap<MediaItem, AdminMediaDto>()
            .ForMember(d => d.TagIds, o => o.MapFrom(s => s.MediaTags.Select(t => t.TagId)));
        CreateMap<AdminMediaDto, MediaItem>()
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.ViewCount, o => o.Ignore())
            .ForMember(d => d.AverageRating, o => o.Ignore())
            .ForMember(d => d.CreatedAt, o => o.Ignore())
            .ForMember(d => d.Category, o => o.Ignore())
            .ForMember(d => d.Content, o => o.Ignore())
            .ForMember(d => d.MediaTags, o => o.Ignore());

        CreateMap<CharacterProfile, AdminCharacterDto>();
        CreateMap<AdminCharacterDto, CharacterProfile>()
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.ViewCount, o => o.Ignore())
            .ForMember(d => d.CreatedAt, o => o.Ignore())
            .ForMember(d => d.Category, o => o.Ignore())
            .ForMember(d => d.Content, o => o.Ignore());

        CreateMap<ArticleTimelineItem, TimelineItemDto>();
        CreateMap<Article, AdminArticleDto>()
            .ForMember(d => d.Timeline, o => o.MapFrom(s => s.TimelineItems.OrderBy(t => t.SortOrder)));
        CreateMap<AdminArticleDto, Article>()
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.ViewCount, o => o.Ignore())
            .ForMember(d => d.CreatedAt, o => o.Ignore())
            .ForMember(d => d.Category, o => o.Ignore())
            .ForMember(d => d.Author, o => o.Ignore())
            .ForMember(d => d.AuthorId, o => o.Ignore())
            .ForMember(d => d.TimelineItems, o => o.Ignore());

        CreateMap<MerchandiseItem, AdminMerchDto>()
            .ForMember(d => d.TagIds, o => o.MapFrom(s => s.MerchandiseTags.Select(t => t.TagId)))
            .ForMember(d => d.GalleryUrls, o => o.MapFrom(s => s.Images.OrderBy(i => i.SortOrder).Select(i => i.ImageUrl)));
        CreateMap<AdminMerchDto, MerchandiseItem>()
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.ViewCount, o => o.Ignore())
            .ForMember(d => d.CreatedAt, o => o.Ignore())
            .ForMember(d => d.Category, o => o.Ignore())
            .ForMember(d => d.Images, o => o.Ignore())
            .ForMember(d => d.MerchandiseTags, o => o.Ignore());

        CreateMap<UpcomingRelease, AdminUpcomingDto>()
            .ForMember(d => d.TagIds, o => o.MapFrom(s => s.UpcomingReleaseTags.Select(t => t.TagId)));
        CreateMap<AdminUpcomingDto, UpcomingRelease>()
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.ViewCount, o => o.Ignore())
            .ForMember(d => d.CreatedAt, o => o.Ignore())
            .ForMember(d => d.Category, o => o.Ignore())
            .ForMember(d => d.UpcomingReleaseTags, o => o.Ignore());

        CreateMap<Event, AdminEventDto>();
        CreateMap<AdminEventDto, Event>()
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.ViewCount, o => o.Ignore())
            .ForMember(d => d.CreatedAt, o => o.Ignore())
            .ForMember(d => d.Category, o => o.Ignore());

        CreateMap<ChatbotFaq, AdminFaqDto>();
        CreateMap<AdminFaqDto, ChatbotFaq>()
            .ForMember(d => d.Id, o => o.Ignore())
            .ForMember(d => d.HitCount, o => o.Ignore())
            .ForMember(d => d.CreatedAt, o => o.Ignore());
    }
}
