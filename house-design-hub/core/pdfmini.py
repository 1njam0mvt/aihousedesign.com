"""Tiny dependency-free PDF writer (A4, Helvetica, embedded JPEGs) used for the 3D Builder blueprint report."""
import re
import time
import zlib

PW, PH = 595.28, 841.89

# Helvetica advance widths for ASCII 32..126 (per 1000 em)
_W = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
      556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
      1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
      667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
      333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
      556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584]


def text_width(s, size, bold=False):
    w = sum(_W[ord(c) - 32] if 32 <= ord(c) <= 126 else 556 for c in s) * size / 1000.0
    return w * (1.07 if bold else 1.0)


def _esc(s):
    b = str(s).encode("cp1252", "replace")
    return b.replace(b"\\", b"\\\\").replace(b"(", b"\\(").replace(b")", b"\\)").decode("latin-1")


def jpeg_info(data):
    """Return (width, height, components) of a baseline/progressive JPEG."""
    i = 2
    while i < len(data) - 9:
        if data[i] != 0xFF:
            i += 1
            continue
        m = data[i + 1]
        if m in (0xC0, 0xC1, 0xC2):
            return (data[i + 7] << 8) | data[i + 8], (data[i + 5] << 8) | data[i + 6], data[i + 9]
        i += 2 + ((data[i + 2] << 8) | data[i + 3])
    raise ValueError("not a JPEG")


class Doc:
    def __init__(self):
        self.pages = []      # each: {"c": [ops], "x": {name: image_index}}
        self.images = []     # (bytes, w, h, comps)
        self.cur = None

    def new_page(self):
        self.cur = {"c": [], "x": {}}
        self.pages.append(self.cur)
        return self.cur

    def add_image(self, data):
        w, h, n = jpeg_info(data)
        self.images.append((data, w, h, n))
        return len(self.images) - 1

    @staticmethod
    def _col(c):
        return " ".join(f"{v:.3f}" for v in c)

    def text(self, x, y, s, size=10, bold=False, color=(0.1, 0.12, 0.16)):
        self.cur["c"].append(f"BT /{'F2' if bold else 'F1'} {size} Tf {self._col(color)} rg {x:.2f} {y:.2f} Td ({_esc(s)}) Tj ET")

    def rect(self, x, y, w, h, fill=None, stroke=None, lw=0.6):
        ops = []
        if fill:
            ops.append(f"{self._col(fill)} rg")
        if stroke:
            ops.append(f"{self._col(stroke)} RG {lw} w")
        paint = "B" if fill and stroke else "f" if fill else "S"
        ops.append(f"{x:.2f} {y:.2f} {w:.2f} {h:.2f} re {paint}")
        self.cur["c"].append(" ".join(ops))

    def line(self, x1, y1, x2, y2, color=(0.8, 0.82, 0.85), lw=0.6):
        self.cur["c"].append(f"{self._col(color)} RG {lw} w {x1:.2f} {y1:.2f} m {x2:.2f} {y2:.2f} l S")

    def image(self, idx, x, y, w, h):
        name = f"Im{idx}"
        self.cur["x"][name] = idx
        self.cur["c"].append(f"q {w:.2f} 0 0 {h:.2f} {x:.2f} {y:.2f} cm /{name} Do Q")

    def output(self):
        objs = []                      # list of bytes bodies; object number = index + 1

        def add(body):
            objs.append(body if isinstance(body, bytes) else body.encode("latin-1"))
            return len(objs)

        add("")  # 1 catalog (filled later)
        add("")  # 2 pages (filled later)
        f1 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>")
        f2 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>")
        img_ids = []
        for data, w, h, n in self.images:
            cs = "/DeviceGray" if n == 1 else "/DeviceRGB"
            head = f"<< /Type /XObject /Subtype /Image /Width {w} /Height {h} /ColorSpace {cs} /BitsPerComponent 8 /Filter /DCTDecode /Length {len(data)} >>\nstream\n".encode("latin-1")
            img_ids.append(add(head + data + b"\nendstream"))
        page_ids = []
        for pg in self.pages:
            content = zlib.compress("\n".join(pg["c"]).encode("latin-1", "replace"))
            cid = add(b"<< /Filter /FlateDecode /Length %d >>\nstream\n" % len(content) + content + b"\nendstream")
            xo = " ".join(f"/{k} {img_ids[v]} 0 R" for k, v in pg["x"].items())
            pid = add(f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {PW} {PH}] /Contents {cid} 0 R "
                      f"/Resources << /Font << /F1 {f1} 0 R /F2 {f2} 0 R >> /XObject << {xo} >> >> >>")
            page_ids.append(pid)
        objs[0] = b"<< /Type /Catalog /Pages 2 0 R >>"
        objs[1] = ("<< /Type /Pages /Count %d /Kids [%s] >>" % (len(page_ids), " ".join(f"{p} 0 R" for p in page_ids))).encode("latin-1")
        out = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
        offs = []
        for i, body in enumerate(objs, 1):
            offs.append(len(out))
            out += b"%d 0 obj\n" % i + body + b"\nendobj\n"
        xref = len(out)
        out += b"xref\n0 %d\n0000000000 65535 f \n" % (len(objs) + 1)
        for o in offs:
            out += b"%010d 00000 n \n" % o
        out += b"trailer\n<< /Size %d /Root 1 0 R /Info << /Title (AI House Design blueprint report) /Producer (AI House Design) >> >>\nstartxref\n%d\n%%%%EOF\n" % (len(objs) + 1, xref)
        return bytes(out)


