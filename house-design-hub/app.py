"""AI Houses Design: Flask app (pages + JSON API)."""
import json
import os
import re
import smtplib
import threading
import time
from email.message import EmailMessage
from urllib.parse import urlencode
from markupsafe import Markup, escape
from flask import Flask, send_from_directory, abort, jsonify, redirect, render_template, request, Response, url_for

from core import ai, catalog, seo, topics
from core.i18n import LANGS, get_dict
from core.planner import STYLES, FACINGS

app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 60 * 60 * 24 * 30  # long browser cache for /static (faster pages)
EN = get_dict("en")["t"]


@app.url_defaults
def _static_version(endpoint, values):
    """Append ?v=<file mtime> to every /static URL so browsers never keep serving an old CSS/JS file after an update."""
    if endpoint == "static" and values.get("filename"):
        try:
            values["v"] = int(os.path.getmtime(os.path.join(app.static_folder, values["filename"])))
        except OSError:
            pass


def hero_photos():
    """Real photos for the home hero: put .webp/.jpg files in static/img/hero/ named like 1-foundation.webp, 2-framing.webp ...
    (sorted by name; the text after the number becomes the stage label). With 2+ photos the hero plays them as a cinematic sequence
    instead of the 3D model."""
    root = os.path.join(app.static_folder, "img", "hero")
    out = []
    try:
        names = sorted(f for f in os.listdir(root) if f.lower().endswith((".webp", ".jpg", ".jpeg", ".png")))
    except OSError:
        return out
    for f in names:
        label = re.sub(r"^\d+[-_ ]*", "", os.path.splitext(f)[0]).replace("-", " ").replace("_", " ").strip().title()
        out.append({"src": url_for("static", filename="img/hero/" + f), "label": label or "Home"})
    return out

# Shown on the legal pages. Set these env vars before going live.
SITE_NAME = os.getenv("SITE_NAME", "AI Houses Design")
CONTACT_EMAIL = os.getenv("CONTACT_EMAIL", "hello@aihousesdesign.com")  # create this mailbox / forwarder
LEGAL_UPDATED = "9 October 2026"


# ---------- real images: kept OUT of the UI code, looked up by ID --------------------------------------------------------
# Photos live in their own folders (or on a CDN / S3 / Cloudinary bucket) and are found by name only:
#   gallery/<style>.<ext>            hero collage + "Styles" showcase
#   designs/<id>.<ext>               one specific design card (baseline thumbnail, always a plain static image)
#   designs/<style>-<N>bhk.<ext>     every card of that style + bedroom count
# Set ASSET_BASE_URL=https://cdn.example.com/aihouses to serve them from a bucket instead of /static/img.
# For a bucket, list the files in static/img/manifest.json: {"gallery": {"modern": "modern.webp"}, "designs": {"15": "15.webp"}}
# Anything without an image keeps its drawn illustration, and changing CSS/templates never touches these files.
ASSET_BASE_URL = os.getenv("ASSET_BASE_URL", "").rstrip("/")
_IMG_EXT = (".webp", ".jpg", ".jpeg", ".png")
_img_cache = {"t": 0, "data": {"gallery": {}, "designs": {}}}


def img_manifest():
    """{'gallery': {key: filename}, 'designs': {key: filename}} (re-scanned at most once a minute)."""
    if time.time() - _img_cache["t"] > 60:
        root = os.path.join(app.static_folder, "img")
        data = {}
        for folder in ("gallery", "designs"):
            found = {}
            try:
                for f in sorted(os.listdir(os.path.join(root, folder))):
                    if f.lower().endswith(_IMG_EXT):
                        found[os.path.splitext(f)[0]] = f
            except OSError:
                pass
            data[folder] = found
        try:  # optional file for images hosted elsewhere
            import json
            with open(os.path.join(root, "manifest.json"), encoding="utf-8") as fh:
                extra = json.load(fh)
            for folder in ("gallery", "designs"):
                data[folder].update({str(k): v for k, v in (extra.get(folder) or {}).items()})
        except (OSError, ValueError):
            pass
        _img_cache.update(t=time.time(), data=data)
    return _img_cache["data"]


