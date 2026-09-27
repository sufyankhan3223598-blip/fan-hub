# Demo video script

A running order for the mandatory .mp4 demo that covers every functional requirement. Target length: 12 to 18 minutes. Record at 1920x1080 with the API and frontend running locally (see README section 3).

Before recording: reset the database (drop `FanHubPlus`, restart the API) so the seed data is fresh, open a private browser window, and allow location access when asked.

---

## Part 1 - Visitor journey (about 4 min)

| # | Action | Requirement shown |
|---|---|---|
| 1 | Open `http://localhost:4200`. Let the power-up preloader finish (or show the Skip button). | Loading experience |
| 2 | Scroll slowly through the cinematic home: Nexus portal, the eight realm scenes, trending titles, upcoming releases, events globe, community, stats. | Visual storytelling, categories |
| 3 | Scroll to the **Sitemap** constellation on the home page, hover a branch. Point at the Sitemap link in the footer. | Sitemap |
| 4 | Open the **Realms** menu and choose **Anime**. Show the 3D realm hero, breadcrumbs, content grid, characters and media. | Category browsing, breadcrumbs |
| 5 | Hover a card to show the dual-image effect. Open a title: the teaser plus **Login to unlock** panel. | Visitor limited access |
| 6 | Use the navbar search (Ctrl + K) for "titan". | Basic search |
| 7 | Toggle **Light / Dark** mode and **A- / A / A+** font size from the display menu. | Accessibility |
| 8 | Open the **chatbot**: ask "How do I bookmark?", then "Recommend something". Tap the **Guide me through Fan Hub Plus** quick reply to show the onboarding steps. | Chatbot FAQ and onboarding |
| 9 | Open **FAQ** and search a question. Open **Feedback**, choose type **Bug**, submit. | FAQ, typed feedback |
| 10 | Click **Join free**, register a new account, show the verification development link and open it. | Registration, email verification |

## Part 2 - Registered user journey (about 6 min)

Log in as **ayesha@fanhubplus.com / User@123** (or use **Forgot password** first to show the reset link flow).

| # | Action | Requirement shown |
|---|---|---|
| 11 | **Dashboard**: greeting, KPIs, activity chart, favorite realms donut, recent activity, bookmarks, recommendations, favorite fandoms, notifications. | Personalized dashboard |
| 12 | **Explore**: filter by realm, genre, release year range, popularity and content type; sort by latest, most popular and A-Z; paginate. | Advanced search, filters, sorting |
| 13 | Open a title: full details, trailer, genres and tags, **rate 5 stars**, **bookmark**, then **Share** (copy link, WhatsApp, X, Facebook). | Content details, rating, bookmarks, sharing |
| 14 | **Media** gallery: filter by type, play a video, an audio track (waveform player) and an explainer; give a thumbs up. | Multimedia center, media rating |
| 15 | **Characters**: filter by realm and fandom, open a profile (stats, quote, bio), bookmark it. | Character profiles |
| 16 | **Articles**: open a featured article with rich text, embedded images and the timeline. | Featured articles, timeline |
| 17 | **Events**: allow location, click **Near me**, change the radius, filter by city and type, switch to **Calendar** view, open an event and its ticket link. Open **Event highlights** to show the storytelling page. | Location-aware events, calendar, highlights |
| 18 | **Merchandise**: switch grouping between realm and fandom, show tags (Limited Edition, Pre-Order, Collectible), open an item gallery. Open **Upcoming releases** with countdowns. | Merchandise showcase, upcoming releases |
| 19 | **Bookmarks & notes**: filter by type, add or edit a note, remove one. | Bookmarks and notes |
| 20 | **Profile & settings**: edit favorite fandoms and categories, change theme preference, upload and crop an avatar, change password. | Profile management |
| 21 | **Submit content**: choose Fan Art, a realm, write with the rich-text editor, upload a cover, submit. Open **My submissions** to show the Pending status. | Fan submissions |
| 22 | **Chat history**: open a saved session. | Chat history |
| 23 | Log out. | Session management |

## Part 3 - Admin journey (about 5 min)

Log in as **admin@fanhubplus.com / Admin@123** and open **Control panel**.

| # | Action | Requirement shown |
|---|---|---|
| 24 | **Overview**: KPI tiles, traffic by section, popular realms, top content, live activity, events map, moderation queue, open feedback. | Usage statistics |
| 25 | **Analytics**: switch 7 / 30 / 90 days, pick a custom range, change the trend metric, show most-viewed content and merchandise, export CSV. | Active users, popular categories, chatbot volume, view counts |
| 26 | **Fan submissions**: preview the submission made in step 21, approve it with a note. Log back in as the user later to show the notification (optional). | Moderation |
| 27 | **Feedback**: open the bug from step 9, move it to **In Review**, add a note; bulk-mark two items **Resolved**. | Feedback workflow |
| 28 | **Content catalog**: search, filter, sort a column; click **New content item**, fill the form (realm, genres, tags, image upload), save; edit it; delete it. | Add / edit / remove content |
| 29 | Quickly open **Media gallery**, **Characters**, **Articles** (timeline editor), **Merchandise** (gallery editor), **Events**, **Categories**, **Tags**. | All content modules |
| 30 | **Chatbot**: add a new FAQ, then ask the chatbot that question to show it answering; open the **Query log**. | Chatbot knowledge base |
| 31 | **Users**: search, change a role, block and unblock a user. | User management |

## Part 4 - Responsiveness and polish (about 1 min)

| # | Action |
|---|---|
| 32 | Open browser dev tools and switch to a phone size: show the mobile drawer menu, a realm page, the dashboard and an admin grid. |
| 33 | Visit an unknown URL to show the 404 page. |
| 34 | Show Swagger at `http://localhost:5080/swagger` to present the REST API. |