# ------------------------------------------------------------------------------------------------ report layout
GREEN = (0.024, 0.306, 0.231)
EM = (0.063, 0.725, 0.506)
INK = (0.09, 0.11, 0.15)
MUTE = (0.40, 0.45, 0.52)
LINE = (0.86, 0.88, 0.91)
SOFT = (0.95, 0.96, 0.97)


def _s(v, n=80):
    return re.sub(r"[\r\n\t]+", " ", str(v if v is not None else "")).strip()[:n]


def _num(v, lo=0, hi=10_000_000):
    try:
        return max(lo, min(hi, float(v)))
    except (TypeError, ValueError):
        return 0.0


def _hex(v, default=(0.8, 0.8, 0.8)):
    m = re.fullmatch(r"#([0-9a-fA-F]{6})", str(v or ""))
    return tuple(int(m.group(1)[i:i + 2], 16) / 255 for i in (0, 2, 4)) if m else default


def _money(v):
    return "$" + f"{int(round(v)):,}"


def _fit(doc, idx, x, ytop, maxw, maxh):
    _, w, h, _ = doc.images[idx]
    k = min(maxw / w, maxh / h)
    iw, ih = w * k, h * k
    doc.image(idx, x + (maxw - iw) / 2, ytop - ih, iw, ih)
    return ih