def asset_url(folder, filename):
    if ASSET_BASE_URL:
        return f"{ASSET_BASE_URL}/{folder}/{filename}"
    return url_for("static", filename=f"img/{folder}/{filename}")


def art_img(style, hero=False):
    """<img> for a style picture if gallery/<style>.<ext> exists, else empty (the page draws the SVG instead)."""
    fn = img_manifest()["gallery"].get(style)
    if not fn:
        return ""
    alt = f"{EN['style.' + style]} house design: front elevation and 3D exterior view"
    load = 'loading="eager" fetchpriority="high"' if hero else 'loading="lazy"'
    return Markup(f'<img src="{escape(asset_url("gallery", fn))}" alt="{escape(alt)}" width="400" height="300" {load} decoding="async">')


@app.context_processor
def inject():
    return dict(T=lambda k: EN.get(k, k), LANGS=LANGS, TOPICS=topics.TOPICS, STYLE_KEYS=list(STYLES),
                total=len(catalog.DESIGNS), style_en=lambda k: EN["style." + k],
                SITE_NAME=SITE_NAME, CONTACT_EMAIL=CONTACT_EMAIL, LEGAL_UPDATED=LEGAL_UPDATED,
                YEAR=time.localtime().tm_year, IMG=img_manifest(), ASSET_BASE=ASSET_BASE_URL, art_img=art_img,
                SITE_URL=seo.SITE_URL, canonical=seo.SITE_URL + request.path, site_ld=seo.site_ld(SITE_NAME),
                SEO_LINKS=[(v["nav"], v["path"]) for v in seo.ALL_PAGES.values() if v["kind"] == "landing"])


def _int(name, default=None, lo=None, hi=None):
    try:
        v = int(request.args.get(name, ""))
    except ValueError:
        return default
    if lo is not None:
        v = max(lo, v)
    if hi is not None:
        v = min(hi, v)
    return v


# ---------- pages ----------
@app.route("/")
def index():
    featured = [catalog.card(d) for d in catalog.DESIGNS[:8]]
    return render_template("index.html", featured=featured, stats=catalog.stats(), faqs=seo.HOME_FAQS, hero_photos=hero_photos(),
                           ld=[seo.faq_ld(seo.HOME_FAQS)], explore=[v for v in seo.ALL_PAGES.values()])


@app.route("/gallery")
def gallery():
    return render_template("gallery.html", ld=[seo.breadcrumb([("Home", "/"), ("Gallery", "/gallery")])])


@app.route("/design/<int:design_id>")
def design(design_id):
    d = catalog.BY_ID.get(design_id)
    if not d:
        abort(404)
    m = catalog.meta(d)
    topic_slug = {"village": "village-house-design", "assam": "assam-type-house-design", "duplex": "duplex-house-design",
                  "modern": "modern-house-design", "contemporary": "modern-house-design", "minimalist": "minimalist-house-design",
                  "passive": "passive-house-design", "compact": "small-house-design", "lowcost": "low-cost-village-house-design"}.get(m["style"])
    t = topics.BY_SLUG.get(topic_slug) if topic_slug else None
    crumbs = [("Home", "/"), ("Gallery", "/gallery")] + ([(t["title"], f"/topic/{t['slug']}")] if t else []) + [(m["name"], f"/design/{m['id']}")]
    return render_template("design.html", d=m, topic=t, ld=[seo.breadcrumb(crumbs)])


@app.route("/designer")
def designer():
    return render_template("designer.html", ld=[seo.breadcrumb([("Home", "/"), ("AI Designer", "/designer")]), seo.webapp_ld(SITE_NAME)])


@app.route("/topic/<slug>")
def topic(slug):
    t = topics.BY_SLUG.get(slug)
    if not t:
        abort(404)
    items = _topic_items(t)
    cards = [catalog.card(d) for d in items[:12]]
    crumbs = [("Home", "/"), ("Gallery", "/gallery"), (t["title"], f"/topic/{slug}")]
    return render_template("topic.html", t=t, count=len(items), cards=cards,
                           ld=[seo.breadcrumb(crumbs), seo.itemlist_ld(cards)])


