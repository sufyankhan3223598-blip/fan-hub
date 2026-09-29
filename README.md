<div align="center">

# FanHub Plus
### Next-Generation Fandom Universe & Multiverse Content Portal
**Angular 20 (Signals & Standalone) | ASP.NET Core 8 Web API | Microsoft SQL Server | Three.js WebGL 2.0 | Leaflet GIS**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-fan--hub--plus.runasp.net-7B2FBE?style=for-the-badge&logo=google-chrome&logoColor=white)](http://fan-hub-plus.runasp.net)
[![Angular](https://img.shields.io/badge/Frontend-Angular%2020-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev/)
[![.NET 8](https://img.shields.io/badge/Backend-.NET%208%20Web%20API-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![SQL Server](https://img.shields.io/badge/Database-SQL%20Server-CC292B?style=for-the-badge&logo=microsoft-sql-server&logoColor=white)](https://www.microsoft.com/sql-server)
[![Three.js](https://img.shields.io/badge/3D%20Graphics-Three.js-000000?style=for-the-badge&logo=threedotjs&logoColor=white)](https://threejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

---

**Live Demo URL:** [http://fan-hub-plus.runasp.net](http://fan-hub-plus.runasp.net)  
**Competition Entry:** TechWiz 7 — The World Tech Championship (End-to-End Web Solutions)  
**Team:** **MLR_DOMINATORS** | **Organization:** Aptech Limited

</div>

---

**Fan Hub Plus** is an enterprise-grade, interactive fandom super-hub uniting eight rich pop-culture domains — **Anime, Gaming, Movies, TV Shows, K-Pop, Comics, Manga, and Cosplay** — under a single cohesive digital ecosystem. It fuses real-time **Three.js WebGL 2.0 3D realm stages**, high-capacity multimedia streaming with PC file upload capabilities (**up to 200 MB**), location-aware **Leaflet GIS convention mapping**, an **AI-powered conversational assistant with a 4-step onboarding flow**, and fine-grained **Role-Based Access Control (RBAC)** for fans and administrators.

---

## Contents
1. [System Architecture](#1-system-architecture)
2. [Key Features](#2-key-features)
3. [How the Platform Works](#3-how-the-platform-works)
4. [Prerequisites](#4-prerequisites)
5. [Quick Start](#5-quick-start)
6. [Demo Accounts](#6-demo-accounts)
7. [User Roles](#7-user-roles)
8. [Multiverse Realms & Media Management](#8-multiverse-realms--media-management)
9. [API Endpoints](#9-api-endpoints)
10. [Project Structure](#10-project-structure)
11. [Testing & Quality Checks](#11-testing--quality-checks)
12. [Troubleshooting & FAQs](#12-troubleshooting--faqs)
13. [Documentation & Project Deliverables](#13-documentation--project-deliverables)
14. [License & Team Credits](#14-license--team-credits)

---

## 1. System Architecture

```
                       ┌──────────────────────────────────────────────┐
                       │           Incoming Fan / Administrator        │
                       │             (Browser / Mobile Device)        │
                       └──────────────────────┬───────────────────────┘
                                              │
                         HTTPS / JSON Requests & Static Assets
                                              │
                                              ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                             FRONTEND TIER (Angular 20 SPA)                                  │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌─────────────────────────────────┐  │
│  │  Three.js 3D Engine   │  │   Leaflet GIS Engine  │  │  Angular Signals Reactive State │  │
│  │ (WebGL Hero Stages,   │  │ (Global Convention    │  │ (Auth Store, Audio/Video Sync,  │  │
│  │  Aura Particle Ki)    │  │  Map, GPS Radius)     │  │  Catalog Filters, Chat Drawer)  │  │
│  └───────────────────────┘  └───────────────────────┘  └─────────────────────────────────┘  │
└─────────────────────────────────────────────┬───────────────────────────────────────────────┘
                                              │
                                RESTful API Calls (/api)
                                              │
                                              ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            BACKEND API TIER (ASP.NET Core 8)                                │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────────┐  │
│  │     REST Controllers    │  │     Security & Auth     │  │     Domain Services         │  │
│  │ (Admin, Catalog, Auth,  │  │ (JWT Bearer, Refresh    │  │ (Chatbot NLP Engine,        │  │
│  │  Media, Events, FAQs)   │  │  Tokens, PBKDF2 Hash)   │  │  Recommendation, MailKit)  │  │
│  └─────────────────────────┘  └─────────────────────────┘  └─────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                 Entity Framework Core 8 (AppDbContext & Fluent API)                   │  │
│  └───────────────────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┬───────────────────────────────┘
                        │                                     │
           T-SQL Queries & Migrations             Static Media I/O & Uploads
                        │                                     │
                        ▼                                     ▼
        ┌───────────────────────────────┐     ┌───────────────────────────────┐
        │       DATABASE TIER           │     │       STORAGE & EXTERNAL      │
        │   Microsoft SQL Server 2022   │     │  wwwroot/media (200MB Uploads)│
        │  (22 Relational DB Tables)    │     │  OpenAI API / Local Knowledge │
        └───────────────────────────────┘     └───────────────────────────────┘
```

* **Frontend Client:** Built using **Angular 20** with Standalone Components and fine-grained reactive **Signals**. Enhanced with **Three.js** for hardware-accelerated 3D realm stages and **Leaflet.js** for global fan event mapping.
* **Backend API:** Layered RESTful web service built with **ASP.NET Core 8 (C#)**, secured with signed JWT access tokens and sliding refresh tokens.
* **Data Persistence:** **Microsoft SQL Server** with **Entity Framework Core 8**, enforcing strict relational integrity, foreign key cascades, and unique constraints across 22 normalized tables.
* **Media & File Handling:** Direct multipart form file uploads supporting video and audio files up to **200 MB** directly stored in web root with GUID sanitization.

---

## 2. Key Features

* **🌌 Interactive Three.js 3D WebGL Realm Stages:** Real-time 3D volumetric character models (Super Saiyan God Goku with God Ki particle vortex, Captain America with curved shield geometry) reacting dynamically to cursor tilt and mouse parallax.
* **🎬 High-Capacity Local Media Uploads (200 MB):** Admins can upload native video (`.mp4`, `.webm`, `.mov`, `.mkv`) and audio (`.mp3`, `.wav`, `.m4a`) files directly from their desktop.
* **🔇 Synchronized Multimedia & Auto-Pause on Navigation:** Route changes instantly pause background `<audio>`, `<video>`, and YouTube iframes. Only one media file can play at any time across the entire platform.
* **🤖 Multi-Step Conversational AI Chatbot:** Features a guided 4-step interactive onboarding walkthrough (Realm Discovery → Recommendation Engine → Explorer Tour → Event Calendar CTA) with intent classification and offline FAQ fallback.
* **🗺️ Location-Aware Event Discovery & GIS Map:** Interactive Leaflet world map with CARTO dark tiles plotting global Comic-Cons, Anime Expos, and screenings with real-time browser GPS distance calculation.
* **⏳ Upcoming Releases Hub & 3D Gyroscopic Tilt Cards:** Signal-driven countdown ticker actively calculating days/hours/minutes until worldwide drop dates, paired with dual-state card flip interactions.
* **⭐ Dual-Mode Rating & Review Engine:** Granular 5-star rating system combined with binary Thumbs-Up/Down reaction counters and spam prevention.
* **🔖 Personalized Fan Dashboard:** Central user hub with custom favorite fandom badges, personal saved bookmarks with custom timestamped notes, and community fan article submission tracking.
* **🛡️ Admin Knowledge Base & Query Desk Studio:** Control suite to hot-sync chatbot FAQ knowledge records without application downtime, plus an unanswered query audit log with 1-click FAQ promotion.

---

## 3. How the Platform Works

```
  1. Discovery ──────► 2. Authentication ──► 3. Personalization ──► 4. Interactive Media ──► 5. Admin Moderation
  Visitor browses      User signs up or      Fan dashboard picks     Streams trailer/OST,     Admin reviews fan
  8 realms, maps,      logs in with JWT      favorite realms,        adds 5-star review &     submissions, uploads
  3D WebGL stages      session credentials   saves custom notes      uses AI assistant        media & checks stats
```

1. **Guest Multiverse Discovery:** Visitors arrive at the landing page to experience the 3D cosmic portal, browse through the 8 designated realms, and search through curated content.
2. **Onboarding & AI Guidance:** The slide-out AI assistant greets new visitors, recommending content based on their chosen realm preferences.
3. **Secure Fan Authentication:** Users create an account or use one-click demo credentials. Stateless JWT Bearer tokens provide immediate, secure access.
4. **Interactive Engagement:** Members bookmark favorite characters and merchandise with custom private annotations, stream high-definition trailers, and rate content.
5. **Community Submissions:** Fans submit original cosplay tutorials or lore essays through the community submission portal (queued for approval).
6. **Administrative Governance:** Superadmins log in to review pending submissions, upload local video/audio files up to 200 MB, manage knowledge base FAQs, and review analytics telemetry.

---

## 4. Prerequisites

| Requirement | Supported Version | Verification Command | Notes |
|---|---|---|---|
| **Node.js** | `v20.19+` or `v22.12+` (LTS) | `node -v` | Required for Angular 20 build pipeline |
| **npm** | `v10.0+` | `npm -v` | Bundled with Node.js |
| **.NET SDK** | `8.0` or `9.0/10.0` | `dotnet --version` | ASP.NET Core Web API runtime |
| **Microsoft SQL Server**| LocalDB, Express 2019+, or 2022 | `sqlcmd -?` | Localhost instance `.\SQLEXPRESS` |
| **Modern Browser** | Chrome 110+, Edge 110+, Firefox 115+ | — | Hardware-accelerated WebGL 2.0 enabled |

---

## 5. Quick Start

### Option A: One-Click Automated Launch (Recommended)
Simply double-click the automated runner script located at the project root:
```cmd
Project\run_project.bat
```
*Automatically starts SQL Server Express, launches the Backend API on port `5080`, and starts the Angular Frontend on port `4200`.*

---

### Option B: Manual Command-Line Launch

#### 1. Clone the Repository
```bash
git clone https://github.com/sufyankhan3223598-blip/fan-hub.git
cd fan-hub
```

#### 2. Configure Database Connection
Open `backend/FanHubPlus.Api/appsettings.json` and set your connection string:
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=.\\SQLEXPRESS;Database=FanHubPlus;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"
}
```
*(On first API startup, Entity Framework Core automatically creates the database and populates all test data).*

#### 3. Start the Backend API (Terminal 1)
```powershell
cd backend/FanHubPlus.Api
dotnet restore
dotnet run --urls "http://localhost:5080"
```
* **API Base:** `http://localhost:5080`
* **Swagger API UI:** `http://localhost:5080/swagger`
* **Health Check:** `http://localhost:5080/api/health`

#### 4. Start the Frontend Client (Terminal 2)
```powershell
cd frontend
npm install
npm start
```
* **Application URL:** `http://localhost:4200`  
*(Requests to `/api`, `/media`, and `/uploads` are automatically proxied to the backend).*

---

## 6. Demo Accounts

The database comes pre-seeded with authenticated demonstration accounts representing every tier:

| Role | Name | Email Address | Password | Permissions & Access Scope |
|---|---|---|---|---|
| **Super Admin** | System Administrator | `admin@fanhubplus.com` | `Admin@123` | Full access to `/admin` control suite, 200MB media uploads, FAQ manager, user management, and moderation queue |
| **Registered Member** | Ayesha Khan | `ayesha@fanhubplus.com` | `User@123` | Personalized dashboard, bookmarks with notes, rating reviews, avatar profile personalization |
| **Registered Member** | Bilal Ahmed | `bilal@fanhubplus.com` | `User@123` | Active member profile with pending fan article submissions |
| **Registered Member** | Sara Malik | `sara@fanhubplus.com` | `User@123` | Active member profile (Favorite realms: K-Pop & Movies) |
| **Registered Member** | Omar Farooq | `omar@fanhubplus.com` | `User@123` | Active member profile (Favorite realms: Comics & Cosplay) |
| **Visitor (Guest)** | Public Guest | *(No account needed)* | — | Unrestricted catalog browsing, video streaming, event map discovery, AI assistant |

---

## 7. User Roles

| Role | Purpose | Key Capabilities |
|---|---|---|
| **Visitor (Guest)** | Discover and explore the fandom multiverse | Browse all 8 realms, stream media trailers, interact with 3D stages, search catalog, use Leaflet convention map, query AI assistant. Read-only access to reviews. |
| **Registered Member** | Participate in the fandom community | Full personal dashboard, create/edit bookmarks with private notes, submit 5-star ratings, submit fan articles and cosplay builds, customize display theme and avatar. |
| **Super Administrator** | System governance and content management | Complete CRUD control over realms, contents, media files, and character profiles. Upload local media up to 200 MB. Approve/reject fan submissions. Manage chatbot FAQs and inspect live system telemetry. |

---

## 8. Multiverse Realms & Media Management

### The 8 Multiverse Realms
* **🔴 Anime:** Featuring *Dragon Ball*, *Demon Slayer*, *Attack on Titan* (Accent: `#E11D48`).
* **🟢 Gaming:** Featuring *Elden Ring*, *Cyberpunk 2077*, *Zelda* (Accent: `#22C55E`).
* **🟡 Movies:** Featuring *Oppenheimer*, *Spider-Man: Spider-Verse* (Accent: `#F59E0B`).
* **🔵 TV Shows:** Featuring *Arcane*, *Stranger Things*, *The Last of Us* (Accent: `#3B82F6`).
* **🌸 K-Pop:** Featuring *BTS*, *BLACKPINK*, *NewJeans*, *Stray Kids* (Accent: `#EC4899`).
* **⚡ Comics:** Featuring *Batman: Year One*, *Captain America*, *Watchmen* (Accent: `#FACC15`).
* **⚪ Manga:** Featuring *Berserk*, *One Piece*, *Jujutsu Kaisen* (Accent: `#E5E7EB`).
* **🟣 Cosplay:** Prop crafting, armor forging tutorials, convention masquerades (Accent: `#A855F7`).

### Direct PC File Uploads (Up to 200 MB)
Admins can upload local video files (`.mp4`, `.webm`) and audio files (`.mp3`, `.wav`) directly through the Admin Media form:
* Automatically sets `embedType: "file"` for local files and `embedType: "youtube"` for URLs.
* Files are validated for MIME signatures and assigned unique non-colliding GUID filenames.
* Stored in `wwwroot/media/uploads/` and served via ASP.NET Core static file middleware.

---

## 9. API Endpoints

### Authentication & User Account (`/api/auth`)
* `POST /api/auth/register` — Register a new member account with salted hash password.
* `POST /api/auth/login` — Authenticate credentials and receive JWT Bearer token + Refresh token.
* `POST /api/auth/refresh` — Exchange refresh token for a renewed JWT access token.
* `POST /api/auth/forgot-password` — Generate secure password reset token.
* `GET  /api/auth/me` — Retrieve current authenticated user profile and preference state.

### Catalog & Realm Content (`/api/catalog`, `/api/content`)
* `GET  /api/categories` — Retrieve all 8 multiverse realm categories with styling metadata.
* `GET  /api/content` — Multi-facet catalog search (keywords, realm category, genre, format, sorting).
* `GET  /api/content/{slug}` — Retrieve full detail packet for a content item including trailer streams.
* `POST /api/content/{id}/rate` — Submit 5-star rating score and community text review.
* `GET  /api/characters` — Retrieve character legend profiles with stat attributes.
* `GET  /api/merchandise` — Retrieve merchandise showcase galleries and upcoming drops.

### Events & Location Services (`/api/events`)
* `GET  /api/events` — Retrieve upcoming global fan conventions, dates, venues, and ticket URLs.
* `GET  /api/events/nearby` — Query conventions filtered by client GPS latitude/longitude radius.

### AI Chatbot Assistant (`/api/chatbot`)
* `POST /api/chatbot/query` — Submit message for intent routing, FAQ matching, and recommendation generation.
* `GET  /api/chatbot/history` — Retrieve persistent chat session history for authenticated member.

### Administration Control Suite (`/api/admin`)
* `GET  /api/admin/analytics` — Real-time telemetry: user growth, realm popularity, query traffic.
* `POST /api/admin/media/upload` — Direct multipart file upload for audio/video assets (**up to 200 MB**).
* `GET  /api/admin/faqs` — List all chatbot knowledge base records.
* `POST /api/admin/faqs` — Create or update FAQ record with zero-downtime hot sync.
* `GET  /api/admin/submissions` — Retrieve fan submission queue for moderation approval/rejection.

---

## 10. Project Structure

```
FanHubPlus/
├── backend/
│   └── FanHubPlus.Api/
│       ├── Controllers/          # REST API endpoints (Auth, Admin, Catalog, Chatbot, Events)
│       ├── Data/                 # AppDbContext, DbInitializer, seed migrations
│       ├── DTOs/                 # Strongly typed request/response payload contracts
│       ├── Entities/             # Domain models (User, Category, Content, Media, Bookmark)
│       ├── Middleware/           # Global exception handler & JWT Bearer inspection
│       ├── Services/             # Business services (Chatbot, Media Storage, Recommendation)
│       └── wwwroot/              # Static media store & local PC uploads (up to 200 MB)
├── frontend/
│   ├── src/app/core/             # Singleton services (ApiService, AuthService, ThemeManager)
│   ├── src/app/features/
│   │   ├── admin/                # Admin suite (Analytics, Media CRUD, FAQ Studio, Submissions)
│   │   ├── auth/                 # Login & Signup with 3D Captain America hero stages
│   │   ├── chatbot/              # Interactive 4-step drawer assistant with suggestions
│   │   ├── dashboard/            # Personalized user hub with bookmarks & private notes
│   │   ├── events/               # Leaflet GIS convention map & GPS distance engine
│   │   ├── realm/                # Dedicated realm landing pages for all 8 fandoms
│   │   └── three-stage/          # Three.js 3D WebGL volumetric canvas engine
│   └── src/app/layout/           # Global Navbar, Footer, Route Preloader
├── database/
│   ├── schema.sql                # Complete T-SQL schema definition (22 relational tables)
│   └── seed.sql                  # Comprehensive demonstration seed data across all 8 realms
└── Project/
    ├── run_project.bat           # Automated one-click local development launcher
    └── Documentation.docx        # Complete TechWiz 7 SRS & Project Documentation
```

---

## 11. Testing & Quality Checks

### Backend API Verification
```powershell
# Verify .NET project builds cleanly with zero errors
cd backend/FanHubPlus.Api
dotnet build

# Verify API health check
curl http://localhost:5080/api/health
```

### Frontend Verification
```powershell
# Typecheck and lint frontend application
cd frontend
npm run build

# Run unit tests
npm test -- --watch=false
```

---

## 12. Troubleshooting & FAQs

#### Q: Port 5080 or 4200 is already in use
**A:** Terminate any running process occupying the ports or edit `launchSettings.json` in the API project and `angular.json` in the frontend.

#### Q: API fails to connect to SQL Server
**A:** Verify that the SQL Server Express service is running:
```powershell
Get-Service -Name "MSSQL$SQLEXPRESS" | Start-Service
```
Confirm your instance name in `backend/FanHubPlus.Api/appsettings.json`.

#### Q: Can I upload large media files from my local PC?
**A:** **Yes!** The system is configured with custom `FormOptions`, `IISServerOptions`, and `web.config` `requestFiltering` supporting direct audio/video uploads **up to 200 MB** through the Admin Media panel.

#### Q: Does the application run without an external OpenAI API key?
**A:** **Yes.** If no key is configured in `appsettings.json`, the built-in deterministic NLP knowledge base engine handles all fan questions, realm recommendations, and the 4-step onboarding flow locally.

---

## 13. Documentation & Project Deliverables

* **Final Project Documentation & SRS (`Documentation.docx`):** Comprehensive 21-section technical specification located in the repository root, covering Problem Definition, Architecture Diagrams, DFD Level 0 & 1, ER Diagrams, 22-Table Relational Schema, and Full Application Screenshots.
* **Database Scripts:** Standalone schema (`database/schema.sql`) and seed data (`database/seed.sql`) files.
* **Deployed Web Application:** Live and publicly accessible at [http://fan-hub-plus.runasp.net](http://fan-hub-plus.runasp.net).
* **Demonstration Video:** High-definition video walkthrough (`.mp4`) demonstrating every functional requirement.

---

## 14. License & Team Credits

Developed by **MLR_DOMINATORS** for **TechWiz 7 — The World Tech Championship** under the theme *Fandom Universe (Portal for Fans)*.

### Project Team Members:
* **M Arham Khan** — Database Architecture, SQL Scripts & Video Lead
* **Sufiyan Khan** — Full-Stack Lead (Angular 20, ASP.NET Core 8 & Three.js 3D Engine)
* **Muhammad Faizan** — Backend Services, AI Chatbot Engine & EF Core Models
* **Ghazali Raza** — Quality Assurance, Asset Research & Screen Testing
* **Shafaq Fatima** — Technical Documentation, SRS & Presentation Lead
* **Zehra Alyani** — Media Asset Research & Content Curation

*This project is licensed under the MIT License for educational and portfolio demonstration.*
