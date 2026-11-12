"""Writes the component previews, their guidelines, the cover and the index of the design system.

Run from the repo root: python3 design/generate-components.py design/design-system
"""
import datetime
import json
import os
import sys

OUT = sys.argv[1]
FONTS = ('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?'
         'family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Geist:wght@400..700'
         '&family=Geist+Mono:wght@400..600&display=swap">')

T = {  # template thumbnails: name -> (asset id, bytes)
    "galaxy": ("03f8ecb7fb8ab934724f3814ef03689b", 12020), "radialBars": ("9464e854c57bcf1c24a983d9a059280e", 15172),
    "sphereSwarm": ("77f87d7ee605f6c0ae587d37caf19f6e", 15479), "terrainWave": ("e8ee4020e46c42816a415a8bad032c19", 14316),
    "liquidGold": ("ce485015a64c3018a1d70319e91de5d1", 23952), "nova": ("ab4a26c2e872e61fb6d535196e7478eb", 14407),
    "hyperdrive": ("2d77debe8356f7f6b22556d9441c4a44", 18361), "helix": ("be931f4eae5eb8f0f5280955bb5b013d", 14071),
    "nightCity": ("33edbac81e652adb13e8d49f43a3c8c2", 25321), "aurora": ("8c546043ae47bb1056894f2245d751ff", 15707),
    "jellyfish": ("905ee29eff68bd8c6685ace0306e2155", 7939), "solar": ("c7e82ae45c3fbc45d961db57fc5fa1ee", 21547),
    "nebula": ("c2dc97c2e1bfd8c4f3015b7659c78207", 23442), "vortex": ("d2e39e4768e0f016489e0a9b4374aaf1", 16594),
    "equalizer": ("312e184739504e3a23f7d92dd2e29cb4", 21309), "pulseRing": ("396f7309d1efcc5f0bf014297ed18804", 9014),
}
E = {  # element thumbnails
    "barRing": ("8e7bc2ea9c6c31af084cdeaef63b91ea", 9055), "stars": ("4fc9e9379949205ec35fd43c4fe765df", 2151),
    "core": ("6621542129cd5d7b24416bac088ea4f6", 3914), "tunnel": ("8c8ed9d44ac278263d9fed695d1aacc4", 10856),
    "gridFloor": ("976d32a4000620d3698cd837b9dd13e6", 12227), "trackTitle": ("b1842b2dee006177bd1c37dd5e12d775", 6486),
    "spectrumRing": ("3d063ab6114b2d69e80758aa39a276c1", 7843), "sun": ("1d3195633a353195faa4759fca3f5f87", 5193),
}


def img(name):
    asset = T.get(name) or E[name]
    return f"background-image:url(/_blob/{asset[0]})"


def ic(name, cls="", solid=False):
    extra = " data-solid" if solid else ""
    return f'<i class="pf-i {cls}" data-i="{name}"{extra}></i>'


MARK = ('<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="9" cy="9" r="3"/><circle cx="24" cy="9" r="5"/><circle cx="39" cy="9" r="3"/>'
        '<circle cx="9" cy="24" r="5"/><circle cx="24" cy="24" r="8"/><circle cx="39" cy="24" r="5"/>'
        '<circle cx="9" cy="39" r="3"/><circle cx="24" cy="39" r="5"/><circle cx="39" cy="39" r="3"/></svg>')
LOGO = f'<span class="pf-logo">{MARK}<span>Beatframe</span></span>'


def scrub(label, value, unit="", v=0.5, sig=None, m=0.2, key="", active=False, lock=False, bare=False):
    mod = f'<span class="pf-scrub__mod" data-sig="{sig}" style="--m:{m}"></span>' if sig else ""
    unit_html = f"<small>{unit}</small>" if unit else ""
    act = " data-active" if active else ""
    if bare:
        tail = ""
    elif lock:
        tail = (f'<span class="pf-param__lock" title="Counts cannot react or animate">{ic("lock","pf-i--sm")}</span>'
                '<span style="width:16px"></span>')
    else:
        jack = f'<button class="pf-jack" data-sig="{sig}" aria-label="Reacts to {sig}"></button>' if sig else \
            '<button class="pf-jack" aria-label="React to audio"></button>'
        state = f' data-state="{key}"' if key else ""
        tail = jack + f'<button class="pf-key"{state} aria-label="Animate over time"></button>'
    return (f'<div class="pf-param"><div class="pf-scrub" role="slider" tabindex="0" aria-label="{label}" style="--v:{v}"{act}>'
            f'<span class="pf-scrub__label">{label}</span><span class="pf-scrub__value">{value}{unit_html}</span>{mod}</div>{tail}</div>')


def seg(items, pressed, block=False, locked=()):
    out = []
    for item in items:
        on = ' aria-pressed="true"' if item == pressed else ' aria-pressed="false"'
        lk = " data-locked" if item in locked else ""
        icon = ic("lock") if item in locked else ""
        out.append(f'<button class="pf-seg__item"{on}{lk}>{item}{icon}</button>')
    cls = "pf-seg pf-seg--block" if block else "pf-seg"
    return f'<div class="{cls}" role="group">{"".join(out)}</div>'


def tcard(name, label, meta, current=False, compact=False, badge=""):
    cur = ' aria-current="true"' if current else ""
    cls = "pf-tcard pf-tcard--compact" if compact else "pf-tcard"
    badges = f'<span class="pf-tcard__badges">{badge}</span>' if badge else ""
    meta_html = "" if compact else f'<span class="pf-tcard__meta">{meta}</span>'
    return (f'<a class="{cls}" href="#"{cur}><span class="pf-tcard__media" style="{img(name)}">{badges}'
            f'<span class="pf-tcard__play"><span>{ic("play", solid=True)}</span></span></span>'
            f'<span class="pf-tcard__body"><span class="pf-tcard__name">{label}</span>{meta_html}</span></a>')


def layer(name, thumb, sigs=(), selected=False, hidden=False):
    sel = ' aria-selected="true"' if selected else ""
    hid = " data-hidden" if hidden else ""
    dots = "".join(f'<span class="pf-dot" data-sig="{s}" title="Reacts to {s}"></span>' for s in sigs)
    eye = "eye-off" if hidden else "eye"
    return (f'<div class="pf-layer" role="option"{sel}{hid}><span class="pf-layer__grip">{ic("grip","pf-i--sm")}</span>'
            f'<span class="pf-layer__thumb" style="{img(thumb)}"></span><span class="pf-layer__name">{name}</span>'
            f'<span class="pf-layer__sigs">{dots}</span>'
            f'<button class="pf-layer__btn" aria-label="Show or hide">{ic(eye)}</button>'
            f'<button class="pf-layer__btn" aria-label="More">{ic("more")}</button></div>')


SIGS = [("bass", "Bass"), ("mid", "Mids"), ("high", "Highs"), ("level", "Level"), ("beat", "Beat")]


def chips(pressed=None):
    return "".join(
        f'<button class="pf-signal" data-sig="{k}" aria-pressed="{"true" if k == pressed else "false"}">{label}</button>'
        for k, label in SIGS)


TIMELINE = f'''<div class="pf-timeline" style="--t:.34;width:100%">
<div class="pf-tl-row pf-tl-row--ruler"><div class="pf-tl-head"><span class="pf-overline">Timeline</span></div>
<div class="pf-tl-lane"><span style="left:0">0:00</span><span style="left:12.5%">0:24</span><span style="left:25%">0:48</span><span style="left:37.5%">1:12</span><span style="left:50%">1:36</span><span style="left:62.5%">2:00</span><span style="left:75%">2:24</span><span style="left:87.5%">2:48</span></div></div>
<div class="pf-tl-row pf-tl-row--wave"><div class="pf-tl-head">{ic("music","pf-i--sm")}<b>demo-track.wav</b></div>
<div class="pf-tl-lane"><div class="pf-wave" data-bars="150" data-played=".34"></div><div class="pf-beats"></div>
<div class="pf-range" style="left:25%;width:15.6%"><span class="pf-range__label">Export 0:30</span></div></div></div>
<div class="pf-tl-row"><div class="pf-tl-head"><button class="pf-key" data-state="at"></button><b>Galaxy</b>&nbsp;Arm twist</div>
<div class="pf-tl-lane"><span class="pf-kfspan" style="left:8%;width:54%"></span><button class="pf-kf" style="left:8%"></button><button class="pf-kf" data-sel style="left:34%"></button><button class="pf-kf" style="left:62%"></button></div></div>
<div class="pf-tl-row"><div class="pf-tl-head"><button class="pf-key" data-state="on"></button><b>Camera</b>&nbsp;Distance</div>
<div class="pf-tl-lane"><span class="pf-kfspan" style="left:25%;width:25%"></span><button class="pf-kf" style="left:25%"></button><button class="pf-kf" style="left:50%"></button><button class="pf-kf pf-kf--hold" style="left:81%"></button></div></div>
<div class="pf-tl-row"><div class="pf-tl-head"><button class="pf-key" data-state="on"></button><b>Look</b>&nbsp;Bloom</div>
<div class="pf-tl-lane"><span class="pf-kfspan" style="left:40%;width:30%"></span><button class="pf-kf" style="left:40%"></button><button class="pf-kf" style="left:70%"></button></div></div>
<div class="pf-playhead"></div></div>'''