def _topic_items(t):
    f = t["filt"]
    return catalog.search(predicate=topics.predicate(t), max_cost=f.get("max_cost"), max_area=f.get("max_area"))


# ---------- SEO landing pages and guides (one search intent per URL) ----------
def _landing_view(key):
    def view():
        p = seo.ALL_PAGES[key]
        cards, count, t = [], 0, None
        if p.get("topic"):
            t = topics.BY_SLUG[p["topic"]]
            items = _topic_items(t)
            count, cards = len(items), [catalog.card(d) for d in items[:8]]
        crumbs = [("Home", "/")] + ([("Guides", "/guides/")] if p["kind"] == "guide" else []) + [(p["nav"], p["path"])]
        ld = [seo.breadcrumb(crumbs)] + ([seo.faq_ld(p["faqs"])] if p.get("faqs") else []) + \
             ([seo.article_ld(p, SITE_NAME)] if p["kind"] == "guide" else [])
        related = [(seo.ALL_PAGES[r]["nav"], seo.ALL_PAGES[r]["path"]) for r in p["related"]]
        return render_template("landing.html", p=p, cards=cards, count=count, topic=t, crumbs=crumbs, ld=ld, related=related,
                               designer_url=url_for("designer") + "?" + urlencode(p["cta"]))
    return view


for _key, _p in seo.ALL_PAGES.items():
    app.add_url_rule(_p["path"], endpoint="seo_" + re.sub(r"\W", "_", _key), view_func=_landing_view(_key))


@app.route("/guides/")
def guides():
    items = [v for v in seo.ALL_PAGES.values() if v["kind"] == "guide"]
    return render_template("guides.html", items=items,
                           ld=[seo.breadcrumb([("Home", "/"), ("Guides", "/guides/")])])


# ---------- info / legal pages ----------
FAQS = [
    (f"What is {SITE_NAME}?",
     "A free library of house design ideas with 2D plans, 3D models and a 4D construction timeline, plus an AI designer "
     "that generates a plan from a short description of your plot, family and budget."),
    ("Are the plans ready to build from?",
     "No. Every plan is an illustrative concept. Always have a licensed architect or structural engineer verify the "
     "structure, local bylaws, setbacks and costs before you build."),
    ("How accurate are the cost estimates?",
     "They are rough figures in Indian rupees (lakh), based on the built-up area and the style of the house. Real costs "
     "change with location, materials, labour and finishes, so treat them as a starting point only."),
    ("How does the AI designer work?",
     "Describe what you need, for example \"3 bedroom modern house 30x40 two floors\". The designer reads the numbers and "
     "style words, fills any missing details with feasible defaults and draws a plan that fits your plot. "
     "If the site owner has enabled it, it also adds short design tips written by an AI model."),
    ("Which languages are supported?",
     "English, Hindi, Spanish, French, Arabic, Bengali, Chinese, Japanese, German, Portuguese, Korean and Italian. "
     "Use the language menu at the top right of any page."),
    ("What do 2D, 3D and 4D mean here?",
     "2D is the floor plan, 3D is a model you can rotate and zoom, and 4D adds time: a day and night view and a "
     "step by step construction timeline from foundation to finishing."),
    ("Can I download a plan?",
     "Yes. Open a design and use the download button to save the plan as an SVG file. SVG opens in any browser and "
     "in most design tools."),
    ("Do I need an account?",
     "No. There is no sign up or login. Your theme and language choices are saved only in your own browser."),
    ("What happens to what I type in the AI designer?",
     "It is used to generate your plan and is not stored by us. See the Privacy page for details."),
    ("Do the designs show real photos?",
     "Cards show an illustrated 2D plan or, where available, a photo or render of that style. The 3D model and the 4D "
     "construction timeline open only on the design page, so the gallery stays fast. Photos are examples of a style, not a "
     "guarantee of what your finished house will look like."),
    ("Which plot sizes and house types are covered?",
     "Plots from 20x30 ft up to 80x100 ft, in single-floor, duplex and triple-floor homes with 1 to 6 bedrooms, in styles "
     "such as modern, village, Assam type, luxury villa, low cost, passive eco and compact. You can filter by "
     "style, bedrooms, floors and facing, and sort by cost or area."),
    ("I found a mistake or have a suggestion. What do I do?",
     "Please use the Contact page. Reports about wrong plans, translations or broken pages are very welcome."),
]


