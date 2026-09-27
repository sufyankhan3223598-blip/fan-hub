import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/guards/guards';

export const routes: Routes = [

  { path: '', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent), title: 'Fan Hub Plus | One Universe. Every Fandom.' },
  { path: 'about', loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent), title: 'Fan Hub Plus | About & Sitemap' },
  { path: 'realm/:slug', loadComponent: () => import('./features/realm/realm.component').then(m => m.RealmComponent), title: 'Fan Hub Plus | Realm' },
  { path: 'explore', loadComponent: () => import('./features/explore/explore.component').then(m => m.ExploreComponent), title: 'Fan Hub Plus | Content Explorer' },
  { path: 'content/:slug', loadComponent: () => import('./features/content-detail/content-detail.component').then(m => m.ContentDetailComponent), title: 'Fan Hub Plus | Content' },
  { path: 'media', loadComponent: () => import('./features/media/media.component').then(m => m.MediaComponent), title: 'Fan Hub Plus | Multimedia Center' },
  { path: 'media/:id', loadComponent: () => import('./features/media/media-detail.component').then(m => m.MediaDetailComponent), title: 'Fan Hub Plus | Media' },
  { path: 'characters', loadComponent: () => import('./features/characters/characters.component').then(m => m.CharactersComponent), title: 'Fan Hub Plus | Character Profiles' },
  { path: 'characters/:slug', loadComponent: () => import('./features/characters/character-detail.component').then(m => m.CharacterDetailComponent), title: 'Fan Hub Plus | Character' },
  { path: 'articles', loadComponent: () => import('./features/articles/articles.component').then(m => m.ArticlesComponent), title: 'Fan Hub Plus | Featured Articles' },
  { path: 'articles/:slug', loadComponent: () => import('./features/articles/article-detail.component').then(m => m.ArticleDetailComponent), title: 'Fan Hub Plus | Article' },
  { path: 'community', loadComponent: () => import('./features/community/community.component').then(m => m.CommunityComponent), title: 'Fan Hub Plus | Fan Creations' },
  { path: 'community/:id', loadComponent: () => import('./features/community/submission-detail.component').then(m => m.SubmissionDetailComponent), title: 'Fan Hub Plus | Fan Creation' },
  { path: 'events', loadComponent: () => import('./features/events/events.component').then(m => m.EventsComponent), title: 'Fan Hub Plus | Events Map & Calendar' },
  { path: 'events/highlights', loadComponent: () => import('./features/events/event-highlights.component').then(m => m.EventHighlightsComponent), title: 'Fan Hub Plus | Event Highlights' },
  { path: 'events/:slug', loadComponent: () => import('./features/events/event-detail.component').then(m => m.EventDetailComponent), title: 'Fan Hub Plus | Event' },
  { path: 'merchandise', loadComponent: () => import('./features/merch/merch.component').then(m => m.MerchComponent), title: 'Fan Hub Plus | Merchandise Showcase' },
  { path: 'merchandise/upcoming', loadComponent: () => import('./features/merch/upcoming.component').then(m => m.UpcomingComponent), title: 'Fan Hub Plus | Upcoming Releases' },
  { path: 'merchandise/:slug', loadComponent: () => import('./features/merch/merch-detail.component').then(m => m.MerchDetailComponent), title: 'Fan Hub Plus | Merchandise' },
  { path: 'faq', loadComponent: () => import('./features/faq/faq.component').then(m => m.FaqComponent), title: 'Fan Hub Plus | FAQ' },


  { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent), title: 'Fan Hub Plus | Login' },
  { path: 'register', canActivate: [guestGuard], loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent), title: 'Fan Hub Plus | Join' },
  { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password.component').then(m => m.ForgotPasswordComponent), title: 'Fan Hub Plus | Forgot Password' },
  { path: 'reset-password', loadComponent: () => import('./features/auth/reset-password.component').then(m => m.ResetPasswordComponent), title: 'Fan Hub Plus | Reset Password' },
  { path: 'verify-email', loadComponent: () => import('./features/auth/verify-email.component').then(m => m.VerifyEmailComponent), title: 'Fan Hub Plus | Verify Email' },


  { path: 'dashboard', canActivate: [authGuard], loadComponent: () => import('./features/user/dashboard.component').then(m => m.DashboardComponent), title: 'Fan Hub Plus | Dashboard' },
  { path: 'profile', canActivate: [authGuard], loadComponent: () => import('./features/user/profile.component').then(m => m.ProfileComponent), title: 'Fan Hub Plus | Profile & Settings' },
  { path: 'bookmarks', canActivate: [authGuard], loadComponent: () => import('./features/user/bookmarks.component').then(m => m.BookmarksComponent), title: 'Fan Hub Plus | Bookmarks & Notes' },
  { path: 'submit', canActivate: [authGuard], loadComponent: () => import('./features/user/submit.component').then(m => m.SubmitComponent), title: 'Fan Hub Plus | Submit Fan Content' },
  { path: 'submissions/mine', canActivate: [authGuard], loadComponent: () => import('./features/user/my-submissions.component').then(m => m.MySubmissionsComponent), title: 'Fan Hub Plus | My Submissions' },
  { path: 'chat-history', canActivate: [authGuard], loadComponent: () => import('./features/user/chat-history.component').then(m => m.ChatHistoryComponent), title: 'Fan Hub Plus | Chat History' },
  { path: 'feedback', canActivate: [authGuard], loadComponent: () => import('./features/feedback/feedback.component').then(m => m.FeedbackComponent), title: 'Fan Hub Plus | Feedback' },


  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/admin-shell.component').then(m => m.AdminShellComponent),
    children: [
      { path: '', loadComponent: () => import('./features/admin/admin-overview.component').then(m => m.AdminOverviewComponent), title: 'Fan Hub Plus | Admin Overview' },
      { path: 'analytics', loadComponent: () => import('./features/admin/admin-analytics.component').then(m => m.AdminAnalyticsComponent), title: 'Fan Hub Plus | Admin Analytics' },
      { path: 'users', loadComponent: () => import('./features/admin/admin-users.component').then(m => m.AdminUsersComponent), title: 'Fan Hub Plus | Admin Users' },
      { path: 'submissions', loadComponent: () => import('./features/admin/admin-submissions.component').then(m => m.AdminSubmissionsComponent), title: 'Fan Hub Plus | Admin Submissions' },
      { path: 'feedback', loadComponent: () => import('./features/admin/admin-feedback.component').then(m => m.AdminFeedbackComponent), title: 'Fan Hub Plus | Admin Feedback' },
      { path: 'chatbot', loadComponent: () => import('./features/admin/admin-chatbot.component').then(m => m.AdminChatbotComponent), title: 'Fan Hub Plus | Chatbot Knowledge Base' },
      { path: 'manage/:resource', loadComponent: () => import('./features/admin/admin-crud.component').then(m => m.AdminCrudComponent), title: 'Fan Hub Plus | Admin Manage' }
    ]
  },


  { path: 'ui-kit', loadComponent: () => import('./features/ui-kit/ui-kit.component').then(m => m.UiKitComponent), title: 'UI Kit | Fan Hub Plus' },
  { path: '**', loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent), title: 'Lost in the multiverse | Fan Hub Plus' }
];
