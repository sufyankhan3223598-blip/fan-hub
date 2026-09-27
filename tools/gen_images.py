"""
Renders the original dual-image artwork (ImageUrl + HoverImageUrl) for every
seeded row into backend/FanHubPlus.Api/wwwroot/media/images/<kind>/<slug>-<a|b|c>.webp

Each realm has its own generative motif (sakura + blade slashes for Anime,
pixel grid for Gaming, spotlight beams for Movies, scanlines for TV, stage
beams for K-Pop, halftone bursts for Comics, ink splashes for Manga and
ornate rings for Cosplay). Variant "a" is the poster, variant "b" is the
alternate hover art, variant "c" is an extra gallery shot (merchandise).
All artwork is generated - no third-party images are used.
"""
import json, math, os, random, sys, zlib
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "backend", "FanHubPlus.Api", "wwwroot", "media", "images")
FONTS = os.path.join(ROOT, "tools", "fonts")


def font(name, size, weight=None):
    f = ImageFont.truetype(os.path.join(FONTS, name), size)
    if weight:
        try:
            f.set_variation_by_axes([weight])
        except Exception:
            pass
    return f


def hex2rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def mix(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


BG = (7, 7, 12)


def gradient(w, h, top, bottom):
    t = np.linspace(0, 1, h)[:, None, None]
    arr = np.array(top)[None, None, :] * (1 - t) + np.array(bottom)[None, None, :] * t
    arr = np.repeat(arr, w, axis=1)
    return Image.fromarray(arr.astype(np.uint8), "RGB")


def radial(w, h, cx, cy, r, color, strength=1.0):
    y, x = np.ogrid[:h, :w]
    d = np.sqrt((x - cx) ** 2 + (y - cy) ** 2) / r
    a = np.clip(1 - d, 0, 1) ** 2 * strength
    layer = np.zeros((h, w, 3))
    layer[:] = color
    return Image.fromarray((layer * a[..., None]).astype(np.uint8), "RGB")


def screen(base, layer):
    return ImageChops.screen(base, layer)


def glow_layer(size, draw_fn, blur=12, boost=1.6):
    layer = Image.new("RGB", size, (0, 0, 0))
    draw_fn(ImageDraw.Draw(layer))
    g = layer.filter(ImageFilter.GaussianBlur(blur))
    g = Image.eval(g, lambda v: min(255, int(v * boost)))
    return ImageChops.screen(layer, g)


# ------------------------------------------------------------------ motifs
def motif_anime(img, acc, sec, rnd, variant):
    w, h = img.size
    cx, cy, r = w * rnd.uniform(.35, .7), h * rnd.uniform(.25, .45), min(w, h) * rnd.uniform(.28, .38)
    img = screen(img, radial(w, h, cx, cy, r * 1.9, acc, .9))

    def d(dr):
        dr.ellipse([cx - r, cy - r, cx + r, cy + r], outline=sec, width=3)
        for i in range(3):
            y = cy + r * .9 + i * 22
            dr.line([(0, y + rnd.uniform(-40, 40)), (w, y - 60 + rnd.uniform(-40, 40))], fill=mix(acc, (255, 255, 255), .3), width=2)
        # blade slash
        x0 = rnd.uniform(-.1, .2) * w
        dr.line([(x0, h * .95), (x0 + w * 1.1, h * .05)], fill=(255, 255, 255), width=4)
        dr.line([(x0 + 14, h * .95), (x0 + w * 1.1 + 14, h * .05)], fill=acc, width=2)
        for _ in range(55 if variant == "a" else 90):
            px, py, s = rnd.uniform(0, w), rnd.uniform(0, h), rnd.uniform(4, 11)
            dr.ellipse([px, py, px + s * 1.6, py + s], fill=mix(sec, (255, 255, 255), rnd.uniform(0, .4)))
    return screen(img, glow_layer(img.size, d, 10))


def motif_gaming(img, acc, sec, rnd, variant):
    w, h = img.size
    img = screen(img, radial(w, h, w * .5, h * .7, w * .9, acc, .7))

    def d(dr):
        horizon = h * rnd.uniform(.55, .65)
        for i in range(-12, 13):
            dr.line([(w / 2 + i * 18, horizon), (w / 2 + i * 140, h)], fill=mix(acc, (0, 0, 0), .35), width=1)
        y = horizon
        step = 6
        while y < h:
            dr.line([(0, y), (w, y)], fill=mix(acc, (0, 0, 0), .4), width=1)
            step *= 1.25
            y += step
        for _ in range(26):
            s = rnd.choice([10, 14, 18, 24, 32])
            x, yy = rnd.uniform(0, w), rnd.uniform(0, horizon)
            col = sec if rnd.random() < .35 else acc
            dr.rectangle([x, yy, x + s, yy + s], outline=col, width=2)
            if rnd.random() < .4:
                dr.rectangle([x + 4, yy + 4, x + s - 4, yy + s - 4], fill=col)
        # hexagon
        hx, hy, hr = w * .5, h * .33, w * .26
        pts = [(hx + hr * math.cos(math.pi / 3 * k + math.pi / 6), hy + hr * math.sin(math.pi / 3 * k + math.pi / 6)) for k in range(6)]
        dr.polygon(pts, outline=sec, width=4)
    return screen(img, glow_layer(img.size, d, 8))


def motif_movies(img, acc, sec, rnd, variant):
    w, h = img.size
    img = screen(img, radial(w, h, w * .5, h * .15, w * .8, acc, .6))
    beams = Image.new("RGB", (w, h))
    bd = ImageDraw.Draw(beams)
    for k in range(3):
        sx = w * (0.2 + 0.3 * k) + rnd.uniform(-40, 40)
        spread = rnd.uniform(.25, .45) * w
        col = mix(acc if k != 1 else sec, (255, 230, 180), .3)
        bd.polygon([(sx - 8, h), (sx + 8, h), (sx + spread, 0), (sx - spread, 0)], fill=mix(col, (0, 0, 0), .55))
    beams = beams.filter(ImageFilter.GaussianBlur(28))
    img = screen(img, beams)

    def d(dr):
        # film strip on the side
        x = w * .07 if variant == "a" else w * .88
        dr.rectangle([x - 26, 0, x + 26, h], outline=mix(acc, (0, 0, 0), .2), width=2)
        for yy in range(10, h, 34):
            dr.rounded_rectangle([x - 12, yy, x + 12, yy + 18], radius=4, outline=acc, width=2)
        cx, cy, r = w * .6, h * .38, w * .22
        dr.ellipse([cx - r, cy - r, cx + r, cy + r], outline=sec, width=4)
        for k in range(5):
            a = k * 2 * math.pi / 5
            px, py = cx + r * .55 * math.cos(a), cy + r * .55 * math.sin(a)
            dr.ellipse([px - r * .2, py - r * .2, px + r * .2, py + r * .2], outline=acc, width=3)
    return screen(img, glow_layer(img.size, d, 9))


def motif_tv(img, acc, sec, rnd, variant):
    w, h = img.size
    img = screen(img, radial(w, h, w * .5, h * .4, w * .8, acc, .75))

    def d(dr):
        m = w * .12
        dr.rounded_rectangle([m, h * .14, w - m, h * .58], radius=34, outline=sec, width=5)
        for k, col in enumerate([(255, 60, 60), (60, 255, 120), (60, 140, 255)]):
            off = (k - 1) * 5
            for i in range(7):
                x = m + 20 + i * (w - 2 * m - 40) / 7
                dr.rectangle([x + off, h * .2, x + off + (w - 2 * m - 40) / 7 - 6, h * .52], outline=mix(col, (0, 0, 0), .5), width=1)
        dr.line([(w * .5, h * .58), (w * .38, h * .66)], fill=acc, width=4)
        dr.line([(w * .5, h * .58), (w * .62, h * .66)], fill=acc, width=4)
    img = screen(img, glow_layer(img.size, d, 10))
    arr = np.array(img).astype(np.int16)
    arr[::4] = (arr[::4] * .55).astype(np.int16)
    # glitch rows
    for _ in range(6):
        y0 = rnd.randint(0, h - 9)
        arr[y0:y0 + 8] = np.roll(arr[y0:y0 + 8], rnd.randint(-30, 30), axis=1)
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def motif_kpop(img, acc, sec, rnd, variant):
    w, h = img.size
    beams = Image.new("RGB", (w, h))
    bd = ImageDraw.Draw(beams)
    for k in range(6):
        sx = rnd.uniform(0, w)
        ex = rnd.uniform(-.3, 1.3) * w
        col = acc if k % 2 == 0 else sec
        bd.polygon([(sx - 6, 0), (sx + 6, 0), (ex + 90, h), (ex - 90, h)], fill=mix(col, (0, 0, 0), .45))
    img = screen(img, beams.filter(ImageFilter.GaussianBlur(22)))

    def d(dr):
        for _ in range(40):
            x, y, s = rnd.uniform(0, w), rnd.uniform(0, h), rnd.uniform(6, 34)
            col = mix(acc if rnd.random() < .5 else sec, (0, 0, 0), rnd.uniform(.2, .6))
            dr.ellipse([x, y, x + s, y + s], outline=col, width=2)
        # stage floor
        dr.ellipse([w * .1, h * .72, w * .9, h * .86], outline=mix(sec, (255, 255, 255), .2), width=3)
        dr.ellipse([w * .2, h * .75, w * .8, h * .83], outline=acc, width=2)
    return screen(img, glow_layer(img.size, d, 7))


def motif_comics(img, acc, sec, rnd, variant):
    w, h = img.size
    cx, cy = w * rnd.uniform(.4, .6), h * rnd.uniform(.3, .45)
    rays = Image.new("RGB", (w, h))
    rd = ImageDraw.Draw(rays)
    n = 18
    for k in range(n):
        a0 = k * 2 * math.pi / n
        a1 = a0 + math.pi / n
        R = max(w, h) * 1.2
        col = mix(acc, (0, 0, 0), .7) if k % 2 == 0 else mix(sec, (0, 0, 0), .85)
        rd.polygon([(cx, cy), (cx + R * math.cos(a0), cy + R * math.sin(a0)), (cx + R * math.cos(a1), cy + R * math.sin(a1))], fill=col)
    img = Image.blend(img, rays, .5)
    # halftone
    dots = Image.new("L", (w, h), 0)
    dd = ImageDraw.Draw(dots)
    for y in range(0, h, 14):
        for x in range(0, w, 14):
            dist = math.hypot(x - cx, y - cy) / max(w, h)
            r = max(0, 5.5 * (1 - dist * 1.4))
            if r > .5:
                dd.ellipse([x - r, y - r, x + r, y + r], fill=90)
    img = Image.composite(Image.new("RGB", (w, h), mix(acc, (255, 255, 255), .2)), img, dots)

    def d(dr):
        pts = []
        for k in range(24):
            a = k * 2 * math.pi / 24
            rr = (w * .2) * (1 if k % 2 == 0 else .62)
            pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
        dr.polygon(pts, outline=(255, 255, 255), width=5)
    return screen(img, glow_layer(img.size, d, 6, 1.2))


def motif_manga(img, acc, sec, rnd, variant):
    w, h = img.size
    base = gradient(w, h, (18, 18, 22), (6, 6, 8)) if variant == "a" else gradient(w, h, (232, 230, 225), (200, 198, 192))
    ink = (10, 10, 12) if variant == "b" else (235, 235, 235)
    dr = ImageDraw.Draw(base)
    cx, cy = w * .5, h * .38
    for k in range(120):
        a = rnd.uniform(0, 2 * math.pi)
        r0 = rnd.uniform(.18, .3) * w
        r1 = max(w, h)
        dr.line([(cx + r0 * math.cos(a), cy + r0 * math.sin(a)), (cx + r1 * math.cos(a), cy + r1 * math.sin(a))],
                fill=mix(ink, base.getpixel((1, 1)), .55), width=1)
    for _ in range(18):
        x, y, s = rnd.uniform(0, w), rnd.uniform(0, h), rnd.uniform(8, 60)
        dr.ellipse([x, y, x + s, y + s * rnd.uniform(.6, 1.2)], fill=ink)
        for _ in range(6):
            dx, dy, ss = x + rnd.uniform(-60, 60), y + rnd.uniform(-60, 60), rnd.uniform(2, 8)
            dr.ellipse([dx, dy, dx + ss, dy + ss], fill=ink)
    r = w * .2
    dr.ellipse([cx - r, cy - r, cx + r, cy + r], fill=sec)
    # panel frames
    dr.rectangle([w * .06, h * .06, w * .94, h * .94], outline=ink, width=4)
    dr.line([(w * .06, h * .62), (w * .94, h * .55)], fill=ink, width=4)
    return base


def motif_cosplay(img, acc, sec, rnd, variant):
    w, h = img.size
    img = screen(img, radial(w, h, w * .5, h * .38, w * .9, acc, .8))
    cx, cy = w * .5, h * .38

    def d(dr):
        for k in range(1, 6):
            r = w * .07 * k
            dr.ellipse([cx - r, cy - r, cx + r, cy + r], outline=sec if k % 2 else acc, width=2)
        for k in range(16):
            a = k * 2 * math.pi / 16
            r0, r1 = w * .12, w * .36
            dr.line([(cx + r0 * math.cos(a), cy + r0 * math.sin(a)), (cx + r1 * math.cos(a), cy + r1 * math.sin(a))], fill=sec, width=1)
        # mask
        mw, mh = w * .34, w * .13
        dr.polygon([(cx - mw / 2, cy - mh / 3), (cx - mw / 5, cy - mh / 2), (cx, cy - mh / 5), (cx + mw / 5, cy - mh / 2),
                    (cx + mw / 2, cy - mh / 3), (cx + mw / 3, cy + mh / 2), (cx, cy + mh / 4), (cx - mw / 3, cy + mh / 2)],
                   outline=(255, 236, 170), width=4)
        dr.ellipse([cx - mw / 4 - 16, cy - 8, cx - mw / 4 + 16, cy + 12], outline=(255, 236, 170), width=3)
        dr.ellipse([cx + mw / 4 - 16, cy - 8, cx + mw / 4 + 16, cy + 12], outline=(255, 236, 170), width=3)
    return screen(img, glow_layer(img.size, d, 9))


MOTIFS = {"anime": motif_anime, "gaming": motif_gaming, "movies": motif_movies, "tv-shows": motif_tv,
          "k-pop": motif_kpop, "comics": motif_comics, "manga": motif_manga, "cosplay": motif_cosplay}
COLORS = {}


def finish(img, rnd):
    w, h = img.size
    arr = np.array(img).astype(np.float32)
    # vignette
    y, x = np.ogrid[:h, :w]
    d = np.sqrt(((x - w / 2) / (w / 2)) ** 2 + ((y - h / 2) / (h / 2)) ** 2)
    arr *= np.clip(1.15 - d * .45, .35, 1)[..., None]
    # grain
    arr += np.random.default_rng(rnd.randint(0, 99999)).normal(0, 3.5, arr.shape[:2])[..., None]
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def wrap(draw, text, f, maxw):
    words, lines, cur = text.split(), [], ""
    for wd in words:
        t = (cur + " " + wd).strip()
        if draw.textlength(t, font=f) <= maxw:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = wd
    if cur:
        lines.append(cur)
    return lines


def typeset(img, title, label, acc, variant, realm):
    w, h = img.size
    dr = ImageDraw.Draw(img)
    light_bg = realm == "manga" and variant == "b"
    ink = (12, 12, 14) if light_bg else (255, 255, 255)
    # giant outline initial
    initial = "".join(p[0] for p in title.replace("-", " ").split()[:2]).upper()
    big = font("Orbitron.ttf", int(h * .34), 900)
    tw = dr.textlength(initial, font=big)
    ov = Image.new("RGBA", img.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(ov)
    od.text(((w - tw) / 2 + (w * .12 if variant == "b" else 0), h * .06), initial, font=big, fill=(0, 0, 0, 0),
            stroke_width=2, stroke_fill=(*ink, 55))
    img.paste(ov, (0, 0), ov)
    dr = ImageDraw.Draw(img)
    # bottom scrim
    scrim = gradient(w, int(h * .45), (0, 0, 0), (0, 0, 0))
    mask = Image.fromarray((np.linspace(0, 1, int(h * .45)) ** 1.4 * (120 if light_bg else 215)).astype(np.uint8)[:, None].repeat(w, 1), "L")
    if not light_bg:
        img.paste(scrim, (0, h - int(h * .45)), mask)
    dr = ImageDraw.Draw(img)
    size = int(min(w, h) * (.085 if variant == "a" else .06))
    f = font("Orbitron.ttf", size, 800)
    lines = wrap(dr, title.upper(), f, w * .84)
    while len(lines) > 3:
        size = int(size * .86)
        f = font("Orbitron.ttf", size, 800)
        lines = wrap(dr, title.upper(), f, w * .84)
    y = h - h * .08 - len(lines) * size * 1.15
    lf = font("Rajdhani-Bold.ttf", int(size * .5))
    dr.text((w * .08, y - size * .95), label.upper(), font=lf, fill=acc)
    dr.line([(w * .08, y - size * .25), (w * .08 + w * .16, y - size * .25)], fill=acc, width=3)
    for i, ln in enumerate(lines):
        dr.text((w * .08, y + i * size * 1.15), ln, font=f, fill=ink)
    # frame corners (HUD)
    c = int(min(w, h) * .05)
    for (x0, y0, sx, sy) in [(14, 14, 1, 1), (w - 14, 14, -1, 1), (14, h - 14, 1, -1), (w - 14, h - 14, -1, -1)]:
        dr.line([(x0, y0), (x0 + c * sx, y0)], fill=(*acc,), width=2)
        dr.line([(x0, y0), (x0, y0 + c * sy)], fill=(*acc,), width=2)
    return img


def render(kind, slug, title, realm, label, size, variant):
    acc, sec = COLORS[realm]
    rnd = random.Random(zlib.crc32(f'{kind}/{slug}/{variant}'.encode()))
    w, h = size
    if variant == "b":
        acc, sec = sec, acc
    top = mix(BG, acc, .10 if variant == "a" else .18)
    bottom = mix(BG, sec, .06)
    img = gradient(w, h, top, bottom)
    img = screen(img, radial(w, h, w * rnd.uniform(.1, .9), h * rnd.uniform(.5, .9), w * .8, sec, .35))
    img = MOTIFS[realm](img, acc, sec, rnd, "a" if variant == "c" else variant)
    img = finish(img, rnd)
    if variant != "c":
        img = typeset(img, title, label, acc, variant, realm)
    path = os.path.join(OUT, kind)
    os.makedirs(path, exist_ok=True)
    img.save(os.path.join(path, f"{slug}-{variant}.webp"), "WEBP", quality=72, method=6)


def main():
    manifest = json.load(open(os.path.join(ROOT, "tools", "image_manifest.json")))
    for slug, name, a, b in manifest["categories"]:
        COLORS[slug] = (hex2rgb(a), hex2rgb(b))
    COLORS["manga"] = (hex2rgb("#E5E7EB"), hex2rgb("#DC2626"))
    only = sys.argv[1:]
    portrait, landscape = (480, 720), (880, 495)
    jobs = []
    for slug, name, a, b in manifest["categories"]:
        jobs += [("categories", slug, name, slug, "Realm", (1280, 720), v) for v in "ab"]
    for kind, size, variants in [("content", portrait, "ab"), ("characters", portrait, "ab"), ("merch", portrait, "abc"),
                                 ("upcoming", portrait, "ab"), ("media", landscape, "ab"), ("events", landscape, "ab"),
                                 ("articles", landscape, "ab"), ("submissions", landscape, "a")]:
        for slug, title, realm, l1, l2 in manifest[kind]:
            label = " / ".join(str(x) for x in [realm.replace("-", " "), l1, l2] if x)
            jobs += [(kind, slug, title, realm, label, size, v) for v in variants]
    if only:
        jobs = [j for j in jobs if j[0] in only]
    for i, j in enumerate(jobs):
        render(*j)
        if i % 50 == 0:
            print(i, "/", len(jobs), flush=True)
    print("done", len(jobs))


if __name__ == "__main__":
    main()
