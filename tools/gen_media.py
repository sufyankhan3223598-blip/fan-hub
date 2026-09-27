"""
Generates the original audio (soundtracks / podcast intermission) and video (realm teasers,
animated explainers) used by the Multimedia Center, into backend/FanHubPlus.Api/wwwroot/media.
Requires ffmpeg (libx264 + libmp3lame) and numpy. Everything is synthesized - no third-party media.
"""
import json, os, subprocess, sys, wave
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MEDIA = os.path.join(ROOT, "backend", "FanHubPlus.Api", "wwwroot", "media")
FONT = os.path.join(ROOT, "tools", "fonts", "Orbitron.ttf")
FONT2 = os.path.join(ROOT, "tools", "fonts", "Rajdhani-SemiBold.ttf")
SR = 44100


def note(n):  # midi -> Hz
    return 440.0 * 2 ** ((n - 69) / 12)


def env(length, a=0.02, r=0.3):
    t = np.arange(length) / SR
    e = np.minimum(1, t / a) * np.exp(-t / max(r, 1e-3))
    return e


def voice(freq, dur, kind="sine", a=0.01, r=0.4, detune=0.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    ph = 2 * np.pi * freq * t
    if kind == "sine":
        w = np.sin(ph)
    elif kind == "tri":
        w = 2 / np.pi * np.arcsin(np.sin(ph))
    elif kind == "saw":
        w = sum(np.sin(ph * k) / k for k in range(1, 12)) * 0.6
    elif kind == "square":
        w = sum(np.sin(ph * k) / k for k in range(1, 14, 2)) * 0.8
    else:  # pad
        w = (np.sin(ph) + np.sin(ph * (1 + detune + 0.003)) + 0.5 * np.sin(ph * 2.001)) / 2.2
    return w * env(n, a, r)


def place(buf, sig, start):
    s = int(start * SR)
    e = min(len(buf), s + len(sig))
    buf[s:e] += sig[:e - s]


def reverb(x, delays=(0.031, 0.047, 0.071, 0.113), fb=0.35):
    out = x.copy()
    for d in delays:
        k = int(d * SR)
        y = np.zeros_like(x)
        y[k:] = x[:-k] * fb
        out += y
    return out


def compose(style, seconds=60, bpm=96, root=57, seed=1):
    rng = np.random.default_rng(seed)
    buf = np.zeros(int(seconds * SR) + SR)
    beat = 60 / bpm
    minor = [0, 2, 3, 5, 7, 8, 10]
    major = [0, 2, 4, 5, 7, 9, 11]
    scale = major if style in ("pop", "heroic", "waltz") else minor
    prog = [0, 5, 3, 4] if style != "waltz" else [0, 3, 4, 0]
    bars = int(seconds / (beat * 4))
    for bar in range(bars):
        deg = prog[bar % 4]
        chord = [root + scale[(deg + i) % 7] + 12 * ((deg + i) // 7) for i in (0, 2, 4)]
        t0 = bar * beat * 4
        # pad
        for n in chord:
            place(buf, voice(note(n), beat * 4.2, "pad", a=0.4, r=2.5, detune=0.002) * 0.12, t0)
        # bass
        place(buf, voice(note(chord[0] - 12), beat * 3.5, "tri", a=0.01, r=1.2) * 0.3, t0)
        if style in ("chiptune", "pop", "synth", "heroic"):
            steps = 8 if style != "heroic" else 4
            kind = {"chiptune": "square", "pop": "saw", "synth": "saw", "heroic": "tri"}[style]
            for s in range(steps):
                n = chord[s % 3] + 12 * (1 + (s // 3) % 2)
                place(buf, voice(note(n), beat / 2, kind, a=0.005, r=0.18) * (0.07 if kind != "tri" else 0.12), t0 + s * beat * 4 / steps)
        if style in ("ambient", "piano", "cinematic", "waltz"):
            for s in range(4 if style != "waltz" else 6):
                if rng.random() < 0.75:
                    n = root + 12 + scale[rng.integers(0, 7)]
                    place(buf, voice(note(n), beat * 2, "sine", a=0.005, r=0.9) * 0.16, t0 + s * beat * (4 / (4 if style != "waltz" else 6)) * (1 if style != "waltz" else 1))
        # percussion
        if style in ("pop", "chiptune", "synth", "heroic"):
            for s in range(4):
                kick = np.sin(2 * np.pi * np.linspace(0, 1, int(0.15 * SR)) * 55 * np.exp(-np.linspace(0, 6, int(0.15 * SR)))) * env(int(0.15 * SR), 0.001, 0.08)
                place(buf, kick * 0.5, t0 + s * beat)
                if s % 2 == 1:
                    sn = rng.normal(0, 1, int(0.12 * SR)) * env(int(0.12 * SR), 0.001, 0.05)
                    place(buf, sn * 0.12, t0 + s * beat)
                hh = rng.normal(0, 1, int(0.04 * SR)) * env(int(0.04 * SR), 0.001, 0.01)
                place(buf, hh * 0.05, t0 + s * beat + beat / 2)
    buf = reverb(buf)
    # fade in/out
    fade = int(2 * SR)
    buf[:fade] *= np.linspace(0, 1, fade)
    buf[int(seconds * SR) - fade:int(seconds * SR)] *= np.linspace(1, 0, fade)
    buf = buf[:int(seconds * SR)]
    buf /= max(1e-6, np.abs(buf).max()) / 0.85
    return buf


def write_mp3(samples, path):
    tmp = path + ".wav"
    with wave.open(tmp, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((samples * 32767).astype(np.int16).tobytes())
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp, "-codec:a", "libmp3lame", "-b:a", "128k", path], check=True)
    os.remove(tmp)


TRACKS = [
    ("sakura-blade", "ambient", 84, 57), ("pixel-quest", "chiptune", 128, 60), ("spotlight-overture", "cinematic", 72, 55),
    ("signal-lost", "synth", 110, 52), ("neon-stage", "pop", 118, 61), ("halftone-hero", "heroic", 100, 58),
    ("ink-and-silence", "piano", 66, 56), ("masquerade", "waltz", 90, 60), ("nexus-theme", "cinematic", 80, 53),
    ("realm-radio-1", "ambient", 70, 59),
]


def gen_audio():
    os.makedirs(os.path.join(MEDIA, "audio"), exist_ok=True)
    for i, (name, style, bpm, root) in enumerate(TRACKS):
        write_mp3(compose(style, 60, bpm, root, seed=i + 7), os.path.join(MEDIA, "audio", f"{name}.mp3"))
        print("audio", name, flush=True)


def esc(t):
    return t.replace(":", r"\:").replace("'", r"\'").replace(",", r"\,")


def teaser(realm, title, tagline, posters, accent):
    """30s montage: Ken Burns on 5 posters with crossfades + title cards."""
    out = os.path.join(MEDIA, "video", f"{realm}-teaser.mp4")
    inputs, filters = [], []
    seg = 6.5
    for i, p in enumerate(posters[:5]):
        inputs += ["-loop", "1", "-t", str(seg), "-i", p]
        filters.append(
            f"[{i}:v]scale=1280:-2,crop=1280:720,zoompan=z='min(zoom+0.0009,1.12)':d={int(seg * 25)}:s=1280x720:fps=25,"
            f"eq=brightness=-0.08:saturation=1.1,setsar=1[v{i}]")
    chain, last, offset = "", "v0", seg - 1
    for i in range(1, len(posters[:5])):
        chain += f";[{last}][v{i}]xfade=transition=fade:duration=1:offset={offset}[x{i}]"
        last, offset = f"x{i}", offset + seg - 1
    total = offset + 1
    text = (f"[{last}]drawbox=x=0:y=ih-150:w=iw:h=150:color=black@0.55:t=fill,"
            f"drawtext=fontfile='{FONT}':text='{esc(title.upper())}':fontcolor=white:fontsize=58:x=60:y=h-128:alpha='if(lt(t,1),t,1)',"
            f"drawtext=fontfile='{FONT2}':text='{esc(tagline)}':fontcolor={accent}:fontsize=30:x=62:y=h-58:alpha='if(lt(t,1.5),0,min(1,t-1.5))',"
            f"drawtext=fontfile='{FONT}':text='FAN HUB PLUS':fontcolor=white@0.8:fontsize=22:x=w-tw-40:y=36,"
            f"fade=t=in:st=0:d=1,fade=t=out:st={total - 1.2}:d=1.2[out]")
    fc = ";".join(filters) + chain + ";" + text
    cmd = ["ffmpeg", "-y", "-loglevel", "error"] + inputs + ["-filter_complex", fc, "-map", "[out]", "-t", str(total),
           "-c:v", "libx264", "-preset", "veryfast", "-crf", "28", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]
    subprocess.run(cmd, check=True)
    # add soundtrack
    track = {"anime": "sakura-blade", "gaming": "pixel-quest", "movies": "spotlight-overture", "tv-shows": "signal-lost",
             "k-pop": "neon-stage", "comics": "halftone-hero", "manga": "ink-and-silence", "cosplay": "masquerade"}.get(realm, "nexus-theme")
    mixed = out.replace(".mp4", ".tmp.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", out, "-i", os.path.join(MEDIA, "audio", f"{track}.mp3"),
                    "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "96k", "-shortest",
                    "-af", f"afade=t=out:st={total - 2}:d=2", "-movflags", "+faststart", mixed], check=True)
    os.replace(mixed, out)
    print("video", realm, flush=True)


def explainer(name, heading, steps, bg):
    out = os.path.join(MEDIA, "video", f"explainer-{name}.mp4")
    dur = 24
    per = dur / len(steps)
    draws = [f"drawtext=fontfile='{FONT}':text='{esc(heading.upper())}':fontcolor=0xF5C86A:fontsize=46:x=80:y=90"]
    for i, s in enumerate(steps):
        st = i * per + 0.3
        draws.append(
            f"drawtext=fontfile='{FONT2}':text='{i + 1:02d}  {esc(s)}':fontcolor=white:fontsize=40:x='80+max(0,60-(t-{st:.2f})*180)':"
            f"y={200 + i * 90}:alpha='if(lt(t,{st:.2f}),0,min(1,(t-{st:.2f})*2))'")
        draws.append(f"drawbox=x=80:y={250 + i * 90}:w='if(lt(t,{st:.2f}),0,min(900,(t-{st:.2f})*900))':h=2:color=0x22D3EE@0.8:t=fill")
    fc = (f"[0:v]scale=1280:-2,crop=1280:720,boxblur=18:2,eq=brightness=-0.25,setsar=1," + ",".join(draws) +
          f",drawtext=fontfile='{FONT}':text='FAN HUB PLUS':fontcolor=white@0.7:fontsize=20:x=w-tw-40:y=h-50,fade=t=in:st=0:d=0.8,fade=t=out:st={dur - 1}:d=1[out]")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-loop", "1", "-t", str(dur), "-i", bg,
                    "-i", os.path.join(MEDIA, "audio", "realm-radio-1.mp3"),
                    "-filter_complex", fc, "-map", "[out]", "-map", "1:a", "-t", str(dur), "-r", "25",
                    "-c:v", "libx264", "-preset", "veryfast", "-crf", "28", "-pix_fmt", "yuv420p",
                    "-c:a", "aac", "-b:a", "96k", "-shortest", "-movflags", "+faststart", out], check=True)
    print("explainer", name, flush=True)


def gen_video():
    os.makedirs(os.path.join(MEDIA, "video"), exist_ok=True)
    manifest = json.load(open(os.path.join(ROOT, "tools", "image_manifest.json")))
    sys.path.insert(0, os.path.join(ROOT, "tools"))
    from seed_data import CATEGORIES
    for slug, name, tagline, _desc, accent, _sec, _icon in CATEGORIES:
        posters = [os.path.join(MEDIA, "images", "content", f"{c[0]}-{v}.webp")
                   for c in manifest["content"] if c[2] == slug for v in "a"][:5]
        teaser(slug, f"{name} Realm", tagline, posters, accent)
    img = lambda k, s: os.path.join(MEDIA, "images", k, f"{s}-b.webp")
    explainer("bookmarks", "Bookmarks and Notes", ["Open any card or detail page", "Tap the bookmark icon", "Add a personal note", "Find everything in Bookmarks"], img("categories", "anime"))
    explainer("submissions", "Submitting Fan Content", ["Open Submit Fan Content", "Write your article or upload art", "Admins review within 48 hours", "Approved posts go public"], img("categories", "cosplay"))
    explainer("events", "Finding Events Near You", ["Open the Event Map", "Allow location and press Near Me", "Filter the calendar by city", "Follow the ticket link"], img("categories", "gaming"))


if __name__ == "__main__":
    what = sys.argv[1:] or ["audio", "video"]
    if "audio" in what:
        gen_audio()
    if "video" in what:
        gen_video()
