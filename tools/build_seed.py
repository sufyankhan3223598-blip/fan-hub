"""
Generates /database/seed.sql from seed_data.py.

Usage:  python tools/build_seed.py [--json path/to/out.json]

- Explicit IDs are inserted with IDENTITY_INSERT so relationships are stable.
- Activity data (views, activities, chatbot queries, feedback...) uses
  DATEADD(..., SYSUTCDATETIME()) so dashboards always show recent data.
- Passwords are hashed in ASP.NET Core Identity V3 format
  (PBKDF2-HMACSHA512, 100,000 iterations, 16-byte salt, 32-byte subkey),
  which the API verifies with PasswordHasher<User>.
"""
import base64, hashlib, json, os, random, re, struct, sys
from datetime import date

sys.path.insert(0, os.path.dirname(__file__))
from seed_data import (CATEGORIES, GENRES, TAGS, CONTENT, CHARACTERS, MERCH, UPCOMING,
                       EVENTS, ARTICLES, MEDIA, FAQS, USERS)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rnd = random.Random(2026)
BASE_DATE = date(2026, 9, 24)   # event dates are stored relative to this date


def slugify(s):
    s = s.lower().replace("&", "and")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def q(v):
    """SQL literal."""
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "1" if v else "0"
    if isinstance(v, (int, float)):
        return str(v)
    if isinstance(v, Raw):
        return v.sql
    return "N'" + str(v).replace("'", "''") + "'"


class Raw:
    def __init__(self, sql):
        self.sql = sql


def ago(days=0, hours=0, minutes=0):
    total = days * 1440 + hours * 60 + minutes
    return Raw(f"DATEADD(MINUTE, -{total}, SYSUTCDATETIME())")


def from_base(d: str):
    """Keep the gap between BASE_DATE and d, relative to the install date."""
    y, m, dd = map(int, d.split("-"))
    delta = (date(y, m, dd) - BASE_DATE).days
    return Raw(f"DATEADD(DAY, {delta}, CAST(CAST(SYSUTCDATETIME() AS date) AS datetime2))")


def identity_hash(password: str) -> str:
    salt = os.urandom(16)
    subkey = hashlib.pbkdf2_hmac("sha512", password.encode(), salt, 100000, 32)
    blob = bytes([0x01]) + struct.pack(">III", 2, 100000, 16) + salt + subkey
    return base64.b64encode(blob).decode()


def img(kind, slug, v):
    return f"/media/images/{kind}/{slug}-{v}.webp"


out = []
data = {}  # mirror for tooling / previews


def table(name, cols, rows, identity=True):
    data[name] = [dict(zip(cols, [r if not isinstance(r, Raw) else r.sql for r in row])) for row in rows]
    if not rows:
        return
    out.append(f"-- {name} ({len(rows)} rows)")
    if identity:
        out.append(f"SET IDENTITY_INSERT [{name}] ON;")
    for i in range(0, len(rows), 200):
        chunk = rows[i:i + 200]
        out.append(f"INSERT INTO [{name}] ({', '.join('[' + c + ']' for c in cols)}) VALUES")
        out.append(",\n".join("  (" + ", ".join(q(v) for v in r) + ")" for r in chunk) + ";")
    if identity:
        out.append(f"SET IDENTITY_INSERT [{name}] OFF;")
    out.append("GO\n")


# ---------------------------------------------------------------- lookups
table("Roles", ["Id", "Name"], [(1, "Visitor"), (2, "User"), (3, "Admin")])
role_id = {"Visitor": 1, "User": 2, "Admin": 3}

cat_rows, cat_id = [], {}
for i, (slug, name, tagline, desc, accent, second, icon) in enumerate(CATEGORIES, 1):
    cat_id[slug] = i
    cat_rows.append((i, name, slug, tagline, desc, accent, second, icon,
                     img("categories", slug, "a"), img("categories", slug, "b"), i))
table("Categories", ["Id", "Name", "Slug", "Tagline", "Description", "AccentColor", "SecondaryColor", "Icon",
                     "ImageUrl", "HoverImageUrl", "SortOrder"], cat_rows)

genre_id = {g: i for i, g in enumerate(GENRES, 1)}
table("Genres", ["Id", "Name", "Slug"], [(i, g, slugify(g)) for g, i in genre_id.items()])

