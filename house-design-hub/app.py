"""House Design Hub: Flask app (pages + JSON API)."""
import json
import os
import re
import time
from flask import Flask, abort, jsonify, redirect, render_template, request, Response, url_for

from core import catalog, ai, topics
from core.i18n import LANGS, get_dict
from core.planner import STYLES, FACINGS

app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False
EN = get_dict("en")["t"]

# Shown on the legal pages. Set these env vars before going live.
SITE_NAME = os.getenv("SITE_NAME", "House Design Hub")
CONTACT_EMAIL = os.getenv("CONTACT_EMAIL", "hello@example.com")
LEGAL_UPDATED = "9 October 2026"


@app.context_processor
def inject():
    return dict(T=lambda k: EN.get(k, k), LANGS=LANGS, TOPICS=topics.TOPICS, STYLE_KEYS=list(STYLES),
                total=len(catalog.DESIGNS), style_en=lambda k: EN["style." + k],
                SITE_NAME=SITE_NAME, CONTACT_EMAIL=CONTACT_EMAIL, LEGAL_UPDATED=LEGAL_UPDATED)


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
    return render_template("index.html", featured=featured, stats=catalog.stats())


@app.route("/gallery")
def gallery():
    return render_template("gallery.html")


@app.route("/design/<int:design_id>")
def design(design_id):
    d = catalog.BY_ID.get(design_id)
    if not d:
        abort(404)
    return render_template("design.html", d=catalog.meta(d))


@app.route("/designer")
def designer():
    return render_template("designer.html")


@app.route("/topic/<slug>")
def topic(slug):
    t = topics.BY_SLUG.get(slug)
    if not t:
        abort(404)
    items = _topic_items(t)
    return render_template("topic.html", t=t, count=len(items), cards=[catalog.card(d) for d in items[:12]])


def _topic_items(t):
    f = t["filt"]
    return catalog.search(predicate=topics.predicate(t), max_cost=f.get("max_cost"), max_area=f.get("max_area"))


# ---------- info / legal pages ----------
FAQS = [
    ("What is House Design Hub?",
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
    ("I found a mistake or have a suggestion. What do I do?",
     "Please use the Contact page. Reports about wrong plans, translations or broken pages are very welcome."),
]


@app.route("/faq")
def faq():
    ld = {"@context": "https://schema.org", "@type": "FAQPage",
          "mainEntity": [{"@type": "Question", "name": q,
                          "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in FAQS]}
    return render_template("faq.html", faqs=FAQS, faq_ld=ld)


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
    return redirect(url_for("contact", sent=1))


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
    return Response(f"User-agent: *\nAllow: /\nSitemap: {request.url_root}sitemap.xml\n", mimetype="text/plain")


@app.route("/sitemap.xml")
def sitemap():
    base = request.url_root.rstrip("/")
    urls = [f"{base}/", f"{base}/gallery", f"{base}/designer"] + [f"{base}/{x}" for x in ("faq", "contact", "privacy", "terms", "cookies")] + [f"{base}/topic/{t['slug']}" for t in topics.TOPICS]
    urls += [f"{base}/design/{d['id']}" for d in catalog.DESIGNS[:2000]]
    body = "".join(f"<url><loc>{u}</loc></url>" for u in urls)
    return Response(f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{body}</urlset>', mimetype="application/xml")


@app.route("/healthz")
def healthz():
    return "ok"


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=os.getenv("FLASK_DEBUG") == "1")
    