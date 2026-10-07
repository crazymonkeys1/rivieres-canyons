# Orbit Directories — Claude Code context (becomes `CLAUDE.md` in the build repo)

> Read this whole file at the start of every session. Then read the documents in §3 as needed. If a rule here conflicts with another document, this file wins (except §3's precedence list for design values). Report conflicts to Jordan.

## 1. Who you work with
Jordan (Orbit founder) is non-technical. He directs, you build.
- Explain every step in plain language. Give exact copy-paste commands when he must run something.
- Work **one phase at a time** (§12). At the end of each phase: summarise what changed, show how to check it, and **stop for his OK**.
- Ask before any irreversible action (deleting data, pushing to production, buying or changing a domain).
- **Small design gaps: use the nearest, then say so** (decision B3, 2026-10-07). If a design value or a component variant is missing, use the nearest existing token, text style or component, and list it under **"Proposed additions"** at the end of your reply (name, role, value, why).
- **Stop and ask Jordan** (2–3 options with your recommendation) for anything about content or facts, copy claims, legal or privacy, prices and money, renames of existing names, and deviations from this file.

## 2. Mission
Orbit builds lead magnets that create value first and sell second: *"Devenez indispensable avant même d'avoir à vendre."*
This project is the first one: a **directory of rivers, waterfalls and canyons in Guadeloupe**. The directory itself is the lead magnet. The only thing we sell is a guided outing with one of our two clients (Pascal at Yalodé, Quentin at Wild Canyon), and it always comes after the value.
This build is also the **reference template** for future directories (Mangrove, template). Build it state of the art, but keep it simple: no abstraction for directories that don't exist yet.

## 3. Sources of truth and precedence
**Repo layout (as imported):**
```
CLAUDE.md          this file
docs/              ARCHITECTURE, COMPONENTS, DESIGN_SYSTEM, TYPOGRAPHY, CONTENT_MODEL, PRIVACY_CONTEXT, CHANGELOG, AUDIT, REVIEW, README (handoff overview)
tokens/            tokens.css, text-styles.css  (source of truth for values; implement in packages/core)
data/              *.json content fixtures
design/            visual reference only: Guadeloupe v12 Details.dc.html, Guide Offer Card.dc.html, support.js, image-slot.js, assets/ (guide portraits)
```
The build itself lives in `packages/` and `apps/` (§5).

**Precedence (highest first):**
1. **This file.**
2. **`tokens/tokens.css` and `tokens/text-styles.css`**: all design values.
3. **`docs/ARCHITECTURE.md`, `TYPOGRAPHY.md`, `COMPONENTS.md`, `DESIGN_SYSTEM.md`**: structure, naming, components, behaviour, page templates, SEO.
4. **`docs/CONTENT_MODEL.md`, `docs/PRIVACY_CONTEXT.md` and `data/*.json`**: entities and content (keep text, photo references and credits verbatim).
5. **`design/Guadeloupe v12 Details.dc.html` + `Guide Offer Card.dc.html`**: visual and behavioural reference. **Not authoritative for type scale, weights, line heights, spacing, colour names or component names**: it predates the system (migration map: `docs/TYPOGRAPHY.md` §6). Do not copy its inline pixel values. Never ship the `.dc.html` files. To view it, serve `design/` over HTTP (`npx serve design`).
6. `docs/CHANGELOG.md`, `AUDIT_2026-10-06.md`, `REVIEW_2026-10-06.md`: history and rationale.

Read order for a new session: this file → `docs/ARCHITECTURE.md` → `tokens/tokens.css` → `docs/TYPOGRAPHY.md` → `docs/COMPONENTS.md` → `docs/DESIGN_SYSTEM.md` (page templates and behaviour) → `docs/CONTENT_MODEL.md`. Open the prototype only to see a visual or an interaction.

## 4. Stack (decided, do not change)
- **Astro**, static output (SSG). JavaScript only in interactive islands (filters sheet, menu sheet, gallery/lightbox, tooltips, the forms; native `<details>` for disclosures).
- **pnpm monorepo** (workspaces).
- **Content:** read at build time through one data layer. A fixtures adapter (JSON) comes first; the Airtable adapter comes later. Pages never call Airtable directly.
- **Validation:** every entity has a Zod schema. Invalid content fails the build with a clear message.
- **Hosting:** Cloudflare Pages. Edge functions only for `/go/*` redirects and the lead endpoint. Temporary storage in Cloudflare D1.
- **Images:** downloaded at build time, optimised by Astro, served from our own storage. Never hotlink.
- **Fonts:** all three families come from Google Fonts (SIL Open Font License: free for commercial use, self-hosting allowed). Self-host: download the WOFF2 files from Google Fonts or use the `@fontsource` packages (`instrument-serif`, `source-serif-4`, `archivo`; check current package names), Latin subset, `font-display: swap`, keep each font's OFL notice in the repo. Never load fonts from the Google CDN at runtime (privacy and performance).
- **Analytics:** Cloudflare Web Analytics (cookieless).
- No Next.js, no Supabase, no client-side rendering of content, no CMS in this repo. The CMS and the CRM are separate future projects.

## 5. Architecture: layers (folders) × atomic levels
**Four layers (folder = layer):**
```
packages/core/         any lead magnet: tokens, text styles, atoms/molecules, SEO/JSON-LD helpers, sitemap, llms.txt, lead client + consent, /go/ tracking, analytics
packages/directory/    any directory: listing + filter engine, templates, filter landing pages, intent articles, trust layer, FAQ engine, internal linking
packages/places/       directories of PLACES: location policy, access status, safety/risks, key facts, nearby, offers attached to a place
apps/rivieres-canyons/ this site: config, theme overrides, vocabularies, copy, content mapping, pages
```
To place something, ask: *"Would this still make sense if we listed cars?"* Yes → `directory` (or `core` if not even directory-specific). Only for places → `places`. Only for Guadeloupe → the app. Never import from an app into a package. Packages never contain Guadeloupe words or data.

**Seven atomic levels (bottom-up, strict):** L0 primitives → L1 tokens → L2 text styles → L3 atoms → L4 molecules → L5 organisms → L6 templates → L7 pages. A level only imports from levels below. Pages contain no styling; templates contain layout only. Full rules, folder placement and the "new thing" decision tree: `ARCHITECTURE.md` §1–2.

## 6. Design system: how to use it (hard rules)
1. **Values come from tokens.** Never write a raw hex, px size outside the scale, shadow, duration or z-index in a component. Use `var(--…)` from `tokens.css`. Components use L1 semantic tokens only, never `--c-*` primitives.
2. **Text comes from the 10 text styles + 2 modifiers** (`text-display text-heading text-title text-quote text-pull text-read text-subheading text-body text-caption text-label`, `is-strong`, `is-upper`). Components never set `font-family`, `font-size`, `font-weight`, `line-height` or `letter-spacing`.
3. **Fonts and weights:** Instrument Serif 400 + 400 italic (identity), Source Serif 4 400 + 600 (prose), Archivo 400 + 600 (UI). Weights 400 and 600 only. No other family, weight, italic, or uppercase (uppercase = overline only).
4. **Colour roles:** content text `--color-text-body`, headings and values `--color-text-strong`, meta only `--color-text-muted`. `--color-action-accent` is decoration (underline, bullet, quote rule), never text and never a fill behind text. Filled CTAs use `--color-action-primary`. Danger palette is for safety only, at most one danger surface per viewport.
5. **Floors:** nothing below 12px, prose ≥18px on mobile, inputs 16px, touch targets ≥44px (`--tap-size-min`).
6. **Mobile-first:** write CSS for ~360px; add only `@media (min-width: 480px)` and `(min-width: 1024px)` (`--breakpoint-sm`, `--breakpoint-lg`). No `max-width` queries. **No layout decisions in JavaScript** (the prototype's `isWide` flag is a prototype shortcut; replace it with CSS). Prefer `auto-fit`/`minmax`/`flex-wrap`/`clamp()`.
7. **Accessibility:** interactive things are `<button>` or `<a>` (no `div role="button"`), a global two-tone `:focus-visible` ring (in `text-styles.css`), `prefers-reduced-motion` honoured, one H1 per page, H2 with `id`, tooltips also open on tap and focus, icons are decorative (`aria-hidden`) and followed by text. Icon style (decision B2, 2026-10-07): each site chooses SVG line icons or emoji in `site.config.ts` (`icon_style`); no boilerplate default. Rivières & Canyons: emoji.
8. **Search before creating.** Look in `tokens.css` and `COMPONENTS.md` and follow `ARCHITECTURE.md` §2. Reuse with props, then compose, and only then create. A missing value: use the nearest and list a "Proposed addition" (§1). A component you do create is registered in `COMPONENTS.md` and logged in `docs/CHANGELOG.md` in the same change. A new text style is almost never right: use the nearest.
9. **Naming (role, not appearance):** components PascalCase `{Subject}{Role}` (`DestinationCard`, `FactList`); variants are props (`variant="primary"`), never separate components (`ButtonGhost` is wrong); no banned appearance words (Pill, Chip, Tile, Strip, Bar, Band, Box, Glass, Dark…). Variables `--{category}-{role}[-{variant}]`. Test: *does the name stay true if the colour, size or layout changes?* Full convention: `ARCHITECTURE.md` §3.
10. **Component names are the ones in `docs/COMPONENTS.md`.** Legacy names in older documents are mapped there. Variable naming (decision B1, 2026-10-07): colours `--color-{group}-{role}`, fonts `--font-family-*` / `--font-weight-*` / `--font-size-*`, widths `--container-*`, shapes `--radius-*`, shadows `--elevation-*`, motion `--duration-*`; text styles `text-{role}`. Old → new table in `docs/CHANGELOG.md`.
11. **Definition of done for a component:** (a) listed in `COMPONENTS.md` with level, composition, props, text styles, mobile layout; (b) uses tokens and text styles only; (c) works at 360px first, then 480 and 1024; (d) keyboard and screen-reader pass; (e) takes data through props/slots, reads no source directly; (f) logged in `docs/CHANGELOG.md`.
12. **Automated checks (build them in phase 3, run on every change):** fail on raw hex outside `tokens.css`, `font-weight` other than 400/600 (tokens), font sizes outside the token scale, text under 12px, `outline: none` without replacement, `max-width` media queries, `--palette-*` used in components, and any `[...]` placeholder in a production build.
13. **Restyling must not rename.** A redesign edits L0/L1/L2 values (and re-points semantic tokens); components, props and file names do not change.

## 7. Open decisions (use the stated default; do not change it without Jordan)
| ID | Question | Default in the docs | Where |
|---|---|---|---|
| J1 | Fact lists on phones: 2 columns / scroll / stack | 2 columns <480px | AUDIT §5 |
| J2 | Filters on mobile | One-line search + "Filtres" button (built) | AUDIT §5 |
| J3–J8 | signature location, article gutter, listing H1, "en sécurité" CTA copy, Yalodé teal | see AUDIT §5 (J5 icons: resolved by B2) | AUDIT §5 |
| B1–B4 | Boilerplate decisions (naming, icons, way of working, order of work) | **Applied 2026-10-07** | `docs/BOILERPLATE_AUDIT_2026-10-07.md` §7 |
| J-T1…J-T8 | families (3), UI scale (12/14/16/18), weights (400/600), tour price size, quote sizes, heading ink, uppercase, tabular numerals | recommended options are already in the tokens | TYPOGRAPHY §7 |
| J-N1 | Role-based component names | applied in `COMPONENTS.md` (reversible) | REVIEW §4 |
| J-N2 | Variable renames | **Superseded by B1 (2026-10-07):** grouped naming shared with Mangroves | CHANGELOG |
| J-N3 | One changelog | **Resolved:** `docs/CHANGELOG.md` only | REVIEW §4 |

## 8. Data rules
- **Entities:** `destinations` (places: a generic listing + place fields; status `draft` / `published` / `hidden` / `rejected`), `types` and `localities` (records with landing-page text), `criteria` (yes/no attributes as rows), `offers` (guided outings, each linked to exactly ONE destination, with an `is_main` flag), `operators`, `guides`, `reviews`, `articles` (intent pages with a selection: types, localities, criteria with/without, a named rule, include/exclude), `images` (one record per photo, with rights), `sources` (typed; featured = press), `copy` (site texts and lists by key).
- **Airtable** (decisions D1–D6, 2026-10-07; `docs/AIRTABLE_BASE_DESIGN.md`): one base per site, French column names read by field ID, generated from code (`pnpm airtable:export` → `airtable/SPEC.md` + CSVs + round-trip check). Yes/no criteria are rows editors add; measured facts are columns the technical owner adds in `site.config.ts`. For now only Orbit edits, in the base (2026-10-07); the clients' interface "Mon espace" comes when they start editing (`docs/AIRTABLE_INTERFACES.md`).
- **Generic fields vs site facts:** what every directory has lives in the packages; what is specific to this site (difficulty, approach, swimming, waterfall…) is declared once in `apps/rivieres-canyons/src/content/site.config.ts` and stored under `facts`. Filters, key facts, completeness and Airtable columns follow that declaration. Vocabularies, location labels, landing-page dimensions and confidence levels are there too.
- **Three publication gates:** `status` (published / hidden), `confidence` (site levels; a level can hide a listing), completeness (indexed or `noindex`).
- **Images:** rights `free` / `partner` / `permission_needed`; a production build fails on `permission_needed`.
- Field names are `snake_case` English (future database columns). `slug` is unique and permanent; URLs come from it.
- Numbers are numbers (`duration_min: 210`, not "3 h 30"). Vocabularies are enums. Relations are IDs, not text.
- FR fields now. Structure is ready for `_en` later.
- **Never invent facts.** Unknown = empty field. Empty fields and empty sections are hidden (except Safety and FAQ, which follow the design rules).
- `signature` = optional one-sentence "Ce qui la rend unique", used only as card subtitle and SEO snippet source. The 10 values in `destinations.json` are **drafts** written from existing page data; add `signature_status` (`draft` | `validated`) and fail a production build while any is `draft`. `has_waterfall` = boolean or null.
- `location_policy` on every destination:
  - `public` = itinerary, parking, map link.
  - `commune_only` = commune + "renseignez-vous", no itinerary.
  - `guide_only` = no coordinates, no itinerary (every canyon).
  - `closed` = no directions at all, closure alert.
  The build fails if a `guide_only` or `closed` destination carries coordinates or an itinerary.
- **Reviews:** only real reviews with a source. Anything marked draft/"brouillon" is never rendered.
- **No live data**: no weather, no "doable today", no conditions status.
- **Completeness score** per destination = filled key fields / total key fields. Below the threshold (app config, start at 60%), the page gets `noindex` and is left out of the sitemap.

## 9. Conversion and leads
- **Booking:** every "Réserver" goes through `/go/book/{offer}`, which logs the click, then redirects to the operator's booking URL with UTM parameters.
- **Contact a guide:** "Écrire à {guide}" goes through `/go/whatsapp/{guide}?ref={page}`, which logs the click, then opens `wa.me/{number}` with a pre-filled message: "Bonjour {guide}, je vous écris depuis {site} au sujet de {sortie ou lieu}."
- **Empty state "Demander conseil":** both guides, each through the WhatsApp link.
- **"Top 5" lead magnet (`LeadCapture`):** email first, phone optional, explicit consent checkbox (unticked) plus a privacy page link. Protected by Cloudflare Turnstile. Posts to `/api/lead` in the fixed lead format: `site, source, magnet, page, email, phone?, consent, consent_text, utm, created_at`. For now stored in D1. Later, `LEAD_ENDPOINT` forwards to the Orbit CRM (config change only).
- **Privacy policy:** the text is not written yet and will be generated later. Build the page and the consent link now, from `docs/PRIVACY_CONTEXT.md` (processing facts, open items, build rules). Do not write legal text yourself.
- **Placeholders** such as `[WHATSAPP_PASCAL]` and `[BOOKING_URL_YALODE]` are allowed in development. **A production build fails if any `[...]` placeholder remains.**

## 10. SEO and LLM rules
- One H1 per page. H2 per section with an `id`. Semantic HTML (`<dl>` for facts, `<details>` for FAQ and disclosures, `<nav>` for breadcrumbs).
- JSON-LD: destination = TouristAttraction + FAQPage + BreadcrumbList (+ Product/Offer when an offer exists); article = Article + ItemList + FAQPage + BreadcrumbList; guide page = Person; site = Organization + WebSite.
- Per page: title, meta description, canonical, Open Graph. Sitemap (indexable pages only). `robots.txt` **explicitly allows** GPTBot, ClaudeBot, PerplexityBot and Google-Extended. On Cloudflare, also disable "Block AI bots" for the domain.
- `llms.txt` + `llms-full.txt`. A Markdown twin of every indexable page (`/{path}.md`).
- **Filter landing pages:** only for types and communes with 3+ published places. Other filter combinations are client-side only and never indexed.
- URL structure: French at the root, `/en/` reserved for English later.
- Performance budget (mobile): LCP < 2.5 s, CLS < 0.1, JS < 50 KB on content pages. Accessibility: WCAG AA.

## 11. Copy rules
Calm, factual, specific. **Safety claims only where a guide is involved** (decision 2026-10-07): "en sécurité" / "en toute sécurité" may describe a guided outing or a guide (offers, guide bios, guided CTAs); never a place, an article, the listing or the disclaimer. `pnpm content:check` fails on them elsewhere. Never copy sources verbatim. Always show photo credits and social account names. Every page keeps the safety disclaimer (`LegalNotice`).

## 12. Changelog
Log every reusable decision in `docs/CHANGELOG.md`: date, layer (Core / Directory / Places / Site), the change, why, how to apply elsewhere, and status per site (Rivières & Canyons / Mangrove / Template).

## 13. Build plan (one phase at a time, stop after each)
0. **Check the handoff.** Compare `design/` with this file and the docs. Report what is missing or contradictory. No code.
1. **Content audit + schema.** Done 2026-10-07; **1b** (generic listing + site config + images and sources) done 2026-10-07. Zod schemas; map every fixture; `docs/CONTENT_REPORT.md` (completeness per destination, missing fields, placeholders, `signature` drafts, and a check that every image has a `credit` and source `url` in the data files: image licences are already documented there, so only report gaps).
2. **Airtable base.** Done 2026-10-07: base `appQss9sjY59pUxtM` built and filled by the GitHub job "Airtable" (verified identical). **Airtable is now the content source**: edits are pulled with the job `pull-content` (`content:pull`), never from `data/`. Helper fields added by hand. Remaining: one `pull-content` run to prove the way back. Interfaces deferred (only Orbit edits for now).
3. **Scaffold + design system implementation.** Monorepo, the four packages, `tokens.css` and `text-styles.css` as shipped, self-hosted fonts, all **atoms and molecules** from `COMPONENTS.md` with a living style guide page rendering tokens, text styles and every component state at 360 / 480 / 1024, the automated checks from §6.12.
4. **Organisms and templates, in order:** destination page (fixtures: Saut d'Acomat, Cascade aux Écrevisses, Canyon doré) → listing + filters → intent article → filter landing page → guide page → blog index → static pages (about, legal notice, privacy, contact).
5. **SEO/LLM layer** and the completeness `noindex` rule.
6. **Conversion:** `/go/` redirects, WhatsApp links, lead form + D1 + Turnstile, analytics.
7. **Deploy:** Cloudflare Pages preview URL. An Airtable automation calls the deploy hook on publish.
8. **QA before going public:** Lighthouse mobile, Rich Results test, link check, a11y check, placeholder check, AI-bot access check, a read-through on a real phone. Then connect the domain.

## 14. Session start checklist
1. Read this file. 2. Check `docs/CHANGELOG.md` for entries newer than your last session, and `docs/OPEN_LOOPS.md` for loops to close or open. 3. State the current phase and what you will do. 4. Before creating anything new, search `tokens.css` and `COMPONENTS.md`. 5. End by listing what changed, how Jordan can check it, and any judgment call you stopped on. Add new loops (things to validate, get or do) to `docs/OPEN_LOOPS.md`.
