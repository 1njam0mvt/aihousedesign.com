"""Procedural floor-plan engine.

Units are feet. y=0 is the front (road side) of the plot, y grows toward the rear.
Rooms on each floor are packed into horizontal bands that tile the buildable
rectangle exactly, so every plan is a valid, gap-free layout.
"""
import random

# relative area weights per room type
ROOM_W = {
    "living": 5, "kitchen": 3, "dining": 3, "bedroom": 4, "master": 5, "bath": 2.0,
    "porch": 2, "verandah": 3, "pooja": 1.6, "balcony": 1.6, "lounge": 3.2,
    "stair": 2.2, "store": 1.8, "carport": 3.2, "study": 2.5,
}

STYLES = {
    "modern": dict(beds=(2, 3, 4, 5), floors=(1, 2, 3), rate=2100, roof="flat", wall="#ece8e1", roofc="#454b55", accent="#d9822b", plot=(900, 4500), indian=False, car=True, veranda=False, store=False, kw="modern new latest"),
    "minimalist": dict(beds=(1, 2, 3, 4), floors=(1, 2), rate=2000, roof="flat", wall="#f4f4f2", roofc="#6b7078", accent="#222222", plot=(600, 3000), indian=False, car=False, veranda=False, store=False, kw="minimalist minimal simple clean"),
    "contemporary": dict(beds=(2, 3, 4, 5), floors=(1, 2, 3), rate=2300, roof="shed", wall="#e2ddd3", roofc="#3b4048", accent="#2f7f79", plot=(1000, 5000), indian=False, car=True, veranda=False, store=False, kw="contemporary stylish"),
    "village": dict(beds=(1, 2, 3, 4), floors=(1, 2), rate=1200, roof="gable", wall="#e8d3b0", roofc="#a4532f", accent="#5b3a1e", plot=(600, 4000), indian=True, car=False, veranda=True, store=True, kw="village rural gaon normal village simple village"),
    "assam": dict(beds=(1, 2, 3, 4), floors=(1, 2), rate=1500, roof="gable", wall="#d9c7a0", roofc="#3f6b4a", accent="#6d4a2b", plot=(600, 3500), indian=True, car=False, veranda=True, store=True, kw="assam type northeast chang ghar bamboo"),
    "traditional": dict(beds=(2, 3, 4, 5), floors=(1, 2), rate=1800, roof="gable", wall="#efe0c4", roofc="#8a3b24", accent="#7a4a21", plot=(800, 4000), indian=True, car=False, veranda=True, store=True, kw="traditional indian classic"),
    "duplex": dict(beds=(2, 3, 4, 5), floors=(2,), rate=2200, roof="flat", wall="#ebe3d6", roofc="#5a5f68", accent="#b5651d", plot=(600, 3000), indian=True, car=True, veranda=False, store=False, kw="duplex two floor double storey"),
    "passive": dict(beds=(2, 3, 4), floors=(1, 2), rate=2500, roof="shed", wall="#dfe8dc", roofc="#4c6a52", accent="#7fa37a", plot=(900, 3500), indian=False, car=False, veranda=False, store=False, kw="passive eco green energy efficient"),
    "loft": dict(beds=(1, 2, 3), floors=(1, 2), rate=2400, roof="shed", wall="#d7d9dc", roofc="#2f3338", accent="#e0a030", plot=(500, 2000), indian=False, car=False, veranda=False, store=False, kw="loft small spaces"),
    "farmhouse": dict(beds=(2, 3, 4, 5), floors=(1, 2), rate=1900, roof="gable", wall="#f1ebe0", roofc="#6e4b3a", accent="#9a6b3f", plot=(1800, 8000), indian=False, car=True, veranda=True, store=False, kw="farmhouse farm country"),
    "bungalow": dict(beds=(2, 3, 4, 5), floors=(1, 2), rate=2200, roof="gable", wall="#f0e6d2", roofc="#7c3f2a", accent="#b08850", plot=(1200, 5000), indian=True, car=True, veranda=True, store=False, kw="bungalow independent house"),
    "villa": dict(beds=(3, 4, 5, 6), floors=(2, 3), rate=3200, roof="flat", wall="#f3efe8", roofc="#3d4249", accent="#c8a24a", plot=(2400, 10000), indian=False, car=True, veranda=False, store=False, kw="villa luxury premium"),
    "lowcost": dict(beds=(1, 2, 3), floors=(1,), rate=1100, roof="shed", wall="#e7dcc6", roofc="#6f7c85", accent="#8a6a45", plot=(400, 1800), indian=True, car=False, veranda=True, store=False, kw="low cost budget cheap affordable economical"),
    "compact": dict(beds=(1, 2), floors=(1, 2), rate=1700, roof="flat", wall="#eeeae2", roofc="#555b63", accent="#3a7ca5", plot=(400, 1200), indian=False, car=False, veranda=False, store=False, kw="small tiny compact"),
    "mansion": dict(beds=(5, 6), floors=(2, 3), rate=3800, roof="flat", wall="#f4efe6", roofc="#35393f", accent="#b58b2a", plot=(4000, 12000), indian=False, car=True, veranda=False, store=False, kw="mansion big large"),
}

FACINGS = ("N", "E", "S", "W")


def margins(w, d):
    side = 2.0 if w <= 25 else 3.0
    front = 4.0 if d <= 40 else 6.0
    rear = 3.0
    return side, front, rear


