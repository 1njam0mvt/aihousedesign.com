#!/usr/bin/env python3
"""Turn your photos / renders into site-ready .webp files.

    pip install pillow
    python tools/make_images.py ~/Downloads/my-photos gallery
    python tools/make_images.py ~/Downloads/my-photos designs

What it does for every .jpg/.jpeg/.png/.webp in the folder:
  - crops to 4:3 from the centre (the shape of the site's cards, so nothing stretches)
  - resizes to 800x600 (use --size 1200x900 for sharper images)
  - saves as .webp, lowering quality until the file is under 60 KB (--max-kb to change)
  - names it from the source file: "Modern House.JPG" -> modern-house.webp
and writes it to static/img/<gallery|designs>/.

NAMING (the file name decides where the picture appears):
  gallery/<style>.webp          hero collage + "Styles" showcase. style = modern, village, assam, duplex, villa,
                                minimalist, contemporary, traditional, passive, loft, farmhouse, bungalow,
                                lowcost, compact or mansion
  designs/<id>.webp             one specific design card, e.g. 15.webp
  designs/<style>-<N>bhk.webp   every card of that style and bedroom count, e.g. modern-3bhk.webp
Anything without a matching image keeps its drawn illustration, so you can add images a few at a time.
"""
import argparse
import io
import os
import re
import sys

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Pillow is missing. Run:  pip install pillow")

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "static", "img")
EXT = (".jpg", ".jpeg", ".png", ".webp")


def slug(name):
    return re.sub(r"[^a-z0-9]+", "-", os.path.splitext(name)[0].lower()).strip("-")


def encode(img, max_bytes):
    for q in range(86, 34, -4):
        buf = io.BytesIO()
        img.save(buf, "WEBP", quality=q, method=6)
        if buf.tell() <= max_bytes:
            return buf.getvalue(), q
    return buf.getvalue(), q  # best effort


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("source", help="folder with your original images")
    ap.add_argument("kind", choices=("gallery", "designs"), help="where the images go")
    ap.add_argument("--size", default="800x600", help="output size, 4:3 (default 800x600)")
    ap.add_argument("--max-kb", type=int, default=60, help="target maximum file size in KB (default 60)")
    a = ap.parse_args()
    w, h = (int(x) for x in a.size.lower().split("x"))
    if abs(w / h - 4 / 3) > 0.01:
        print("note: the site's cards are 4:3, other shapes will be cropped by the browser")
    out = os.path.normpath(os.path.join(ROOT, a.kind))
    os.makedirs(out, exist_ok=True)
    files = [f for f in sorted(os.listdir(a.source)) if f.lower().endswith(EXT)]
    if not files:
        sys.exit("No .jpg/.png/.webp images found in " + a.source)
    for f in files:
        img = ImageOps.exif_transpose(Image.open(os.path.join(a.source, f))).convert("RGB")
        if img.width < w * 0.9:
            print(f"  ! {f}: only {img.width}px wide, it will look soft at {w}px")
        img = ImageOps.fit(img, (w, h), Image.LANCZOS, centering=(0.5, 0.5))
        data, q = encode(img, a.max_kb * 1024)
        name = slug(f) + ".webp"
        with open(os.path.join(out, name), "wb") as fh:
            fh.write(data)
        flag = "" if len(data) <= a.max_kb * 1024 else "  (over target, try --size 640x480)"
        print(f"  {name:32} {len(data) / 1024:5.1f} KB  quality {q}{flag}")
    print(f"Done: {len(files)} image(s) in {out}\nRestart not needed; the site notices new files within a minute.")


if __name__ == "__main__":
    main()