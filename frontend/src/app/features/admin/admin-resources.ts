
export type FieldType =
  | 'text' | 'textarea' | 'richtext' | 'number' | 'select' | 'category' | 'checkbox' | 'date' | 'datetime'
  | 'color' | 'image' | 'tags' | 'genres' | 'timeline' | 'gallery' | 'url';

export interface FieldDef {
  key: string; label: string; type: FieldType; required?: boolean; options?: string[]; hint?: string;
  min?: number; max?: number; maxLength?: number; half?: boolean; placeholder?: string; folder?: string;
}
export type ColumnType = 'title' | 'text' | 'category' | 'bool' | 'date' | 'number' | 'color' | 'rating' | 'published';
export interface ColumnDef { key: string; label: string; type: ColumnType; sort?: string; sub?: string; }
export interface FilterDef { key: 'categoryId' | 'type' | 'status'; label: string; options?: { v: string; l: string }[]; }

export interface ResourceConfig {
  resource: string; title: string; singular: string; icon: string; description: string;
  titleKey: string; defaultSort: string; publicUrl?: (row: Record<string, unknown>) => string | null;
  columns: ColumnDef[]; filters: FilterDef[]; fields: FieldDef[]; defaults: Record<string, unknown>;
}

const opts = (a: string[]) => a.map(v => ({ v, l: v }));
const CONTENT_TYPES = ['Video', 'Audio', 'Article', 'Image'];
const FORMATS = ['Series', 'Film', 'Manga', 'Comic Series', 'Comic Arc', 'Graphic Novel', 'Game', 'Album', 'EP', 'Guide', 'Showcase'];
const MEDIA_TYPES = ['Trailer', 'Video', 'Explainer', 'Soundtrack', 'Podcast'];
const RELEASE_TYPES = ['Anime', 'Movie', 'Show', 'Game', 'Comic', 'Merch Drop'];
const EVENT_TYPES = ['Convention', 'Meetup', 'Premiere', 'Screening'];
const FAQ_CATEGORIES = ['Platform', 'Account', 'Features', 'Media', 'Events', 'Chatbot', 'Accessibility'];

const IMAGES: FieldDef[] = [
  { key: 'imageUrl', label: 'Primary image', type: 'image', required: true, half: true },
  { key: 'hoverImageUrl', label: 'Hover image (dual-image card)', type: 'image', half: true, hint: 'Shown on hover. Defaults to the primary image.' }
];