@app.route("/faq")
def faq():
    # One FAQPage for everything visible on the page (a page may only have one FAQPage block).
    all_faqs = FAQS + [(q, a) for q, a, _ in seo.FAQ_SEARCH]
    return render_template("faq.html", faqs=FAQS, search_faqs=seo.FAQ_SEARCH,
                           ld=[seo.breadcrumb([("Home", "/"), ("FAQ", "/faq")]), seo.faq_ld(all_faqs)])


@app.route("/terms")
def terms():
    return render_template("terms.html")


@app.route("/privacy")
def privacy():
    return render_template("privacy.html")


@app.route("/cookies")
def cookies():
    return render_template("cookies.html")


_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_last_post = {}  # ip -> timestamp, a very small flood guard


@app.route("/contact", methods=["GET", "POST"])
def contact():
    if request.method == "GET":
        return render_template("contact.html", sent=request.args.get("sent") == "1", error=None, form={})
    f = {k: (request.form.get(k) or "").strip() for k in ("name", "email", "message")}
    if request.form.get("website"):  # honeypot field: real people leave it empty
        return redirect(url_for("contact", sent=1))
    error = None
    if not (1 <= len(f["name"]) <= 100):
        error = "Please enter your name."
    elif not _EMAIL_RE.match(f["email"]) or len(f["email"]) > 200:
        error = "Please enter a valid email address."
    elif not (10 <= len(f["message"]) <= 3000):
        error = "Please write a message between 10 and 3000 characters."
    ip = request.headers.get("X-Forwarded-For", request.remote_addr or "").split(",")[0].strip()
    if not error and time.time() - _last_post.get(ip, 0) < 30:
        error = "Please wait a few seconds before sending another message."
    if error:
        return render_template("contact.html", sent=False, error=error, form=f), 400
    _last_post[ip] = time.time()
    os.makedirs(app.instance_path, exist_ok=True)
    with open(os.path.join(app.instance_path, "contact_messages.jsonl"), "a", encoding="utf-8") as fh:
        fh.write(json.dumps({"time": time.strftime("%Y-%m-%d %H:%M:%S"), **f}, ensure_ascii=False) + "\n")
    _email_contact(f)
    return redirect(url_for("contact", sent=1))


def _email_contact(f):
    """Email the message to CONTACT_EMAIL when SMTP_HOST is set (SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM optional).
    Runs in the background so the visitor never waits; the message is already saved to instance/contact_messages.jsonl."""
    host = os.getenv("SMTP_HOST")
    if not host:
        return

    def send():
        try:
            msg = EmailMessage()
            msg["Subject"] = f"[{SITE_NAME}] Message from " + re.sub(r"[\r\n]+", " ", f["name"])[:80]
            msg["From"] = os.getenv("SMTP_FROM", CONTACT_EMAIL)
            msg["To"] = CONTACT_EMAIL
            msg["Reply-To"] = f["email"]
            msg.set_content(f"Name: {f['name']}\nEmail: {f['email']}\n\n{f['message']}\n")
            port = int(os.getenv("SMTP_PORT", "587"))
            with (smtplib.SMTP_SSL if port == 465 else smtplib.SMTP)(host, port, timeout=10) as smtp:
                if port != 465:
                    smtp.starttls()
                if os.getenv("SMTP_USER"):
                    smtp.login(os.getenv("SMTP_USER"), os.getenv("SMTP_PASS", ""))
                smtp.send_message(msg)
        except Exception as exc:  # never break the form because mail failed
            app.logger.warning("contact email failed: %s", exc)

    threading.Thread(target=send, daemon=True).start()


@app.errorhandler(404)
def not_found(_):
    return render_template("404.html"), 404


# ---------- API ----------
@app.route("/api/i18n/<lang>")
def api_i18n(lang):
    resp = jsonify(get_dict(lang))
    resp.headers["Cache-Control"] = "public, max-age=3600"
    return resp


