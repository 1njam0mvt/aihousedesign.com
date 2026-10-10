"""SEO content: landing pages, guides, homepage FAQs and JSON-LD helpers.

Every claim here describes what the app really does (plans in 2D, a rotatable 3D model, a 4D construction
timeline, rough INR cost estimates, free and no login). Do not add claims the app cannot back up
(photo-to-3D, code compliance, photorealistic renders): they hurt trust and can get a page flagged.
"""
import os

SITE_URL = os.getenv("SITE_URL", "https://aihousesdesign.com").rstrip("/")
PUBLISHED = "2026-10-10"

# ---------------------------------------------------------------- homepage FAQs (also FAQPage JSON-LD)
HOME_FAQS = [
    ("Can I design a house for free using AI?",
     "Yes. Describe your plot size, number of bedrooms, floors and style and the AI house designer draws a 2D floor plan, "
     "a 3D model and a rough cost estimate in seconds. It is free and there is no login or software to install."),
    ("What is the difference between house design and home design?",
     "The two terms are used interchangeably. House design usually means the structure: the floor layout, the shape of "
     "the building and the exterior elevation. Home design often also covers interiors such as furniture and decor."),
    ("How does an AI house plan generator work?",
     "You give it a few parameters such as plot size, bedrooms, floors, style and which way the house faces. It places and "
     "sizes the rooms to fit the plot, then shows the plan in 2D, a 3D model and a construction timeline. Optional short "
     "design tips are written by an AI model."),
    ("Can I use AI-generated house plans for real construction?",
     "Treat them as concepts and layout inspiration. For structural design, services drawings and the permit or sanction "
     "drawings your local authority requires, a licensed architect or civil engineer must review and approve the plan."),
    ("What is the best free software for creating house floor plans?",
     "For a quick concept, a web-based planner like this one is fastest because there is nothing to install. For detailed "
     "drawings, professionals use CAD and BIM tools such as AutoCAD, Revit or ArchiCAD, and free options include "
     "SketchUp Free, Sweet Home 3D and FreeCAD."),
]

# ---------------------------------------------------------------- /faq search-intent section (also in FAQPage JSON-LD)
# (question, answer, (link label, link path)).  Keep answers to 2-3 sentences: that is the length search engines quote.
FAQ_SEARCH = [
    ("Can I design a house for free using AI without logging in?",
     "Yes. AI Houses Design is a free AI house design generator that needs no account or login: enter your plot size, bedrooms, floors and style and it "
     "creates a 2D floor plan, a 3D model and a rough cost estimate in seconds. You can generate as many options as you like online, with nothing to install.",
     ("Try the free AI house design generator", "/free-ai-house-design/")),
    ("Can AI-generated house plans be used directly for building construction?",
     "Not directly. An AI house plan is a concept layout for planning and discussion, not a stamped construction drawing. Architects lead the layout and "
     "appearance, and civil or structural engineers design the structure and foundations, so a licensed professional must review the plan, add the "
     "electrical and plumbing drawings and prepare the documents your local authority needs before you build.",
     ("How to design a house with AI, step by step", "/guides/how-to-design-a-house-with-ai/")),
    ("What is passive house design, and how do you design a passive house?",
     "Passive house design is an approach to very high energy efficiency that keeps a home comfortable with minimal heating or cooling. To design one, follow "
     "five principles: airtight construction, continuous high-grade insulation, high-performance windows, thermal-bridge-free detailing and heat recovery "
     "ventilation. Orient the house and size the windows for your climate, and in hot regions focus on shading, cross-ventilation and insulation to keep heat out.",
     ("Passive house design plans and principles", "/passive-houses-design/")),
    ("What software and apps do professional architects use to design houses?",
     "Most architects use CAD and BIM software and apps such as AutoCAD, Revit and ArchiCAD for plans and construction drawings. They add SketchUp or Rhino "
     "for 3D models and tools like Lumion, Enscape or V-Ray for realistic visuals. AI house design tools are used early on, to explore layouts quickly before "
     "detailed drawings are made.",
     ("What software do architects use?", "/guides/software-architects-use/")),
    ("What are people who design houses called?",
     "People who design houses are called architects. Interior designers plan the interiors and finishes, and civil or structural engineers make sure the "
     "building is safe and stable. In many countries a licensed architect or engineer must sign off the drawings before a house can be built.",
     ("Who designs houses, and which software they use", "/guides/software-architects-use/")),
    ("How do you design a low-cost single-floor village house?",
     "Keep the footprint a simple rectangle so beams, walls and roof stay short and cheap, and build on one floor to avoid stairs and heavy columns. Use locally "
     "available materials, choose load-bearing brick masonry where it suits the plot, and place windows on opposite walls for cross-ventilation. Add a front "
     "verandah and keep corridors minimal so most of your carpet area is usable room space.",
     ("Indian village house design plans", "/indian-village-house-design/")),
    ("How do you design small or tiny houses to maximize space?",
     "Use a simple compact footprint, combine living, dining and kitchen into one open space and avoid long corridors. Build up with a second floor or loft "
     "instead of out, and add built-in storage and furniture that does double duty. Large windows placed opposite each other bring in daylight and "
     "cross-ventilation so small rooms feel bigger.",
     ("Small houses design for small plots", "/small-houses-design/")),
    ("What is the difference between house design and home design?",
     "The terms are used interchangeably, but house design usually means the building itself: its floor layout, structure and exterior elevation. Home design "
     "often goes further to include interiors such as furniture, colours and decor. A 3D house design focuses on the shape and layout of the building, which is "
     "what you see in the 3D models on this site.",
     ("House front elevation and 3D exterior design", "/elevation-design/")),
]

