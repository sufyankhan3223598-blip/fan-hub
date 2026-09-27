import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminOverview, AdminUser, Analytics, ArticleCard, ArticleDetail, Bookmark, BookmarkStatus, Category, ChatResponse,
  ChatSession, CharacterCard, CharacterDetail, ContentCard, ContentDetail, Dashboard, Faq, FanEvent, FanEventDetail,
  Feedback, Genre, Home, ItemType, Media, Merch, MerchGroup, AppNotification, Paged, RatingSummary, SearchResult,
  SiteStats, Submission, Tag, Upcoming, User, ChatHistoryItem
} from '../models/models';

export function toParams(obj: Record<string, unknown> = {}): HttpParams {
  let p = new HttpParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') continue;
    p = p.set(k, String(v));
  }
  return p;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;


  home(): Observable<Home> { return this.http.get<Home>(`${this.base}/site/home`); }
  stats(): Observable<SiteStats> { return this.http.get<SiteStats>(`${this.base}/site/stats`); }
  search(q: string): Observable<SearchResult[]> { return this.http.get<SearchResult[]>(`${this.base}/site/search`, { params: toParams({ q }) }); }
  faqs(): Observable<Faq[]> { return this.http.get<Faq[]>(`${this.base}/site/faqs`); }
  genres(category?: string): Observable<Genre[]> { return this.http.get<Genre[]>(`${this.base}/site/genres`, { params: toParams({ category }) }); }
  tags(): Observable<Tag[]> { return this.http.get<Tag[]>(`${this.base}/site/tags`); }


  categories(): Observable<Category[]> { return this.http.get<Category[]>(`${this.base}/categories`); }
  category(slug: string): Observable<Category> { return this.http.get<Category>(`${this.base}/categories/${slug}`); }
  contents(q: Record<string, unknown>): Observable<Paged<ContentCard>> { return this.http.get<Paged<ContentCard>>(`${this.base}/contents`, { params: toParams(q) }); }
  trending(take = 12): Observable<ContentCard[]> { return this.http.get<ContentCard[]>(`${this.base}/contents/trending`, { params: toParams({ take }) }); }
  content(slug: string): Observable<ContentDetail> { return this.http.get<ContentDetail>(`${this.base}/contents/${slug}`); }
  media(q: Record<string, unknown>): Observable<Paged<Media>> { return this.http.get<Paged<Media>>(`${this.base}/media`, { params: toParams(q) }); }
  mediaItem(id: number): Observable<Media> { return this.http.get<Media>(`${this.base}/media/${id}`); }
  characters(q: Record<string, unknown>): Observable<Paged<CharacterCard>> { return this.http.get<Paged<CharacterCard>>(`${this.base}/characters`, { params: toParams(q) }); }
  character(slug: string): Observable<CharacterDetail> { return this.http.get<CharacterDetail>(`${this.base}/characters/${slug}`); }
  fandoms(category?: string): Observable<string[]> { return this.http.get<string[]>(`${this.base}/characters/fandoms`, { params: toParams({ category }) }); }
  articles(q: Record<string, unknown>): Observable<Paged<ArticleCard>> { return this.http.get<Paged<ArticleCard>>(`${this.base}/articles`, { params: toParams(q) }); }
  article(slug: string): Observable<ArticleDetail> { return this.http.get<ArticleDetail>(`${this.base}/articles/${slug}`); }
  merchandise(q: Record<string, unknown>): Observable<Paged<Merch>> { return this.http.get<Paged<Merch>>(`${this.base}/merchandise`, { params: toParams(q) }); }
  merchGrouped(by: 'category' | 'fandom'): Observable<MerchGroup[]> { return this.http.get<MerchGroup[]>(`${this.base}/merchandise/grouped`, { params: toParams({ by }) }); }
  merchItem(slug: string): Observable<Merch> { return this.http.get<Merch>(`${this.base}/merchandise/${slug}`); }
  upcoming(category?: string, type?: string): Observable<Upcoming[]> { return this.http.get<Upcoming[]>(`${this.base}/upcoming`, { params: toParams({ category, type }) }); }
  events(q: Record<string, unknown> = {}): Observable<FanEvent[]> { return this.http.get<FanEvent[]>(`${this.base}/events`, { params: toParams(q) }); }
  event(slug: string): Observable<FanEventDetail> { return this.http.get<FanEventDetail>(`${this.base}/events/${slug}`); }
  eventCities(): Observable<string[]> { return this.http.get<string[]>(`${this.base}/events/cities`); }


  bookmarks(type?: string, search?: string): Observable<Bookmark[]> { return this.http.get<Bookmark[]>(`${this.base}/bookmarks`, { params: toParams({ type, search }) }); }
  bookmarkStatus(itemType: ItemType, itemId: number): Observable<BookmarkStatus> { return this.http.get<BookmarkStatus>(`${this.base}/bookmarks/status`, { params: toParams({ itemType, itemId }) }); }
  addBookmark(itemType: ItemType, itemId: number, note?: string | null): Observable<Bookmark> { return this.http.post<Bookmark>(`${this.base}/bookmarks`, { itemType, itemId, note }); }
  updateNote(id: number, note: string | null): Observable<Bookmark> { return this.http.put<Bookmark>(`${this.base}/bookmarks/${id}/note`, { note }); }
  removeBookmark(id: number): Observable<void> { return this.http.delete<void>(`${this.base}/bookmarks/${id}`); }
  rating(itemType: string, itemId: number): Observable<RatingSummary> { return this.http.get<RatingSummary>(`${this.base}/ratings`, { params: toParams({ itemType, itemId }) }); }
  rate(itemType: string, itemId: number, stars?: number | null, thumb?: number | null): Observable<RatingSummary> { return this.http.post<RatingSummary>(`${this.base}/ratings`, { itemType, itemId, stars, thumb }); }
  sendFeedback(body: { type: string; subject: string; message: string; pageUrl?: string }): Observable<Feedback> { return this.http.post<Feedback>(`${this.base}/feedback`, body); }
  myFeedback(): Observable<Feedback[]> { return this.http.get<Feedback[]>(`${this.base}/feedback/mine`); }
  approvedSubmissions(q: Record<string, unknown> = {}): Observable<Paged<Submission>> { return this.http.get<Paged<Submission>>(`${this.base}/submissions`, { params: toParams(q) }); }
  submission(id: number): Observable<Submission> { return this.http.get<Submission>(`${this.base}/submissions/${id}`); }
  mySubmissions(): Observable<Submission[]> { return this.http.get<Submission[]>(`${this.base}/submissions/mine`); }
  submit(body: { categoryId: number; title: string; submissionType: string; summary: string; body: string; imageUrl?: string | null }): Observable<Submission> { return this.http.post<Submission>(`${this.base}/submissions`, body); }
  notifications(): Observable<AppNotification[]> { return this.http.get<AppNotification[]>(`${this.base}/notifications`); }
  readNotification(id: number): Observable<void> { return this.http.post<void>(`${this.base}/notifications/${id}/read`, {}); }
  readAllNotifications(): Observable<void> { return this.http.post<void>(`${this.base}/notifications/read-all`, {}); }


  dashboard(): Observable<Dashboard> { return this.http.get<Dashboard>(`${this.base}/dashboard`); }
  profile(): Observable<User> { return this.http.get<User>(`${this.base}/profile`); }
  updateProfile(body: { fullName: string; bio?: string | null; favoriteFandoms: string[]; categoryIds: number[] }): Observable<User> { return this.http.put<User>(`${this.base}/profile`, body); }
  updatePreferences(body: { theme: string; fontSize: string; reduceMotion: boolean; emailNotifications: boolean }): Observable<User> { return this.http.put<User>(`${this.base}/profile/preferences`, body); }
  uploadAvatar(file: Blob, name = 'avatar.png'): Observable<User> { const f = new FormData(); f.append('file', file, name); return this.http.post<User>(`${this.base}/profile/avatar`, f); }
  removeAvatar(): Observable<User> { return this.http.delete<User>(`${this.base}/profile/avatar`); }
  uploadSubmissionImage(file: File): Observable<{ url: string }> { const f = new FormData(); f.append('file', file); return this.http.post<{ url: string }>(`${this.base}/profile/uploads`, f); }
  changePassword(currentPassword: string, newPassword: string): Observable<void> { return this.http.put<void>(`${this.base}/auth/change-password`, { currentPassword, newPassword }); }


  chat(message: string, sessionId: string): Observable<ChatResponse> { return this.http.post<ChatResponse>(`${this.base}/chatbot/message`, { message, sessionId }); }
  chatHistory(): Observable<ChatSession[]> { return this.http.get<ChatSession[]>(`${this.base}/chatbot/history`); }
  clearChatHistory(): Observable<void> { return this.http.delete<void>(`${this.base}/chatbot/history`); }


  adminOverview(): Observable<AdminOverview> { return this.http.get<AdminOverview>(`${this.base}/admin/overview`); }
  adminAnalytics(from?: string, to?: string): Observable<Analytics> { return this.http.get<Analytics>(`${this.base}/admin/analytics`, { params: toParams({ from, to }) }); }
  adminList<T>(resource: string, q: Record<string, unknown>): Observable<Paged<T>> { return this.http.get<Paged<T>>(`${this.base}/admin/${resource}`, { params: toParams(q) }); }
  adminGet<T>(resource: string, id: number): Observable<T> { return this.http.get<T>(`${this.base}/admin/${resource}/${id}`); }
  adminCreate<T>(resource: string, body: unknown): Observable<T> { return this.http.post<T>(`${this.base}/admin/${resource}`, body); }
  adminUpdate<T>(resource: string, id: number, body: unknown): Observable<T> { return this.http.put<T>(`${this.base}/admin/${resource}/${id}`, body); }
  adminDelete(resource: string, id: number): Observable<void> { return this.http.delete<void>(`${this.base}/admin/${resource}/${id}`); }
  adminBulkDelete(resource: string, ids: number[]): Observable<unknown> { return this.http.post(`${this.base}/admin/${resource}/bulk-delete`, { ids }); }
  adminUsers(q: Record<string, unknown>): Observable<Paged<AdminUser>> { return this.http.get<Paged<AdminUser>>(`${this.base}/admin/users`, { params: toParams(q) }); }
  adminSetRole(id: number, role: string): Observable<void> { return this.http.put<void>(`${this.base}/admin/users/${id}/role`, { role }); }
  adminBlock(ids: number[], blocked: boolean): Observable<void> { return this.http.post<void>(`${this.base}/admin/users/bulk-block`, { ids, blocked }); }
  adminSubmissions(q: Record<string, unknown>): Observable<Paged<Submission>> { return this.http.get<Paged<Submission>>(`${this.base}/admin/submissions`, { params: toParams(q) }); }
  adminReview(ids: number[], status: string, reviewNote?: string | null): Observable<void> { return this.http.post<void>(`${this.base}/admin/submissions/bulk-review`, { ids, status, reviewNote }); }
  adminFeedback(q: Record<string, unknown>): Observable<Paged<Feedback>> { return this.http.get<Paged<Feedback>>(`${this.base}/admin/feedback`, { params: toParams(q) }); }
  adminUpdateFeedback(id: number, status: string, adminNote?: string | null): Observable<void> { return this.http.put<void>(`${this.base}/admin/feedback/${id}`, { status, adminNote }); }
  adminBulkFeedback(ids: number[], status: string): Observable<void> { return this.http.post<void>(`${this.base}/admin/feedback/bulk-status`, { ids, status }); }
  adminChatQueries(q: Record<string, unknown>): Observable<Paged<ChatHistoryItem>> { return this.http.get<Paged<ChatHistoryItem>>(`${this.base}/admin/chatbot-queries`, { params: toParams(q) }); }
  adminUpload(file: File, folder: string): Observable<{ url: string }> { const f = new FormData(); f.append('file', file); return this.http.post<{ url: string }>(`${this.base}/admin/uploads`, f, { params: toParams({ folder }) }); }
}
