# Handoff: Orbit Directory (Guadeloupe v12)

## Overview
A directory of rivers, waterfalls and canyons in Guadeloupe, run by two canyoning guides (Pascal, Yalodé; Quentin, Wild Canyon). Templates:
- **Directory listing** (`/`)
- **Destination page** (`/destinations/[slug]`)
- **Blog article** (`/blog/[slug]`, theme pages such as "Canyoning avec enfants")
- **Blog index** (`/blog`)
- **Filter landing page** (`/cascades`, `/rivieres`, `/canyons`, `/communes/[slug]`), only for types and communes with 3+ places
- **Guide page** (`/guides/pascal`, `/guides/quentin`)
- **Privacy page** (`/confidentialite`)

The same system will be reused for other directories (Mangrove, Orbit Directory template).

## Target stack
- **Astro**, static output (`output: 'static'`). Every page above is pre-rendered.
- **Content:** Airtable, read at build time only (Airtable API in Astro content loaders or `getStaticPaths`). No runtime calls to Airtable, no API key in the client. Until the base is rebuilt, use `data/*.json` as fixtures with the same shape.
- **Hosting:** Cloudflare Pages. Rebuild on content change with a deploy hook.
- **Interactive islands only where needed:** filters sheet, gallery lightbox, video lightbox, tooltips, mobile sticky CTA, lead magnet form. Everything else is static HTML.
- **Lead magnet submission:** a Cloudflare Pages Function (or the e-mail provider's form endpoint). Store consent (timestamp, wording version).
- The earlier Next.js / Supabase recommendation is withdrawn.

## About the design files
The HTML files at the project root are **design references built in HTML**, not production code. Recreate them in Astro using the tokens and components documented here.

**Use v12 only:** `design/Guadeloupe v12 Details.dc.html`. It imports `design/Guide Offer Card.dc.html` and needs `design/support.js` and `design/image-slot.js` beside it. Serve `design/` over HTTP (`npx serve design`) to view it. All templates are switched by internal state (`view: list | detail | seo | blog | filter | guide | privacy`).

Preview props (Tweaks panel): `startView` (open any template), `previewSite`, `accessPolicyPreview` (render Accès as public / commune_only / guide_only / closed), `showEmptyFields` (dashed placeholder where `signature` is empty; design-only, never ship it).

**Superseded:** everything in `../_archive/` (v2–v11, `design_handoff_directory_v10/`, the Orbit Directory Playbook, old specs and CSVs).

## Fidelity and precedence
The HTML prototype is the **reference for structure, content, behaviour and colour roles**. It predates the type system and the naming review: its pixel sizes, weights, line heights, spacing and component names are **not** the standard. Where it disagrees with `tokens/*.css` or `docs/*.md`, the documents win. Precedence list: `CLAUDE.md` §3 (repo root). Migration map from prototype values to tokens: `docs/TYPOGRAPHY.md` §6.

## Contents
| Path | What |
|---|---|
| `docs/ARCHITECTURE.md` | **Start here.** Atomic hierarchy (L0–L7), naming conventions, where new things go, change process |
| `docs/COMPONENTS.md` | Component registry: canonical names, levels, composition, props, mobile behaviour |
| `docs/DESIGN_SYSTEM.md` | Foundations summary, component behaviour and content rules, page templates A–G, Accès-by-policy table, SEO rules |
| `tokens/tokens.css` | CSS custom properties for every token, each with its role and when to use it |
| `docs/TYPOGRAPHY.md` | **Typography reference**: families, 10 text styles, usage, UX reasons, forbidden variations, migration map, open options |
| `tokens/text-styles.css` | One class per text role, plus global focus ring, reduced-motion rule and keyframes |
| `docs/REVIEW_2026-10-06.md` | Cross-document review: contradictions fixed, naming review, open decisions J-N1…J-N3 |
| `docs/AUDIT_2026-10-06.md` | Why the system looks like this: findings, open decisions J1–J8, build backlog |
| `data/destinations.json` | 21 destinations, **one object each** (all enrichment merged), plus `SOCIAL` |
| `data/operators-and-tours.json` | 2 operators, 7 tours, tour meta, real reviews |
| `data/blog-articles.json` | 7 blog articles and their blocks (filter rules as text) |
| `data/taxonomies.json` | Types, access meta, risks, gear/tag emoji, levels, location policies, computed filter pages |
| `data/ui-copy.json` | Static template copy |
| `docs/CONTENT_MODEL.md` | Entity shapes and field → component mapping |
| `docs/CHANGELOG.md` | Design decisions log, each rule tagged Core / Directory / Places / Site |

`data/rendered/` (v10 resolved view-models) is not carried over: it no longer matches v12. Check computed strings against the v12 reference instead.

## Interactions and behaviour (summary)
- **Navigation:** cards open a destination; intent links open blog articles; footer links open filter pages and guide pages; breadcrumbs go back.
- **Tooltips:** hero "!" badge, fact cells and access tiles; hover on desktop, tap on mobile.
- **Gallery / Social:** Lightbox with arrows, swipe, Esc, source link per photo; YouTube embedded; "Ouvrir dans l'app" on mobile only.
- **StickyBooking:** mobile only, when a tour exists; hides on scroll-down.
- **Header and menu:** SiteHeader on every page; on mobile an icon-only menu button opens the MenuSheet; ≥1024 inline nav.
- **Filters (listing):** one-line FilterToolbar (search + "Filtres"); FiltersSheet holds every filter (Afficher, Île, sort, spirit, operator, duration, commune, approach, rappel, reliability; toggles kids, pets, "Avec cascade"). Applies live. Inline controls only ≥1024.
- **Contact:** "Écrire à {guide}" and "Demander conseil" open WhatsApp (wa.me, pre-filled). No lead form.
- **Booking:** every "Réserver" opens the operator's booking page in a new tab.
- **Lead magnet:** e-mail first, explicit consent checkbox, link to the privacy page; phone optional in step 2.
- **No live conditions** anywhere.
- **Responsive:** mobile-first; `min-width` queries at 480px and 1024px only; layout never decided in JavaScript.
- **Motion:** `riseIn`, `sheetUp`, `fadeIn` and `--dur-*` tokens; `prefers-reduced-motion` respected.

## Placeholders to replace before launch
`[WHATSAPP_PASCAL]`, `[WHATSAPP_QUENTIN]`, `[BOOKING_URL_YALODE]`, `[BOOKING_URL_WILDCANYON]`, Yalodé logo, `[PRIVACY_POLICY_TEXT]` (text to be generated later, see `docs/PRIVACY_CONTEXT.md`), `signature` per destination (10 drafts written on 2026-10-06 in the design, to validate with the guides; 11 still empty).

## Assets
- `design/assets/pascal-head.png`, `design/assets/quentin-head.png` (guide portraits).
- All other photos are remote URLs in `data/destinations.json`, each with a credit. Licences and credits are documented in each image's `credit` and `url` fields; download the files into the Astro project (never hotlink) and keep the credit shown.
- Fonts: Instrument Serif (400, 400 italic), Source Serif 4 (400, 600), Archivo (400, 600): from Google Fonts (SIL OFL), 6 WOFF2 files, self-hosted. Roles and rules: `docs/TYPOGRAPHY.md`.

## Suggested first prompts for Claude Code
1. "Read `CLAUDE.md`, then `docs/ARCHITECTURE.md`, `tokens/tokens.css`, `docs/TYPOGRAPHY.md` and `docs/COMPONENTS.md`. Run phase 0 (check the handoff) and report; no code."
2. "Phase 3: scaffold the monorepo and implement the tokens, text styles, self-hosted fonts, all atoms and molecules from COMPONENTS.md, a style-guide page at 360/480/1024, and the automated token checks."
3. "Model `data/*.json` as Astro content collections with typed schemas (see `docs/CONTENT_MODEL.md`). Write an Airtable loader with the same output shape, used at build time only."
4. "Build the PlaceTemplate with `cascade_aux_ecrevisses` (public), `riviere_lezarde` (commune_only), `canyon_ferry` (guide_only) and `saut_d_acomat_site` (closed) as fixtures."
5. "Build ListingTemplate, ArticleTemplate, CollectionTemplate (filter pages and blog index), ProfileTemplate and DocumentTemplate."