@app.route("/api/stats")
def api_stats():
    return jsonify(catalog.stats())


@app.route("/api/designs")
def api_designs():
    style = request.args.get("style") or None
    if style and style not in STYLES:
        style = None
    facing = request.args.get("facing") or None
    if facing not in FACINGS:
        facing = None
    slug = request.args.get("topic")
    pred, max_cost, max_area = None, _int("max_cost"), _int("max_area")
    if slug in topics.BY_SLUG:
        t = topics.BY_SLUG[slug]
        pred = topics.predicate(t)
        max_cost = max_cost or t["filt"].get("max_cost")
        max_area = max_area or t["filt"].get("max_area")
    items = catalog.search(
        q=(request.args.get("q") or "")[:80], style=style, beds=_int("beds", None, 1, 6),
        floors=_int("floors", None, 1, 3), facing=facing, min_area=_int("min_area"),
        max_area=max_area, max_cost=max_cost, sort=request.args.get("sort", "popular"), predicate=pred)
    per = _int("per", 24, 1, 60)
    page = _int("page", 1, 1)
    chunk = items[(page - 1) * per: page * per]
    return jsonify({"total": len(items), "page": page, "per": per,
                    "has_more": page * per < len(items), "items": [catalog.card(d) for d in chunk]})


@app.route("/api/design/<int:design_id>")
def api_design(design_id):
    d = catalog.BY_ID.get(design_id)
    if not d:
        return jsonify({"error": "not found"}), 404
    plan = catalog.plan_for(design_id)
    return jsonify({"meta": catalog.meta(d), "plan": plan, "notes": ai.local_notes(d, plan)})


@app.route("/api/similar/<int:design_id>")
def api_similar(design_id):
    d = catalog.BY_ID.get(design_id)
    if not d:
        return jsonify({"items": []})
    items = catalog.search(style=d["style"], beds=d["beds"])
    items = [x for x in items if x["id"] != design_id][:6]
    return jsonify({"items": [catalog.card(x) for x in items]})


def _generated_payload(p, plan, lang, with_llm=True):
    notes = (ai.llm_notes(p, plan, lang) if with_llm else None) or ai.local_notes(p, plan)
    name = f"{p['style'].title()} {p['beds']} BHK House {p['w']}x{p['d']} ft"
    return {"meta": {"id": None, "style": p["style"], "beds": p["beds"], "floors": p["floors"], "w": p["w"],
                     "d": p["d"], "facing": p["facing"], "variant": p["variant"] + 1, "name": name,
                     "built_area": plan["built_area"], "cost": plan["cost"]},
            "plan": plan, "notes": notes, "reply": ai.reply_text(p, plan, lang)}


@app.route("/api/generate", methods=["POST"])
def api_generate():
    data = request.get_json(silent=True) or {}
    lang = data.get("lang", "en")
    params = {k: data.get(k) for k in ("style", "beds", "floors", "w", "d", "facing", "variant") if data.get(k) not in (None, "")}
    try:
        p, plan = ai.generate(params, seed=data.get("seed"))
    except (ValueError, TypeError):
        return jsonify({"error": "bad parameters"}), 400
    return jsonify(_generated_payload(p, plan, lang))


@app.route("/api/chat", methods=["POST"])
def api_chat():
    data = request.get_json(silent=True) or {}
    text = (data.get("message") or "")[:300]
    params, _ = ai.parse_request(text)
    p, plan = ai.generate(params, seed=data.get("seed"))
    return jsonify(_generated_payload(p, plan, data.get("lang", "en")))


# ---------- SEO ----------
@app.route("/robots.txt")
def robots():
    # /api/ stays crawlable on purpose: gallery cards load from it and Google needs it to render the page.
    return Response(f"User-agent: *\nAllow: /\nSitemap: {seo.SITE_URL}/sitemap.xml\n", mimetype="text/plain")


@app.route("/favicon.ico")
def favicon():
    # real multi-size .ico (16/32/48) at the root: Google and older browsers request exactly this URL
    return send_from_directory(os.path.join(app.static_folder, "img"), "favicon.ico", mimetype="image/x-icon")


