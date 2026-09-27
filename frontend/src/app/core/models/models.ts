

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CategoryLite { id: number; name: string; slug: string; accentColor: string; }

export interface Category extends CategoryLite {
  tagline: string;
  description: string;
  secondaryColor: string;
  icon: string;
  imageUrl: string;
  hoverImageUrl: string;
  sortOrder: number;
  contentCount: number;
  characterCount: number;
  mediaCount: number;
  merchandiseCount: number;
  totalItems: number;
}

export interface Tag { id: number; name: string; slug: string; color: string; }
export interface Genre { id: number; name: string; slug: string; }

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: 'User' | 'Admin' | 'Visitor';
  avatarUrl?: string | null;
  bio?: string | null;
  theme: 'dark' | 'light';
  fontSize: 'sm' | 'md' | 'lg';
  reduceMotion: boolean;
  emailNotifications: boolean;
  emailVerified: boolean;
  createdAt: string;
  favoriteFandoms: string[];
  categories: CategoryLite[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
  devLink?: string | null;
}

export interface MessageResponse { message: string; devLink?: string | null; }

export interface ContentCard {
  id: number;
  title: string;
  slug: string;
  contentType: string;
  format: string;
  releaseYear: number;
  synopsis: string;
  imageUrl: string;
  hoverImageUrl: string;
  categoryName: string;
  categorySlug: string;
  accentColor: string;
  averageRating: number;
  ratingCount: number;
  popularityScore: number;
  viewCount: number;
  isFeatured: boolean;
  genres: string[];
  tags: Tag[];
}

export interface ContentDetail extends ContentCard {
  description: string;
  creator: string;
  seasons?: number | null;
  episodes?: number | null;
  trailerUrl?: string | null;
  bannerUrl: string;
  likeCount: number;
  dislikeCount: number;
  locked: boolean;
  characters: CharacterCard[];
  media: Media[];
  related: ContentCard[];
}

export interface Media {
  id: number;
  title: string;
  mediaType: string;
  embedType: 'file' | 'youtube' | string;
  url?: string | null;
  durationSeconds: number;
  description: string;
  imageUrl: string;
  hoverImageUrl: string;
  categoryName: string;
  categorySlug: string;
  accentColor: string;
  viewCount: number;
  averageRating: number;
  ratingCount: number;
  likeCount: number;
  dislikeCount: number;
  locked: boolean;
  contentId?: number | null;
  tags: Tag[];
  createdAt: string;
}

export interface CharacterCard {
  id: number;
  name: string;
  slug: string;
  fandom: string;
  role: string;
  power: string;
  quote: string;
  strength: number;
  intelligence: number;
  agility: number;
  charisma: number;
  imageUrl: string;
  hoverImageUrl: string;
  categoryName: string;
  categorySlug: string;
  accentColor: string;
  viewCount: number;
  popularityScore: number;
}

export interface CharacterDetail extends CharacterCard {
  bio: string;
  locked: boolean;
  content?: ContentCard | null;
  related: CharacterCard[];
}

export interface ArticleCard {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  imageUrl: string;
  hoverImageUrl: string;
  readMinutes: number;
  isFeatured: boolean;
  categoryName: string;
  categorySlug: string;
  accentColor: string;
  authorName: string;
  viewCount: number;
  publishedAt: string;
}

export interface TimelineItem { id?: number; dateLabel: string; title: string; description: string; sortOrder?: number; }

export interface ArticleDetail extends ArticleCard {
  body: string;
  locked: boolean;
  timeline: TimelineItem[];
  related: ArticleCard[];
}

export interface Merch {
  id: number;
  name: string;
  slug: string;
  fandom: string;
  manufacturer: string;
  description: string;
  imageUrl: string;
  hoverImageUrl: string;
  isUpcoming: boolean;
  viewCount: number;
  popularityScore: number;
  categoryName: string;
  categorySlug: string;
  accentColor: string;
  tags: Tag[];
  images: { imageUrl: string; caption: string }[];
  locked: boolean;
}

export interface MerchGroup { key: string; label: string; accentColor: string; items: Merch[]; }

export interface Upcoming {
  id: number;
  title: string;
  releaseType: string;
  releaseDate: string;
  isDateConfirmed: boolean;
  studio: string;
  description: string;
  imageUrl: string;
  hoverImageUrl: string;
  externalUrl?: string | null;
  categoryName: string;
  categorySlug: string;
  accentColor: string;
  viewCount: number;
  tags: Tag[];
}

export interface FanEvent {
  id: number;
  title: string;
  slug: string;
  eventType: string;
  description: string;
  city: string;
  country: string;
  venue: string;
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
  ticketUrl: string;
  imageUrl: string;
  hoverImageUrl: string;
  isHighlight: boolean;
  categoryName?: string | null;
  categorySlug?: string | null;
  accentColor: string;
  viewCount: number;
  distanceKm?: number | null;
}

