"""Design catalog: thousands of parametric house designs, generated once at import."""
import random
import re
from functools import lru_cache

from .planner import STYLES, FACINGS, feasible, build_plan

PLOTS = [(20, 30), (20, 40), (25, 40), (30, 40), (30, 50), (35, 60), (40, 50), (40, 60),
         (50, 60), (50, 80), (60, 80), (60, 100), (80, 100)]
LAYOUT_VARIANTS = 4
DIMS = [2, 3, 4]


def _build():
    items = []
    for style, cfg in STYLES.items():
        for beds in cfg["beds"]:
            for floors in cfg["floors"]:
                for (w, d) in PLOTS:
                    if not feasible(style, beds, floors, w, d):
                        continue
                    for variant in range(LAYOUT_VARIANTS):
                        for facing in FACINGS:
                            items.append(dict(style=style, beds=beds, floors=floors, w=w, d=d,
                                              variant=variant, facing=facing))
    random.Random(2026).shuffle(items)  # variety in the default gallery order
    for i, it in enumerate(items, start=1):
        it["id"] = i
    return items


DESIGNS = _build()
BY_ID = {d["id"]: d for d in DESIGNS}


def _facing_word(f):
    return {"N": "North", "E": "East", "S": "South", "W": "West"}[f]


def _label(style):
    return {"lowcost": "Low Cost", "assam": "Assam Type", "compact": "Small Compact",
            "passive": "Passive Eco", "villa": "Luxury Villa"}.get(style, style.title())


@lru_cache(maxsize=4096)
def plan_for(design_id):
    d = BY_ID[design_id]
    return build_plan(d["style"], d["beds"], d["floors"], d["w"], d["d"], d["variant"], d["facing"])


def meta(d):
    p = plan_for(d["id"])
    fl = "Single-Floor" if d["floors"] == 1 else f"{d['floors']}-Floor"
    beds = d["beds"]

    # Blueprint-to-Reality Stages
    stages = [
        {"id": "blueprint", "num": "STAGE 00", "label_key": "stage_blueprint", "tag": "CAD WIREFRAME", "desc": "Every home starts as lines on paper. Scroll to watch this one come to life."},
        {"id": "foundation", "num": "STAGE 01", "label_key": "stage_foundation", "tag": "SOLID FOOTING", "desc": "Poured footers and a sealed crawl space set the stage for what goes up."},
        {"id": "framing", "num": "STAGE 02", "label_key": "stage_framing", "tag": "TIMBER SKELETON", "desc": "Every wall, floor, joist and truss built to blueprint plan. Solid lumber as good as it gets."},
        {"id": "driedin", "num": "STAGE 03", "label_key": "stage_driedin", "tag": "WEATHER SHIELD", "desc": "Weather-tight. Fully house-wrapped and roof-sealed before the weather gets a say."},
        {"id": "exterior", "num": "STAGE 04", "label_key": "stage_exterior", "tag": "FACADE & STONE", "desc": "Architectural shingles, board-and-batten siding and hand-laid stone."},
        {"id": "home", "num": "STAGE 05", "label_key": "stage_complete", "tag": "COMPLETED RESIDENCE", "desc": f"4,200 sq ft, {beds} bedrooms, {d['floors']} floors. Built to picture."}
    ]

    # Six Layers Architectural X-Ray
    layers = [
        {"id": "01", "name": "ROOF DECK", "spec": "5/8\" or 3/4\" exterior-grade plywood/OSB. Inspected and structurally verified."},
        {"id": "02", "name": "DRIP EDGE", "spec": "Corrosion-resistant eaves & rakes edging to direct runoff clear of fascia."},
        {"id": "03", "name": "ICE & WATER SHIELD", "spec": "Self-adhering waterproof membrane along eaves, valleys, and joints."},
        {"id": "04", "name": "SYNTHETIC UNDERLAYMENT", "spec": "High-traction woven polymer air and moisture barrier with 4\" overlapping seams."},
        {"id": "05", "name": "ARCHITECTURAL SHINGLES", "spec": "Multi-layered fiberglass dimensional asphalt shingles with Class-A fire rating."},
        {"id": "06", "name": "RIDGE VENT & CAP", "spec": "Continuous passive exhaust ventilation balancing ridge airflow and attic temperature."}
    ]

    # Film Walkthrough Sequences
    walkthrough = [
        {"name": "EXTERIOR", "sub": "Architectural Facade & Landscaping", "lens": "24mm F/2.8", "iso": "ISO 100", "tc": "00:00:14:02"},
        {"name": "FOYER", "sub": "Grand High-Ceiling Reception Gallery", "lens": "35mm F/1.8", "iso": "ISO 200", "tc": "00:01:04:18"},
        {"name": "DINING ROOM", "sub": "Coffered Ceiling Formal Dining Space", "lens": "50mm F/1.4", "iso": "ISO 320", "tc": "00:02:18:09"},
        {"name": "KITCHEN", "sub": "Chef's Island with Quartz Countertops", "lens": "35mm F/1.8", "iso": "ISO 400", "tc": "00:03:45:12"},
        {"name": "LOWER LEVEL", "sub": "Entertainment Billiards & Private Wet Bar", "lens": "24mm F/2.8", "iso": "ISO 500", "tc": "00:04:30:20"},
        {"name": "GREAT ROOM", "sub": "Double-Height Natural Stone Fireplace", "lens": "50mm F/1.4", "iso": "ISO 250", "tc": "00:05:12:04"},
        {"name": "HOME OFFICE", "sub": "Bespoke Built-in Oak Shelving & Library", "lens": "35mm F/2.0", "iso": "ISO 200", "tc": "00:06:05:15"},
        {"name": "PRIMARY SUITE", "sub": "Master Retreat with Private Balcony", "lens": "50mm F/1.4", "iso": "ISO 160", "tc": "00:07:22:19"},
        {"name": "PRIMARY BATH", "sub": "Freestanding Soaking Tub & Dual Vanities", "lens": "24mm F/2.8", "iso": "ISO 320", "tc": "00:08:40:02"},
        {"name": "BACKYARD", "sub": "Outdoor Pool, Stone Patio & Covered Verandah", "lens": "18mm F/2.8", "iso": "ISO 100", "tc": "00:09:55:23"}
    ]

    return {
        "id": d["id"], "style": d["style"], "beds": d["beds"], "floors": d["floors"],
        "w": d["w"], "d": d["d"], "variant": d["variant"] + 1, "facing": d["facing"],
        "name": f"{_label(d['style'])} {d['beds']} BHK {fl} House {d['w']}x{d['d']} ft "
                f"({_facing_word(d['facing'])}-facing) Plan {d['variant'] + 1}",
        "built_area": p["built_area"], "cost": p["cost"], "dims": DIMS,
        "stages": stages,
        "layers": layers,
        "walkthrough": walkthrough
    }