def usable_area(w, d):
    side, front, rear = margins(w, d)
    return (w - 2 * side) * (d - front - rear)


def feasible(style, beds, floors, w, d):
    cfg = STYLES[style]
    area = w * d
    if not (cfg["plot"][0] <= area <= cfg["plot"][1]):
        return False
    built = usable_area(w, d) * floors
    upper = 1200 * beds + 4000 if cfg["plot"][1] >= 8000 else 380 * beds + 1200
    return 90 * beds + 250 <= built <= upper


def _split(n, parts):
    base, extra = divmod(n, parts)
    return [base + (1 if i < extra else 0) for i in range(parts)]


def _floor_rooms(level, floors, counts, cfg, beds, w, rng, shuffle):
    """Ordered list of room types for one floor (public -> private)."""
    rooms = []
    nb = counts[level]
    pairs = []
    for i in range(nb):
        kind = "master" if (level == 0 and i == 0 and beds >= 2) or (level == 1 and i == 0 and counts[0] == 0) else "bedroom"
        pairs.append([kind, "bath"])
    if shuffle:
        rng.shuffle(pairs)
    if level == 0:
        if cfg["car"] and w >= 30:
            rooms.append("carport")
        rooms.append("verandah" if cfg["veranda"] else "porch")
        rooms.append("living")
        if cfg["indian"]:
            rooms.append("pooja")
        if beds >= 2:
            rooms.append("dining")
        rooms.append("kitchen")
        if cfg["store"]:
            rooms.append("store")
        if floors > 1:
            rooms.append("stair")
        if beds >= 4 and nb > 1 or floors == 1 and beds >= 3:
            rooms.append("bath")
        if nb == 0:
            rooms.append("study")
    else:
        rooms.append("balcony")
        rooms.append("lounge")
        rooms.append("stair")
        if nb == 0:
            rooms += ["study", "bath"]
    for p in pairs:
        rooms += p
    if level == 0 and not any(r in ("bath",) for r in rooms):
        rooms.append("bath")
    return rooms


MAIN = ("living", "kitchen", "dining", "bedroom", "master", "lounge")


def _layout(room_types, nb, iw, idp, ix, iy, mirror, prefix):
    sizes = _split(len(room_types), nb)
    total = sum(ROOM_W[t] for t in room_types)
    out, i, y = [], 0, iy
    for sz in sizes:
        band = room_types[i:i + sz]
        i += sz
        s = sum(ROOM_W[t] for t in band)
        bh = idp * s / total
        x = ix
        for t in band:
            rw = iw * ROOM_W[t] / s
            rx = ix + iw - (x - ix) - rw if mirror else x
            out.append({
                "id": f"{prefix}{len(out) + 1}", "type": t,
                "x": round(rx, 2), "y": round(y, 2), "w": round(rw, 2), "h": round(bh, 2),
            })
            x += rw
        y += bh
    return out


def _score(rooms):
    return min([min(r["w"], r["h"]) for r in rooms if r["type"] in MAIN] or [99])


def _pack(room_types, iw, idp, ix, iy, level, mirror, prefix):
    """Tile the buildable rectangle with horizontal bands; pick the band count
    that keeps the main rooms (living, bedrooms...) as roomy as possible."""
    n = len(room_types)
    nb0 = 1 if n <= 3 else 2 if n <= 6 else 3 if n <= 10 else 4
    best, best_score = None, -1
    for nb in sorted({max(1, nb0 - 1), nb0, min(n, nb0 + 1)}, key=lambda k: abs(k - nb0)):
        cand = _layout(room_types, nb, iw, idp, ix, iy, mirror, prefix)
        sc = _score(cand)
        if sc > best_score + 0.75 or best is None:  # prefer the default band count unless clearly better
            best, best_score = cand, sc
    return best


def build_plan(style, beds, floors, w, d, variant=0, facing="E"):
    cfg = STYLES[style]
    rng = random.Random(f"{style}-{beds}-{floors}-{w}-{d}-{variant}")
    side, front, rear = margins(w, d)
    ix, iy = side, front
    iw, idp = w - 2 * side, d - front - rear
    counts = [0] * floors
    counts[0] = max(1, beds // floors) if floors > 1 else beds
    rem = beds - counts[0]
    if floors > 1:
        for k, share in enumerate(_split(rem, floors - 1)):
            counts[k + 1] = share
    mirror = bool(variant & 1)
    shuffle = bool(variant & 2)
    floor_list = []
    for level in range(floors):
        types = _floor_rooms(level, floors, counts, cfg, beds, w, rng, shuffle)
        rooms = _pack(types, iw, idp, ix, iy, level, mirror, f"f{level}r")
        floor_list.append({"level": level, "rooms": rooms})
    return {
        "style": style, "beds": beds, "floors": floors, "facing": facing,
        "plot": {"w": w, "d": d},
        "inner": {"x": ix, "y": iy, "w": round(iw, 2), "d": round(idp, 2)},
        "floor_height": 10,
        "roof": cfg["roof"],
        "palette": {"wall": cfg["wall"], "roof": cfg["roofc"], "accent": cfg["accent"]},
        "floor_list": floor_list,
        "built_area": round(iw * idp * floors),
        "rate": cfg["rate"],
        "cost": round(iw * idp * floors * cfg["rate"], -3),
    }
