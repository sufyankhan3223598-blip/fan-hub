# SRS compliance checklist

Mapped against *Fan Hub Plus - End-to-End Web Solutions SRS v1.0* (Aptech). "Where" gives the page or module to show during evaluation.

## 1.4 Scope and 1.5 Constraints

| Requirement | Status | Where |
|---|---|---|
| Categories: Anime, Gaming, Movies, TV Shows, K-Pop, Comics, Manga, Cosplay | Done | Realms menu, `/realm/:slug`, Categories admin |
| Roles: Visitor, Registered user, Administrator | Done | Route guards + API role policies (README section 5) |
| Backend for storage, sessions, feedback and content updates | Done | ASP.NET Core API + SQL Server |
| Works in major browsers and on all devices | Done | Responsive layouts, mobile drawer, tested at phone and desktop widths |
| No purchase, orders or payment | Done | Merchandise is display-only |
| Media licensing respected | Done | All bundled media generated for the project; see CREDITS.md |

## 1.6 Functional requirements

### User authentication and management
| Requirement | Status | Where |
|---|---|---|
| Secure session management | Done | JWT access token + rotating hashed refresh tokens, logout revokes |
| Forgot / reset password | Done | `/forgot-password`, `/reset-password` (tokenized link) |
| Email verification / tokenized link | Done | `/verify-email`, resend from dashboard |
| Profile with editable favorite fandoms, categories of interest, display preferences | Done | `/profile` |
| Optional avatar upload | Done | `/profile` (upload + crop, remove) |

### Personalized dashboard
| Requirement | Status | Where |
|---|---|---|
| Greeting, recent activity, favorite fandoms, bookmarked items | Done | `/dashboard` (also KPIs, charts, recommendations, notifications, upcoming events) |

### Fandom content explorer
| Requirement | Status | Where |
|---|---|---|
| Curated articles, profiles and media across all categories from the database | Done | `/explore`, realm pages, `/characters`, `/articles`, `/media` |
| Multi-level search and filters: category, genre, release year, popularity, content type | Done | `/explore` filter sidebar |
| Sorting: latest, most popular, alphabetical | Done | `/explore` (also top rated) |

### AI-powered chatbot (optional)
| Requirement | Status | Where |
|---|---|---|
| Answers platform and content FAQs | Done | Floating assistant, admin-managed knowledge base |
| Recommends content from preferences and conversation context | Done | "Recommend something", mentions of a realm |
| Multi-step onboarding flow | Done | "Guide me through Fan Hub Plus" (4 steps) |
| Chat history stored for continuity | Done | `/chat-history`; admin query log |

### Interactive multimedia center
| Requirement | Status | Where |
|---|---|---|
| Embedded videos, trailers, audio (podcasts / soundtracks), animated explainers | Done | `/media`, content detail trailers |
| Admin-controlled tagging and categorization of media | Done | Admin > Media gallery |
| User rating: 5-star or thumbs up / down | Done | Content and media detail pages |

### Character profiles and featured articles
| Requirement | Status | Where |
|---|---|---|
| Card-based character profiles with fandom and category filters | Done | `/characters` |
| Featured articles with rich text, embedded images, timeline highlights | Done | `/articles/:slug` |
| Event highlights in storytelling format | Done | `/events/highlights` |
| Users submit fan content (admin approval) | Done | `/submit`, `/submissions/mine`, Admin > Fan submissions, public `/community` |

### Merchandise showcase and resource library
| Requirement | Status | Where |
|---|---|---|
| Galleries grouped by fandom and category | Done | `/merchandise` (group toggle), item gallery |
| Upcoming releases (anime, games, movies, shows, comics, merch drops) | Done | `/merchandise/upcoming`, home section |
| Backend-driven tags (Limited Edition, Pre-Order, Collectible) | Done | Tags admin, shown on cards |
| Optional: admin tracks view count and popularity | Done | View logging on every detail view; Admin > Analytics |