# ---------------------------------------------------------------- landing pages (one search intent per URL)
# cta = parameters for a pre-filled AI designer link; topic = existing /topic/<slug> collection shown as samples
LANDING = {
    "free-ai-house-design": dict(
        nav="Free AI House Design",
        title="Free AI House Design Generator: 2D Plans and 3D, No Login",
        desc="Free AI house design generator. Enter plot size, bedrooms and style to get a 2D floor plan, 3D model and cost estimate instantly. No login, no software.",
        h1="Free AI House Design Generator",
        lead="Describe the house you want and get a floor plan, a 3D model and a rough cost in seconds. It is free to use, works in your browser and needs no account.",
        cta=dict(style="modern", beds=3, floors=2, w=30, d=40, facing="E"), cta_label="Generate a house design free",
        topic="house-design-plan",
        sections=[
            ("How to design a house for free with AI", [
                "Open the AI house designer and type what you need in plain words, for example: 3 bedroom modern house 30x40 two floors. "
                "The designer reads the numbers and style words, fills anything you left out with sensible defaults and draws a plan that fits your plot."]),
            ("What you get from one prompt", [], [
                "A 2D floor plan with room names and sizes for every floor",
                "A 3D model you can rotate, zoom and view with the roof cut away",
                "A 4D view with a day and night switch and a construction timeline from foundation to finishing",
                "A rough cost estimate in lakh, based on built-up area and style",
                "A plan you can download as an SVG file"]),
            ("Free, with no login", [
                "There is no sign up, no watermark and nothing to install. Your theme and language choices stay in your own browser. "
                "You can generate as many options as you like and compare them side by side in the gallery."]),
            ("Is an AI house design ready to build?", [
                "No. An AI plan is a starting point for the conversation with your architect. Before construction, the structure, local bylaws, "
                "setbacks and costs must be checked by a licensed architect or engineer."]),
        ],
        faqs=[
            ("How can I design a house for free using AI without a login?",
             "Open the AI house designer, enter your plot dimensions, number of bedrooms, floors and preferred style, and it generates a 2D floor plan, "
             "a 3D model and a cost estimate straight away. There is no account to create and no software to install."),
            ("Can AI design a complete house plan ready for construction?",
             "AI can produce a functional floor plan layout and a 3D visualisation, which is useful for planning. For structural stability, foundation design, "
             "electrical and plumbing drawings and municipal approval, the draft must be reviewed and certified by a licensed architect or civil engineer."),
            ("Which AI is best for house design?",
             "It depends on the job. General chat assistants can brainstorm ideas, but a dedicated house design tool gives you a scaled floor plan with room sizes, "
             "a 3D model and a cost estimate from the same inputs. Try a few and compare the plans."),
        ],
        related=["floor-plan-creator", "elevation-design", "guides/prompts-for-ai-house-design", "guides/how-to-design-a-house-with-ai"],
    ),
    "floor-plan-creator": dict(
        nav="Floor Plan Creator",
        title="Free Floor Plan Creator Online: 2D House Plans with Room Sizes",
        desc="Create a 2D house floor plan online for free. Enter your plot size and rooms, see dimensions for every room, then view it in 3D and download the plan.",
        h1="Free Online Floor Plan Creator",
        lead="Turn a plot size and a room list into a clear 2D floor plan with dimensions, then check it in 3D before you talk to an architect.",
        cta=dict(style="modern", beds=3, floors=1, w=30, d=40, facing="N"), cta_label="Create a floor plan",
        topic="house-design-plan",
        sections=[
            ("Make a house floor plan in three steps", [], [
                "Enter the plot width and depth in feet, for example 30x40",
                "Choose bedrooms (1 to 6), floors (1 to 3), style and the direction the house faces",
                "Review the plan, then rotate the 3D model and download the plan as SVG"]),
            ("Plans that show real room sizes", [
                "Each room on the plan is labelled with its size, so you can judge whether a bedroom, kitchen or living room feels right for your family. "
                "Plans include living, kitchen, dining, bedrooms, bathrooms, verandah or porch, pooja room, stairs and storage where they fit."]),
            ("Optimise carpet area", [
                "A compact rectangular footprint with short corridors wastes less space and keeps construction cost lower. Try different bedroom counts and "
                "floors on the same plot and compare the built-up area and cost estimate of each option."]),
            ("From concept to approved drawing", [
                "Use the plan to decide the layout you like, then share it with a licensed architect or civil engineer who will prepare the structural and "
                "permit drawings your local authority needs."]),
        ],
        faqs=[
            ("What is the best free software for creating house floor plans?",
             "For beginners, a web-based planner or AI layout creator is the quickest because there is nothing to install. Professionals use CAD and BIM tools "
             "such as AutoCAD, Revit and ArchiCAD, and free desktop options include Sweet Home 3D and FreeCAD."),
            ("How do I make a house floor plan online?",
             "Enter your plot size, bedrooms, floors and style in the designer. It lays out the rooms to fit the plot and shows the 2D plan with room sizes, "
             "which you can also view in 3D and download as an SVG file."),
        ],
        related=["free-ai-house-design", "small-houses-design", "indian-village-house-design", "guides/how-to-design-a-house-with-ai"],
    ),
    "modern-houses-design": dict(
        nav="Modern Houses Design",
        title="Modern Houses Design: Ideas, Floor Plans and 3D Models",
        desc="Browse modern, contemporary and minimalist houses design ideas with 2D floor plans, 3D models and cost estimates. Open any design or generate your own.",
        h1="Modern Houses Design Ideas",
        lead="Clean lines, flat or shed roofs, big windows and open living areas. Browse modern, contemporary and minimalist homes, each with a plan, a 3D model and a rough cost.",
        cta=dict(style="modern", beds=3, floors=2, w=30, d=40, facing="E"), cta_label="Design a modern house",
        topic="modern-house-design",
        sections=[
            ("What defines a modern house design", [], [
                "Simple geometric shapes and clean lines with little ornament",
                "Flat or single-slope (shed) roofs",
                "Large windows and glass for daylight",
                "Open, connected living, dining and kitchen areas",
                "A restrained palette of white, grey and one warm accent colour"]),
            ("Modern, contemporary and minimalist: what is the difference?", [
                "Modern houses follow the clean geometry of 20th century modernism. Contemporary houses are more fluid and borrow from current trends, often with angled or shed roofs. "
                "Minimalist houses go furthest in removing detail and keeping only what is needed."]),
            ("Modern design for Indian plots", [
                "Modern layouts work well on common plot sizes such as 30x40 and 40x60 feet. Shade for windows, cross ventilation and a covered car parking area "
                "keep a modern home comfortable in a warm climate."]),
        ],
        faqs=[("What is the most popular modern house design?",
               "Two-storey modern homes with a flat roof, a balcony above the entrance and large front windows are very common. Single-floor minimalist designs are popular on smaller plots."),
              ("Can I customise a modern house plan?",
               "Yes. Open the AI designer, keep the modern style and change the plot size, bedrooms, floors or the direction the house faces to get a new plan.")],
        related=["small-houses-design", "elevation-design", "passive-houses-design", "free-ai-house-design"],
    ),
    "elevation-design": dict(
        nav="Front Elevation Design",
        title="House Front Elevation Design: Exterior Views and 3D Models",
        desc="Explore house front elevation and exterior design ideas. Rotate a 3D model of every home, change day and night view and see roofs, verandahs and balconies.",
        h1="House Front Elevation and Exterior Design",
        lead="The front elevation is the face of your home. Rotate a 3D model of any design, switch between day and night and compare roofs, balconies and verandahs.",
        cta=dict(style="contemporary", beds=3, floors=2, w=30, d=40, facing="E"), cta_label="View a 3D exterior",
        topic="3d-house-design",
        sections=[
            ("How to design the front elevation of a house", [], [
                "Pick the roof shape first: flat, sloped (gable) or single slope (shed)",
                "Decide on a balcony, verandah or porch, which gives the front depth and shade",
                "Balance solid wall and windows so the facade does not look flat",
                "Choose two wall colours and one accent for the door or trim",
                "Check how it looks in daylight and at night"]),
            ("See the exterior in 3D", [
                "Every design opens a 3D model that you can rotate and zoom. Hide the roof to see inside, and use the day and night switch to see how the house looks at different times."]),
            ("A note on realism", [
                "The 3D view is a clear, simplified model for understanding shape and proportion. It is not a photorealistic render. A licensed architect can prepare detailed elevation drawings for construction."]),
        ],
        faqs=[("How do I design the front elevation of my house?",
               "Start with the roof type and the entrance feature (balcony, verandah or porch), then balance walls and windows and choose a simple colour scheme. Rotate the 3D model of a design to test each choice."),
              ("Can I see a house in 3D before building?",
               "Yes. Every design has a 3D model you can rotate and zoom, with a roof cutaway and a day and night view.")],
        related=["modern-houses-design", "free-ai-house-design", "indian-village-house-design", "guides/how-to-design-a-house-with-ai"],
    ),
    "small-houses-design": dict(
        nav="Small Houses Design",
        title="Small Houses Design: Compact Home Plans for Small Plots",
        desc="Small houses design ideas: compact, low cost and loft home plans for small plots, with 2D floor plans, 3D models and cost estimates you can compare.",
        h1="Small Houses Design for Small Plots",
        lead="A small house can feel generous when every square foot is planned. Browse compact, loft and low cost homes with plans, 3D models and cost estimates.",
        cta=dict(style="compact", beds=2, floors=2, w=20, d=30, facing="E"), cta_label="Design a small house",
        topic="small-house-design",
        sections=[
            ("Tips for designing a small house", [], [
                "Use a simple rectangular footprint and avoid long corridors",
                "Combine living and dining into one open space",
                "Go up with a second floor or a loft instead of out",
                "Add built-in storage and a store room",
                "Place windows opposite each other for cross ventilation"]),
            ("How small can a house be?", [
                "Many families live comfortably in 2 bedroom homes of about 600 to 900 sq ft built-up area. Try a few plot sizes in the designer and compare the layouts and costs."]),
            ("Low cost does not mean low quality", [
                "Compact plans reduce structural spans, wall length and roof area, which lowers cost. Use the cost estimate to compare options before you commit."]),
        ],
        faqs=[("How do I design a small house?",
               "Keep the footprint simple, merge living and dining, build up rather than out, and plan storage early. Enter a small plot size in the designer to see layouts that fit.")],
        related=["indian-village-house-design", "floor-plan-creator", "modern-houses-design", "free-ai-house-design"],
    ),
    "passive-houses-design": dict(
        nav="Passive Houses Design",
        title="Passive House Design: Energy Efficient Home Plans and Principles",
        desc="What passive house design is, how to design one, and energy efficient home plans to explore in 2D and 3D. Learn the five principles and browse eco designs.",
        h1="Passive House Design",
        lead="Passive house design is about comfort with very little heating or cooling. Learn the principles and browse energy efficient home plans.",
        cta=dict(style="passive", beds=3, floors=1, w=35, d=45, facing="S"), cta_label="Design an eco house",
        topic="passive-house-design",
        sections=[
            ("The five principles of passive house design", [], [
                "Airtight construction to stop uncontrolled air leaks",
                "Continuous, high-grade thermal insulation",
                "High-performance windows, often triple glazed in cold climates",
                "Thermal-bridge-free detailing",
                "Heat recovery ventilation (HRV) for fresh air without wasting energy"]),
            ("Passive ideas for warm climates", [
                "In hot regions the same thinking applies in reverse: shade windows, use roof overhangs, orient the house to catch breezes, add cross ventilation and use insulation and reflective roofs to keep heat out."]),
            ("Browse eco house plans", [
                "The designs below use compact shapes and shaded openings. The passive style also shows solar panels on the roof in the 3D view."]),
        ],
        faqs=[("What is passive house design and how do you design one?",
               "Passive house design is an approach focused on extreme energy efficiency and thermal comfort with minimal heating or cooling. It rests on five principles: airtight construction, "
               "continuous insulation, high-performance windows, thermal-bridge-free detailing and heat recovery ventilation."),
              ("Is a passive house expensive to build?",
               "Insulation, windows and ventilation can raise upfront cost, but lower energy bills often repay it over time. Costs depend on climate and location, so get a local estimate.")],
        related=["modern-houses-design", "small-houses-design", "free-ai-house-design", "guides/how-to-design-a-house-with-ai"],
    ),
    "indian-village-house-design": dict(
        nav="Indian Village House Design",
        title="Indian Village House Design: Low Cost Single Floor Plans",
        desc="Indian village house design ideas: low cost single floor plans with verandah, store room and pooja space, shown in 2D and 3D with cost estimates in lakh.",
        h1="Indian Village House Design",
        lead="Simple, airy and affordable village homes with a verandah, store room and pooja space, planned for Indian plots and priced in lakh.",
        cta=dict(style="village", beds=2, floors=1, w=25, d=40, facing="E"), cta_label="Design a village house",
        topic="village-house-design",
        sections=[
            ("What makes a good village house design", [], [
                "A single floor that is easy and cheap to build and extend later",
                "A front verandah for shade, rain protection and daily life",
                "Cross ventilation with windows on opposite walls",
                "A store room and a separate pooja space",
                "Locally available materials and a sloped roof where rain is heavy"]),
            ("Cost-effective planning", [
                "A standard rectangular footprint reduces beam spans and wall length. Load-bearing brick masonry and local materials cut cost. "
                "A 2D plan helps you use carpet area well without wasting space on corridors."]),
            ("Regional styles", [
                "Assam type houses use sloped roofs and a raised verandah suited to a humid, rainy climate. Browse Assam type, village and low cost designs and open any plan in 3D."]),
        ],
        faqs=[("What is the most cost-effective way to design a single-floor village house in India?",
               "Use a simple rectangular footprint to reduce structural spans, choose load-bearing brick masonry and locally sourced materials, and plan cross-ventilation windows. "
               "A 2D floor planner helps you make the most of carpet area."),
              ("How much does a low cost village house cost?",
               "Cost varies by area, materials and location. Each design on this site shows a rough estimate in lakh, which is a good starting point before you ask a local engineer for a quote.")],
        related=["small-houses-design", "floor-plan-creator", "free-ai-house-design", "elevation-design"],
    ),
}