tag_id = {t[0]: i for i, t in enumerate(TAGS, 1)}
table("Tags", ["Id", "Name", "Slug", "Color"], [(tag_id[n], n, slugify(n), c) for n, c in TAGS])

# ---------------------------------------------------------------- users
user_rows, fandom_rows, ucat_rows = [], [], []
fid = 1
for i, (name, email, pw, role, bio, fandoms, cats) in enumerate(USERS, 1):
    user_rows.append((i, name, email, identity_hash(pw), role_id[role], None, bio, "dark", "md", False, True,
                      True, False, ago(days=120 - i * 7), ago(hours=i * 3), ago(minutes=i * 17)))
    for f in fandoms:
        fandom_rows.append((fid, i, f)); fid += 1
    for c in cats:
        ucat_rows.append((i, cat_id[c]))
table("Users", ["Id", "FullName", "Email", "PasswordHash", "RoleId", "AvatarUrl", "Bio", "Theme", "FontSize",
                "ReduceMotion", "EmailNotifications", "EmailVerified", "IsBlocked", "CreatedAt", "LastLoginAt",
                "LastActiveAt"], user_rows)
table("UserFavoriteFandoms", ["Id", "UserId", "Name"], fandom_rows)
table("UserCategories", ["UserId", "CategoryId"], ucat_rows, identity=False)
USER_IDS = list(range(2, len(USERS) + 1))

# ---------------------------------------------------------------- contents
content_rows, cg_rows, ct_rows = [], [], []
content_id, content_meta = {}, []
cid = 1
for cslug, items in CONTENT.items():
    for (title, ctype, fmt, year, creator, genres, synopsis, seasons, episodes) in items:
        slug = slugify(title)
        if slug in [m["slug"] for m in content_meta]:
            slug = f"{slug}-{cslug}"
        content_id[title] = cid
        g_txt = " and ".join(g.lower() for g in genres[:2])
        extra = {
            "Series": f"Across {seasons or 'multiple'} season{'s' if (seasons or 2) > 1 else ''}, the series has built a devoted following for its {g_txt} storytelling.",
            "Film": f"The film is celebrated for its {g_txt} craft and remains a fixture of fan rewatch lists.",
            "Game": f"Players return to it for its {g_txt} design, memorable characters and replayable worlds.",
            "Album": f"The release blends {g_txt} influences and became a fan-favorite era for the group.",
            "EP": f"Its {g_txt} sound and performance videos made it a standout release.",
        }.get(fmt, f"Fans praise its {g_txt} storytelling and distinctive art.")
        description = (f"<p>{synopsis}</p><p>{title} ({year}) comes from {creator}. {extra}</p>"
                       f"<p>Explore characters, media and related picks from the {cslug.replace('-', ' ').title()} realm below.</p>")
        pop = rnd.randint(420, 990)
        views = rnd.randint(1200, 98000)
        avg = round(rnd.uniform(3.9, 4.95), 2)
        rc = rnd.randint(40, 900)
        featured = len([m for m in content_meta if m["cat"] == cslug]) < 3
        trailer = f"/media/video/{cslug}-teaser.mp4" if ctype == "Video" else None
        content_rows.append((cid, cat_id[cslug], title, slug, ctype, fmt, synopsis, description, year, creator,
                             seasons, episodes, trailer, img("content", slug, "a"), img("content", slug, "b"),
                             img("content", slug, "a"), pop, views, avg, rc, rnd.randint(30, 800), rnd.randint(0, 40),
                             featured, True, ago(days=rnd.randint(5, 360))))
        content_meta.append({"id": cid, "slug": slug, "title": title, "cat": cslug, "genres": genres})
        for g in genres:
            cg_rows.append((cid, genre_id[g]))
        for t in rnd.sample(["Trending", "Fan Favorite", "Official", "New Arrival"], rnd.randint(1, 2)):
            ct_rows.append((cid, tag_id[t]))
        cid += 1
table("Contents", ["Id", "CategoryId", "Title", "Slug", "ContentType", "Format", "Synopsis", "Description",
                   "ReleaseYear", "Creator", "Seasons", "Episodes", "TrailerUrl", "ImageUrl", "HoverImageUrl",
                   "BannerUrl", "PopularityScore", "ViewCount", "AverageRating", "RatingCount", "LikeCount",
                   "DislikeCount", "IsFeatured", "IsPublished", "CreatedAt"], content_rows)
