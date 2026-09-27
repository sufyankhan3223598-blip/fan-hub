# Fan Hub Plus

**Fandom Universe portal for fans** - a full-stack web application that brings eight fandom realms (Anime, Gaming, Movies, TV Shows, K-Pop, Comics, Manga, Cosplay) into one immersive hub.

| Layer | Technology |
|---|---|
| Frontend | Angular 20 (standalone components, signals, zoneless), TypeScript, SCSS, Bootstrap 5 grid |
| 3D and motion | Three.js, GSAP + ScrollTrigger, Lenis smooth scroll |
| Maps | Leaflet (CARTO dark / light tiles) |
| Backend | ASP.NET Core 8 Web API (C#), Entity Framework Core 8, FluentValidation, AutoMapper, Serilog, Swagger |
| Database | Microsoft SQL Server (LocalDB, Express or full) |
| Auth | JWT access tokens + rotating refresh tokens, PBKDF2 password hashing, role-based authorization |

---

## 1. Folder structure

```
FanHubPlus/
  backend/
    FanHubPlus.sln
    FanHubPlus.Api/            ASP.NET Core Web API
      Controllers/             REST endpoints (public, member, admin)
      Data/                    DbContext + database initializer
      DTOs/  Entities/  Mapping/  Middleware/  Repositories/  Services/  Validators/
      wwwroot/media/           seeded images, audio and video
      wwwroot/uploads/         user and admin uploads (created at runtime)
  frontend/                    Angular client
    src/app/core/              services, guards, interceptors, models, pipes, Three.js scenes
    src/app/shared/            reusable components (cards, charts, players, map, globe, editor...)
    src/app/layout/            navbar, footer, preloader, chatbot, overlays
    src/app/features/          pages (home, realms, explore, detail pages, user area, admin panel...)
    public/                    fonts, 3D models, globe data, favicon
  database/
    schema.sql                 database and table definitions (SQL Server)
    seed.sql                   test data (users, catalog, media, events, activity...)
  tools/                       Python scripts used to generate the seed data and artwork
  README.md  CREDITS.md  DEMO_SCRIPT.md  SRS_CHECKLIST.md
```

---

## 2. Prerequisites

| Software | Version | Notes |
|---|---|---|
| .NET SDK | 8.0 or newer | `dotnet --version` |
| Node.js | 20.19+ or 22.12+ | required by Angular 20 |
| npm | 10+ | ships with Node |
| SQL Server | LocalDB, Express 2019+, or full SQL Server | LocalDB is installed with Visual Studio |
| IDE (optional) | Visual Studio 2022 / VS Code | |

---

## 3. Installation

### Step 1 - Database

Choose **one** option.

**Option A - automatic (recommended).**
Nothing to do. On first start the API creates the `FanHubPlus` database, all tables and loads the test data from `database/seed.sql`.

**Option B - manual (SSMS / Azure Data Studio).**
1. Open `database/schema.sql` and execute it. It creates the `FanHubPlus` database and every table, key and index.
2. Open `database/seed.sql` and execute it against `FanHubPlus`.
3. The API detects the existing data and skips seeding.

**Connection string.** Edit `backend/FanHubPlus.Api/appsettings.json`:

```
"DefaultConnection": "Server=(localdb)\\MSSQLLocalDB;Database=FanHubPlus;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True"
```

Examples for other servers:

- SQL Express: `Server=.\\SQLEXPRESS;Database=FanHubPlus;Trusted_Connection=True;TrustServerCertificate=True`
- SQL login: `Server=localhost,1433;Database=FanHubPlus;User Id=sa;Password=YourPassword;TrustServerCertificate=True`

### Step 2 - Backend API

```
cd backend/FanHubPlus.Api
dotnet restore
dotnet run
```

- API: `http://localhost:5080`
- Swagger UI: `http://localhost:5080/swagger`
- Health check: `http://localhost:5080/api/health`

Visual Studio: open `backend/FanHubPlus.sln`, set **FanHubPlus.Api** as the startup project and press F5.

### Step 3 - Frontend

```
cd frontend
npm install
npm start
```

The app opens at `http://localhost:4200`. The dev server proxies `/api`, `/media` and `/uploads` to the API on port 5080 (`proxy.conf.json`), so start the API first.

### Optional configuration (`appsettings.json`)

| Section | Purpose | Default behaviour |
|---|---|---|
| `Jwt:Key` | token signing key | change it before deploying (32+ characters) |
| `Smtp` | real email delivery for verification and password reset | when empty, emails are written to the API log and the UI shows a **development link** so the flow can be tested without a mail server |
| `Chatbot:ApiKey` | optional LLM for free-form answers | when empty, the built-in knowledge base (FAQ matching, recommendations, onboarding flow) answers everything |
| `Cors:Origins` | allowed frontend origins | `http://localhost:4200` |

---

## 4. User credentials

| Role | Email | Password | What to try |
|---|---|---|---|
| **Administrator** | admin@fanhubplus.com | Admin@123 | Admin control panel (`/admin`): analytics, users, moderation, feedback, chatbot, all content modules |
| **Registered user** | ayesha@fanhubplus.com | User@123 | Dashboard, bookmarks with notes, ratings, submissions, chat history |
| **Registered user** | bilal@fanhubplus.com | User@123 | Has pending fan submissions |
| **Registered user** | sara@fanhubplus.com | User@123 | |
| **Registered user** | omar@fanhubplus.com | User@123 | |
| **Visitor** | no account | - | Browse without logging in: home, realms, explore, FAQ, chatbot, teasers with "Login to unlock" |

New accounts can be created at `/register`.

---

## 5. Roles and access

| Feature | Visitor | Registered user | Admin |
|---|---|---|---|
| Home, About, Sitemap, FAQ, realm pages | Yes | Yes | Yes |
| Full details, media playback, character and article pages, merchandise, events | Teaser + "Login to unlock" | Yes | Yes |
| Search | Basic | Full filters and sorting | Full |
| Chatbot | FAQ help | + saved history, recommendations | Yes |
| Dashboard, profile, bookmarks and notes, ratings, fan submissions | No | Yes | Yes |
| Admin control panel | No | No | Yes |

Access is enforced twice: Angular route guards in the browser and `[Authorize]` / role policies on every protected API endpoint.

---

## 6. Test data (seed)

`database/seed.sql` contains:

| Data | Count | Notes |
|---|---|---|
| Roles | 3 | Visitor, User, Admin |
| Users | 5 | 1 admin, 4 members (passwords are hashed) |
| Categories (realms) | 8 | each with accent colors, tagline and artwork |
| Genres / Tags | 30 / 12 | tags include Limited Edition, Pre-Order, Collectible |
| Content titles | 96 | 12 per realm: series, films, games, albums, manga, comics, cosplay guides |
| Media items | 24 | trailers, explainers, soundtracks, podcasts (local files and YouTube embeds) |
| Character profiles | 32 | bio, power, quote and stat bars |
| Articles | 12 | rich text with 54 timeline milestones |
| Merchandise | 32 | 96 gallery images, display only |
| Upcoming releases | 16 | release calendar with countdowns |
| Events | 24 | conventions, meetups, premieres, screenings with coordinates and ticket links |
| Chatbot FAQs | 33 | knowledge base for the assistant and the FAQ page |
| Activity | 1,600 views, 36 bookmarks, 45 ratings, 166 activity entries, 180 chatbot queries | spread over the last 30 days so dashboards and analytics have real trends |
| Community | 8 fan submissions (approved, pending, rejected), 10 feedback entries, 13 notifications | |

The scripts in `tools/` regenerate `seed.sql` and the artwork (`python tools/build_seed.py`).

---

## 7. Database design (summary)

Main entities and relationships:

- **User** (Role FK) - many-to-many with **Category** (interests) and one-to-many favorite fandoms
- **Category** 1-to-many **Content**, **MediaItem**, **CharacterProfile**, **Article**, **MerchandiseItem**, **UpcomingRelease**, **Event**
- **Content** many-to-many **Genre** and **Tag**; MediaItem, Merchandise and UpcomingRelease many-to-many **Tag**
- **Article** 1-to-many **ArticleTimelineItem**; **MerchandiseItem** 1-to-many **MerchandiseImage**
- **User** 1-to-many **Bookmark** (polymorphic item type + id, with note), **Rating**, **FanSubmission**, **Feedback**, **ChatbotQuery**, **Notification**, **UserActivity**, **RefreshToken**
- **ViewLog** records every detail view (used for view counts, popularity and analytics)
- **ChatbotFaq** holds the assistant's knowledge base

Full definitions, keys and indexes are in `database/schema.sql`.

---

## 8. Production build and hosting

### Single host (API serves the Angular app)

```
cd frontend
npm run build:api
cd ../backend/FanHubPlus.Api
dotnet publish -c Release -o ./publish
```

`build:api` builds Angular and copies it into the API's `wwwroot`, so one site serves the SPA, the REST API and the media.

### IIS (Windows)
1. Install the **ASP.NET Core 8 Hosting Bundle**.
2. Create a site pointing at the `publish` folder (application pool: No Managed Code).
3. Set the production connection string and `Jwt:Key` (environment variables `ConnectionStrings__DefaultConnection`, `Jwt__Key`, or `appsettings.Production.json`).
4. Give the app pool identity write access to `wwwroot/uploads`.

### Azure App Service + Azure SQL
1. Create an Azure SQL database and run `schema.sql` then `seed.sql` (or let the app seed it on first start).
2. Create a Linux or Windows App Service (.NET 8) and deploy the `publish` folder (VS Publish, `az webapp deploy`, or GitHub Actions).
3. Add `ConnectionStrings__DefaultConnection` and `Jwt__Key` in **Configuration**.

### Render / other container hosts
Use a .NET 8 Docker image, publish the API as above, expose port 8080 (`ASPNETCORE_URLS=http://+:8080`) and point the connection string at any hosted SQL Server.

### Separate frontend host (Netlify / Vercel / static)
Build with `npm run build`, deploy `frontend/dist/fan-hub-plus/browser`, set `apiUrl` and `assetOrigin` in `src/environments/environment.ts` to the API URL, add a SPA rewrite to `index.html`, and add the frontend origin to `Cors:Origins`.

---

## 9. Assumptions

1. No purchasing, cart, orders or payments - merchandise is a showcase only (SRS 1.5).
2. Visitors can use the FAQ-level chatbot; saved chat history and recommendations require an account.
3. Email verification is recommended but not required to log in; unverified users see a reminder banner.
4. Without SMTP settings, email links are shown in the UI and API log (development mode) so the flows can be demonstrated offline.
5. "Nearby events" uses the browser's location permission; if denied, the user can pick a city instead.
6. Franchise names are used for fan information only. Images, audio and video in `wwwroot/media` were generated for this project; trailers of real franchises are not bundled. See `CREDITS.md`.
7. The built-in chatbot needs no paid key. An LLM key is optional.
8. Times are stored in UTC and shown in the viewer's local time.

---

## 10. Useful commands

| Task | Command |
|---|---|
| Run API with hot reload | `dotnet watch run` (in `backend/FanHubPlus.Api`) |
| Create EF migration (optional) | `dotnet ef migrations add InitialCreate` - the app then applies migrations instead of `EnsureCreated` |
| Reset database | drop the `FanHubPlus` database and restart the API |
| Frontend production build | `npm run build` |
| UI kit / style guide | open `/ui-kit` in the app |

---

## 11. Project report and demo video

The SRS requires a project report (problem definition, design specifications, flowcharts / DFDs, database design, test data, installation steps and credentials), a `ReadMe.doc` with assumptions, and a demo video (.mp4). Sections 3, 4, 6, 7 and 9 above give the technical facts to use; `DEMO_SCRIPT.md` lists every feature to show while recording. The SRS asks teams to write the report themselves and to acknowledge every AI tool used - see `CREDITS.md`.