# ---------------------------------------------------------------- guides (long-tail informational queries)
GUIDES = {
    "how-to-design-a-house-with-ai": dict(
        nav="How to design a house with AI",
        title="How to Design a House with AI: A Step-by-Step Guide",
        desc="Learn how to design a house with AI step by step: choose a plot, set rooms and style, read the plan, check it in 3D and prepare it for an architect.",
        h1="How to Design a House with AI",
        lead="AI can turn a short description into a floor plan and 3D model in seconds. This guide shows how to get a useful result and what to do with it next.",
        cta=dict(style="modern", beds=3, floors=2, w=30, d=40, facing="E"), cta_label="Try the AI house designer",
        sections=[
            ("Step 1: Know your plot", [
                "Measure the plot width and depth in feet and note which direction the front faces. These numbers decide almost everything else."]),
            ("Step 2: List what you need", [
                "Write down bedrooms, floors, and must-have spaces such as a verandah, pooja room, study or car parking. Be honest about budget, because floors and area drive cost."]),
            ("Step 3: Describe it to the AI", [
                "Type a short description such as 2 bedroom village house 25x40 single floor. Name a style from the list (modern, village, duplex, villa and others) for a better match."]),
            ("Step 4: Read the 2D plan", [
                "Check room sizes, the entrance, how rooms connect and where the stairs are. Look for long corridors and awkward corners."]),
            ("Step 5: Explore it in 3D", [
                "Rotate the 3D model to understand proportions, then use the roof cutaway and the day and night view."]),
            ("Step 6: Compare options and cost", [
                "Generate a few variations, change one thing at a time and compare built-up area and the rough cost estimate."]),
            ("Step 7: Take it to a professional", [
                "Share your favourite plan with a licensed architect or civil engineer. They will check the structure, services and local rules and prepare drawings for approval."]),
        ],
        faqs=[("Can AI design a house plan?",
               "Yes. AI tools can produce a floor plan layout and a 3D model from a few inputs. The result is a concept that a licensed professional should review before building."),
              ("How do I use AI to design a house?",
               "Enter your plot size, bedrooms, floors and style in an AI house designer, review the plan and 3D model, adjust the inputs and compare options.")],
        related=["guides/prompts-for-ai-house-design", "free-ai-house-design", "floor-plan-creator", "guides/software-architects-use"],
    ),
    "prompts-for-ai-house-design": dict(
        nav="Prompts for AI house design",
        title="AI House Design Prompts: Examples That Work",
        desc="Copy AI house design prompts that work: examples for modern, village, duplex and villa homes, plus a simple formula to write your own.",
        h1="AI House Design Prompts That Work",
        lead="A good prompt names the size, the rooms and the style. Here is a simple formula and ready-to-use examples.",
        cta=dict(style="duplex", beds=4, floors=2, w=30, d=50, facing="E"), cta_label="Try a prompt now",
        sections=[
            ("A simple prompt formula", [
                "Bedrooms + style + plot size + floors + facing. For example: 3 bedroom modern house 30x40 two floors east facing."]),
            ("Example prompts to copy", [], [
                "2 bedroom village house 25x40 single floor",
                "3 bedroom modern house 30x40 two floors",
                "4 bedroom duplex house 30x50 east facing",
                "luxury villa 40x60 two floors",
                "low cost 2 bhk house 20x30",
                "passive eco house 35x45 single floor south facing",
                "compact 2 bedroom house with loft 20x30"]),
            ("Tips for better results", [], [
                "Use feet for plot size, written as width x depth",
                "Name one style at a time, then try another and compare",
                "Change one detail per attempt so you can see what it does",
                "Ask for fewer floors if the plot is small",
                "You can write in any of the supported languages"]),
            ("Prompts for general AI assistants", [
                "General chat assistants can help with ideas such as room lists, vastu or ventilation tips and material choices. Ask them to describe the layout in words, "
                "then enter the plot size and rooms in a house design tool to get an actual scaled plan."]),
        ],
        faqs=[("What is a good AI house design prompt?",
               "A good prompt includes the number of bedrooms, the style, the plot size and the number of floors, for example: 3 bedroom modern house 30x40 two floors."),
              ("Do I need a special prompt format?",
               "No. Plain sentences work. The designer picks out the numbers and style words and fills in anything missing with sensible defaults.")],
        related=["guides/how-to-design-a-house-with-ai", "free-ai-house-design", "modern-houses-design", "indian-village-house-design"],
    ),
    "software-architects-use": dict(
        nav="Software architects use",
        title="What Software Do Architects Use to Design Houses?",
        desc="What software architects use to design houses: AutoCAD, Revit, ArchiCAD, SketchUp and more, and where AI house design tools fit into the workflow.",
        h1="What Software Do Architects Use to Design Houses?",
        lead="Architects mix drafting, 3D modelling and visualisation tools. Here is what each one is used for and where AI planners fit.",
        cta=dict(style="modern", beds=3, floors=2, w=30, d=40, facing="E"), cta_label="Draft a concept with AI",
        sections=[
            ("Drafting and BIM software", [], [
                "AutoCAD: 2D drafting and detailed construction drawings",
                "Revit: building information modelling (BIM) with plans, sections and schedules from one model",
                "ArchiCAD: BIM software popular for residential projects"]),
            ("3D modelling and visualisation", [], [
                "SketchUp: quick, easy 3D massing and concept models",
                "Rhino with Grasshopper: complex shapes and parametric design",
                "Lumion, Enscape and V-Ray: realistic renders and walkthroughs"]),
            ("Where AI house design tools fit", [
                "AI planners are used early, to explore layouts and options quickly before detailed drawings are made. They do not replace the structural, services and permit work that an architect and engineer carry out."]),
            ("Who designs houses?", [
                "Houses are mainly designed by architects. Interior designers plan interiors, and civil or structural engineers check that the structure is safe. In many places, a licensed professional must sign off the drawings."]),
        ],
        faqs=[("What software do architects use to design houses?",
               "Most use CAD and BIM software such as AutoCAD, Revit and ArchiCAD, together with SketchUp or Rhino for 3D models and tools like Lumion or Enscape for visualisation."),
              ("Do civil engineers design houses?",
               "Civil and structural engineers design the structure and check safety, while architects lead the layout and appearance. In many regions both work together on a house."),
              ("What are people who design houses called?",
               "They are called architects. Interior designers handle interior layouts and finishes, and structural engineers verify the structure.")],
        related=["guides/how-to-design-a-house-with-ai", "free-ai-house-design", "floor-plan-creator", "elevation-design"],
    ),
}