TRANSPORT = f'''<div class="pf-transport" style="width:100%">
<button class="pf-play" aria-label="Play">{ic("play", solid=True)}</button>
<span class="pf-timecode">1:05.12 <span>/ 3:12.00</span></span>
<span class="pf-sep"></span>
<button class="pf-track-chip">{ic("music","pf-i--sm")}<span>demo-track.wav</span>{ic("chevron-down","pf-i--sm")}</button>
<span class="pf-badge pf-badge--outline">128 BPM</span>
<span class="pf-spacer"></span>
<button class="pf-btn pf-btn--ghost pf-btn--icon" aria-pressed="true" aria-label="Loop the export section">{ic("repeat")}</button>
<button class="pf-btn pf-btn--ghost pf-btn--icon" aria-label="Mute">{ic("volume")}</button>
<span class="pf-sep"></span>
<button class="pf-btn pf-btn--ghost pf-btn--icon pf-btn--sm" aria-label="Zoom out">{ic("minus")}</button>
<span class="pf-timecode" style="font-size:12px">4x</span>
<button class="pf-btn pf-btn--ghost pf-btn--icon pf-btn--sm" aria-label="Zoom in">{ic("plus")}</button>
</div>'''

APPBAR = f'''<div style="display:flex;align-items:center;gap:8px;width:100%;height:48px;padding:0 12px;border-bottom:1px solid var(--line-1);background:var(--bg-2)">
<span class="pf-logo">{MARK}</span><span class="pf-sep"></span>
<input class="pf-input pf-input--bare" style="width:180px" value="Night drive visual" aria-label="Project title">
<span class="pf-badge pf-badge--success">{ic("check")}Saved</span>
<span class="pf-spacer"></span>
<button class="pf-btn pf-btn--ghost pf-btn--icon" aria-label="Undo">{ic("undo")}</button>
<button class="pf-btn pf-btn--ghost pf-btn--icon" aria-label="Redo" disabled>{ic("redo")}</button>
<span class="pf-sep"></span>
{seg(["16:9", "9:16", "1:1"], "16:9")}
<span class="pf-spacer"></span>
<span class="pf-badge">Free</span>
<button class="pf-btn pf-btn--ghost">{ic("share")}Share</button>
<button class="pf-btn pf-btn--cta">{ic("download")}Export</button>
<span class="pf-avatar">NZ</span></div>'''

EXPORT = f'''<div class="pf-popover pf-stack" style="gap:12px">
<div class="title">Export video</div>
<div class="pf-field"><span class="pf-label">Format</span>{seg(["16:9", "9:16", "1:1"], "9:16", block=True)}</div>
<div class="pf-field"><span class="pf-label">Resolution</span>{seg(["720p", "1080p", "1440p", "4K"], "720p", block=True, locked=("1080p", "1440p", "4K"))}</div>
<div class="pf-field"><span class="pf-label">Frame rate</span>{seg(["30 fps", "60 fps"], "30 fps", block=True, locked=("60 fps",))}</div>
<div class="pf-field"><span class="pf-label">Length</span>{seg(["Whole track", "15 s", "30 s", "60 s"], "30 s", block=True)}</div>
<div class="pf-banner pf-banner--premium">{ic("crown")}<span><b>1080p to 4K, 60 fps, no watermark.</b> Premium unlocks them.</span></div>
<div class="pf-row" style="justify-content:space-between"><span class="pf-note">720 x 1280 · 0:30 · about 1 min</span>
<button class="pf-btn pf-btn--cta">{ic("download")}Export</button></div></div>'''

C = []  # (name, group, height, body class, body html, guidelines)


def add(name, group, height, cls, body, readme):
    C.append((name, group, height, cls, body, readme))


add("Logo", "Brand", 96, "", f'''<span class="pf-logo pf-logo--lg">{MARK}<span>Beatframe</span></span>
<span style="width:32px"></span>{LOGO}<span style="width:32px"></span><span class="pf-logo">{MARK}</span>''',
    """The nine-dot sound figure and the name set in the display face.

- The mark is nine dots in a 3 by 3 grid: small at the corners, larger on the edges, largest in the centre. It is always one colour: `accent` on dark grounds, `on-accent` on an `accent` tile, `bg-0` on light grounds.
- The name is "Beatframe", one word, capital B, always `ink-1` on dark. No gradient, no second colour in the name.
- Full logo in the marketing nav and footer. Mark alone in the editor's app bar, as the app icon (on an `accent` tile with a 25% corner radius) and as the favicon.
- Clear space: the width of the centre dot on every side. Minimum size: 16px mark, 14px name.
- The watermark in a rendered video is the name alone in the display face, white at 70% opacity, bottom right.
- The name lives in `remotion/brand.ts`; change it there, never hard-code it. Trademark and domain have not been checked yet.""")

add("Button", "Actions", 232, "pf-demo--col", f'''<div class="pf-row">
<button class="pf-btn pf-btn--cta">{ic("download")}Export</button>
<button class="pf-btn pf-btn--accent">Add keyframe</button>
<button class="pf-btn pf-btn--secondary">Save project</button>
<button class="pf-btn pf-btn--ghost">{ic("share")}Share</button>
<button class="pf-btn pf-btn--premium">{ic("crown")}Upgrade</button>
<button class="pf-btn pf-btn--danger">{ic("trash")}Delete project</button></div>
<div class="pf-row">
<button class="pf-btn pf-btn--cta pf-btn--xl">Start with your track{ic("arrow-right")}</button>
<button class="pf-btn pf-btn--secondary pf-btn--xl">Browse templates</button>
<button class="pf-btn pf-btn--cta pf-btn--lg">Create account</button>
<button class="pf-btn pf-btn--secondary pf-btn--sm">{ic("plus","pf-i--sm")}Add</button></div>
<div class="pf-row">
<button class="pf-btn pf-btn--ghost pf-btn--icon" aria-label="Undo">{ic("undo")}</button>
<button class="pf-btn pf-btn--ghost pf-btn--icon" aria-pressed="true" aria-label="Loop">{ic("repeat")}</button>
<button class="pf-btn pf-btn--secondary pf-btn--icon" aria-label="More">{ic("more")}</button>
<button class="pf-btn pf-btn--cta" aria-busy="true">Export</button>
<button class="pf-btn pf-btn--secondary" disabled>Save project</button></div>''',
    """One action. Six looks, four sizes, and an icon-only form.

- **cta** (white): the one thing the view is for. At most one per view: "Open the editor" on a marketing page, "Export" in the editor, "Log in" on the login page.
- **accent**: confirms inside a popover or dialog when a cta is already on screen.
- **secondary**: every other action that needs to look like a button.
- **ghost**: toolbar and row actions; icon-only buttons are ghost by default. A toggled-on ghost button uses `aria-pressed="true"` and turns `accent-soft`.
- **premium**: only for upgrading. **danger**: only for deleting, and only as the confirming button.
- Sizes: `sm` 24px (rows, section headers), default 32px (editor), `lg` 40px (account pages, nav), `xl` 48px (hero and closing call).
- Label: verb first, sentence case, no full stop: "Save project", "Export", "Delete project". While working, set `aria-busy="true"`; the label is replaced by a spinner and the width does not change.
- An icon-only button always has an `aria-label` and a Tooltip.""")

add("Kbd", "Actions", 72, "", '''<span class="pf-row"><span class="pf-kbd">Space</span><span class="pf-note">Play or pause</span></span>
<span class="pf-row"><span class="pf-kbd">⌘</span><span class="pf-kbd">Z</span><span class="pf-note">Undo</span></span>
<span class="pf-row"><span class="pf-kbd">⌫</span><span class="pf-note">Delete element</span></span>
<span class="pf-row"><span class="pf-kbd">?</span><span class="pf-note">All shortcuts</span></span>''',
    """A key cap. Shows a keyboard shortcut next to the action it triggers.

- Use in tooltips, on the right of menu items and in the shortcut list (`?`).
- One cap per key; modifiers first. Show ⌘ on macOS and Ctrl elsewhere.""")