export const RESOURCES: Record<string, ResourceConfig> = {
  contents: {
    resource: 'contents', title: 'Content catalog', singular: 'content item', icon: 'film', titleKey: 'title', defaultSort: 'CreatedAt',
    description: 'Titles across all realms: series, films, manga, comics, games, albums.',
    publicUrl: r => `/content/${r['slug']}`,
    columns: [
      { key: 'title', label: 'Title', type: 'title', sort: 'Title', sub: 'format' },
      { key: 'categoryName', label: 'Realm', type: 'category' },
      { key: 'contentType', label: 'Type', type: 'text', sort: 'ContentType' },
      { key: 'releaseYear', label: 'Year', type: 'number', sort: 'ReleaseYear' },
      { key: 'averageRating', label: 'Rating', type: 'rating', sort: 'AverageRating' },
      { key: 'viewCount', label: 'Views', type: 'number', sort: 'ViewCount' },
      { key: 'isPublished', label: 'Status', type: 'published', sort: 'IsPublished' }
    ],
    filters: [{ key: 'categoryId', label: 'All realms' }, { key: 'type', label: 'All types', options: opts(CONTENT_TYPES) }, { key: 'status', label: 'Any status', options: [{ v: 'published', l: 'Published' }, { v: 'draft', l: 'Draft' }] }],
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true, maxLength: 200 },
      { key: 'slug', label: 'Slug', type: 'text', half: true, hint: 'Leave blank to generate from the title.' },
      { key: 'categoryId', label: 'Realm', type: 'category', required: true, half: true },
      { key: 'contentType', label: 'Content type', type: 'select', options: CONTENT_TYPES, required: true, half: true },
      { key: 'format', label: 'Format', type: 'select', options: FORMATS, required: true, half: true },
      { key: 'releaseYear', label: 'Release year', type: 'number', min: 1900, max: 2100, required: true, half: true },
      { key: 'creator', label: 'Creator / studio', type: 'text', half: true },
      { key: 'seasons', label: 'Seasons', type: 'number', min: 0, half: true },
      { key: 'episodes', label: 'Episodes / chapters', type: 'number', min: 0, half: true },
      { key: 'synopsis', label: 'Synopsis', type: 'textarea', required: true, maxLength: 600 },
      { key: 'description', label: 'Full description', type: 'richtext' },
      { key: 'trailerUrl', label: 'Trailer URL (YouTube or /media/...)', type: 'url' },
      ...IMAGES,
      { key: 'bannerUrl', label: 'Banner image', type: 'image' },
      { key: 'genreIds', label: 'Genres', type: 'genres' },
      { key: 'tagIds', label: 'Tags', type: 'tags' },
      { key: 'popularityScore', label: 'Popularity score (0-100)', type: 'number', min: 0, max: 100, half: true },
      { key: 'isFeatured', label: 'Featured on home page', type: 'checkbox', half: true },
      { key: 'isPublished', label: 'Published', type: 'checkbox', half: true }
    ],
    defaults: { contentType: 'Video', format: 'Series', releaseYear: new Date().getFullYear(), isPublished: true, isFeatured: false, popularityScore: 50, genreIds: [], tagIds: [] }
  },

  media: {
    resource: 'media', title: 'Media gallery', singular: 'media item', icon: 'play', titleKey: 'title', defaultSort: 'CreatedAt',
    description: 'Trailers, videos, soundtracks and podcasts. YouTube links are embedded automatically.',
    publicUrl: r => `/media/${r['id']}`,
    columns: [
      { key: 'title', label: 'Title', type: 'title', sort: 'Title', sub: 'mediaType' },
      { key: 'categoryName', label: 'Realm', type: 'category' },
      { key: 'embedType', label: 'Source', type: 'text' },
      { key: 'durationSeconds', label: 'Duration (s)', type: 'number', sort: 'DurationSeconds' },
      { key: 'viewCount', label: 'Views', type: 'number', sort: 'ViewCount' },
      { key: 'isPublished', label: 'Status', type: 'published', sort: 'IsPublished' }
    ],
    filters: [{ key: 'categoryId', label: 'All realms' }, { key: 'type', label: 'All types', options: opts(MEDIA_TYPES) }],
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'categoryId', label: 'Realm', type: 'category', required: true, half: true },
      { key: 'mediaType', label: 'Media type', type: 'select', options: MEDIA_TYPES, required: true, half: true },
      { key: 'url', label: 'Media URL', type: 'url', required: true, hint: 'YouTube link, or a file path such as /media/video/clip.mp4' },
      { key: 'durationSeconds', label: 'Duration (seconds)', type: 'number', min: 0, half: true },
      { key: 'contentId', label: 'Related content ID (optional)', type: 'number', min: 1, half: true },
      { key: 'description', label: 'Description', type: 'textarea', required: true },
      ...IMAGES,
      { key: 'tagIds', label: 'Tags', type: 'tags' },
      { key: 'isPublished', label: 'Published', type: 'checkbox' }
    ],
    defaults: { mediaType: 'Trailer', embedType: 'file', durationSeconds: 0, isPublished: true, tagIds: [] }
  },

  characters: {
    resource: 'characters', title: 'Characters', singular: 'character', icon: 'users', titleKey: 'name', defaultSort: 'CreatedAt',
    description: 'Character profiles with bio, powers, quotes and stat bars.',
    publicUrl: r => `/characters/${r['slug']}`,
    columns: [
      { key: 'name', label: 'Name', type: 'title', sort: 'Name', sub: 'fandom' },
      { key: 'categoryName', label: 'Realm', type: 'category' },
      { key: 'role', label: 'Role', type: 'text', sort: 'Role' },
      { key: 'popularityScore', label: 'Popularity', type: 'number', sort: 'PopularityScore' },
      { key: 'viewCount', label: 'Views', type: 'number', sort: 'ViewCount' }
    ],
    filters: [{ key: 'categoryId', label: 'All realms' }],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true, half: true },
      { key: 'slug', label: 'Slug', type: 'text', half: true, hint: 'Leave blank to generate.' },
      { key: 'categoryId', label: 'Realm', type: 'category', required: true, half: true },
      { key: 'fandom', label: 'Fandom / franchise', type: 'text', required: true, half: true },
      { key: 'role', label: 'Role', type: 'text', half: true, placeholder: 'Protagonist, Villain...' },
      { key: 'power', label: 'Signature power / skill', type: 'text', half: true },
      { key: 'quote', label: 'Quote', type: 'text' },
      { key: 'bio', label: 'Biography', type: 'richtext', required: true },
      { key: 'strength', label: 'Strength', type: 'number', min: 0, max: 100, half: true },
      { key: 'intelligence', label: 'Intelligence', type: 'number', min: 0, max: 100, half: true },
      { key: 'agility', label: 'Agility', type: 'number', min: 0, max: 100, half: true },
      { key: 'charisma', label: 'Charisma', type: 'number', min: 0, max: 100, half: true },
      { key: 'contentId', label: 'Related content ID (optional)', type: 'number', min: 1, half: true },
      { key: 'popularityScore', label: 'Popularity score', type: 'number', min: 0, max: 100, half: true },
      ...IMAGES
    ],
    defaults: { strength: 50, intelligence: 50, agility: 50, charisma: 50, popularityScore: 50 }
  },

  articles: {
    resource: 'articles', title: 'Articles', singular: 'article', icon: 'file-text', titleKey: 'title', defaultSort: 'PublishedAt',
    description: 'Editorial articles and fandom histories with timelines.',
    publicUrl: r => `/articles/${r['slug']}`,
    columns: [
      { key: 'title', label: 'Title', type: 'title', sort: 'Title', sub: 'excerpt' },
      { key: 'categoryName', label: 'Realm', type: 'category' },
      { key: 'status', label: 'Status', type: 'text', sort: 'Status' },
      { key: 'readMinutes', label: 'Read (min)', type: 'number', sort: 'ReadMinutes' },
      { key: 'viewCount', label: 'Views', type: 'number', sort: 'ViewCount' },
      { key: 'publishedAt', label: 'Published', type: 'date', sort: 'PublishedAt' }
    ],
    filters: [{ key: 'categoryId', label: 'All realms' }, { key: 'status', label: 'Any status', options: opts(['Published', 'Draft']) }],
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', half: true, hint: 'Leave blank to generate.' },
      { key: 'categoryId', label: 'Realm', type: 'category', required: true, half: true },
      { key: 'status', label: 'Status', type: 'select', options: ['Published', 'Draft'], half: true },
      { key: 'publishedAt', label: 'Publish date', type: 'datetime', half: true },
      { key: 'readMinutes', label: 'Read time (minutes)', type: 'number', min: 1, max: 120, half: true },
      { key: 'isFeatured', label: 'Featured', type: 'checkbox', half: true },
      { key: 'excerpt', label: 'Excerpt', type: 'textarea', required: true, maxLength: 500 },
      { key: 'body', label: 'Body', type: 'richtext', required: true },
      ...IMAGES,
      { key: 'timeline', label: 'History timeline', type: 'timeline' }
    ],
    defaults: { status: 'Published', readMinutes: 5, isFeatured: false, publishedAt: new Date().toISOString(), timeline: [] }
  },

  merchandise: {
    resource: 'merchandise', title: 'Merchandise', singular: 'merchandise item', icon: 'tag', titleKey: 'name', defaultSort: 'CreatedAt',
    description: 'Collectibles showcase (display only - no cart or payments).',
    publicUrl: r => `/merchandise/${r['slug']}`,
    columns: [
      { key: 'name', label: 'Name', type: 'title', sort: 'Name', sub: 'fandom' },
      { key: 'categoryName', label: 'Realm', type: 'category' },
      { key: 'manufacturer', label: 'Manufacturer', type: 'text', sort: 'Manufacturer' },
      { key: 'isUpcoming', label: 'Upcoming', type: 'bool', sort: 'IsUpcoming' },
      { key: 'viewCount', label: 'Views', type: 'number', sort: 'ViewCount' }
    ],
    filters: [{ key: 'categoryId', label: 'All realms' }, { key: 'status', label: 'All items', options: [{ v: 'upcoming', l: 'Upcoming only' }] }],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true, half: true },
      { key: 'slug', label: 'Slug', type: 'text', half: true, hint: 'Leave blank to generate.' },
      { key: 'categoryId', label: 'Realm', type: 'category', required: true, half: true },
      { key: 'fandom', label: 'Fandom', type: 'text', required: true, half: true },
      { key: 'manufacturer', label: 'Manufacturer', type: 'text', half: true },
      { key: 'popularityScore', label: 'Popularity score', type: 'number', min: 0, max: 100, half: true },
      { key: 'isUpcoming', label: 'Upcoming release', type: 'checkbox' },
      { key: 'description', label: 'Description', type: 'richtext', required: true },
      ...IMAGES,
      { key: 'galleryUrls', label: 'Gallery images', type: 'gallery' },
      { key: 'tagIds', label: 'Tags', type: 'tags' }
    ],
    defaults: { isUpcoming: false, popularityScore: 50, tagIds: [], galleryUrls: [] }
  },

  upcoming: {
    resource: 'upcoming', title: 'Upcoming releases', singular: 'upcoming release', icon: 'calendar', titleKey: 'title', defaultSort: 'ReleaseDate',
    description: 'Release calendar with countdowns across realms.',
    columns: [
      { key: 'title', label: 'Title', type: 'title', sort: 'Title', sub: 'studio' },
      { key: 'categoryName', label: 'Realm', type: 'category' },
      { key: 'releaseType', label: 'Type', type: 'text', sort: 'ReleaseType' },
      { key: 'releaseDate', label: 'Release', type: 'date', sort: 'ReleaseDate' },
      { key: 'isDateConfirmed', label: 'Confirmed', type: 'bool', sort: 'IsDateConfirmed' }
    ],
    filters: [{ key: 'categoryId', label: 'All realms' }, { key: 'type', label: 'All types', options: opts(RELEASE_TYPES) }],
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'categoryId', label: 'Realm', type: 'category', required: true, half: true },
      { key: 'releaseType', label: 'Release type', type: 'select', options: RELEASE_TYPES, required: true, half: true },
      { key: 'releaseDate', label: 'Release date', type: 'datetime', required: true, half: true },
      { key: 'studio', label: 'Studio / publisher', type: 'text', half: true },
      { key: 'isDateConfirmed', label: 'Date confirmed', type: 'checkbox' },
      { key: 'description', label: 'Description', type: 'textarea', required: true },
      { key: 'externalUrl', label: 'Official link', type: 'url' },
      ...IMAGES,
      { key: 'tagIds', label: 'Tags', type: 'tags' }
    ],
    defaults: { releaseType: 'Anime', isDateConfirmed: true, releaseDate: new Date(Date.now() + 30 * 864e5).toISOString(), tagIds: [] }
  },

  events: {
    resource: 'events', title: 'Events', singular: 'event', icon: 'map-pin', titleKey: 'title', defaultSort: 'StartDate',
    description: 'Conventions, meetups, premieres and screenings shown on the map and globe.',
    publicUrl: r => `/events/${r['slug']}`,
    columns: [
      { key: 'title', label: 'Event', type: 'title', sort: 'Title', sub: 'venue' },
      { key: 'eventType', label: 'Type', type: 'text', sort: 'EventType' },
      { key: 'city', label: 'City', type: 'text', sort: 'City' },
      { key: 'country', label: 'Country', type: 'text', sort: 'Country' },
      { key: 'startDate', label: 'Starts', type: 'date', sort: 'StartDate' },
      { key: 'isHighlight', label: 'Highlight', type: 'bool', sort: 'IsHighlight' }
    ],
    filters: [{ key: 'type', label: 'All types', options: opts(EVENT_TYPES) }],
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true, half: true },
      { key: 'slug', label: 'Slug', type: 'text', half: true, hint: 'Leave blank to generate.' },
      { key: 'eventType', label: 'Event type', type: 'select', options: EVENT_TYPES, required: true, half: true },
      { key: 'categoryId', label: 'Realm (optional)', type: 'category', half: true },
      { key: 'startDate', label: 'Starts', type: 'datetime', required: true, half: true },
      { key: 'endDate', label: 'Ends', type: 'datetime', required: true, half: true },
      { key: 'venue', label: 'Venue', type: 'text', required: true },
      { key: 'city', label: 'City', type: 'text', required: true, half: true },
      { key: 'country', label: 'Country', type: 'text', required: true, half: true },
      { key: 'latitude', label: 'Latitude', type: 'number', min: -90, max: 90, required: true, half: true },
      { key: 'longitude', label: 'Longitude', type: 'number', min: -180, max: 180, required: true, half: true },
      { key: 'ticketUrl', label: 'Ticket / info URL', type: 'url' },
      { key: 'description', label: 'Short description', type: 'textarea', required: true },
      { key: 'story', label: 'Event highlights story', type: 'richtext' },
      ...IMAGES,
      { key: 'isHighlight', label: 'Show in event highlights', type: 'checkbox' }
    ],
    defaults: { eventType: 'Convention', latitude: 0, longitude: 0, isHighlight: false, categoryId: null, startDate: new Date(Date.now() + 30 * 864e5).toISOString(), endDate: new Date(Date.now() + 31 * 864e5).toISOString() }
  },

  categories: {
    resource: 'categories', title: 'Categories', singular: 'category', icon: 'layers', titleKey: 'name', defaultSort: 'SortOrder',
    description: 'The realms of the multiverse. Colors drive each realm\'s theme.',
    publicUrl: r => `/realm/${r['slug']}`,
    columns: [
      { key: 'name', label: 'Name', type: 'title', sort: 'Name', sub: 'tagline' },
      { key: 'slug', label: 'Slug', type: 'text', sort: 'Slug' },
      { key: 'accentColor', label: 'Accent', type: 'color' },
      { key: 'sortOrder', label: 'Order', type: 'number', sort: 'SortOrder' }
    ],
    filters: [],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true, half: true },
      { key: 'slug', label: 'Slug', type: 'text', half: true, hint: 'Leave blank to generate.' },
      { key: 'tagline', label: 'Tagline', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea', required: true },
      { key: 'accentColor', label: 'Accent color', type: 'color', half: true },
      { key: 'secondaryColor', label: 'Secondary color', type: 'color', half: true },
      { key: 'icon', label: 'Icon name', type: 'text', half: true, placeholder: 'katana, film-reel, controller...' },
      { key: 'sortOrder', label: 'Sort order', type: 'number', min: 0, half: true },
      ...IMAGES
    ],
    defaults: { accentColor: '#D4AF37', secondaryColor: '#7C3AED', sortOrder: 0 }
  },

  genres: {
    resource: 'genres', title: 'Genres', singular: 'genre', icon: 'grid', titleKey: 'name', defaultSort: 'Name',
    description: 'Genres used to filter the content catalog.',
    columns: [{ key: 'name', label: 'Name', type: 'title', sort: 'Name' }, { key: 'slug', label: 'Slug', type: 'text', sort: 'Slug' }],
    filters: [],
    fields: [{ key: 'name', label: 'Name', type: 'text', required: true, half: true }, { key: 'slug', label: 'Slug', type: 'text', half: true, hint: 'Leave blank to generate.' }],
    defaults: {}
  },

  tags: {
    resource: 'tags', title: 'Tags', singular: 'tag', icon: 'tag', titleKey: 'name', defaultSort: 'Name',
    description: 'Colored tags shown on cards and used for search.',
    columns: [{ key: 'name', label: 'Name', type: 'title', sort: 'Name' }, { key: 'slug', label: 'Slug', type: 'text', sort: 'Slug' }, { key: 'color', label: 'Color', type: 'color' }],
    filters: [],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true, half: true },
      { key: 'slug', label: 'Slug', type: 'text', half: true, hint: 'Leave blank to generate.' },
      { key: 'color', label: 'Color', type: 'color' }
    ],
    defaults: { color: '#D4AF37' }
  },

  faqs: {
    resource: 'faqs', title: 'Chatbot FAQs', singular: 'FAQ', icon: 'help', titleKey: 'question', defaultSort: 'SortOrder',
    description: 'Knowledge base used by the assistant and the public FAQ page.',
    columns: [
      { key: 'question', label: 'Question', type: 'title', sort: 'Question', sub: 'keywords' },
      { key: 'category', label: 'Category', type: 'text', sort: 'Category' },
      { key: 'hitCount', label: 'Hits', type: 'number', sort: 'HitCount' },
      { key: 'isActive', label: 'Active', type: 'bool', sort: 'IsActive' },
      { key: 'sortOrder', label: 'Order', type: 'number', sort: 'SortOrder' }
    ],
    filters: [{ key: 'type', label: 'All categories', options: opts(FAQ_CATEGORIES) }],
    fields: [
      { key: 'question', label: 'Question', type: 'text', required: true, maxLength: 300 },
      { key: 'answer', label: 'Answer', type: 'textarea', required: true, maxLength: 2000 },
      { key: 'category', label: 'Category', type: 'select', options: FAQ_CATEGORIES, required: true, half: true },
      { key: 'sortOrder', label: 'Sort order', type: 'number', min: 0, half: true },
      { key: 'keywords', label: 'Keywords (comma separated)', type: 'text', hint: 'Extra words the assistant should match, e.g. "signup, register, join".' },
      { key: 'isActive', label: 'Active', type: 'checkbox' }
    ],
    defaults: { category: 'Platform', isActive: true, sortOrder: 0 }
  }
};
