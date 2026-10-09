"""Design catalog: thousands of parametric house designs, generated once at import."""
import random
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
    return {
        "id": d["id"], "style": d["style"], "beds": d["beds"], "floors": d["floors"],
        "w": d["w"], "d": d["d"], "variant": d["variant"] + 1, "facing": d["facing"],
        "name": f"{_label(d['style'])} {d['beds']} BHK {fl} House {d['w']}x{d['d']} ft "
                f"({_facing_word(d['facing'])}-facing) Plan {d['variant'] + 1}",
        "built_area": p["built_area"], "cost": p["cost"], "dims": DIMS,
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
    toks = [t for t in (q or "").lower().replace("×", "x").split() if t]
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
        if toks and not all(t in blob for t in toks):
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