add("Badge", "Status", 112, "pf-demo--col", f'''<div class="pf-row">
<span class="pf-badge">Free</span>
<span class="pf-badge pf-badge--premium">{ic("crown")}Premium</span>
<span class="pf-badge pf-badge--accent"><span class="pf-badge__dot pf-badge__dot--live"></span>Rendering 42%</span>
<span class="pf-badge pf-badge--outline">Queued · 2nd</span>
<span class="pf-badge pf-badge--success">{ic("check")}Done</span>
<span class="pf-badge pf-badge--warning">{ic("alert")}Unsaved</span>
<span class="pf-badge pf-badge--danger">{ic("x")}Failed</span>
<span class="pf-badge pf-badge--outline">128 BPM</span></div>
<div class="pf-row"><span class="pf-badge pf-badge--lg"><span class="pf-badge__dot" style="color:var(--accent)"></span>No install. Free to try.</span></div>''',
    """A short status word on a pill.

- Neutral for facts (plan, BPM, format). `accent` for something running. `premium` only for the paid plan.
- Status badges (`success`, `warning`, `danger`) always carry an icon or a word that says the state; colour is never the only cue.
- `solid` sits on a picture (format on a thumbnail). `lg` is the eyebrow pill above the landing headline; use it once per page.
- One or two words. No sentences.""")

add("Banner", "Status", 232, "pf-demo--col", f'''<div class="pf-banner">{ic("user")}<span><b>Log in to keep this project.</b> Without an account it is deleted after three days.</span><button class="pf-btn pf-btn--secondary pf-btn--sm pf-banner__action">Log in</button></div>
<div class="pf-banner pf-banner--premium">{ic("crown")}<span><b>4K and 60 fps are Premium.</b> This export will be 720p at 30 fps with a small watermark.</span><button class="pf-btn pf-btn--premium pf-btn--sm pf-banner__action">Upgrade</button></div>
<div class="pf-banner pf-banner--warning">{ic("alert")}<span><b>Confirm your email address.</b> We sent a link to the address you signed up with.</span><button class="pf-btn pf-btn--ghost pf-btn--sm pf-banner__action">Send again</button></div>
<div class="pf-banner pf-banner--danger">{ic("alert")}<span><b>The render stopped.</b> The server ran out of memory at 1440p. Try 1080p, or a shorter section.</span><button class="pf-btn pf-btn--secondary pf-btn--sm pf-banner__action">Try again</button></div>''',
    """A message that stays in the layout until its reason is gone.

- Bold first sentence says what is true; the second says what to do. One action at most, on the right.
- `premium` explains a gated option where the user meets it. `warning` for something the user should act on. `danger` for a failure, with the reason and the next step.
- Never stack more than one banner in a panel. Things that just happened are a Toast.""")

add("Toast", "Status", 88, "", f'''<div class="pf-toast pf-toast--success">{ic("check")}Project saved</div>
<div class="pf-toast pf-toast--info">{ic("film")}Render queued, 2nd in line<button class="pf-btn pf-btn--ghost pf-btn--sm">View</button></div>
<div class="pf-toast pf-toast--danger">{ic("alert")}This file is larger than 50 MB<button class="pf-btn pf-btn--ghost pf-btn--sm">Choose another</button></div>''',
    """Says what just happened, bottom centre of the editor, for four seconds.

- Past tense matching the button that caused it: "Save project" gives "Project saved".
- One optional action (View, Undo, Try again). Errors stay until dismissed.
- At most three stacked; the newest at the bottom.""")

add("RenderJob", "Status", 232, "pf-demo--col", f'''<div class="pf-job"><span class="pf-job__thumb" style="{img("galaxy")}"></span>
<div class="pf-stack" style="gap:6px"><span class="pf-job__title">Night drive visual</span><div class="pf-progress" style="--p:.42"><span></span></div>
<span class="pf-job__meta"><span>1080 x 1920</span><span>60 fps</span><span>42%</span><span>about 2 min left</span></span></div>
<button class="pf-btn pf-btn--ghost pf-btn--sm">Cancel</button></div>
<div class="pf-job"><span class="pf-job__thumb" style="{img("helix")}"></span>
<div class="pf-stack" style="gap:6px"><span class="pf-job__title">Helix teaser</span>
<span class="pf-job__meta"><span>720 x 720</span><span>30 fps</span><span>0:15</span></span></div>
<span class="pf-badge pf-badge--outline">Queued · 2nd</span></div>
<div class="pf-job"><span class="pf-job__thumb" style="{img("nova")}"></span>
<div class="pf-stack" style="gap:6px"><span class="pf-job__title">Nova, full track</span>
<span class="pf-job__meta"><span>1920 x 1080</span><span>60 fps</span><span>3:12</span><span>148 MB</span></span></div>
<button class="pf-btn pf-btn--secondary pf-btn--sm">{ic("download","pf-i--sm")}Download</button></div>''',
    """One render in the queue: picture, title, size, progress, and the one thing you can do with it.

- Three states: rendering (progress bar, percentage, time left, Cancel), queued (position badge), done (Download). A failed job shows a `danger` Banner in place of the meta line.
- Numbers are in the mono face with tabular figures so they do not jump while counting.
- Used in the export popover's queue and on the dashboard.""")

add("EmptyState", "Status", 232, "", f'''<div class="pf-empty pf-grow"><span class="pf-empty__icon">{ic("folder","pf-i--lg")}</span>
<span class="pf-empty__title">No projects yet</span><span>Save a scene in the editor and it shows up here.</span>
<button class="pf-btn pf-btn--cta" style="margin-top:8px">Open the editor</button></div>
<div class="pf-empty pf-grow"><span class="pf-empty__icon">{ic("layers","pf-i--lg")}</span>
<span class="pf-empty__title">An empty stage</span><span>Add an element from the library, or start from a template.</span>
<button class="pf-btn pf-btn--secondary" style="margin-top:8px">{ic("plus")}Add element</button></div>''',
    """What a list shows before it has anything in it.

- Icon tile, a title that names the state, one sentence that says how to fill it, one button that does so.
- Never an illustration, never an apology.""")

add("TextField", "Inputs", 216, "", f'''<label class="pf-field" style="width:220px"><span class="pf-label">Email</span><input class="pf-input pf-input--lg" placeholder="you@example.com"></label>
<label class="pf-field" style="width:220px"><span class="pf-label">Password</span><input class="pf-input pf-input--lg" type="password" value="12345" aria-invalid="true"><span class="pf-hint pf-hint--error">Use at least 8 characters.</span></label>
<label class="pf-field" style="width:220px"><span class="pf-label">Search elements</span><span class="pf-inputwrap">{ic("search")}<input class="pf-input" placeholder="Ring, tunnel, text"></span></label>
<label class="pf-field" style="width:220px"><span class="pf-label">Project title (bare, in the app bar)</span><input class="pf-input pf-input--bare" value="Night drive visual"></label>
<label class="pf-field" style="width:220px"><span class="pf-label">Lyrics</span><textarea class="pf-input" rows="3">0:12 First line
0:18 Second line</textarea><span class="pf-hint">One line per row. .lrc times work too.</span></label>
<label class="pf-field" style="width:220px"><span class="pf-label">Typeface</span><select class="pf-select"><option>Bebas Neue</option><option>Montserrat</option><option>Orbitron</option></select></label>''',
    """A labelled text input, select or text area.

- The label is always visible above the field; a placeholder is an example, never the label.
- 32px in the editor, `lg` (40px) on account pages. `bare` has no border until hovered: the project title in the app bar.
- An error sets `aria-invalid="true"` and puts one sentence under the field that says how to fix it.
- The consumer provides the label, the value and the validation message.""")