def build_report(design, who, render_jpeg, inspiration_jpeg, site_name="AI House Design"):
    doc = Doc()
    M = 42
    name, email = _s(who.get("n"), 60), _s(who.get("e"), 80)
    lay, bnd, fin = design.get("layout") or {}, design.get("boundary") or {}, design.get("finishes") or {}
    roof, ext = design.get("roof") or {}, design.get("exterior") or {}
    furn = [f for f in (design.get("furniture") or []) if isinstance(f, dict)][:80]
    costs = design.get("costs") or {}
    ri = doc.add_image(render_jpeg) if render_jpeg else None
    ii = doc.add_image(inspiration_jpeg) if inspiration_jpeg else None

    def header(title, sub):
        doc.rect(0, PH - 74, PW, 74, fill=GREEN)
        doc.text(M, PH - 38, site_name, 18, True, (1, 1, 1))
        doc.text(M, PH - 56, title, 10.5, False, (0.8, 0.95, 0.88))
        doc.text(PW - M - text_width(sub, 9), PH - 40, sub, 9, False, (0.8, 0.95, 0.88))

    def footer(n):
        doc.line(M, 40, PW - M, 40)
        doc.text(M, 27, f"{site_name} | Preliminary design report. Costs are rough estimates; have a licensed architect and engineer verify plans.", 7, False, MUTE)
        doc.text(PW - M - 8, 27, str(n), 8, True, MUTE)

    # ---- page 1: cover + rendered view
    doc.new_page()
    header("Custom Dream House Blueprint Report", time.strftime("%d %B %Y"))
    y = PH - 104
    doc.text(M, y, "Prepared for", 8, False, MUTE)
    doc.text(M, y - 14, name or "Guest", 14, True, INK)
    doc.text(M, y - 28, email, 9, False, MUTE)
    total = _num(costs.get("total"))
    doc.rect(PW - M - 170, y - 34, 170, 46, fill=SOFT, stroke=LINE)
    doc.text(PW - M - 160, y - 8, "ESTIMATED TOTAL", 7.5, True, MUTE)
    doc.text(PW - M - 160, y - 28, _money(total), 17, True, GREEN)
    y -= 56
    if ri is not None:
        h = _fit(doc, ri, M, y, PW - 2 * M, 330)
        doc.rect(M, y - h, PW - 2 * M, h, stroke=LINE)
        doc.text(M, y - h - 12, "Rendered 3D builder view", 8, False, MUTE)
        y -= h + 26
    if ii is not None:
        doc.text(M, y - 4, "YOUR INSPIRATION IMAGE", 8, True, MUTE)
        h = _fit(doc, ii, M, y - 10, 250, 170)
        doc.rect(M, y - 10 - h, 250, h, stroke=LINE)
        y -= 10 + h
    rows = [("Base layout", f"{_s(lay.get('name'))} ({_s(lay.get('size'))})"), ("Floor area", f"{_num(lay.get('areaM2')):.1f} m2 / {_num(lay.get('areaM2')) * 10.764:.0f} sq ft"),
            ("Boundary", _s(bnd.get("name"))), ("Roof", f"{_s(roof.get('style'))}, {_s(roof.get('colorName'))}"),
            ("Coastal balcony", "Yes, sea-facing" if design.get("sea") else "No")]
    footer(1)

    # summary list placed to the right of the inspiration image or under the render
    sx = M + 270 if ii is not None else M
    sy = y + (170 if ii is not None else 0) - (12 if ii is not None else 12)
    if ii is None:
        sy = y - 4
    doc.text(sx, sy, "AT A GLANCE", 8, True, MUTE)
    sy -= 16
    for k, v in rows:
        doc.text(sx, sy, k, 9, True, INK)
        doc.text(sx + 100, sy, v, 9, False, INK)
        sy -= 15

    # ---- page 2+: specifications, furniture, costs
    pg = [2]
    state = {"y": 0}

    def fresh():
        doc.new_page()
        header("Specifications and cost allocation", name)
        footer(pg[0])
        pg[0] += 1
        state["y"] = PH - 106

    def heading(t):
        if state["y"] < 120:
            fresh()
        doc.text(M, state["y"], t.upper(), 8.5, True, GREEN)
        doc.line(M, state["y"] - 5, PW - M, state["y"] - 5, EM, 1)
        state["y"] -= 22

    fresh()
    heading("Surfaces and finishes")
    wall, floor = fin.get("wall") or {}, fin.get("floor") or {}
    specs = [("Wall paint", _s(wall.get("name")), wall.get("hex")), ("Floor", f"{_s(floor.get('type')).title()}: {_s(floor.get('name'))}", floor.get("hex")),
             ("Exterior facade", _s(ext.get("name")), ext.get("hex")), ("Roof colour", _s(roof.get("colorName")), roof.get("hex"))]
    for k, v, hx in specs:
        doc.rect(M, state["y"] - 3, 14, 14, fill=_hex(hx), stroke=LINE)
        doc.text(M + 24, state["y"], k, 9.5, True, INK)
        doc.text(M + 150, state["y"], v, 9.5, False, INK)
        state["y"] -= 20
    state["y"] -= 8
    heading("Furniture and appliance schedule")
    if not furn:
        doc.text(M, state["y"], "No furniture placed.", 9.5, False, MUTE)
        state["y"] -= 18
    else:
        doc.rect(M, state["y"] - 5, PW - 2 * M, 18, fill=SOFT)
        for tx, t in ((M + 8, "Item"), (M + 250, "Room"), (M + 340, "Qty"), (M + 400, "Unit"), (PW - M - 60, "Subtotal")):
            doc.text(tx, state["y"], t, 8.5, True, MUTE)
        state["y"] -= 22
        for f in furn:
            if state["y"] < 70:
                fresh()
                heading("Furniture and appliance schedule (continued)")
            q, p = int(_num(f.get("qty"), 0, 999)), _num(f.get("price"))
            doc.text(M + 8, state["y"], _s(f.get("name"), 44), 9, False, INK)
            doc.text(M + 250, state["y"], _s(f.get("cat"), 14), 9, False, MUTE)
            doc.text(M + 340, state["y"], str(q), 9, False, INK)
            doc.text(M + 400, state["y"], _money(p), 9, False, INK)
            sub = _money(q * p)
            doc.text(PW - M - 8 - text_width(sub, 9), state["y"], sub, 9, True, INK)
            doc.line(M, state["y"] - 6, PW - M, state["y"] - 6, LINE, 0.4)
            state["y"] -= 17
    state["y"] -= 10
    if state["y"] < 250:
        fresh()
    heading("Cost allocation")
    items = [("Base structure and layout", costs.get("base")), ("Boundary and fencing", costs.get("boundary")), ("Furniture and appliances", costs.get("furniture")),
             ("Wall finish", costs.get("walls")), ("Flooring", costs.get("floor")), ("Roof", costs.get("roof")), ("Coastal view balcony", costs.get("balcony"))]
    vals = [_num(v) for _, v in items]
    top = max(sum(vals), 1)
    for (label, _), v in zip(items, vals):
        doc.text(M, state["y"], label, 9.5, False, INK)
        doc.rect(M + 190, state["y"] - 2, 200, 9, fill=SOFT)
        doc.rect(M + 190, state["y"] - 2, max(0.5, 200 * v / top), 9, fill=EM)
        doc.text(M + 398, state["y"], f"{v / top * 100:.0f}%", 8.5, False, MUTE)
        m = _money(v)
        doc.text(PW - M - 8 - text_width(m, 9.5), state["y"], m, 9.5, True, INK)
        state["y"] -= 19
    doc.line(M, state["y"] + 6, PW - M, state["y"] + 6, INK, 0.8)
    t = _money(total)
    doc.text(M, state["y"] - 10, "Estimated total", 11, True, INK)
    doc.text(PW - M - 8 - text_width(t, 13, True), state["y"] - 11, t, 13, True, GREEN)
    state["y"] -= 40
    if state["y"] < 90:
        fresh()
    for line in ("This report was generated from your 3D builder choices. Prices are indicative and exclude land, permits, taxes and professional fees.",
                 "Always have your plan checked by a licensed architect and structural engineer before construction."):
        doc.text(M, state["y"], line, 8, False, MUTE)
        state["y"] -= 12
    return doc.output()