table("ContentGenres", ["ContentId", "GenreId"], cg_rows, identity=False)
table("ContentTags", ["ContentId", "TagId"], ct_rows, identity=False)

# ---------------------------------------------------------------- media
media_rows, mt_rows = [], []
for i, (cslug, title, mtype, etype, url, dur, desc, tags) in enumerate(MEDIA, 1):
    slug = slugify(title)
    related = next((m["id"] for m in content_meta if m["cat"] == cslug), None) if mtype == "Trailer" else None
    media_rows.append((i, cat_id[cslug], related, title, mtype, etype, url, dur, desc,
                       img("media", slug, "a"), img("media", slug, "b"), rnd.randint(300, 25000), rnd.randint(300, 950),
                       round(rnd.uniform(3.8, 4.9), 2), rnd.randint(10, 300), rnd.randint(20, 600), rnd.randint(0, 30),
                       True, ago(days=rnd.randint(2, 200))))
    for t in tags:
        mt_rows.append((i, tag_id[t]))
table("MediaItems", ["Id", "CategoryId", "ContentId", "Title", "MediaType", "EmbedType", "Url", "DurationSeconds",
                     "Description", "ImageUrl", "HoverImageUrl", "ViewCount", "PopularityScore", "AverageRating",
                     "RatingCount", "LikeCount", "DislikeCount", "IsPublished", "CreatedAt"], media_rows)
table("MediaTags", ["MediaItemId", "TagId"], mt_rows, identity=False)

# ---------------------------------------------------------------- characters
char_rows = []
for i, (cslug, name, fandom, ctitle, role, power, quote, bio, st, it, ag, ch) in enumerate(CHARACTERS, 1):
    slug = slugify(name)
    char_rows.append((i, cat_id[cslug], content_id.get(ctitle) if ctitle else None, name, slug, fandom, role, power,
                      quote, bio, st, it, ag, ch, img("characters", slug, "a"), img("characters", slug, "b"),
                      rnd.randint(500, 40000), rnd.randint(400, 990), ago(days=rnd.randint(10, 300))))
table("CharacterProfiles", ["Id", "CategoryId", "ContentId", "Name", "Slug", "Fandom", "Role", "Power", "Quote",
                            "Bio", "Strength", "Intelligence", "Agility", "Charisma", "ImageUrl", "HoverImageUrl",
                            "ViewCount", "PopularityScore", "CreatedAt"], char_rows)