add("ParamRow", "Inputs", 264, "pf-demo--panel pf-demo--col", f'''<div class="pf-stack" style="width:296px;gap:6px">
{scrub("Radius", "2.40", "m", 0.48)}
{scrub("Bar height", "1.25", "x", 0.42, sig="bass", m=0.3)}
{scrub("Glow", "68", "%", 0.68, sig="beat", m=0.22, key="on")}
{scrub("Arm twist", "214", "°", 0.59, key="at", active=True)}
{scrub("Hue shift", "32", "°", 0.09, sig="high", m=0.4, key="on")}
{scrub("Bars", "96", "", 0.38, lock=True)}
</div><span class="pf-note" style="max-width:296px">Drag sideways to change. Double-click to type. Shift is 10x, Alt is 0.1x. The coloured bar under the fill is how far the audio pushes the value.</span>''',
    """One number in the inspector: a scrub field, its audio jack and its keyframe diamond.

- The field is the slider. The fill shows the value inside its range; drag sideways to change it, double-click or press Enter to type, arrow keys step, Shift is ten steps, Alt a tenth.
- **Jack** (round): unlit means no audio. Click to open SignalPatch. Lit, it takes the colour of its signal, and a bar under the fill shows the range the audio adds on top.
- **Diamond**: outline grey is off, outline accent means the value is animated, filled accent means a keyframe sits exactly at the playhead.
- A value that cannot react or animate (counts, speeds) shows a small lock in place of both, with a tooltip that says why.
- Label left, value right in the mono face with its unit. Labels are sentence case, never caps.
- The consumer provides label, value, min, max, step, unit, and optionally the signal, its amount and the keyframe state.""")

add("SignalChip", "Audio", 136, "pf-demo--col", f'''<div class="pf-row">{chips("bass")}</div>
<div class="pf-row" style="gap:16px"><span class="pf-row"><button class="pf-jack"></button><span class="pf-note">Unlit jack</span></span>
<span class="pf-row"><button class="pf-jack" data-sig="bass"></button><button class="pf-jack" data-sig="mid"></button><button class="pf-jack" data-sig="high"></button><button class="pf-jack" data-sig="level"></button><button class="pf-jack" data-sig="beat"></button><span class="pf-note">Lit jacks</span></span>
<span class="pf-row"><span class="pf-meter"><span data-sig="bass" style="--l:.9"></span><span data-sig="mid" style="--l:.55"></span><span data-sig="high" style="--l:.35"></span><span data-sig="level" style="--l:.7"></span><span data-sig="beat" style="--l:1"></span></span><span class="pf-note">Live meter</span></span></div>''',
    """The five audio signals, each with one fixed colour: bass, mids, highs, level, beat.

- A signal keeps its colour everywhere it appears: chip, jack, the bar under a scrub field, the dots on a layer row, the beat ticks on the timeline, the live meter in the transport.
- Signal colours are never used for anything else, and never as decoration on marketing pages except in a picture of the editor.
- Chips pick a signal in SignalPatch. Exactly one can be pressed.
- The colours differ in lightness as well as hue, and every chip carries its name, so the set does not rely on colour vision.""")

add("SignalPatch", "Audio", 216, "pf-demo--stage", f'''<div class="pf-popover pf-stack" style="gap:12px;width:300px">
<div class="pf-row" style="justify-content:space-between"><span class="ui-strong">Bar height reacts to</span><button class="pf-btn pf-btn--ghost pf-btn--sm">Unplug</button></div>
<div class="pf-row" style="gap:6px">{chips("bass")}</div>
{scrub("Amount", "30", "%", 0.3, bare=True)}
<div class="pf-togglerow"><span>Invert (the value drops on the signal)</span><button class="pf-switch" role="switch" aria-checked="false"></button></div>
</div>''',
    """The popover that opens from a jack: choose the signal and how far it pushes the value.

- Title names the parameter: "Bar height reacts to". Five SignalChips, one Amount scrub field, an Invert switch, and Unplug.
- Choosing a signal applies it at once; there is no Apply button. Escape or a click outside closes it.
- While it is open and the track plays, the parameter's scrub field moves live so the effect is visible before closing.""")

add("SegmentedControl", "Inputs", 168, "pf-demo--col", f'''<div class="pf-row" style="gap:16px">
<div class="pf-seg"><button class="pf-seg__item" aria-pressed="true">{ic("cursor")}Select</button><button class="pf-seg__item">{ic("move")}Move</button><button class="pf-seg__item">{ic("rotate")}Rotate</button><button class="pf-seg__item">{ic("scale")}Scale</button></div>
{seg(["16:9", "9:16", "1:1"], "9:16")}
{seg(["Linear", "Smooth", "Hold"], "Smooth")}</div>
<div style="width:296px">{seg(["720p", "1080p", "1440p", "4K"], "720p", block=True, locked=("1080p", "1440p", "4K"))}</div>
<span class="pf-note">A locked segment keeps its label readable and shows a gold lock. Clicking it opens the upgrade popover; it never just does nothing.</span>''',
    """Two to five exclusive choices, all visible.

- Use when every option fits in a word: tool, format, resolution, frame rate, easing. More than five, or long labels, is a Select.
- `block` fills the width of the inspector with equal segments.
- A Premium-only option stays readable and carries a `premium` lock; clicking it opens the upgrade popover with that option named.
- The consumer provides the options, the current value, and which are locked.""")

add("Switch", "Inputs", 120, "pf-demo--panel", '''<div class="pf-stack" style="width:296px;gap:2px">
<div class="pf-togglerow"><span>Follow the beat</span><button class="pf-switch" role="switch" aria-checked="true"></button></div>
<div class="pf-togglerow"><span>Show safe area</span><button class="pf-switch" role="switch" aria-checked="false"></button></div>
<div class="pf-togglerow"><span>Snap keyframes to beats</span><button class="pf-switch" role="switch" aria-checked="true"></button></div></div>''',
    """On or off, applied at once.

- The label says what is true when it is on ("Follow the beat"), never "Enable ...".
- Label left, switch right, the whole row is the hit area.
- For a choice between two named things (Wave / On the beat) use a SegmentedControl.""")

add("ColorField", "Inputs", 208, "pf-demo--panel", '''<div class="pf-stack" style="width:296px;gap:6px">
<button class="pf-color" style="--c:#ff4fa3"><span class="pf-color__chip"></span><span class="pf-color__label">Colour</span><span class="pf-color__hex">#FF4FA3</span></button>
<button class="pf-color" style="--c:#ffb23e"><span class="pf-color__chip"></span><span class="pf-color__label">Second colour</span><span class="pf-color__hex">#FFB23E</span></button>
<span class="pf-label" style="margin-top:8px">Palette</span>
<div class="pf-palettes">
<button class="pf-palette" aria-pressed="false" style="--g:linear-gradient(90deg,#f59e0b,#fde047)"><span class="pf-palette__bar"></span>Gold</button>
<button class="pf-palette" aria-pressed="false" style="--g:linear-gradient(90deg,#fb4d6d,#fb7185)"><span class="pf-palette__bar"></span>Rose</button>
<button class="pf-palette" aria-pressed="true" style="--g:linear-gradient(90deg,#f97316,#d946ef)"><span class="pf-palette__bar"></span>Dusk</button>
<button class="pf-palette" aria-pressed="false" style="--g:linear-gradient(90deg,#d946ef,#22d3ee)"><span class="pf-palette__bar"></span>Neon</button>
<button class="pf-palette" aria-pressed="false" style="--g:linear-gradient(90deg,#22d3ee,#3b82f6)"><span class="pf-palette__bar"></span>Ice</button>
<button class="pf-palette" aria-pressed="false" style="--g:linear-gradient(90deg,#14b8a6,#6366f1)"><span class="pf-palette__bar"></span>Ocean</button>
<button class="pf-palette" aria-pressed="false" style="--g:linear-gradient(90deg,#84cc16,#8b5cf6)"><span class="pf-palette__bar"></span>Acid</button>
<button class="pf-palette" aria-pressed="false" style="--g:linear-gradient(90deg,#3b82f6,#22c55e,#eab308,#ef4444,#a855f7)"><span class="pf-palette__bar"></span>Spectrum</button>
</div></div>''',
    """A colour of an element, and the palettes that recolour the whole scene.

- The row shows the colour as a chip, the parameter name, and the hex value in the mono face. Clicking opens the colour picker.
- Palettes are a grid of gradient bars with their names. The one in use has an `accent` ring.
- The gradients here are the user's content colours (from `remotion/scene/palettes.ts`), the only place gradients appear in the interface.""")

