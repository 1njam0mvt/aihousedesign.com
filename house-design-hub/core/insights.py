"""Original data derived from the house design library (used by /house-design-statistics and llms-full.txt).

Everything here is computed from the real catalog, so the numbers always match the site. Costs are the planner's
rough estimates (built area x a per-square-foot rate for the style), not market quotes."""
from functools import lru_cache
from statistics import median

from . import catalog
from .planner import STYLES


def _lakh(v):
    return v / 100000.0


@lru_cache(maxsize=1)
def compute():
    designs = catalog.DESIGNS
    rows = []
    for d in designs:
        m = catalog.meta(d)
        rows.append(dict(style=d["style"], beds=d["beds"], floors=d["floors"], plot=(d["w"], d["d"]), facing=d["facing"],
                         area=float(m["built_area"]), cost=float(m["cost"])))
    n = len(rows)

    def block(items):
        a = [r["area"] for r in items]
        c = [r["cost"] for r in items]
        return dict(count=len(items), area=sum(a) / len(a), cost=_lakh(sum(c) / len(c)),
                    psf=sum(c) / sum(a), median_cost=_lakh(median(c)), median_area=median(a))

    styles = []
    for s in sorted({r["style"] for r in rows}):
        items = [r for r in rows if r["style"] == s]
        b = block(items)
        b.update(key=s, label=catalog._label(s), rate=STYLES[s]["rate"])
        styles.append(b)
    styles.sort(key=lambda x: -x["count"])
    beds = [dict(block([r for r in rows if r["beds"] == k]), key=k) for k in sorted({r["beds"] for r in rows})]
    floors = [dict(block([r for r in rows if r["floors"] == k]), key=k) for k in sorted({r["floors"] for r in rows})]
    plots = {}
    for r in rows:
        plots.setdefault(r["plot"], []).append(r)
    plot_rows = [dict(block(v), key=f"{k[0]} x {k[1]} ft", sqft=k[0] * k[1]) for k, v in sorted(plots.items(), key=lambda kv: kv[0][0] * kv[0][1])]
    facing = {}
    for r in rows:
        facing[r["facing"]] = facing.get(r["facing"], 0) + 1
    overall = block(rows)
    cheapest = min(styles, key=lambda x: x["psf"])
    priciest = max(styles, key=lambda x: x["psf"])
    return dict(total=n, overall=overall, styles=styles, beds=beds, floors=floors, plots=plot_rows,
                facing=sorted(facing.items(), key=lambda kv: -kv[1]), cheapest=cheapest, priciest=priciest,
                min_cost=_lakh(min(r["cost"] for r in rows)), max_cost=_lakh(max(r["cost"] for r in rows)),
                n_styles=len(styles), n_plots=len(plot_rows))
