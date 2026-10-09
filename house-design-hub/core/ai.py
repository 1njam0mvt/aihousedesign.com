"""AI designer: turns a natural-language request into a generated house plan.

Works fully offline with a rule-based parser + the procedural planner.
If ANTHROPIC_API_KEY is set (and the `anthropic` package is installed) the
designer also asks Claude for short design notes in the user's language.
"""
import os
import random
import re

from .i18n import style_names, get_dict
from .planner import STYLES, FACINGS, build_plan, feasible, usable_area

_FLOOR_RE = re.compile(r"(\d)\s*[- ]?\s*(?:floors?|storeys?|stories|story|मंज़िल|मंजिल|piso|étage|etage|طابق|层|তলা|階|etagen?|stockwerke?|geschosse?|pavimentos?|andares?|층|piani|piano)", re.I)
_BED_RE = re.compile(r"(\d)\s*[- ]?\s*(?:bhk|bed(?:room)?s?|br\b|कमरे|शयनकक्ष|dormitorios?|chambres?|غرف|卧室|室|শোবার|schlafzimmer|quartos?|침실|camere|stanze)", re.I)
_PLOT_RE = re.compile(r"(\d{2,3})\s*(?:x|×|\*|by)\s*(\d{2,3})", re.I)

_SYNONYMS = {
    "village": "village", "rural": "village", "gaon": "village", "gaav": "village",
    "assam": "assam", "northeast": "assam",
    "low cost": "lowcost", "lowcost": "lowcost", "budget": "lowcost", "cheap": "lowcost", "affordable": "lowcost",
    "minimal": "minimalist", "eco": "passive", "passive": "passive", "green": "passive",
    "small": "compact", "tiny": "compact", "compact": "compact",
    "luxury": "villa", "villa": "villa", "mansion": "mansion", "big": "mansion", "large": "mansion",
    "farm": "farmhouse", "bungalow": "bungalow", "loft": "loft", "duplex": "duplex",
    "traditional": "traditional", "contemporary": "contemporary", "modern": "modern",
}

SIZE_BY_BEDS = {1: (20, 30), 2: (30, 40), 3: (30, 50), 4: (40, 60), 5: (50, 60), 6: (60, 80)}


def parse_request(text):
    t = (text or "").lower().replace("×", "x")
    params, notes = {}, []
    m = _BED_RE.search(t)
    if m:
        params["beds"] = int(m.group(1))
    m = _FLOOR_RE.search(t)
    if m:
        params["floors"] = int(m.group(1))
    elif "duplex" in t or "double floor" in t or "two floor" in t:
        params["floors"] = 2
    elif "single floor" in t or "one floor" in t or "ground floor" in t:
        params["floors"] = 1
    m = _PLOT_RE.search(t)
    if m:
        params["w"], params["d"] = int(m.group(1)), int(m.group(2))
    for name, key in style_names().items():
        if name and name in t:
            params["style"] = key
            break
    else:
        for word, key in _SYNONYMS.items():
            if word in t:
                params["style"] = key
                break
    for f, word in (("N", "north"), ("E", "east"), ("S", "south"), ("W", "west")):
        if word + "-facing" in t or word + " facing" in t or word + "facing" in t:
            params["facing"] = f
    return params, notes


def _clamp(n, lo, hi):
    return max(lo, min(hi, n))


def complete(params, seed=None):
    """Fill missing values with sensible, feasible defaults."""
    rng = random.Random(seed)
    style = params.get("style") or rng.choice(list(STYLES))
    if style not in STYLES:
        style = "modern"
    cfg = STYLES[style]
    beds = params.get("beds") or rng.choice(cfg["beds"])
    beds = _clamp(int(beds), 1, 6)
    floors = _clamp(int(params.get("floors") or rng.choice(cfg["floors"])), 1, 3)
    if params.get("w") and params.get("d"):
        w, d = _clamp(int(params["w"]), 15, 150), _clamp(int(params["d"]), 20, 200)
    else:
        w, d = SIZE_BY_BEDS.get(beds, (40, 60))
    # grow the plot (or add floors) until the program actually fits
    guard = 0
    while usable_area(w, d) * floors < 90 * beds + 250 and guard < 30:
        if floors < 3 and guard % 2 == 0:
            floors += 1
        else:
            w, d = w + 5, d + 5
        guard += 1
    facing = params.get("facing") if params.get("facing") in FACINGS else rng.choice(FACINGS)
    variant = _clamp(int(params.get("variant", rng.randint(0, 3))), 0, 3)
    return dict(style=style, beds=beds, floors=floors, w=w, d=d, facing=facing, variant=variant)


def generate(params, seed=None):
    p = complete(params, seed)
    plan = build_plan(p["style"], p["beds"], p["floors"], p["w"], p["d"], p["variant"], p["facing"])
    return p, plan


def local_notes(p, plan):
    notes = []
    f = p["facing"]
    notes.append({"E": "East-facing entrance: morning light and a traditionally favoured entry.",
                  "N": "North-facing entrance: soft, even daylight through the day.",
                  "S": "South-facing entrance: plan shading (verandah, overhang) for the strong sun.",
                  "W": "West-facing entrance: keep large glazing small or shaded against afternoon heat."}[f])
    if plan["roof"] == "gable":
        notes.append("Sloped roof sheds monsoon rain quickly and keeps the upper rooms cooler.")
    elif plan["roof"] == "shed":
        notes.append("Shed roof gives easy drainage and room for clerestory light or solar panels.")
    else:
        notes.append("Flat roof doubles as a usable terrace and an easy base for water tank and solar.")
    if p["floors"] > 1:
        notes.append("Stairs sit in the middle of the plan so every room stays within a short walk.")
    notes.append("Cross-ventilation: keep windows on opposite walls of each main room.")
    return notes


def llm_notes(p, plan, lang="en"):
    """Optional: short design commentary from Claude. Silent no-op if unavailable."""
    key = os.getenv("ANTHROPIC_API_KEY")
    if not key:
        return None
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=key, timeout=8.0)
        rooms = ", ".join(sorted({r["type"] for fl in plan["floor_list"] for r in fl["rooms"]}))
        prompt = (f"Give 3 short, practical design tips (one line each, no preamble) for this house: "
                  f"{p['style']} style, {p['beds']} bedrooms, {p['floors']} floor(s), plot {p['w']}x{p['d']} ft, "
                  f"{p['facing']}-facing, India. Rooms: {rooms}. Reply in language code '{lang}'.")
        msg = client.messages.create(model=os.getenv("AI_MODEL", "claude-sonnet-5-5"), max_tokens=350,
                                     messages=[{"role": "user", "content": prompt}])
        text = "".join(b.text for b in msg.content if getattr(b, "text", None))
        return [ln.strip(" -•\t") for ln in text.splitlines() if ln.strip()][:4] or None
    except Exception:
        return None


def reply_text(p, plan, lang):
    d = get_dict(lang)["t"]
    return d["ai_reply"].format(beds=p["beds"], style=d["style." + p["style"]], w=p["w"], d=p["d"],
                                floors=p["floors"], area=f"{plan['built_area']:,}",
                                cost=f"{plan['cost'] / 100000:.1f}")