add("DropZone", "Inputs", 344, "pf-demo--col", f'''<div class="pf-row" style="align-items:stretch">
<div class="pf-drop pf-grow"><span class="pf-drop__icon">{ic("music","pf-i--lg")}</span><span class="pf-drop__title">Drop a track here</span><span class="pf-drop__hint">MP3, WAV, M4A, AAC, OGG or FLAC</span>
<span class="pf-row" style="justify-content:center"><button class="pf-btn pf-btn--cta">Choose a file</button><button class="pf-btn pf-btn--secondary">Use the demo track</button></span></div>
<div class="pf-drop pf-grow" data-over><span class="pf-drop__icon">{ic("download","pf-i--lg")}</span><span class="pf-drop__title">Let go to load it</span><span class="pf-drop__hint">night-drive-master.wav</span></div></div>
<div class="pf-drop pf-drop--inline"><span class="pf-drop__icon">{ic("image")}</span><span class="pf-stack" style="gap:2px"><span class="ui-strong">Add your logo or cover art</span><span class="pf-drop__hint">PNG, JPG or WebP, up to 10 MB</span></span></div>''',
    """Where a file enters: the track, a picture, a 3D model.

- States: rest (dashed), hover, file dragged over (solid `accent` outline, `accent-soft` ground, title changes to "Let go to load it"), uploading (a Progress bar replaces the hint), error (a `danger` Banner under it).
- The large form fills the stage before a track is loaded, with the cta "Choose a file" and "Use the demo track" beside it. The inline form sits in the library and the inspector.
- Always list the accepted formats and the size limit. The whole zone is clickable and reachable by keyboard.""")

add("AppBar", "Editor", 72, "pf-demo--col", APPBAR,
    """The editor's top bar. It replaces the marketing nav inside the editor.

- Left: the mark (links to the dashboard, asks before leaving unsaved work), the project title as a bare field, the saved state as a Badge.
- Centre: undo, redo and the format switch (16:9, 9:16, 1:1), because format changes the stage.
- Right: plan badge, Share, the avatar menu, and Export as the view's one cta.
- 48px tall, `bg-2`, a `line-1` hairline below. Nothing else goes here.
- Signed out, the avatar is a "Log in" ghost button and the saved badge reads "Not saved".""")

add("Rail", "Editor", 360, "", f'''<div style="display:flex;height:312px;border:1px solid var(--line-1);border-radius:var(--radius-lg);overflow:hidden">
<nav class="pf-rail" aria-label="Library">
<button class="pf-rail__item" aria-selected="true">{ic("grid")}Templates</button>
<button class="pf-rail__item">{ic("box")}Elements</button>
<button class="pf-rail__item">{ic("image")}Media</button>
<button class="pf-rail__item">{ic("type")}Text</button>
<button class="pf-rail__item">{ic("droplet")}Palettes</button>
<span class="pf-rail__spacer"></span>
<button class="pf-rail__item">{ic("help")}Help</button></nav>
<div style="width:232px;background:var(--bg-2);padding:12px" class="pf-stack"><span class="ui-strong">Templates</span><span class="pf-note">The library panel for the selected rail item opens here. Clicking the selected item again closes the panel and gives the stage the room.</span></div></div>''',
    """The icon rail on the editor's left edge. It chooses what the library panel shows.

- Five places, top to bottom in the order people work: Templates, Elements, Media, Text, Palettes. Help sits at the bottom.
- Icon above a 9.5px label; labels are always shown. The selected item is `accent-soft` with `accent` icon and label.
- Clicking the selected item collapses the library panel. `1` to `5` switch items from the keyboard.""")

add("Tabs", "Editor", 72, "pf-demo--panel pf-demo--col", '''<div class="pf-tabs" role="tablist" style="width:320px">
<button class="pf-tab" role="tab" aria-selected="true">Element</button>
<button class="pf-tab" role="tab" aria-selected="false">Camera</button>
<button class="pf-tab" role="tab" aria-selected="false">Look</button>
<button class="pf-tab" role="tab" aria-selected="false">Scene<span class="pf-tab__count">6</span></button></div>''',
    """Switches what a panel shows. In the editor: the inspector's Element, Camera and Look.

- The selected tab is `ink-1` with a 2px `accent` underline. Two to four tabs; more is a Rail or a Select.
- Selecting an element in the stage or the layer list switches the inspector to Element. Camera and Look are never selected by accident.""")

add("Section", "Editor", 280, "pf-demo--stage", f'''<div class="pf-panel" style="width:320px">
<div class="pf-section"><button class="pf-section__head">{ic("chevron-down","pf-i--sm")}Shape<span class="pf-section__actions"><span class="pf-btn pf-btn--ghost pf-btn--icon pf-btn--sm" title="Reset section">{ic("rotate","pf-i--sm")}</span></span></button>
<div class="pf-section__body">{scrub("Radius", "2.40", "m", 0.48)}{scrub("Bar height", "1.25", "x", 0.42, sig="bass", m=0.3)}{scrub("Bars", "96", "", 0.38, lock=True)}</div></div>
<div class="pf-section"><button class="pf-section__head">{ic("chevron-down","pf-i--sm")}Colour</button>
<div class="pf-section__body"><button class="pf-color" style="--c:#ff4fa3"><span class="pf-color__chip"></span><span class="pf-color__label">Colour</span><span class="pf-color__hex">#FF4FA3</span></button></div></div>
<div class="pf-section" data-collapsed><button class="pf-section__head">{ic("chevron-down","pf-i--sm")}Position, rotation, scale</button><div class="pf-section__body"></div></div>
<div class="pf-section" data-collapsed><button class="pf-section__head">{ic("chevron-down","pf-i--sm")}Tempo</button><div class="pf-section__body"></div></div></div>''',
    """A collapsible group of controls in the inspector.

- The header is a 36px button: chevron, title in sentence case at 12px semibold, optional small actions on the right (reset, add).
- Body: controls stacked with a 6px gap and 12px side padding.
- Order inside an element: Shape, Colour, Position/rotation/scale, Tempo. The first two open, the rest remember their last state per element type.
- Section titles are plain words. No mono caps, no numbering.""")

add("LayerRow", "Editor", 232, "pf-demo--panel", f'''<div class="pf-layers" role="listbox" aria-label="Scene" style="width:288px">
{layer("Galaxy", "galaxy", ("bass", "beat"), selected=True)}
{layer("Track title", "trackTitle", ("level",))}
{layer("Bar ring", "barRing", ("bass", "mid", "high"))}
{layer("Glowing core", "core", ("beat",), hidden=True)}
{layer("Stars", "stars")}</div>''',
    """One element of the scene in the layer list.

- Left to right: drag grip (on hover), a picture of the element, its name, a dot for each signal that drives it, show/hide, and a menu (duplicate, rename, delete).
- Selected: `accent-soft` ground, `accent-line` border. Hidden: picture and name at 45%, the eye is crossed.
- The list order is the draw order, top is in front. Drag to reorder; a 2px `accent` line shows where it lands.
- Double-click the name to rename. Delete or Backspace removes the selected element and a Toast offers Undo.""")

add("TemplateCard", "Editor", 296, "pf-demo--col", f'''<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px">
{tcard("galaxy", "Galaxy", "2 elements", current=True)}
{tcard("nightCity", "Night City", "5 elements", badge='<span class="pf-badge pf-badge--solid">New</span>')}
{tcard("liquidGold", "Liquid Gold", "2 elements")}</div>
<div style="display:grid;grid-template-columns:repeat(4,132px);gap:8px">
{tcard("helix", "Helix", "", compact=True)}{tcard("nova", "Nova", "", compact=True)}{tcard("hyperdrive", "Hyperdrive", "", compact=True, current=True)}{tcard("aurora", "Aurora", "", compact=True)}</div>''',
    """A template: a picture that plays on hover, its name, how many elements it is made of.

- The picture is the rendered thumbnail from `public/thumbnails/templates`; on hover the silent loop from `public/previews` plays and a play mark fades in.
- Large on the landing page and the dashboard's "Start from" row; `compact` in the editor's library, two per row.
- The template the scene was started from has an `accent` border and the one glow in the panel.
- In the editor, choosing a template over an edited scene asks first: "Replace your scene with Galaxy?".""")

