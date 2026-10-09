"""SEO topic collections built from the keyword research list."""

TOPICS = [
    dict(slug="village-house-design", title="Village House Design", filt=dict(styles={"village", "assam", "lowcost"}),
         keywords="village house design, normal village house design, indian normal village house design, house design photo in village, village simple single floor house design",
         blurb="Simple, airy and affordable village homes with verandahs, store rooms and pooja space, planned for Indian plots."),
    dict(slug="low-cost-village-house-design", title="Low Cost Village House Design", filt=dict(styles={"lowcost", "village"}, max_cost=1200000),
         keywords="low cost village house design, low cost simple village house design picture, budget house design",
         blurb="Budget-friendly layouts that keep construction cost down without losing ventilation or storage."),
    dict(slug="single-floor-house-design", title="Single Floor House Design", filt=dict(floors=1),
         keywords="single floor house design, simple single floor house design, modern single floor house design",
         blurb="Ground-floor-only plans: easy to build, easy to extend, and friendly for every age."),
    dict(slug="assam-type-house-design", title="Assam Type House Design", filt=dict(styles={"assam"}),
         keywords="assam type house design, northeast house design, assam type house plan",
         blurb="Assam-type homes with sloped roofs, verandahs and well ventilated rooms suited to a humid, rainy climate."),
    dict(slug="duplex-house-design", title="Duplex House Design", filt=dict(styles={"duplex"}),
         keywords="duplex house design, double floor house design, two storey house plan",
         blurb="Two-storey duplex plans that fit more rooms onto a small plot."),
    dict(slug="modern-house-design", title="Modern House Design", filt=dict(styles={"modern", "contemporary", "minimalist"}),
         keywords="modern house design, modern minimalist house design, contemporary house design",
         blurb="Clean lines, flat or shed roofs and open living areas."),
    dict(slug="small-house-design", title="Small House Design", filt=dict(styles={"compact", "loft", "lowcost", "minimalist"}, max_area=1100),
         keywords="small house design, simple house design, modern loft house design for small spaces",
         blurb="Compact homes that use every square foot well."),
    dict(slug="minimalist-house-design", title="Minimalist House Design", filt=dict(styles={"minimalist"}),
         keywords="minimalist house design, modern minimalist house design features",
         blurb="Calm, uncluttered homes with simple geometry."),
    dict(slug="passive-house-design", title="Passive House Design", filt=dict(styles={"passive"}),
         keywords="passive house design, eco house design, energy efficient house design",
         blurb="Energy-efficient homes that stay comfortable with less cooling and lighting."),
    dict(slug="3d-house-design", title="3D House Design", filt=dict(),
         keywords="3d house design, 3d house plan, 3d home design, 4d house design",
         blurb="Every design here can be rotated in 3D and played as a 4D construction and day-night timeline."),
    dict(slug="house-design-plan", title="House Design Plans", filt=dict(),
         keywords="house design plan, house design ideas, dream house design, house design photo",
         blurb="Browse thousands of 2D floor plans with room sizes and cost estimates."),
]

BY_SLUG = {t["slug"]: t for t in TOPICS}


def predicate(topic):
    f = topic["filt"]
    styles = f.get("styles")
    floors = f.get("floors")

    def ok(d):
        if styles and d["style"] not in styles:
            return False
        if floors and d["floors"] != floors:
            return False
        return True
    return ok
