# AI House Design: SEO, AEO, GEO, LLMO and E-E-A-T playbook

What is already built into the code, what each keyword points to, and what only you can do outside the code.
No tool can promise a ranking. Rankings and AI citations come from useful pages, trust, links and time. This work makes the site easy to find, understand and cite.

## 1. What the code now does

| Layer | What was added |
|---|---|
| SEO (technical) | Titles under about 60 characters in the form `AI House Design | ...`, descriptions under 160, one H1 per page, canonical tags, `max-snippet` allowed, sitemap with the new pages, internal links in the footer, breadcrumbs |
| AEO (direct answers) | Every landing page and guide opens with a one-paragraph answer. FAQ blocks with matching FAQPage schema on home, designer, builder and every landing page. HowTo schema on the 3D builder. Questions taken from Google's "People also ask" |
| GEO (be cited) | `/house-design-statistics`: original data computed from all 7,968 designs, with a "Cite this page" line and Dataset schema. Visible "Updated" dates and `dateModified` in schema |
| LLMO (be understood) | `/llms.txt` and `/llms-full.txt`, one consistent name (AI House Design), Organization and WebSite schema with `sameAs` support, AI search crawlers explicitly allowed in `robots.txt` |
| E-E-A-T | `/methodology` explains how plans and costs are made and their limits, honest "concepts, not approval drawings" notes, privacy policy covering the builder check-in, correction route through the contact page |

## 2. Keyword map (from your Google screenshots)

| Keyword people search | Page that targets it |
|---|---|
| ai house design free, free ai house design | `/free-ai-house-design/` and the home page |
| ai house design online, aihouse design online free | home page, `/designer` |
| 3d house design ai free, ai house 3d design, ai 3d house plan generator free, generate 3d house plans with ai | `/3d-house-design-ai/` |
| ai home exterior design free | `/ai-home-exterior-design/` |
| ai house design generator, best ai house design generator | `/free-ai-house-design/`, `/guides/free-ai-house-design-generator-checklist/` |
| ai house maker free, ai house maker, ai house creator | `/ai-house-maker/`, `/builder` |
| how much does ai house design cost, is ai home design free | `/guides/how-much-does-ai-house-design-cost/`, home FAQ |
| how can I make a 3D picture of my house | `/guides/how-to-make-a-3d-picture-of-your-house/` |
| what is an ai home | home FAQ "What is an AI home design generator?" |

Not targeted on purpose: "ai house photo editor" (the site does not edit photos), and queries for the other company called AiHouse (3D interior design software), "aihouse india", "aihouse download" and "gemini ai house design". Ranking for those would attract the wrong visitors and risk a trademark problem.

## 3. Do these yourself (cannot be done in code)

1. **Search Console**: submit `https://aihousesdesign.com/sitemap.xml`, then use URL Inspection > Request indexing for the 9 new URLs (`/3d-house-design-ai/`, `/ai-home-exterior-design/`, `/ai-house-maker/`, `/house-design-statistics`, `/methodology`, and the 4 new guides).
2. **Bing Webmaster Tools**: submit the sitemap too. Bing data also feeds several AI assistants.
3. **Set these environment variables** so the site shows who is behind it (they appear in schema only when set):
   - `AUTHOR_NAME`, `AUTHOR_URL`, `AUTHOR_BIO`: your real name, profile link and a short true bio
   - `SOCIAL_LINKS`: comma-separated profile URLs (LinkedIn, GitHub, YouTube, Medium)
   - `SITE_UPDATED`: change to today's date only when you really update content
   - `SECRET_KEY`: any long random string (also keeps the builder PDF unlock working across restarts)
4. **Keep the entity identical everywhere**: same name "AI House Design", same logo, same one-line description on LinkedIn, GitHub, Medium, YouTube and any directory.
5. **Earn backlinks**: submit to AI tool directories and architecture or home-design directories, answer real questions on Quora and Reddit and link only where it truly helps, publish a guest post with your statistics page as the source.
6. **Publish monthly** (about 1 guide a month): ideas, each tied to a keyword: "30x40 house plan ideas", "2 BHK vs 3 BHK cost", "Vastu-friendly floor plans", "How to choose a house facing direction", "Modern vs traditional house exterior", "How to read a floor plan", "Cost to build a house per sq ft in India", "Small house design for a 20x30 plot", "Duplex vs single floor", "Passive house design basics", "Sea-facing apartment design ideas", "House design checklist before hiring an architect".
7. **Measure monthly**: Search Console queries and clicks; ask Perplexity, ChatGPT search and Gemini the target questions and note whether the site is cited; PageSpeed Insights for the home page; Google Rich Results Test on `/builder`, `/free-ai-house-design/` and `/house-design-statistics`.
8. **Add real proof over time** (the biggest E-E-A-T gain): real user designs or case studies you have permission to show, your own process notes, reviews from an architect who agrees to be named, and an About page with who runs the site.

## 4. Things to check or decide

- The Guides section on the home page says "written by licensed architects and structural engineers". Keep that only if it is true. If not, change the sentence, because Google and AI systems check claims like this.
- The builder shows cost in US dollars while the rest of the site uses rupees. Pick one for consistency.
- The home page headline "Design your dream house" is brand copy, not a keyword. The opening paragraph and the new definition paragraphs carry the keywords instead.