add("ElementTile", "Editor", 152, "pf-demo--panel", f'''<div style="display:grid;grid-template-columns:repeat(4,88px);gap:8px">
<button class="pf-ecard"><span class="pf-ecard__media" style="{img("barRing")}"></span><span class="pf-ecard__name">Bar ring</span><span class="pf-ecard__add">{ic("plus","pf-i--sm")}</span></button>
<button class="pf-ecard"><span class="pf-ecard__media" style="{img("tunnel")}"></span><span class="pf-ecard__name">Tunnel</span><span class="pf-ecard__add">{ic("plus","pf-i--sm")}</span></button>
<button class="pf-ecard"><span class="pf-ecard__media" style="{img("spectrumRing")}"></span><span class="pf-ecard__name">Spectrum ring</span><span class="pf-ecard__add">{ic("plus","pf-i--sm")}</span></button>
<button class="pf-ecard"><span class="pf-ecard__media" style="{img("gridFloor")}"></span><span class="pf-ecard__name">Grid floor</span><span class="pf-ecard__add">{ic("plus","pf-i--sm")}</span></button></div>''',
    """An element in the library's catalogue. Click to add it to the scene.

- Picture from `public/thumbnails/elements`, name underneath, a plus mark on hover.
- Three per row in the library panel, grouped under plain headings: Shapes, Particles, Backdrops, Text, Your files.
- Adding selects the new element, opens the inspector on it, and shows the Toast "Bar ring added" with Undo.""")

add("Stage", "Editor", 420, "pf-demo--col", f'''<div class="pf-stage" style="height:372px;padding:56px 32px 24px">
<div class="pf-toolbar" style="position:absolute;top:12px;left:50%;transform:translateX(-50%)">
<button class="pf-btn pf-btn--ghost pf-btn--icon" aria-pressed="true" aria-label="Select">{ic("cursor")}</button>
<button class="pf-btn pf-btn--ghost pf-btn--icon" aria-label="Move">{ic("move")}</button>
<button class="pf-btn pf-btn--ghost pf-btn--icon" aria-label="Rotate">{ic("rotate")}</button>
<button class="pf-btn pf-btn--ghost pf-btn--icon" aria-label="Scale">{ic("scale")}</button>
<span class="pf-sep"></span>
<button class="pf-btn pf-btn--ghost pf-btn--sm">Fit{ic("chevron-down","pf-i--sm")}</button></div>
<span class="pf-timecode" style="position:absolute;top:20px;right:16px;font-size:11px;color:var(--ink-3)">60 fps</span>
<div class="pf-frame" style="width:auto;height:100%;{img("galaxy")}"><span class="pf-frame__tl"><span class="pf-badge pf-badge--solid">16:9</span><span class="pf-badge pf-badge--solid">720p</span></span><span class="pf-frame__br">Beatframe</span></div></div>''',
    """The middle of the editor: the video frame on a dotted well, and the floating toolbar.

- The frame shows exactly what will be exported, including the watermark on the free plan. It is always the brightest thing on screen; nothing translucent or blurred is ever laid over it.
- The frame takes the export format's shape (16:9, 9:16, 1:1) and is fitted into the stage with at least 24px around it.
- Toolbar, top centre: Select (V), Move (G), Rotate (R), Scale (S), then the zoom menu. Top right: the frames actually drawn per second, in `ink-3`.
- Format and resolution sit as `solid` badges inside the frame's top-left corner.
- Before a track is loaded the stage holds the large DropZone instead of the frame.""")

add("Transport", "Editor", 72, "pf-demo--col", TRANSPORT,
    """Playback controls at the top of the timeline.

- Left: play/pause (the white round button, Space), the time as `timecode` with the total in `ink-3`, the track chip (click to replace the track), detected BPM.
- Right: loop the export section, mute, timeline zoom.
- 44px tall. It never grows a second row: anything else belongs in the inspector or the export popover.""")

add("Timeline", "Editor", 216, "pf-demo--col", TIMELINE,
    """Time, left to right: ruler, the track's waveform, one lane per animated setting.

- **Waveform**: unplayed bars `ink-4`, played bars `accent`. Beats are `sig-beat` ticks along its bottom edge.
- **Lanes**: one per animated setting, labelled "Element, setting". Keyframes are diamonds (`ink-1`; the selected one `accent` with the glow); a hold keyframe is a square. A hairline joins the first and last keyframe of a lane.
- **Playhead**: a 1px `accent` line with a flag on the ruler, across every lane.
- **Export section**: an `accent` wash with two draggable edges and a label; outside it the waveform is unchanged.
- Click the ruler to jump, drag a keyframe to move it, Alt-drag to copy, Delete removes it. With "Snap keyframes to beats" on, dragging snaps to the nearest beat tick.
- Lane headers are 168px wide and carry the setting's diamond, so a keyframe can be added at the playhead from here.""")

add("ExportPopover", "Editor", 440, "pf-demo--stage", EXPORT,
    """Opens from Export in the app bar: format, resolution, frame rate, length, then the one button.

- Every option is a SegmentedControl, so all choices and what is locked are visible at once.
- The summary line states the result before the click: pixel size, length, a time estimate.
- On the free plan a `premium` Banner says in one sentence what Premium adds. A locked segment opens the same message with Upgrade.
- After Export the popover turns into the queue: RenderJob rows, newest first.""")

add("Menu", "Overlays", 280, "pf-demo--stage", f'''<div class="pf-menu">
<button class="pf-menu__item">{ic("copy")}Duplicate<span class="pf-kbd">⌘D</span></button>
<button class="pf-menu__item">{ic("type")}Rename</button>
<button class="pf-menu__item">{ic("eye-off")}Hide<span class="pf-kbd">H</span></button>
<div class="pf-menu__sep"></div>
<button class="pf-menu__item pf-menu__item--danger">{ic("trash")}Delete<span class="pf-kbd">⌫</span></button></div>
<div class="pf-menu">
<div class="pf-menu__label pf-overline">nz@example.com</div>
<a class="pf-menu__item" href="#">{ic("folder")}Dashboard</a>
<a class="pf-menu__item" href="#">{ic("user")}Account</a>
<a class="pf-menu__item" href="#">{ic("crown")}Plan<span class="pf-badge">Free</span></a>
<div class="pf-menu__sep"></div>
<button class="pf-menu__item">Log out</button></div>''',
    """A list of actions that opens from a button or a right-click.

- Items are 30px: icon, label, shortcut on the right. Destructive items are last, after a separator, in `danger`.
- Opens under its trigger, aligned to its left edge; flips up near the bottom. Arrow keys move, Enter chooses, Escape closes and returns focus.
- Never nest more than one level.""")

add("Tooltip", "Overlays", 72, "pf-demo--stage", '''<span class="pf-tooltip">Move<span class="pf-kbd">G</span></span>
<span class="pf-tooltip">Play or pause<span class="pf-kbd">Space</span></span>
<span class="pf-tooltip">React to audio</span>
<span class="pf-tooltip">Counts cannot react or animate</span>''',
    """Names a control on hover or focus, with its shortcut.

- Light on dark so it reads over the stage. Appears after 400ms, at once when moving between neighbours.
- Every icon-only button has one. Two to four words, sentence case, no full stop.
- Never holds information the user needs to complete a task.""")

add("Dialog", "Overlays", 280, "pf-demo--stage", f'''<div class="pf-dialog"><div class="pf-dialog__head"><h2 class="pf-dialog__title">Delete "Night drive visual"?</h2></div>
<div class="pf-dialog__body">The project and its two rendered videos are removed for good. The track you uploaded is deleted too.</div>
<div class="pf-dialog__foot"><button class="pf-btn pf-btn--secondary">Keep project</button><button class="pf-btn pf-btn--danger">Delete project</button></div></div>
<div class="pf-dialog"><div class="pf-dialog__head"><h2 class="pf-dialog__title">Leave without saving?</h2></div>
<div class="pf-dialog__body">Your changes to this scene since the last save will be lost.</div>
<div class="pf-dialog__foot"><button class="pf-btn pf-btn--ghost">Leave</button><button class="pf-btn pf-btn--cta">Save and leave</button></div></div>''',
    """Stops the user for a decision that cannot be undone, over a `scrim`.

- Title is the question, naming the thing: "Delete "Night drive visual"?". Body says exactly what is lost.
- Buttons name the outcomes ("Keep project", "Delete project"), never OK / Cancel. The safe choice is on the left and has focus.
- Use only for deleting and for leaving unsaved work. Everything else is undoable and gets a Toast with Undo instead.""")

add("NavBar", "Marketing", 96, "pf-demo--col", f'''<nav class="pf-nav">{LOGO}
<span class="pf-nav__links" style="margin-left:16px"><a class="pf-nav__link" href="#">Templates</a><a class="pf-nav__link" href="#">Features</a><a class="pf-nav__link" href="#" aria-current="page">Pricing</a></span>
<span class="pf-spacer"></span><a class="pf-nav__link" href="#">Log in</a><a class="pf-btn pf-btn--cta pf-btn--lg" href="#">Open the editor</a></nav>''',
    """The marketing pages' top bar: logo, three links, Log in, and the cta.

- Sticky, 64px, translucent `bg-1` with a blur, `line-1` hairline below. This is the only blurred surface in the product.
- Links: Templates, Features, Pricing. Signed in, "Log in" becomes "Dashboard".
- The cta is always "Open the editor". It is the page's one white button until the closing section.
- Under 720px the links collapse into a menu button; the cta stays visible.
- The editor does not use this bar; it has the AppBar.""")