ALL_PAGES = {}
for _k, _v in LANDING.items():
    ALL_PAGES[_k] = dict(_v, path=f"/{_k}/", kind="landing")
for _k, _v in GUIDES.items():
    ALL_PAGES["guides/" + _k] = dict(_v, path=f"/guides/{_k}/", kind="guide")


def url(path):
    return SITE_URL + path


# ---------------------------------------------------------------- JSON-LD builders
def breadcrumb(items):
    return {"@context": "https://schema.org", "@type": "BreadcrumbList",
            "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, "item": url(p)}
                                for i, (n, p) in enumerate(items)]}


def faq_ld(faqs):
    return {"@context": "https://schema.org", "@type": "FAQPage",
            "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faqs]}


def site_ld(name):
    return {"@context": "https://schema.org", "@graph": [
        {"@type": "WebSite", "@id": url("/#website"), "url": url("/"), "name": name, "inLanguage": "en",
         "potentialAction": {"@type": "SearchAction",
                             "target": {"@type": "EntryPoint", "urlTemplate": url("/gallery") + "?q={search_term_string}"},
                             "query-input": "required name=search_term_string"}},
        {"@type": "Organization", "@id": url("/#org"), "name": name, "url": url("/"),
         "logo": url("/static/img/icon-512.png")},
    ]}


def webapp_ld(name):
    return {"@context": "https://schema.org", "@type": "WebApplication", "name": name + " AI House Designer",
            "url": url("/designer"), "applicationCategory": "DesignApplication", "operatingSystem": "Any (web browser)",
            "browserRequirements": "Requires JavaScript",
            "description": "Free AI house designer that generates 2D floor plans, 3D models and a rough cost estimate from plot size, bedrooms, floors and style.",
            "offers": {"@type": "Offer", "price": "0", "priceCurrency": "INR"}}


def article_ld(page, name):
    return {"@context": "https://schema.org", "@type": "Article", "headline": page["h1"], "description": page["desc"],
            "mainEntityOfPage": url(page["path"]), "datePublished": PUBLISHED, "dateModified": PUBLISHED,
            "author": {"@type": "Organization", "name": name, "url": url("/")},
            "publisher": {"@type": "Organization", "name": name, "logo": {"@type": "ImageObject", "url": url("/static/img/icon-512.png")}},
            "image": url("/static/img/og-default.png")}


def itemlist_ld(designs):
    return {"@context": "https://schema.org", "@type": "ItemList",
            "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": url(f"/design/{d['id']}"), "name": d["name"]}
                                for i, d in enumerate(designs)]}