# Fan Hub Plus (Multiverse Fandom Universe)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-fan--hub--plus.runasp.net-gold?style=for-the-badge&logo=google-chrome&logoColor=white)](http://fan-hub-plus.runasp.net)
[![Angular](https://img.shields.io/badge/Frontend-Angular%2020-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev/)
[![.NET 8](https://img.shields.io/badge/Backend-.NET%208%20Web%20API-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![SQL Server](https://img.shields.io/badge/Database-SQL%20Server-CC292B?style=for-the-badge&logo=microsoft-sql-server&logoColor=white)](https://www.microsoft.com/sql-server)
[![Three.js](https://img.shields.io/badge/3D%20Graphics-Three.js-000000?style=for-the-badge&logo=threedotjs&logoColor=white)](https://threejs.org/)

**Fan Hub Plus** is a next-generation fandom universe web application that unites eight multiverse realms — **Anime, Gaming, Movies, TV Shows, K-Pop, Comics, Manga, and Cosplay** — into one cohesive, interactive portal.

---

## 🌐 Live Production URL

* **Website URL:** [http://fan-hub-plus.runasp.net](http://fan-hub-plus.runasp.net)
* **Hosted on:** MonsterASP (.NET 8 + Angular Single-Host on IIS)
* **Database:** Microsoft SQL Server (Hosted on `databaseasp.net`)

---

## 🚀 Key Features & Recent Enhancements

### 1. 🎛️ Admin Media Management & PC File Uploads
* **Direct PC File Upload:** Admins can now upload video (`.mp4`, `.webm`, `.mov`, `.mkv`) and audio (`.mp3`, `.wav`, `.m4a`) files directly from their local computer (up to **200 MB**).
* **Automatic File Handling:** Uploaded media is securely stored under `wwwroot/media/uploads/` with unique GUID-based filenames.
* **Smart Embed Detection:** The platform automatically sets `embedType` to `file` for local uploads and `youtube` for external video links.
* **High-Capacity Limits:** Backend configured with custom `FormOptions`, `IISServerOptions`, and `web.config` `requestFiltering` supporting uploads up to 250 MB.

### 2. 🎵 Synchronized Multimedia Center & Seamless Route Navigation
* **Global Navigation Pause:** Navigating between pages, categories, or realms immediately pauses all currently playing `<audio>`, `<video>`, and YouTube `<iframe>` elements via Angular's `NavigationStart` lifecycle hooks.
* **Component Teardown Cleanup:** Implemented `OnDestroy` lifecycle hooks across `VideoPlayerComponent`, `AudioPlayerComponent`, and `RealmComponent` to prevent persistent background sound.
* **Mutual Playback Exclusion:** Playing any media file automatically pauses any other media running on the page.

### 3. 🔐 Authentication & Clean Login Experience
* **Professional Login View:** Clean, production-ready royal login interface with email and password authentication.
* **Role-Based Access Control (RBAC):** Distinct permissions and dashboards for Visitors, Registered Members, and Superadmins.
* **Session Persistence:** Secure JWT access tokens with sliding refresh token mechanics.

### 4. ⚔️ Multiverse Realms & Character Legends
* **Eight Unique Realms:** Dedicated spaces for Anime, Gaming, Movies, TV Shows, K-Pop, Comics, Manga, and Cosplay.
* **Interactive Character Legends:** Character cards with 3D flip animation, lore, stat meters (STR, INT, AGI, CHA), and filterable category tags.
* **Merchandise Showcase:** Showcase of authentic collectible items with high-resolution imagery and upcoming release calendars.

### 5. 🌌 3D Hero Stages & Mobile Fallback Safeguards
* **Interactive WebGL Hero Stages:** Three.js-powered 3D characters and particle fields reacting to mouse movement and scroll.
* **Mobile-Safe Execution:** Fallback `try/catch` and low-power modes ensure smooth performance on all mobile devices and low-spec hardware without crashing.

### 6. 🗺️ Global Fandom Events Map
* **Interactive Leaflet Map:** Displays global fan conventions, tournaments, screenings, and meetups with GPS coordinates, CARTO dark tiles, and ticket booking links.

### 7. 🤖 Built-In Multiverse AI Chatbot
* **Assistant Knowledge Base:** Instant responses to FAQs, lore questions, realm recommendations, and platform navigation with saved chat history for logged-in members.

---

## 🔑 Default User Credentials

| Role | Email Address | Password | Permissions & Access |
|---|---|---|---|
| **Super Admin** | `admin@fanhubplus.com` | `Admin@123` | Full access to `/admin` dashboard, media uploads, analytics, user management, and content moderation |
| **Member (User)** | `ayesha@fanhubplus.com` | `User@123` | Full access to bookmarks, ratings, fan submissions, personalized realm feeds, and profile settings |
| **Member (User)** | `bilal@fanhubplus.com` | `User@123` | Member with pending fan submissions |
| **Member (User)** | `sara@fanhubplus.com` | `User@123` | Active member profile |
| **Member (User)** | `omar@fanhubplus.com` | `User@123` | Active member profile |
| **Visitor** | *(No login required)* | - | Browse home, explore realms, read articles, view trailers with sign-in prompts |

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | Angular 20 | Standalone components, reactive Signals, SCSS, Bootstrap 5 grid |
| **3D & Animation** | Three.js & GSAP | Custom 3D scenes, shaders, ScrollTrigger, Lenis smooth scroll |
| **Maps** | Leaflet | OpenStreetMap / CARTO dark tiles, custom markers |
| **Backend API** | ASP.NET Core 8 (C#) | RESTful API, EF Core 8, AutoMapper, FluentValidation, Serilog |
| **Database** | Microsoft SQL Server | Relational schema, indexed foreign keys, seeded catalog |
| **Security** | JWT & PBKDF2 | Bearer token authorization, password salting & hashing |
| **Deployment** | IIS / MonsterASP | Single-host architecture serving Angular SPA from API `wwwroot` |

---

## 📂 Project Architecture

```
FanHubPlus/
├── backend/
│   └── FanHubPlus.Api/           # ASP.NET Core 8 Web API
│       ├── Controllers/          # Admin, Auth, Site, Content, and User endpoints
│       ├── Data/                 # AppDbContext, Seed scripts, and DbSeeder
│       ├── DTOs/                 # Request and response data transfer objects
│       ├── Entities/             # EF Core data entities
│       ├── Middleware/           # Global exception handling and JWT validation
│       ├── Services/             # Storage, Email, Token, and Business services
│       └── wwwroot/              # Static files, uploaded media, and compiled Angular SPA
├── frontend/                     # Angular 20 Client Application
│   ├── src/app/core/             # Services, guards, interceptors, models, Three.js core
│   ├── src/app/features/         # Modules: Admin, Auth, Home, Realm, Media, Characters, etc.
│   ├── src/app/layout/           # Navbar, footer, preloader, chatbot, overlays
│   └── src/app/shared/           # Cards, video/audio players, maps, modals, basics
└── database/
    ├── schema.sql                # Complete database schema (tables, constraints, indexes)
    └── seed.sql                  # Seed data for users, categories, characters, media, etc.
```

---

## 💻 Local Setup & Development

### 1. Prerequisites
* [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
* [Node.js (v20+ or v22+)](https://nodejs.org/) & `npm`
* [SQL Server (LocalDB, Express, or Full)](https://www.microsoft.com/sql-server)

### 2. Database Configuration
Update the connection string in `backend/FanHubPlus.Api/appsettings.json`:
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Database=FanHubPlus;Trusted_Connection=True;TrustServerCertificate=True"
}
```
*(On first run, the API automatically verifies and applies schema/seed if the database is fresh).*

### 3. Run the Backend API
```powershell
cd backend/FanHubPlus.Api
dotnet restore
dotnet run
```
* API runs at: `http://localhost:5080`
* Swagger Documentation: `http://localhost:5080/swagger`

### 4. Run the Angular Frontend
```powershell
cd frontend
npm install
npm start
```
* Frontend runs at: `http://localhost:4200`
* Requests to `/api`, `/media`, and `/uploads` are automatically proxied to the backend.

---

## 📦 Production Build & Deployment

To generate a single-host deployment package:
```powershell
# 1. Build the Angular SPA into the API's wwwroot directory
cd frontend
npm run build:api

# 2. Publish the ASP.NET Core API
cd ../backend/FanHubPlus.Api
dotnet publish -c Release -o ./publish
```
Copy the contents of `./publish` to your IIS / MonsterASP web root folder.

---

## 📄 License & Credits
Developed as an advanced full-stack fandom portal showcase. All franchise references and artworks are used for portfolio and educational demonstration.