add("FilterChips", "Marketing", 72, "", '''<button class="pf-chip" aria-pressed="true">All<span class="pf-chip__count">33</span></button>
<button class="pf-chip" aria-pressed="false">Particles<span class="pf-chip__count">12</span></button>
<button class="pf-chip" aria-pressed="false">Bars and rings<span class="pf-chip__count">7</span></button>
<button class="pf-chip" aria-pressed="false">Space<span class="pf-chip__count">6</span></button>
<button class="pf-chip" aria-pressed="false">Retro<span class="pf-chip__count">4</span></button>
<button class="pf-chip" aria-pressed="false">With text<span class="pf-chip__count">4</span></button>''',
    """Filters the template gallery by kind.

- One chip is always pressed; "All" first. Each shows how many templates it holds.
- The pressed chip is the white fill. Chips scroll sideways on phones instead of wrapping.
- The categories and counts above are examples; templates need a `category` field before this ships.""")

add("AppWindow", "Marketing", 400, "", f'''<div class="pf-window" style="width:560px"><div class="pf-window__bar"><i></i><i></i><i></i><span class="pf-window__url">beatframe.app/editor</span></div>
<div style="aspect-ratio:16/9;{img("galaxy")};background-size:cover"></div></div>
<div class="pf-phone" style="width:150px"><div class="pf-phone__screen" style="{img("jellyfish")}"></div></div>''',
    """Frames for showing the product on marketing pages: a browser window and a phone.

- The window holds a real screenshot or a live, simplified editor. The phone holds a 9:16 loop from `public/previews/portrait`.
- Only show what the product really renders. No mock-up scenes, no stock footage.
- One window per section at most. The hero's window is the largest thing on the page.""")

add("FeatureCard", "Marketing", 392, "", f'''<div class="pf-card" style="width:360px"><div class="pf-card__demo">
{scrub("Bar height", "1.25", "x", 0.42, sig="bass", m=0.3)}{scrub("Glow", "68", "%", 0.68, sig="beat", m=0.22)}{scrub("Camera shake", "12", "%", 0.12, sig="level", m=0.3)}</div>
<h3 class="pf-card__title">Anything can react</h3><p class="pf-card__text">Plug a setting into bass, mids, highs, loudness or the beat with one click.</p></div>
<div class="pf-card" style="width:360px"><div class="pf-card__demo" style="padding:0;overflow:hidden">{TIMELINE.replace('--head:168px','').replace('style="--t:.34;width:100%"','style="--t:.34;--head:0px;width:100%"').replace('class="pf-tl-head"','class="pf-tl-head" hidden')}</div>
<h3 class="pf-card__title">Animate over time</h3><p class="pf-card__text">Set a value now and another later. It travels between them, right above the waveform.</p></div>''',
    """A feature on the landing page: a small working piece of the editor, a title, one or two sentences.

- The demo on top is made of real components (ParamRow, Timeline, SegmentedControl), not an illustration or an icon.
- Title in `display-sm`, text in `ink-2`, 44 characters wide at most.
- Cards sit in a bento grid: two wide cards and one tall one per row of three columns. They do not all have the same size.
- No icons in circles, no numbered features, no coloured side borders.""")

add("StepCard", "Marketing", 216, "", f'''<div class="pf-card pf-grow"><span class="pf-step__num">Step 1</span><h3 class="pf-card__title">Load a track</h3><p class="pf-card__text">Drop in any song. It is analysed once, right in your browser.</p></div>
<div class="pf-card pf-grow"><span class="pf-step__num">Step 2</span><h3 class="pf-card__title">Build the scene</h3><p class="pf-card__text">Start from a template. Add elements and wire any setting to the music.</p></div>
<div class="pf-card pf-grow"><span class="pf-step__num">Step 3</span><h3 class="pf-card__title">Export the video</h3><p class="pf-card__text">Pick a format and press Export. It looks exactly like the preview.</p></div>''',
    """One step of "How it works". There are exactly three.

- "Step 1" in the mono face in `accent`, a three-word title, one or two sentences.
- The numbers are there because the order is real: track, scene, export.
- On the landing page each step also carries a small picture of that moment in the editor.""")

add("PricingCard", "Marketing", 480, "", f'''<div class="pf-price" style="width:320px"><span class="pf-price__name">Free</span>
<span class="pf-price__amount">€0</span>
<ul class="pf-price__list"><li>{ic("check")}Export up to 720p at 30 fps</li><li>{ic("check")}All templates and elements</li><li>{ic("check")}Landscape, portrait and square</li><li>{ic("check")}Your own pictures and 3D models</li><li>{ic("check")}Small watermark in the corner</li></ul>
<a class="pf-btn pf-btn--secondary pf-btn--lg pf-btn--block" href="#">Open the editor</a></div>
<div class="pf-price pf-price--featured" style="width:320px"><span class="pf-price__name">Premium<span class="pf-badge pf-badge--premium">{ic("crown")}Best quality</span></span>
<span class="pf-price__amount">€—<small>per month</small></span>
<ul class="pf-price__list"><li>{ic("check")}Export up to 4K at 60 fps</li><li>{ic("check")}No watermark</li><li>{ic("check")}Everything in Free</li><li>{ic("check")}Cancel any time in two clicks</li></ul>
<a class="pf-btn pf-btn--cta pf-btn--lg pf-btn--block" href="#">Get Premium</a></div>''',
    """A plan: name, price, what it includes, one button.

- Two cards, Free left, Premium right. Premium is `featured`: an `accent-line` border and an `accent-soft` wash at the top.
- The price is the largest thing in the card (`display-md`), with "per month" beside it. The amount comes from Stripe; "€—" above is a placeholder until a price is set.
- List what the plan gives, most wanted first, five lines at most. Every line starts with a check in `accent`.
- Premium's button is the page's cta. Until Stripe keys are set it is disabled and reads "Not on sale yet".
- Never invent a discount, a countdown or a "most popular" claim.""")

add("CompareTable", "Marketing", 360, "pf-demo--col", f'''<table class="pf-table"><thead><tr><th></th><th>Free</th><th>Premium</th></tr></thead><tbody>
<tr><th>Resolution</th><td>720p</td><td>720p, 1080p, 1440p, 4K</td></tr>
<tr><th>Frame rate</th><td>30 fps</td><td>30 or 60 fps</td></tr>
<tr><th>Watermark</th><td>Small, bottom right</td><td data-no>None</td></tr>
<tr><th>Templates and elements</th><td>{ic("check")}</td><td>{ic("check")}</td></tr>
<tr><th>Formats 16:9, 9:16, 1:1</th><td>{ic("check")}</td><td>{ic("check")}</td></tr>
<tr><th>Your own pictures and 3D models</th><td>{ic("check")}</td><td>{ic("check")}</td></tr>
<tr><th>Saved projects</th><td>{ic("check")}</td><td>{ic("check")}</td></tr></tbody></table>''',
    """Free against Premium, line by line, under the pricing cards.

- Rows are things people ask about, in their words. Values are the real limits from `src/lib/tiers.ts`.
- A check where both plans have it; the actual value where they differ. Never an X: write "None" or the smaller number.
- On phones the first column stays put and the plans scroll sideways inside the table's own container.""")

add("FAQ", "Marketing", 320, "pf-demo--col", f'''<div class="pf-faq" style="max-width:720px">
<details open><summary>What does the watermark look like?{ic("plus")}</summary><p>A small "Beatframe" in the bottom right corner. The editor's preview shows it exactly where the video will have it.</p></details>
<details><summary>Do I keep my projects on the free plan?{ic("plus")}</summary><p>Yes. Projects, your own templates and your videos stay in your account on both plans.</p></details>
<details><summary>How is the payment handled?{ic("plus")}</summary><p>By Stripe, on a page run by Stripe. Card details never reach this site.</p></details>
<details><summary>What happens when Premium ends?{ic("plus")}</summary><p>The account goes back to the free plan. Nothing is deleted.</p></details></div>''',
    """Questions people have before paying, answered in two sentences each.

- A real `details` element per question, so it works without script and with the keyboard. The plus turns into a cross when open.
- The question is the user's own sentence. The answer starts with the answer ("Yes.", "By Stripe.").
- Four to eight questions, the first one open.""")