def card(d):
    """Meta + a compact ground-floor thumbnail for gallery cards."""
    m = meta(d)
    p = plan_for(d["id"])
    m["thumb"] = {
        "plot": p["plot"], "inner": p["inner"], "palette": p["palette"], "roof": p["roof"],
        "rooms": [[r["type"], r["x"], r["y"], r["w"], r["h"]] for r in p["floor_list"][0]["rooms"]],
    }
    return m


def _blob(d):
    cfg = STYLES[d["style"]]
    fl = "single floor one floor ground floor" if d["floors"] == 1 else "duplex two floor double storey" if d["floors"] == 2 else "three floor triple storey"
    return (f"{d['style']} {cfg['kw']} {d['beds']} bhk {d['beds']} bedroom {fl} {d['w']}x{d['d']} "
            f"{_facing_word(d['facing']).lower()} facing 2d 3d 4d house design plan").lower()


_BLOBS = {d["id"]: _blob(d) for d in DESIGNS}


def search(q="", style=None, beds=None, floors=None, facing=None, min_area=None, max_area=None,
           max_cost=None, sort="popular", predicate=None):
    qtext = (q or "").lower().replace("×", "x")
    phrases = [f"{n} bhk" for n in re.findall(r"(\d+)\s*bhk", qtext)]       # "3 bhk" / "3bhk" must match the bedroom count
    qtext = re.sub(r"\d+\s*bhk", " ", qtext)
    toks = [t for t in qtext.split() if t]
    out = []
    for d in DESIGNS:
        if style and d["style"] != style:
            continue
        if beds and d["beds"] != beds:
            continue
        if floors and d["floors"] != floors:
            continue
        if facing and d["facing"] != facing:
            continue
        if predicate and not predicate(d):
            continue
        blob = _BLOBS[d["id"]]
        if phrases and not all(ph in blob for ph in phrases):
            continue
        if toks and not all((re.search(r"\b" + t + r"\b", blob) if t.isdigit() else t in blob) for t in toks):
            continue
        out.append(d)
    if min_area or max_area or max_cost or sort in ("cost_asc", "cost_desc", "area_asc", "area_desc"):
        keyed = []
        for d in out:
            p = plan_for(d["id"])
            if min_area and p["built_area"] < min_area:
                continue
            if max_area and p["built_area"] > max_area:
                continue
            if max_cost and p["cost"] > max_cost:
                continue
            keyed.append((p["cost"], p["built_area"], d))
        if sort == "cost_asc":
            keyed.sort(key=lambda k: k[0])
        elif sort == "cost_desc":
            keyed.sort(key=lambda k: -k[0])
        elif sort == "area_asc":
            keyed.sort(key=lambda k: k[1])
        elif sort == "area_desc":
            keyed.sort(key=lambda k: -k[1])
        out = [k[2] for k in keyed]
    return out


def stats():
    per = {}
    for d in DESIGNS:
        per[d["style"]] = per.get(d["style"], 0) + 1
    return {"total": len(DESIGNS), "styles": per, "dimensions": DIMS}