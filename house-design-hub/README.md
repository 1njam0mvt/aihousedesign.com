# House Design Hub

Python (Flask) website with thousands of house designs in **2D, 3D and 4D**, an **AI house designer**,
**dark / light theme**, a **language dropdown with 12 languages** (English first), and a mobile + desktop responsive layout.
Built around the "house design" keyword list (village, single floor, low cost, Assam type, duplex, modern, 3D...).

## Run

```bash
python -m venv .venv && source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python app.py                                          # http://localhost:5000
# production:  gunicorn -w 2 -b 0.0.0.0:8000 app:app
```

## Structure

```
app.py                 Flask routes: pages, JSON API, sitemap/robots
core/planner.py        procedural floor-plan engine (gap-free room layouts, cost estimate)
core/catalog.py        ~8,000 designs = 15 styles x bedrooms x floors x plot sizes x 4 layouts x 4 facings
core/ai.py             AI designer: request parser + generator (+ optional Claude design notes)
core/i18n.py           UI translations: en, hi, es, fr, ar (RTL), bn, zh
core/topics.py         SEO collection pages built from your keyword list
templates/             base, home, gallery, design, designer, topic, 404
static/css/style.css   theme tokens (light/dark), responsive layout
static/js/             app (theme, language), plan2d (SVG), viewer3d (three.js), view, cards, gallery, designer
```

## How the pieces work

- **2D**: SVG floor plan per floor with room names/sizes, compass, road side; downloadable as SVG.
- **3D**: three.js model (walls, windows, doors, roof by style); drag to rotate, wheel/pinch to zoom, cutaway to see inside.
- **4D** = time: construction timeline (foundation -> walls -> roof -> finishing, with Play) plus a 24-hour sun/night slider.
- **AI designer**: type e.g. `3 bedroom modern house 30x40 two floors east facing` (or fill the form / "Surprise me").
  It understands numbers + style words in all 12 languages. Missing details are filled with feasible defaults;
  if the plot is too small for the rooms, it grows the plot or adds a floor.
- **Optional LLM notes**: `export ANTHROPIC_API_KEY=...` (and `pip install anthropic`) adds Claude-written design tips in the
  user's language. Without a key, built-in rule-based tips are used. Model: `AI_MODEL` env var (default `claude-sonnet-5-5`).

## Add things

- **Another language**: add a code to `LANGS` in `core/i18n.py` and a dict for it in `core/i18n_extra.py` (missing keys fall back to English).
- **New style**: add an entry to `STYLES` in `core/planner.py` + a name row in `_STYLE` in `core/i18n.py`.
- **More designs**: widen `PLOTS`, `LAYOUT_VARIANTS` in `core/catalog.py`.

## Notes

- 3D loads three.js from cdnjs, so the browser needs internet access for the 3D/4D tabs.
- Plans are concept layouts with rough cost estimates (INR per sq ft by style). Have an architect/engineer verify
  structure, local bylaws and costs before building.