# ---------------------------------------------------------------- articles
art_rows, tl_rows = [], []
tl = 1
for i, (cslug, title, excerpt, paras, timeline) in enumerate(ARTICLES, 1):
    slug = slugify(title)
    body = ""
    for p_i, p in enumerate(paras):
        body += f"<p>{p}</p>"
        if p_i == 0:
            body += (f'<figure><img src="{img("articles", slug, "b")}" alt="{title} illustration">'
                     f"<figcaption>{title}</figcaption></figure>")
        if p_i == 1:
            body += f"<h3>Why it matters</h3>"
    body += "<blockquote>Fan Hub Plus editorial - part of the Featured Articles hub.</blockquote>"
    words = sum(len(p.split()) for p in paras) + 120
    art_rows.append((i, cat_id[cslug], 1, title, slug, excerpt, body, img("articles", slug, "a"),
                     img("articles", slug, "b"), max(3, words // 180), i <= 4, "Published",
                     rnd.randint(800, 30000), rnd.randint(400, 990), ago(days=i * 9 + 2), ago(days=i * 9 + 3)))
    for s, (dl, tt, dd) in enumerate(timeline):
        tl_rows.append((tl, i, dl, tt, dd, s)); tl += 1
table("Articles", ["Id", "CategoryId", "AuthorId", "Title", "Slug", "Excerpt", "Body", "ImageUrl", "HoverImageUrl",
                   "ReadMinutes", "IsFeatured", "Status", "ViewCount", "PopularityScore", "PublishedAt", "CreatedAt"],
      art_rows)
table("ArticleTimelineItems", ["Id", "ArticleId", "DateLabel", "Title", "Description", "SortOrder"], tl_rows)

# ---------------------------------------------------------------- merchandise
merch_rows, mimg_rows, mtag_rows = [], [], []
mi = 1
for i, (cslug, name, fandom, maker, tags, desc, upcoming) in enumerate(MERCH, 1):
    slug = slugify(name)
    merch_rows.append((i, cat_id[cslug], name, slug, fandom, maker, desc, img("merch", slug, "a"),
                       img("merch", slug, "b"), upcoming, rnd.randint(200, 20000), rnd.randint(300, 990),
                       ago(days=rnd.randint(3, 200))))
    for s, v in enumerate(["a", "b", "c"]):
        mimg_rows.append((mi, i, img("merch", slug, v), f"{name} - view {s + 1}", s)); mi += 1
    for t in tags:
        mtag_rows.append((i, tag_id[t]))
table("MerchandiseItems", ["Id", "CategoryId", "Name", "Slug", "Fandom", "Manufacturer", "Description", "ImageUrl",
                           "HoverImageUrl", "IsUpcoming", "ViewCount", "PopularityScore", "CreatedAt"], merch_rows)
table("MerchandiseImages", ["Id", "MerchandiseItemId", "ImageUrl", "Caption", "SortOrder"], mimg_rows)
table("MerchandiseTags", ["MerchandiseItemId", "TagId"], mtag_rows, identity=False)

# ---------------------------------------------------------------- upcoming
up_rows, uptag_rows = [], []
for i, (cslug, title, rtype, d, conf, studio, desc, tags) in enumerate(UPCOMING, 1):
    slug = slugify(title)
    up_rows.append((i, cat_id[cslug], title, rtype, Raw(f"'{d}'"), conf, studio, desc, img("upcoming", slug, "a"),
                    img("upcoming", slug, "b"), None, rnd.randint(100, 9000), ago(days=rnd.randint(1, 60))))
    for t in tags:
        uptag_rows.append((i, tag_id[t]))
table("UpcomingReleases", ["Id", "CategoryId", "Title", "ReleaseType", "ReleaseDate", "IsDateConfirmed", "Studio",
                           "Description", "ImageUrl", "HoverImageUrl", "ExternalUrl", "ViewCount", "CreatedAt"], up_rows)
table("UpcomingReleaseTags", ["UpcomingReleaseId", "TagId"], uptag_rows, identity=False)

# ---------------------------------------------------------------- events
ev_rows = []
for i, (cslug, title, etype, city, country, venue, lat, lng, start, end, ticket, hl, desc, story) in enumerate(EVENTS, 1):
    slug = slugify(title)
    ev_rows.append((i, cat_id.get(cslug) if cslug else None, title, slug, etype, desc,
                    f"<p>{story}</p><p>{desc}</p>", city, country, venue, lat, lng, from_base(start), from_base(end),
                    ticket, img("events", slug, "a"), img("events", slug, "b"), hl, rnd.randint(100, 12000),
                    ago(days=rnd.randint(5, 90))))
table("Events", ["Id", "CategoryId", "Title", "Slug", "EventType", "Description", "Story", "City", "Country", "Venue",
                 "Latitude", "Longitude", "StartDate", "EndDate", "TicketUrl", "ImageUrl", "HoverImageUrl",
                 "IsHighlight", "ViewCount", "CreatedAt"], ev_rows)

# ---------------------------------------------------------------- chatbot faqs
table("ChatbotFaqs", ["Id", "Category", "Question", "Answer", "Keywords", "IsActive", "SortOrder", "HitCount",
                      "CreatedAt"],
      [(i, c, qq, a, k, True, i, rnd.randint(0, 120), ago(days=100)) for i, (c, qq, a, k) in enumerate(FAQS, 1)])

# ---------------------------------------------------------------- activity (relative dates)
item_pool = ([("Content", m["id"], cat_id[m["cat"]]) for m in content_meta] +
             [("Character", i, r[1]) for i, r in enumerate(char_rows, 1)] +
             [("Media", i, r[1]) for i, r in enumerate(media_rows, 1)] +
             [("Merchandise", i, r[1]) for i, r in enumerate(merch_rows, 1)] +
             [("Article", i, r[1]) for i, r in enumerate(art_rows, 1)])
view_rows = []
for vid in range(1, 1601):
    t, iid, c = rnd.choice(item_pool)
    d = int(abs(rnd.gauss(0, 11))) % 30
    view_rows.append((vid, rnd.choice(USER_IDS + [None, None]), t, iid, c, ago(days=d, hours=rnd.randint(0, 23),
                                                                                minutes=rnd.randint(0, 59))))
table("ViewLogs", ["Id", "UserId", "ItemType", "ItemId", "CategoryId", "ViewedAt"], view_rows)


def title_of(t, iid):
    if t == "Content":
        return next(m["title"] for m in content_meta if m["id"] == iid), f"/content/{next(m['slug'] for m in content_meta if m['id'] == iid)}"
    if t == "Character":
        r = char_rows[iid - 1]; return r[3], f"/characters/{r[4]}"
    if t == "Media":
        r = media_rows[iid - 1]; return r[3], f"/media/{iid}"
    if t == "Merchandise":
        r = merch_rows[iid - 1]; return r[2], f"/merchandise/{r[3]}"
    r = art_rows[iid - 1]; return r[3], f"/articles/{r[4]}"


def image_of(t, iid):
    return {"Content": lambda: content_rows[iid - 1][13], "Character": lambda: char_rows[iid - 1][14],
            "Media": lambda: media_rows[iid - 1][9], "Merchandise": lambda: merch_rows[iid - 1][7],
            "Article": lambda: art_rows[iid - 1][7]}[t]()


bm_rows, rating_rows, act_rows = [], [], []
seen = set()
notes = ["Rewatch this before the next season.", "Great reference for my next cosplay build.",
         "Recommend to the group chat.", "Soundtrack is incredible.", "Pick this up at the next convention.", None]
bid = rid = aid = 1
for u in USER_IDS:
    for _ in range(9):
        t, iid, c = rnd.choice(item_pool)
        if (u, t, iid) in seen:
            continue
        seen.add((u, t, iid))
        ttl, url = title_of(t, iid)
        when = ago(days=rnd.randint(0, 25), hours=rnd.randint(0, 23))
        bm_rows.append((bid, u, t, iid, ttl, image_of(t, iid), url, rnd.choice(notes), when)); bid += 1
        act_rows.append((aid, u, "Bookmark", f"Bookmarked {ttl}", t, iid, url, when)); aid += 1
    for _ in range(12):
        t, iid, c = rnd.choice([p for p in item_pool if p[0] in ("Content", "Media")])
        if (u, "R" + t, iid) in seen:
            continue
        seen.add((u, "R" + t, iid))
        ttl, url = title_of(t, iid)
        when = ago(days=rnd.randint(0, 28), hours=rnd.randint(0, 23))
        rating_rows.append((rid, u, t, iid, rnd.randint(3, 5), rnd.choice([1, 1, 1, 0, -1]), when)); rid += 1
        act_rows.append((aid, u, "Rating", f"Rated {ttl}", t, iid, url, when)); aid += 1
    for _ in range(14):
        t, iid, c = rnd.choice(item_pool)
        ttl, url = title_of(t, iid)
        act_rows.append((aid, u, "View", f"Viewed {ttl}", t, iid, url,
                         ago(days=rnd.randint(0, 29), hours=rnd.randint(0, 23)))); aid += 1
    for d in range(0, 30, rnd.randint(3, 6)):
        act_rows.append((aid, u, "Login", "Signed in", None, None, None, ago(days=d, hours=rnd.randint(0, 12)))); aid += 1
table("Bookmarks", ["Id", "UserId", "ItemType", "ItemId", "Title", "ImageUrl", "Url", "Note", "CreatedAt"], bm_rows)
table("Ratings", ["Id", "UserId", "ItemType", "ItemId", "Stars", "Thumb", "CreatedAt"], rating_rows)

# fan submissions
subs = [
    (2, "anime", "Why Frieren Is the Most Rewatchable Fantasy Anime", "Article", "Approved",
     "An essay on pacing, memory and small moments in Frieren.",
     "<p>Frieren succeeds because it lets quiet moments breathe. Every flashback reframes the present journey.</p><p>Its episodic structure rewards rewatching, as details planted early gain meaning later.</p>"),
    (2, "cosplay", "My First Worbla Armor Build", "Cosplay", "Approved",
     "A build diary of a full armor set completed in eight weeks.",
     "<p>I started with paper patterns, moved to foam cores and finished with heat-shaped Worbla shells.</p><p>Priming with wood glue layers gave a smooth base for metallic paint.</p>"),
    (3, "gaming", "Elden Ring Boss Tier List - Community Edition", "Article", "Pending",
     "Ranking the toughest bosses in the Lands Between.",
     "<p>This list ranks bosses by difficulty, design and spectacle, with notes on builds that helped.</p>"),
    (3, "manga", "Berserk Golden Age Fan Art Series", "Fan Art", "Pending",
     "A three-piece ink illustration series.",
     "<p>Three ink illustrations inspired by the Golden Age arc, drawn with brush pens.</p>"),
    (4, "k-pop", "Stray Kids 5-STAR Album Review", "Review", "Approved",
     "Track-by-track thoughts on 5-STAR.",
     "<p>5-STAR shows the group's range, from the maximalist S-Class to softer B-sides.</p>"),
    (4, "comics", "Watchmen Theory: The Clock Motif", "Theory", "Rejected",
     "Tracking the doomsday clock through every chapter.",
     "<p>Every chapter ends closer to midnight. This theory maps the clock to each character arc.</p>"),
    (5, "movies", "Spider-Verse Animation Breakdown", "Article", "Pending",
     "How frame rates tell Miles's story.",
     "<p>Miles animates on twos early in the film and shifts as he gains confidence.</p>"),
    (5, "tv-shows", "Arcane Season 2 Watch Guide", "Article", "Approved",
     "Everything to remember before watching season two.",
     "<p>A recap of the key relationships and cliffhangers from season one.</p>"),
]
sub_rows = []
for i, (u, cslug, title, stype, status, summary, body) in enumerate(subs, 1):
    reviewed = status != "Pending"
    sub_rows.append((i, u, cat_id[cslug], title, stype, summary, body, img("submissions", slugify(title), "a"), status,
                     "Great contribution, published to the hub." if status == "Approved" else (
                         "Please expand the theory with page references." if status == "Rejected" else None),
                     1 if reviewed else None, ago(days=i) if reviewed else None, rnd.randint(0, 900) if status == "Approved" else 0,
                     ago(days=i + 3)))
    act_rows.append((aid, u, "Submission", f"Submitted {title}", "Submission", i, "/submissions/mine", ago(days=i + 3))); aid += 1
table("FanSubmissions", ["Id", "UserId", "CategoryId", "Title", "SubmissionType", "Summary", "Body", "ImageUrl", "Status",
                         "ReviewNote", "ReviewedById", "ReviewedAt", "ViewCount", "CreatedAt"], sub_rows)
table("UserActivities", ["Id", "UserId", "ActivityType", "Description", "ItemType", "ItemId", "Url", "CreatedAt"], act_rows)

# notifications
notif_rows = []
nid = 1
for u in USER_IDS:
    notif_rows.append((nid, u, "Welcome to Fan Hub Plus", "Your multiverse passport is ready. Explore the eight realms.", "/dashboard", True, ago(days=20))); nid += 1
    notif_rows.append((nid, u, "New event near you", "A Fan Hub Plus meetup was added to the Event Map.", "/events", False, ago(days=2))); nid += 1
for i, r in enumerate(sub_rows, 1):
    if r[8] != "Pending":
        notif_rows.append((nid, r[1], f"Submission {r[8].lower()}", f"'{r[3]}' was {r[8].lower()} by the admin team.", "/submissions/mine", False, ago(days=i))); nid += 1
table("Notifications", ["Id", "UserId", "Title", "Message", "Url", "IsRead", "CreatedAt"], notif_rows)

# feedback
fb = [
    (2, "Bug", "Map pins overlap on mobile", "When zooming out on the Event Map, pins in Tokyo overlap and are hard to tap.", "Open"),
    (3, "Suggestion", "Add a dark fantasy collection", "It would be great to have a cross-realm collection for dark fantasy.", "In Review"),
    (4, "Query", "K-Pop comeback calendar", "Will the upcoming releases include comeback dates for groups?", "Resolved"),
    (5, "Suggestion", "Watch-along reminders", "Please add email reminders for premiere watch-alongs.", "Open"),
    (2, "Query", "Cosplay submissions", "Can I submit multiple photos in one cosplay submission?", "Resolved"),
    (3, "Bug", "Audio waveform not loading", "The waveform sometimes shows late on slow connections.", "Closed"),
    (4, "Suggestion", "More manga characters", "Please add more characters from Vinland Saga.", "Open"),
    (5, "Bug", "Font size resets", "The font size setting reset after I logged out.", "In Review"),
    (None, "Query", "Partnering for an event", "How can our convention be listed on the Event Map?", "Open"),
    (2, "Suggestion", "Light theme for dashboard charts", "Charts could use a bit more contrast in light mode.", "Resolved"),
]
fb_rows = []
for i, (u, t, s, m, st) in enumerate(fb, 1):
    name, email = (USERS[u - 1][0], USERS[u - 1][1]) if u else ("Convention Organizer", "events@example.com")
    fb_rows.append((i, u, name, email, t, s, m, "/", st, "Thanks, we are tracking this." if st != "Open" else None,
                    ago(days=i * 2, hours=3)))
table("Feedback", ["Id", "UserId", "Name", "Email", "Type", "Subject", "Message", "PageUrl", "Status", "AdminNote",
                   "CreatedAt"], fb_rows)

# chatbot queries (history + analytics volume)
cq = [("What is Fan Hub Plus?", "Platform"), ("Recommend me an anime", "Recommend"), ("How do I bookmark something?", "Faq"),
      ("Find events near me", "Faq"), ("Guide me through the platform", "Onboarding"), ("Does Fan Hub Plus sell merchandise?", "Faq"),
      ("Suggest a game like Elden Ring", "Recommend"), ("How do I reset my password?", "Faq"), ("hi", "Greeting")]
cq_rows = []
for i in range(1, 181):
    msg, intent = rnd.choice(cq)
    u = rnd.choice(USER_IDS + [None, None, None])
    cq_rows.append((i, u, f"seed-{(u or 0)}-{i // 4}", msg, "Answered by the Fan Hub Plus assistant.", intent,
                    ago(days=int(abs(rnd.gauss(0, 10))) % 30, hours=rnd.randint(0, 23))))
table("ChatbotQueries", ["Id", "UserId", "SessionId", "Message", "Response", "Intent", "CreatedAt"], cq_rows)

# ---------------------------------------------------------------- write
header = """/* =====================================================================
   FAN HUB PLUS - SEED DATA (SQL Server)
   Generated by tools/build_seed.py - run AFTER schema.sql.
   Demo credentials:
     Admin : admin@fanhubplus.com / Admin@123
     User  : ayesha@fanhubplus.com / User@123  (also bilal@, sara@, omar@)
   Activity timestamps are relative to install time (SYSUTCDATETIME()).
   ===================================================================== */
USE FanHubPlus;
GO
SET NOCOUNT ON;
GO
"""
path = os.path.join(ROOT, "database", "seed.sql")
with open(path, "w", encoding="utf-8") as f:
    f.write(header + "\n".join(out))
print("wrote", path, sum(len(v) for v in data.values()), "rows")

if "--json" in sys.argv:
    jp = sys.argv[sys.argv.index("--json") + 1]
    with open(jp, "w", encoding="utf-8") as f:
        json.dump(data, f)
    print("wrote", jp)

# manifest for the image generator
manifest = {
    "categories": [(r[2], r[1], r[5], r[6]) for r in cat_rows],
    "content": [(r[3], r[2], CATEGORIES[r[1] - 1][0], r[5], r[8]) for r in content_rows],
    "characters": [(r[4], r[3], CATEGORIES[r[1] - 1][0], r[5], r[6]) for r in char_rows],
    "media": [(slugify(r[3]), r[3], CATEGORIES[r[1] - 1][0], r[4], "") for r in media_rows],
    "merch": [(r[3], r[2], CATEGORIES[r[1] - 1][0], r[4], "") for r in merch_rows],
    "upcoming": [(slugify(r[2]), r[2], CATEGORIES[r[1] - 1][0], r[3], "") for r in up_rows],
    "events": [(r[3], r[2], CATEGORIES[(r[1] or 1) - 1][0], r[7], r[4]) for r in ev_rows],
    "articles": [(r[4], r[3], CATEGORIES[r[1] - 1][0], "Feature", "") for r in art_rows],
    "submissions": [(slugify(r[3]), r[3], CATEGORIES[r[2] - 1][0], r[4], "") for r in sub_rows],
}
with open(os.path.join(ROOT, "tools", "image_manifest.json"), "w") as f:
    json.dump(manifest, f, indent=1)