@app.route("/apple-touch-icon.png")
@app.route("/apple-touch-icon-precomposed.png")
def apple_touch_icon():
    # iOS Safari asks for this at the root even when a <link> exists
    return send_from_directory(os.path.join(app.static_folder, "img"), "apple-touch-icon.png", mimetype="image/png")


@app.route("/manifest.json")
@app.route("/manifest.webmanifest")
@app.route("/site.webmanifest")  # registered first, so url_for('webmanifest') gives this one
def webmanifest():
    """Web app manifest, built in code (no file to misplace). Icons live in static/img/."""
    icon = lambda name, size, purpose: {"src": url_for("static", filename=f"img/{name}"), "sizes": f"{size}x{size}",
                                        "type": "image/png", "purpose": purpose}
    data = {
        "name": SITE_NAME, "short_name": "AI Houses",
        "description": "Free AI house design: 2D floor plans, 3D models and cost estimates in seconds.",
        "id": "/", "start_url": "/", "scope": "/", "display": "standalone", "orientation": "portrait-primary",
        "background_color": "#14262a", "theme_color": "#235d42",
        "categories": ["design", "productivity", "lifestyle"],
        "icons": [icon("icon-192.png", 192, "any"), icon("icon-256.png", 256, "any"),
                  icon("icon-512.png", 512, "any"), icon("icon-maskable-512.png", 512, "maskable")],
    }
    resp = Response(json.dumps(data, indent=2), mimetype="application/manifest+json")
    resp.headers["Cache-Control"] = "public, max-age=3600"
    return resp


def _lastmod():
    """Date of the newest change to templates / content code, so <lastmod> is real and moves only when the site changes."""
    root = os.path.dirname(os.path.abspath(__file__))
    newest = 0
    for folder in ("templates", "core"):
        for dirpath, _, files in os.walk(os.path.join(root, folder)):
            for fn in files:
                if fn.endswith((".html", ".py")):
                    newest = max(newest, os.path.getmtime(os.path.join(dirpath, fn)))
    return time.strftime("%Y-%m-%d", time.gmtime(newest or time.time()))


# path -> (priority, changefreq).  Google ignores priority and changefreq but other crawlers read them; lastmod is the one that counts.
_SM = {
    "/": (1.0, "daily"), "/designer": (0.9, "weekly"), "/gallery": (0.8, "weekly"), "/faq": (0.8, "weekly"), "/contact": (0.5, "monthly"),
    "/free-ai-house-design/": (0.9, "weekly"), "/floor-plan-creator/": (0.9, "weekly"),
    "/modern-houses-design/": (0.8, "weekly"), "/elevation-design/": (0.8, "weekly"), "/small-houses-design/": (0.8, "weekly"),
    "/passive-houses-design/": (0.8, "weekly"), "/indian-village-house-design/": (0.8, "weekly"),
    "/guides/": (0.7, "weekly"),
}


@app.route("/sitemap.xml")
def sitemap():
    guide_pages = [v["path"] for v in seo.ALL_PAGES.values() if v["kind"] == "guide"]
    landing_pages = [v["path"] for v in seo.ALL_PAGES.values() if v["kind"] == "landing"]
    core_pages = ["/", "/gallery", "/designer", "/faq", "/contact"]
    rows = [(p, *_SM[p]) for p in core_pages + landing_pages + ["/guides/"]]
    rows += [(f"/topic/{t['slug']}", 0.7, "weekly") for t in topics.TOPICS]
    rows += [(p, 0.7, "monthly") for p in guide_pages]
    rows += [(f"/design/{d['id']}", 0.4, "monthly") for d in catalog.DESIGNS[::4]]  # even sample across every style
    lm = _lastmod()
    body = "".join(f"<url><loc>{seo.SITE_URL}{p}</loc><lastmod>{lm}</lastmod><changefreq>{cf}</changefreq><priority>{pr:.1f}</priority></url>"
                   for p, pr, cf in rows)
    return Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
                    + body + '</urlset>', mimetype="application/xml")


@app.route("/healthz")
def healthz():
    return "ok"


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=os.getenv("FLASK_DEBUG") == "1")