### Feedback and analytics
| Requirement | Status | Where |
|---|---|---|
| Feedback form with type (bug, suggestion, query) | Done | `/feedback`; admin status workflow |

### Bookmarking, notes and sharing
| Requirement | Status | Where |
|---|---|---|
| Bookmark articles, characters, videos, merchandise (and titles, events) | Done | Bookmark button on every card and detail page |
| Notes on bookmarks | Done | `/bookmarks` |
| Sharing | Done | Share menu: copy link, WhatsApp, X, Facebook |

### Location-aware event discovery and calendar
| Requirement | Status | Where |
|---|---|---|
| Map + GPS to discover nearby conventions, meetups, screenings | Done | `/events` (Near me + radius, Leaflet map, 3D globe on home) |
| Event calendar filterable by city with ticket links | Done | `/events` calendar view, event detail |

### Admin control panel
| Requirement | Status | Where |
|---|---|---|
| Add / edit / remove category content | Done | Admin > Content catalog, Categories, Genres, Tags |
| Multimedia, character profiles, featured articles | Done | Admin > Media gallery, Characters, Articles (plus Merchandise, Upcoming, Events) |
| Chatbot FAQ entries and knowledge base | Done | Admin > Chatbot |
| User feedback and fan-submitted content | Done | Admin > Feedback, Fan submissions |
| Usage statistics: active users, popular categories, chatbot volume | Done | Admin > Overview and Analytics (date range, CSV export) |
| User management | Done | Admin > Users (roles, block, delete) |

### Accessibility and UI enhancements
| Requirement | Status | Where |
|---|---|---|
| Dark mode toggle | Done | Navbar display menu, profile preferences |
| Font-size adjustment | Done | A- / A / A+ in navbar and profile |
| Breadcrumbs | Done | Realm, detail and listing pages |
| Smooth transitions and loading spinners | Done | Route progress bar, spinners, skeletons, page transitions, reduced-motion option |

## 1.7 Non-functional requirements

| Requirement | How it is met |
|---|---|
| Safe to use | No downloads except the optional CSV export an admin requests; uploads restricted to image types and size; HTML sanitized on the server |
| Accessibility | Legible font scale, focus rings, ARIA labels, keyboard navigation, reduced-motion mode, alt text |
| User-friendliness | Mega menu, search palette (Ctrl + K), breadcrumbs, sitemap, assistant |
| Operability | Global exception middleware, validation messages, empty and error states |
| Performance | Lazy-loaded routes, WebP images, pausing off-screen 3D, split queries, paging, response caching headers for media |
| Scalability | Layered API (controllers, services, repository), generic admin CRUD, stateless JWT auth |
| Security | PBKDF2 password hashing, JWT + refresh rotation, role-based authorization, rate limiting on auth endpoints, input validation |
| Availability | Stateless API suitable for IIS / Azure / container hosting (README section 8) |
| Compatibility | Evergreen browsers, responsive from 360px to wide desktop |

## 1.8 Interface requirements and database design

| Requirement | Status |
|---|---|
| Frontend: HTML5, CSS3, Bootstrap, Angular, TypeScript | Done |
| Backend: C# with ASP.NET Core | Done |
| Database: SQL Server | Done - `database/schema.sql` |
| Entities: User, Category, Content, Character Profile, Merchandise Item, Bookmark, Chatbot Query, Feedback (+ supporting tables) | Done |
| Relationships: User-Category many-to-many; Category one-to-many content, characters, merchandise; User one-to-many bookmarks, queries, feedback | Done |

## 1.9 Deliverables

| Deliverable | Status |
|---|---|
| SQL script files | `database/schema.sql`, `database/seed.sql` |
| Installation instructions | README section 3 |
| Credentials for all user types | README section 4 |
| Test data description | README section 6 |
| Assumptions | README section 9 (copy into ReadMe.doc) |
| Project report (problem definition, design, flowcharts / DFDs, database design) | To be written by the team |
| Demo video (.mp4) | To be recorded - follow DEMO_SCRIPT.md |
| Hosted URL (preferred) | Hosting steps in README section 8 |