export interface FanEventDetail extends FanEvent { story: string; locked: boolean; nearby: FanEvent[]; }

export interface SiteStats {
  categories: number; contents: number; characters: number; media: number; merchandise: number;
  events: number; articles: number; members: number; upcomingReleases: number;
}

export interface SearchResult { type: string; id: number; title: string; subtitle: string; imageUrl: string; url: string; }

export interface Home {
  categories: Category[];
  featuredByCategory: Record<string, ContentCard[]>;
  trending: ContentCard[];
  events: FanEvent[];
  upcoming: Upcoming[];
  stats: SiteStats;
}

export interface Faq { id: number; category: string; question: string; answer: string; }

export type ItemType = 'Content' | 'Character' | 'Media' | 'Merchandise' | 'Article' | 'Event';

export interface Bookmark {
  id: number;
  itemType: ItemType;
  itemId: number;
  title: string;
  imageUrl: string;
  url: string;
  note?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface BookmarkStatus { bookmarked: boolean; bookmarkId?: number | null; note?: string | null; }

export interface RatingSummary {
  itemType: string; itemId: number; averageRating: number; ratingCount: number;
  likeCount: number; dislikeCount: number; myStars?: number | null; myThumb: number;
}

export interface Feedback {
  id: number; userId?: number | null; name: string; email: string; type: 'Bug' | 'Suggestion' | 'Query';
  subject: string; message: string; pageUrl?: string | null; status: string; adminNote?: string | null;
  createdAt: string; updatedAt?: string | null;
}

export interface Submission {
  id: number; userId: number; authorName: string; authorAvatarUrl?: string | null; categoryId: number;
  categoryName: string; categorySlug: string; accentColor: string; title: string; submissionType: string;
  summary: string; body: string; imageUrl?: string | null; status: 'Pending' | 'Approved' | 'Rejected';
  reviewNote?: string | null; reviewedAt?: string | null; viewCount: number; createdAt: string;
}

export interface Kpi { key: string; label: string; value: number; change: number; trend: number[]; }
export interface NamedSeries { name: string; color: string; values: number[]; }
export interface Slice { label: string; value: number; color: string; }
export interface Activity { id: number; activityType: string; description: string; url?: string | null; createdAt: string; userName?: string | null; userAvatarUrl?: string | null; }
export interface AppNotification { id: number; title: string; message: string; url?: string | null; isRead: boolean; createdAt: string; }

export interface Dashboard {
  user: User;
  greeting: string;
  streak: number;
  kpis: Kpi[];
  activityLabels: string[];
  activitySeries: NamedSeries[];
  categoryBreakdown: Slice[];
  recentActivity: Activity[];
  bookmarks: Bookmark[];
  recommendations: ContentCard[];
  favoriteFandomContent: ContentCard[];
  notifications: AppNotification[];
  upcomingEvents: FanEvent[];
}

export interface ChatSuggestion { title: string; subtitle: string; imageUrl: string; url: string; }
export interface ChatResponse {
  reply: string; intent: string; quickReplies: string[]; suggestions: ChatSuggestion[];
  onboardingStep?: number | null; createdAt: string;
}
export interface ChatHistoryItem { id: number; sessionId: string; message: string; response: string; intent: string; createdAt: string; }
export interface ChatSession { sessionId: string; startedAt: string; lastMessageAt: string; messageCount: number; preview: string; messages: ChatHistoryItem[]; }

export interface TopItem { itemType: string; itemId: number; title: string; imageUrl: string; categoryName: string; accentColor: string; views: number; popularityScore: number; url: string; }

export interface AdminOverview {
  kpis: Kpi[];
  trafficLabels: string[];
  trafficSeries: NamedSeries[];
  popularCategories: Slice[];
  topContent: TopItem[];
  liveActivity: Activity[];
  events: FanEvent[];
  moderationQueue: Submission[];
  openFeedback: Feedback[];
}

export interface Analytics {
  from: string; to: string; labels: string[];
  activeUsers: number[]; views: number[]; chatbotQueries: number[]; newUsers: number[];
  totalActiveUsers: number; totalViews: number; totalChatbotQueries: number; totalNewUsers: number;
  popularCategories: Slice[]; viewsByType: Slice[]; chatbotIntents: Slice[]; feedbackByType: Slice[];
  mostViewed: TopItem[]; mostViewedMerchandise: TopItem[]; topFaqs: { question: string; hits: number }[];
}

export interface AdminUser {
  id: number; fullName: string; email: string; role: string; avatarUrl?: string | null; emailVerified: boolean;
  isBlocked: boolean; createdAt: string; lastLoginAt?: string | null; lastActiveAt?: string | null;
  bookmarkCount: number; submissionCount: number;
}