add("Footer", "Marketing", 264, "pf-demo--col", f'''<footer class="pf-footer"><div class="pf-stack" style="gap:12px">{LOGO}<span style="max-width:30ch">Turn any song into an audio-reactive 3D video, right in your browser.</span></div>
<div><h4>Product</h4><a href="#">Editor</a><a href="#">Templates</a><a href="#">Pricing</a></div>
<div><h4>Account</h4><a href="#">Log in</a><a href="#">Create account</a><a href="#">Dashboard</a></div>
<div><h4>Legal</h4><a href="#">Imprint</a><a href="#">Privacy</a><a href="#">Terms</a></div></footer>''',
    """The end of every marketing page: logo and tagline, then three columns of links.

- Product, Account, Legal. Only pages that exist.
- Columns stack to two per row on phones, with the logo block first.""")

add("AuthCard", "Account", 440, "pf-demo--stage", f'''<form class="pf-auth"><h1 class="pf-auth__title">Log in</h1>
<label class="pf-field"><span class="pf-label">Email</span><input class="pf-input pf-input--lg" type="email" value="nz@example.com"></label>
<label class="pf-field"><span class="pf-row" style="justify-content:space-between"><span class="pf-label">Password</span><a class="pf-link pf-hint" href="#">Forgot it?</a></span><input class="pf-input pf-input--lg" type="password" value="password"></label>
<button class="pf-btn pf-btn--cta pf-btn--lg pf-btn--block" type="button">Log in</button>
<span class="pf-hint" style="text-align:center">New here? <a class="pf-link" href="#">Create an account</a></span></form>''',
    """The card for logging in, signing up and resetting a password.

- 400px wide, centred on `bg-1`, the logo above it. Title in `display-sm` names the task: "Log in", "Create your account", "Reset your password".
- `lg` fields and one full-width cta whose label repeats the title's verb.
- Errors appear under the field they belong to; a wrong login says "That email and password do not match." under the password.
- One line under the button links to the other form. Nothing else on the page.""")

add("ProjectCard", "Account", 264, "", f'''<div class="pf-tcard" style="width:260px"><span class="pf-tcard__media" style="{img("galaxy")}"><span class="pf-tcard__badges"><span class="pf-badge pf-badge--solid">9:16</span></span></span>
<span class="pf-tcard__body"><span class="pf-stack" style="gap:0"><span class="pf-tcard__name">Night drive visual</span><span class="pf-tcard__meta">Edited 2 hours ago · 2 videos</span></span><button class="pf-btn pf-btn--ghost pf-btn--icon pf-btn--sm" aria-label="More">{ic("more")}</button></span></div>
<div class="pf-tcard" style="width:260px"><span class="pf-tcard__media" style="{img("solar")}"><span class="pf-tcard__badges"><span class="pf-badge pf-badge--accent"><span class="pf-badge__dot pf-badge__dot--live"></span>Rendering 42%</span></span></span>
<span class="pf-tcard__body"><span class="pf-stack" style="gap:0"><span class="pf-tcard__name">Solar, album teaser</span><span class="pf-tcard__meta">Edited yesterday · 1 video</span></span><button class="pf-btn pf-btn--ghost pf-btn--icon pf-btn--sm" aria-label="More">{ic("more")}</button></span></div>
<a class="pf-drop" href="#" style="width:260px;align-self:stretch;text-decoration:none"><span class="pf-drop__icon">{ic("plus","pf-i--lg")}</span><span class="pf-drop__title">New project</span></a>''',
    """A saved project on the dashboard.

- The picture drawn after saving, the format as a `solid` badge, the title, when it was edited and how many videos it has, and a menu (Open, Duplicate, Rename, Delete).
- While one of its videos renders, the badge becomes the live "Rendering 42%".
- The whole card opens the project in the editor. The first tile of the grid is always "New project".""")


def write(path, text):
    full = os.path.join(OUT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as f:
        f.write(text)


for name, group, height, cls, body, readme in C:
    html = (f'<!-- @dsCard group="{group}" height={height} -->\n<!doctype html>\n<html lang="en">\n<head><meta charset="utf-8">'
            f'<title>{name}</title>{FONTS}</head>\n<body class="pf-demo {cls}">\n{body}\n'
            '<script>window.Pulsefield && window.Pulsefield.mount();</script>\n</body>\n</html>\n')
    write(f"components/{name}/preview.html", html)
    write(f"components/{name}/README.md", f"# {name}\n\n{readme}\n")

# Cover: the logo's nine dots as the palette, on the stage's dot grid.
dots = "".join(f'<circle class="dot" cx="{x}" cy="{y}" r="1.5"/>' for y in range(24, 288, 48) for x in range(500, 960, 48))
discs = [(576, 48, 24, "deep"), (720, 48, 40, "bass"), (864, 48, 24, "deep"), (576, 144, 40, "mid"), (720, 144, 64, "accent"),
         (864, 144, 40, "high"), (576, 240, 24, "deep"), (720, 240, 40, "beat"), (864, 240, 24, "deep")]
bar_html = "".join(f'<circle class="{c}" cx="{x}" cy="{y}" r="{r}"/>' for x, y, r, c in discs)
cover = f'''<!-- @dsCard height=288 -->
<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Beatframe</title>{FONTS}
<style>
  html, body {{ margin:0; height:100%; }}
  body {{ background:var(--bg-1); color:var(--ink-1); overflow:hidden; }}
  .cover {{ position:relative; width:960px; height:288px; overflow:hidden; }}
  .cover svg {{ position:absolute; inset:0; display:block; }}
  .dot {{ fill:var(--line-3); }}
  .bass {{ fill:var(--sig-bass); }} .mid {{ fill:var(--sig-mid); }} .accent {{ fill:var(--accent); }}
  .high {{ fill:var(--sig-high); }} .beat {{ fill:var(--sig-beat); }} .deep {{ fill:var(--bg-4); }}
  .words {{ position:absolute; left:var(--space-8); bottom:var(--space-8); max-width:440px; }}
  .name {{ margin:0; font:700 72px/.95 var(--font-display); letter-spacing:-.035em; color:var(--ink-1); }}
  .tag {{ margin:var(--space-3) 0 0 2px; font:400 14px/20px var(--font-sans); color:var(--ink-2); }}
</style></head>
<body>
<div class="cover">
<svg viewBox="0 0 960 288" width="960" height="288" aria-hidden="true">
<!--
  blocks      accent disc r 64 in the centre (the one accent) · sig-bass, sig-mid, sig-high, sig-beat discs r 40 on the edges · bg-4 discs r 24 at the corners
  arrangement the logo's nine dots at scale: a 3 by 3 grid, 144px between centres, right of x = 480
  pattern     a dot grid at a 48px pitch (space-12) in line-3: the editor's stage is a dotted well
  scales      radii 24, 40, 64 are space-6, space-10 and space-16; pitch space-12; discs only, as in the mark
-->
{dots}{bar_html}
</svg>
<div class="words"><h1 class="name">Beatframe</h1><p class="tag">Turn any song into an audio-reactive 3D video.</p></div>
</div>
</body>
</html>
'''
write("components/Cover/preview.html", cover)

write("assets/Templates/README.md", "Rendered thumbnails of templates, copied from `public/thumbnails/templates` (480 x 270 JPEG). Regenerate with `pnpm thumbnails`; never draw a template by hand.\n")
write("assets/Elements/README.md", "Rendered thumbnails of single elements, copied from `public/thumbnails/elements` (480 x 270 JPEG). Used in ElementTile and LayerRow.\n")


def group(name, items):
    files = {f"{k}.jpg": {"name": f"{k}.jpg", "blob": v[0], "size": v[1], "type": "image/jpeg"} for k, v in items.items()}
    return {"name": name, "tile": "m", "order": [f"{k}.jpg" for k in items], "files": files}


now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
index = {
    "v": 3, "layout": "files", "createdOnFiles": {"v": 1, "at": now},
    "title": "Beatframe", "namespace": "Pulsefield", "libraries": [],
    "sections": {}, "groups": ["Templates", "Elements"],
    "assetGroups": {"Templates": group("Templates", T), "Elements": group("Elements", E)},
    "blobs": {}, "docs": {"sections": []},
    "lastChange": {"by": "Claude", "at": now, "via": "Claude Code", "note": "First version: tokens, components, brand book."},
}
write("design-system.json", json.dumps(index, indent=1))
print(len(C), "components")
