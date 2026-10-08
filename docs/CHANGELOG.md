# Directory Design Changelog

Reusable design rules for all Orbit directory sites. Apply each entry to every site and to the template.

> **Single changelog:** this file (`docs/CHANGELOG.md`). Add every entry here.
>
> **Naming changed on 2026-10-07 (decision B1):** grouped names (`--palette-*`, `--color-*`, `--font-size-*`, `text-*` classes…). Full old → new table in the entry "2026-10-07 · B1" below. Entries older than that keep the names they used when written.
>
> **Token and name renames since the early 2026-10-06 entries** (older entries keep the names they used when written):
> `--w-regular`/`--w-semibold` → `--fw-regular`/`--fw-semibold` · `--t-h1…--t-micro` → `--fs-h1…--fs-micro` (2026-10-06, J-N2) · `--text-display` → `--text-strong` (merged) · `--danger-title` → `--danger-text` (merged) · `--t-display-xl/l/m/s` → `--t-h1` (xl, l merged), `--t-h2`, `--t-title` · `--t-price`, `--t-price-l` → `--t-title` / `--t-h2` · `--t-quote-l` → `--t-pull` · `--t-signature` (removed) · `--t-caption`, `--t-label`, `--t-overline`, `--t-input` → `--t-small`, `--t-micro`, `--t-micro` + `is-upper`, `--t-body` · `--w-medium`, `--w-bold` (removed) · component legacy names → `docs/COMPONENTS.md`.


Status: ✅ applied · ⏳ to apply · — not relevant

Layer (which projects a rule applies to):
- **Core**: any Orbit lead magnet (type, tokens, consent, SEO basics, stack).
- **Directory**: any directory (cards, filters, guides/operators, booking, contact, blog).
- **Places**: directories of physical places (access, safety, location policy, place facts).
- **Site**: Guadeloupe only (local data, owner decisions).

## Baseline (from Guadeloupe v2, before 2026-09-29)

| # | Rule | Guadeloupe | Mangrove | Template |
|---|------|---|---|---|
| B1 | **[Directory]** Hero: short headline, one-line subhead, centered, no filter inside hero. Operator guide avatars behind a pill, visually balanced in weight. | ✅ | ⏳ | ⏳ |
| B2 | **[Core]** Home content split into full-bleed colour bands (white / cream / dark green) for separation. | ✅ | ⏳ | ⏳ |
| B3 | **[Core]** Founder story as a signed letter (serif italic) on a dark band, with tilted guide photos and signatures. | ✅ | ⏳ | ⏳ |
| B4 | **[Places]** Detail pages show all sections at once, with a sticky anchor bar instead of tabs. | ✅ | ⏳ | ⏳ |
| B5 | **[Directory]** Listing cards always open the detail page ("Plus d'infos"), never a form. | ✅ | ⏳ | ⏳ |
| B6 | **[Directory]** Items without real photos use type-matched stock photos, assigned deterministically, labelled "Photo d'illustration". | ✅ | ⏳ | ⏳ |
| B7 | **[Directory]** Type icon on each item badge. | ✅ | ⏳ | ⏳ |
| B8 | **[Directory]** Testimonials placed after the main "en détail" card on offer pages. | ✅ | ⏳ | ⏳ |
| B9 | **[Directory]** Footer SEO links (by type, island/area, commune, audience) on a cream full-bleed band. | ✅ | ⏳ | ⏳ |
| B10 | **[Core]** No absolute safety claims in copy. | ⏳ hero subhead still says "en toute sécurité" | ⏳ | ⏳ |

## Changes

### 2026-10-08 · Phase 6: conversion (/go/ redirects, lead form, analytics)
- **Layer:** Core (edge functions, LeadCapture, PageShell) · Site (targets, wording)
- **Change:**
  - **`@orbit/core/edge`**, the only server code, run as Cloudflare Pages Functions (`apps/rivieres-canyons/functions/`):
    - `/go/book/{outing or company}/`: logs the click, then redirects to the company's booking page with `utm_source`, `utm_medium=referral`, `utm_campaign` (the outing) and `utm_content` (the page the click came from). Placeholder booking URL → the company's website.
    - `/go/whatsapp/{guide}/?ref=…`: logs the click, then opens `wa.me` with « Bonjour {guide}, je vous écris depuis {site} au sujet de « {sortie ou lieu} ». » (the guide's outing on that place when there is one, else the place, else « d'une sortie »). Placeholder number → the company's contact page.
    - `/api/lead`: step 1 stores the lead in the fixed format (`site, source, magnet, page, email, consent, consent_text, consent_text_version, utm, created_at`) after the Turnstile check; step 2 adds the optional phone with a one-time token. Forwards to `LEAD_ENDPOINT` when it is set (the Orbit CRM later: a setting, no code).
    - Click logs keep kind, id, source page, UTM and time: no IP, no browser details (PRIVACY_CONTEXT §2).
  - The functions hold no site data: the site publishes `/go/targets.json` (where each id leads, message wording, accepted lead values), built from the content.
  - `consent_text_version` is a short fingerprint of the consent wording, so it changes exactly when the wording changes; the server refuses an unknown version.
  - **LeadCapture** steps 2 (optional phone, « Ajouter » / « Non merci ») and 3 (confirmation, `role="status"`), wording from the v12 design. Turnstile is loaded only when the visitor starts using the form.
  - Cloudflare Web Analytics beacon in PageShell, only when `PUBLIC_CF_BEACON_TOKEN` is set.
  - D1 schema in `migrations/0001_leads_and_clicks.sql`; `wrangler.toml` for the Pages project.
  - 404 page (`dist/404.html`): unknown addresses now answer « 404 », not the home page with « 200 ».
  - `pnpm edge:test` (21 tests, in GitHub "Checks") with a fake site and database; `seo:check:prod` also fails on placeholders in `go/targets.json`.
- **Why:** phase 6 of the build plan (CLAUDE.md §9, §13).
- **How to apply elsewhere:** a new site copies the two function files and builds its own `/go/targets.json` from its content; everything else is in `@orbit/core`.
- **Status:** Rivières & Canyons ✅ (live once phase 7 sets the database and keys) · Mangrove ⏳ · Template ✅

### 2026-10-08 · Name with its preposition (decision V13-A)
- **Layer:** Directory (field) · Site (headings)
- **Change:** listings get `name_with_preposition` (Airtable « Nom avec préposition », e.g. « au Canyon doré », « aux Chutes du Carbet »). Headings built on a name use it (« Comment aller au Canyon doré », « Accéder au Canyon Ferry avec un guide », « Aller au Canyon doré avec un guide », the access FAQ question); when empty, they fall back to a wording that is correct with any name (« Canyon doré : comment y aller »). New GitHub job `add-new-columns`: adds the columns the code declares but the base lacks, without touching any row.
- **Why:** « Comment aller à Canyon doré » is wrong French; the article depends on the name, so it is content, not code.
- **How to apply elsewhere:** any French directory fills the field; other languages can use it for their own contracted forms.
- **Status:** Rivières & Canyons ⏳ (column to add and fill) · Mangrove ⏳ · Template ✅

### 2026-10-08 · Phase 5: search engines and AI assistants
- **Layer:** Core · Directory · Places · Site
- **Change:**
  - **One page registry** (`src/content/pages.ts`): every public page has one entry with its title, description, canonical path, indexing, social image, JSON-LD, breadcrumb and Markdown twin. The site layout takes only the page's path and reads the rest from there; the sitemap, `robots.txt`, `llms.txt`, `llms-full.txt` and the `.md` twins are built from the same list. A page without an entry fails the build.
  - JSON-LD builders: `@orbit/core/seo` (BreadcrumbList, FAQPage, ItemList, Organization, WebSite, Person, Article, CollectionPage, Blog; robots, sitemap, llms.txt writers; a small Markdown writer), `@orbit/places/seo` (TouristAttraction: `publicAccess` true for public, false for closed, omitted otherwise; coordinates only for public places), `@orbit/directory/seo` (Product + Offer, no rating without a source and a count).
  - Completeness gate: a place below 60 % is `noindex`, out of the sitemap, `llms.txt` and the twins (11 of 22 today). One shared function for the build and `content:check`.
  - Every place gets the question "{lieu} : comment y aller ?", answered from its location policy (itinerary only for public places), on the page and in its FAQPage.
  - `robots.txt` allows everyone and names GPTBot, ClaudeBot, PerplexityBot and Google-Extended; `/go/`, `/api/` and the style guide are not crawled.
  - The domain comes from `SITE_URL`; until it is set, `pnpm seo:check:prod` fails.
  - `pnpm seo:check` (in GitHub "Checks"): one H1, title, description and canonical per page; every H2 has an id; JSON-LD parses; indexable pages are in the sitemap and have a twin, noindex pages have neither; robots names the AI crawlers.
  - Fix: the image library Sharp was missing; the build would have failed as soon as photos were downloaded.
- **Why:** phase 5 of the build plan (CLAUDE.md §10, §13).
- **How to apply elsewhere:** a new site writes its own `pages.ts` entries from its content; builders, endpoints and the check are reused as they are.
- **Status:** Rivières & Canyons ✅ · Mangrove ⏳ · Template ✅

### 2026-10-08 · Phase 4: organisms, templates and every page
- **Layer:** Core · Directory · Places · Site
- **Change:**
  - Pages: place (`/destinations/{slug}/`), listing with filters (`/`), intent articles (`/blog/{slug}/`), blog index, filter landing pages (`/cascades/`, `/canyons/`, `/rivieres/`, `/communes/{commune}/`: types and communes with 3+ published places), guide pages (`/guides/{slug}/`), about, contact, legal notice, privacy. 45 pages in all.
  - Templates: ArticleTemplate, CollectionTemplate, ProfileTemplate, DocumentTemplate (Core); ListingTemplate (Directory); PlaceTemplate (Places).
  - New components: Photo (atom), GuideSection, GuidePitch, ProfileHeader; the article organisms AnswerSummary, TableOfContents, TakeawayList, ArticleSection, ArticleEntry, RelatedCard.
  - Computed text, never hand-written facts: an article's selection (its saved filters and named rule), entry facts, FAQ and reading time; a filter page's intro, short answer and FAQ (counts, guided places, access). Wording is in the site texts (`copy.ts`, overridable in Airtable).
  - Articles never list a closed place (`location_policy: closed` or access status closed): no directions to a closed site.
  - Operator colours are decoration only (rings, rules), never text: some brand colours fail contrast as text.
  - Pages still to write go in as placeholders: privacy text `[PRIVACY_POLICY_TEXT]` and legal notice `[LEGAL_NOTICE_TEXT]`; both pages are `noindex` meanwhile and a production build fails on them.
- **Why:** phase 4 of the build plan (CLAUDE.md §13).
- **How to apply elsewhere:** a new directory reuses the templates and organisms as they are; it writes its own `site.config.ts`, site texts and the small content helpers (`article.ts`, `collection.ts`) for its own facts.
- **Status:** Rivières & Canyons ✅ · Mangrove ⏳ · Template ✅

### 2026-10-07 · Phase 3: design system in code (atoms, molecules, style guide, checks)
- **Layer:** Core
- **Change:**
  - Astro 7 static app; `packages/core/src/styles/` holds `tokens.css` and `text-styles.css` (moved from `tokens/`, which keeps links) plus `fonts.css` and `index.css`.
  - Fonts self-hosted from `@fontsource` (Latin subset, `font-display: swap`, 6 files); OFL licences in `packages/core/src/fonts/`. Nothing loads from Google.
  - 13 atoms and 13 molecules from `COMPONENTS.md` in `packages/core/src/components/`; no site words inside (labels are props).
  - Living style guide `/style-guide/` (tokens read from `tokens.css` at build time, every text style, every component state) shown at 360 · 480 · 1024 px. Development page, `noindex`.
  - `pnpm design:check` (CLAUDE.md §6.12): raw colours, `--palette-*` in components, typography properties in components, px outside tokens (1–4px borders and rings allowed; component sizes in local variables), raw durations, z-index and shadows, removed outlines, `max-width` and off-scale breakpoints, styling in pages, and with `--production` any `[PLACEHOLDER]` in the built pages. One declaration can opt out with `/* design-check-allow: reason */`.
  - GitHub workflow "Checks" runs design rules, content checks, the Airtable round trip and the build on every push.
  - Added `.visually-hidden` to the global rules of `text-styles.css` (labels for screen readers).
- **Why:** the system now exists as code that a check enforces, not only as documents.
- **How to apply elsewhere:** a new site imports `@orbit/core/styles/index.css`, adds its `theme.css` (tier-1 values), and uses the components as they are.
- **Status:** Rivières & Canyons ✅ · Mangrove ⏳ · Template ✅

### 2026-10-07 · Airtable base built by a GitHub job
- **Layer:** Core
- **Change:** `pnpm airtable:build` creates a new base in a workspace through the Airtable API (tables, typed fields, options, links), writes the content, reads it back and compares, and records the field IDs (`airtable/map.json`) and a report (`airtable/BUILD_REPORT.md`). It refuses to create a second base once `map.json` exists. It runs from GitHub Actions (workflow "Airtable", started by hand), because GitHub can reach Airtable and keeps the token as a secret; the same workflow pulls the content later (`pull-content`). Tested against a simulated Airtable API.
- **Fix (same day):** Airtable's API refuses the "one record only" option when creating a link field, so single links are created as normal links and the adapter enforces one record (clear error otherwise). New job `reset-and-refill-base` (`pnpm airtable:reset`, confirmation `RESET`): adds the fields a base lacks, empties its tables and writes the content again.
- **Why:** replaces about 30 minutes of manual CSV import and type conversion; the cloud environment cannot reach api.airtable.com.
- **How to apply elsewhere:** same workflow and command for every directory; only the token secret and the workspace ID change.
- **Status:** Rivières & Canyons ⏳ (to run) · Mangrove ⏳ · Template ✅

### 2026-10-07 · Airtable base: generated from code, criteria as rows, French columns read by ID (decisions D1–D6)
- **Layer:** Core (Airtable engine: field spec, CSV, round trip, API by field ID; site texts merged with page blocks) · Directory (types, localities and criteria entities; article selections; generic tables) · Places (places table, "Ce qui manque" formula) · Site (table names, `ARTICLE_RULES`, social posts table)
- **Change:**
  - **D1:** yes/no attributes are rows of a Critères table (filter, badge, key fact, landing page); measured facts stay columns declared in `site.config.ts`. `has_waterfall`, `has_rappel`, `pets_allowed` and the 18 outing tags became criteria.
  - **D2:** Types and Communes are tables with their landing-page text; listings link to communes by key.
  - **D3:** an article's selection = types, communes, criteria with / without, a named rule on facts (`ARTICLE_RULES`), include / exclude. Verified to pick exactly what the design picked.
  - **D4:** listing status `draft` / `published` / `hidden` / `rejected` (+ reason); the rejected-listings entity is gone.
  - **D5:** one base per site. **D6:** French column names; the site reads fields by ID (`airtable/map.json`), so renaming a column is harmless.
  - Roles (Business plan): Orbit technical owner = Creator; Orbit team = Editor; the clients (guides) = interface-only editors of their own outings, profile, company and photos. Field permissions protect slugs, keys, statuses and rights.
  - `pnpm airtable:export` writes `airtable/SPEC.md` and import-ready CSVs and checks the round trip; `airtable:link` and `content:pull` read the base at build time and refuse invalid content with the row and field named.
  - Also: outings and articles get a status; guide stories a validation status (from the old base's "Histoire validée"); reviews a guide, rating and date; articles a FAQ; press is a featured source; page blocks are site texts; checks moved to `src/content/check.ts`.
- **Why:** the two edits editors make most (a new listing, a new criterion) need no code and cannot break the site; one description of the base serves the spec, the import and the adapter, so they never drift; nothing ties the content to Airtable (keys, not record IDs).
- **How to apply elsewhere:** a new directory writes its `site.config.ts` and copies `src/content/airtable.ts` (table names, site extras), then runs `pnpm airtable:export`. Mangroves: its Activities, Protection and the four checkboxes become criteria; its tours move to Sorties; Hero Palettes, Islands' design columns, Operator Features / Practical and Reference Sources are dropped or merged (`docs/AIRTABLE_BASE_DESIGN.md` §1).
- **Status:** Rivières & Canyons ✅ (base to create) · Mangrove ⏳ · Template ✅

### 2026-10-07 · B1: grouped token and text-style names (aligned with Mangroves)
- **Layer:** Core
- **Change:** Every token and text-style class is renamed to grouped names: tier 1 `--palette-*`, then `--color-text-*`, `--color-surface-*`, `--color-border-*`, `--color-action-*`, `--color-status-*`, `--font-*`, `--container-*`, `--radius-*`, `--elevation-*`, `--duration-*`, `--easing-*`. Text styles become `text-*` classes; modifiers `is-strong` and `is-upper` are kept. Applied to `tokens/`, `CLAUDE.md` and the current docs. The operator tokens (`--op-*`, `--avatar-*`) and the palette entries teal, indigo and peach are removed (see "Operator colours from data").
- **Why:** One naming scheme across the canyon and mangrove sites, so the boilerplate has a single vocabulary. The values do not change.
- **How to apply elsewhere:** Use these names in every new site and component. Historical docs (this changelog's older entries, AUDIT, REVIEW, PHASE0, BOILERPLATE_AUDIT) keep the old names.
- **Status:** Rivières & Canyons ✅ · Mangrove ✅ (already uses this scheme) · Template ⏳

| Old token | New token |
|---|---|
| `--c-` | `--palette-` |
| `--text-strong` | `--color-text-strong` |
| `--text-body` | `--color-text-body` |
| `--text-muted` | `--color-text-muted` |
| `--text-faint` | `--color-text-faint` |
| `--text-on-dark-accent` | `--color-text-inverse-accent` |
| `--text-on-dark-3` | `--color-text-inverse-tertiary` |
| `--text-on-dark-2` | `--color-text-inverse-secondary` |
| `--text-on-dark` | `--color-text-inverse` |
| `--text-shadow-photo` | `--text-shadow-on-photo` |
| `--surface-page` | `--color-surface-page` |
| `--surface-card` | `--color-surface-card` |
| `--surface-subtle` | `--color-surface-inset` |
| `--surface-sunken` | `--color-surface-sunken` |
| `--surface-info` | `--color-surface-info` |
| `--surface-footer` | `--color-surface-footer` |
| `--surface-dark-2` | `--color-surface-inverse-strong` |
| `--surface-dark` | `--color-surface-inverse` |
| `--surface-glass` | `--color-surface-overlay` |
| `--surface-chip-on-photo` | `--color-surface-on-photo` |
| `--surface-scrim` | `--color-overlay-lightbox` |
| `--scrim-hero` | `--gradient-hero-scrim` |
| `--border-strong` | `--color-border-strong` |
| `--border-on-dark` | `--color-border-inverse` |
| `--border` | `--color-border-default` |
| `--brand-hover` | `--color-brand-hover` |
| `--brand` | `--color-brand` |
| `--accent-strong-hover` | `--color-action-primary-hover` |
| `--accent-strong` | `--color-action-primary` |
| `--accent` | `--color-action-accent` |
| `--focus-ring-dark` | `--color-focus-ring-inverse` |
| `--focus-ring` | `--color-focus-ring` |
| `--focus-halo` | `--color-focus-halo` |
| `--danger-surface` | `--color-surface-danger` |
| `--danger-border` | `--color-border-danger` |
| `--danger-text` | `--color-text-danger` |
| `--danger` | `--color-status-danger` |
| `--success-surface` | `--color-surface-success` |
| `--success-ink` | `--color-text-success` |
| `--warning-surface` | `--color-surface-caution` |
| `--warning-ink` | `--color-text-caution` |
| `--star` | `--color-rating` |
| `--font-display` | `--font-family-display` |
| `--font-read` | `--font-family-read` |
| `--font-ui` | `--font-family-ui` |
| `--fw-regular` | `--font-weight-regular` |
| `--fw-semibold` | `--font-weight-strong` |
| `--fs-h1` | `--font-size-display` |
| `--fs-h2` | `--font-size-heading` |
| `--fs-title` | `--font-size-title` |
| `--fs-quote` | `--font-size-quote` |
| `--fs-pull` | `--font-size-pull` |
| `--fs-read` | `--font-size-read` |
| `--fs-h3` | `--font-size-subheading` |
| `--fs-body` | `--font-size-body` |
| `--fs-small` | `--font-size-caption` |
| `--fs-micro` | `--font-size-label` |
| `--lh-display` | `--line-height-display` |
| `--lh-tight` | `--line-height-tight` |
| `--lh-ui` | `--line-height-ui` |
| `--lh-read` | `--line-height-read` |
| `--ls-read` | `--letter-spacing-read` |
| `--ls-overline` | `--letter-spacing-eyebrow` |
| `--ls-wordmark` | `--letter-spacing-wordmark` |
| `--gutter-read` | `--page-gutter-read` |
| `--gutter` | `--page-gutter` |
| `--w-layout` | `--container-page` |
| `--w-article` | `--container-article` |
| `--w-read` | `--container-read` |
| `--w-text` | `--container-text` |
| `--w-narrow` | `--container-narrow` |
| `--w-side` | `--container-side` |
| `--target` | `--tap-size-min` |
| `--bp-sm` | `--breakpoint-sm` |
| `--bp-lg` | `--breakpoint-lg` |
| `--r-sheet` | `--radius-sheet` |
| `--r-pill` | `--radius-full` |
| `--r-s` | `--radius-tag` |
| `--r-m` | `--radius-control` |
| `--r-l` | `--radius-container` |
| `--sh-card-hover` | `--elevation-hover` |
| `--sh-float` | `--elevation-overlap` |
| `--sh-tooltip` | `--elevation-tooltip` |
| `--sh-sheet` | `--elevation-sheet` |
| `--sh-sticky-bottom` | `--elevation-bar` |
| `--sh-input` | `--elevation-input` |
| `--sh-knob` | `--elevation-thumb` |
| `--sh-avatar-ring` | `--elevation-avatar-ring` |
| `--dur-fast` | `--duration-fast` |
| `--dur-base` | `--duration-base` |
| `--dur-slow` | `--duration-slow` |
| `--dur-enter` | `--duration-enter` |
| `--ease-out` | `--easing-sheet` |
| `--ease` | `--easing-standard` |
| `--op-*`, `--avatar-*` | removed: `operator.brand_color` → local `--operator-color` |

| Old text style | New text style |
|---|---|
| `t-h1` | `text-display` |
| `t-h2` | `text-heading` |
| `t-title` | `text-title` |
| `t-quote` | `text-quote` |
| `t-pull` | `text-pull` |
| `t-read` | `text-read` |
| `t-h3` | `text-subheading` |
| `t-body` | `text-body` |
| `t-small` | `text-caption` |
| `t-micro` | `text-label` |

### 2026-10-07 · B2: icon style chosen per site (SVG line icons or emoji)
- **Layer:** Core
- **Change:** The `Icon` atom renders SVG line icons or emoji, set per site in `site.config.ts` (`SITE.icon_style`). No boilerplate default: each new site chooses at setup (Jordan, 2026-10-07). Rivières & Canyons keeps emoji (the design is built on them). Emoji stay decorative (`aria-hidden`) and are always followed by text.
- **Why:** SVG icons render the same on every device and match the type; emoji are quicker and warmer. The right choice depends on the site's tone.
- **How to apply elsewhere:** Set `icon_style` in `site.config.ts`. Icon keys in vocabularies stay the same in both modes.
- **Status:** Rivières & Canyons ✅ (emoji) · Mangrove ⏳ (to choose) · Template ✅ (choice at setup)

### 2026-10-07 · B3: small design gaps use the nearest existing item
- **Layer:** Core
- **Change:** When a design needs a value, style or component the system lacks, use the nearest existing one and list it under "Proposed additions" in the phase report. Stop and ask Jordan only for content, legal, money and renames.
- **Why:** Keeps the build moving without growing the system silently.
- **How to apply elsewhere:** Same way of working on every site (`CLAUDE.md` §1).
- **Status:** Rivières & Canyons ✅ · Mangrove ⏳ · Template ✅

### 2026-10-07 · Phase 1b: generic listing, site facts, Images and Sources entities
- **Layer:** Core (images with rights, typed sources, facts system, completeness by dotted path, copy, rejected listings, SEO overrides) · Directory (generic listing, publication gates, offers, articles with authors, landing pages) · Places (`access_restricted`, direction fields) · Site (`site.config.ts`)
- **Change:**
  - **Listing** holds only fields every directory has (identity, status, confidence, `last_reviewed_on`, location `area / zone / localities / geo`, editorial text, FAQ, `estimated_fields`, SEO overrides). Kind-specific data goes in `facts`, declared per site as `FactDefinition[]` (key, label, type, options, unit, icon, `filter`, `key_fact`, `completeness`, `schema_org`). The schema is generated from those declarations.
  - **Three publication gates:** `status` (published / hidden), `confidence` (site levels, each may `hide`), completeness (below the threshold: `noindex`).
  - **Images** become their own entity: owner, role (hero / gallery / site / guided / illustration), order, credit, licence, rights `free` / `partner` / `permission_needed`, source page. `content:check:prod` fails on any `permission_needed` image.
  - **Sources** become their own entity, typed (official, tourism office, operator, media, reference), attached to a listing, an article or the site.
  - **Landing pages** are computed from declared dimensions (type, commune, secteur) with the 3+ rule.
  - Offers: `price_checked_on` added; `commune` removed (it comes from the place). Articles: `author_ids`. Places: `access_restricted` (never shown as "accès libre").
  - `vocabularies.ts` is now `site.config.ts` (facts, vocabularies, location labels, confidence, completeness, landing dimensions, UTM source, icon style, safety-claim rule).
- **Why:** A new directory writes only its settings and content mapping (`docs/DIRECTORY_BLUEPRINT.md`); the packages hold everything common. Same entity set as the Mangroves base, so phase 2 can start from it.
- **How to apply elsewhere:** Follow `docs/DIRECTORY_BLUEPRINT.md`.
- **Status:** Rivières & Canyons ✅ · Mangrove ⏳ · Template ⏳

### 2026-10-07 · Operator colours come from data, not tokens
- **Layer:** Directory
- **Change:** `--op-*` and `--avatar-*` tokens are removed. Each operator carries `brand_color`; a component sets it as a local `--operator-color`. Buttons still use `--color-action-primary` (rule C9).
- **Why:** Operators change per site; tokens are for the system, not for content.
- **Status:** Rivières & Canyons ✅ · Mangrove ⏳ · Template ⏳

### 2026-10-07 · CautionNote molecule (from Mangroves)
- **Layer:** Directory
- **Change:** New molecule in `COMPONENTS.md`: icon + "À confirmer", shown next to any value listed in a listing's `estimated_fields`.
- **Why:** Lets us publish useful estimates honestly instead of hiding them.
- **Status:** Rivières & Canyons ⏳ (built in phase 3) · Mangrove ✅ · Template ⏳

### 2026-10-07 · Safety claims only where a guide is involved
- **Layer:** Site (rule reusable by any guided-offer directory)
- **Change:** "En sécurité" / "en toute sécurité" may describe a guided outing or a guide (offers, guide bios, guided CTAs), never a place, an article, the listing or the disclaimer. `pnpm content:check` fails on them elsewhere. Supersedes the "pending" note in the Q1-A/Q3 entry and settles B10.
- **Why:** Jordan, 2026-10-07: safety is what the guide brings, not a property of the place.
- **Status:** Rivières & Canyons ✅ · Mangrove ⏳ · Template ⏳

### 2026-10-07 · Open loops file
- **Layer:** Core (way of working)
- **Change:** `docs/OPEN_LOOPS.md` lists what is still to validate, get or do (blocking before launch / to validate / worth adding / closed). Read at session start, updated at session end. First entries: the 5 Parc national photos (kept, permission needed before launch), placeholders, draft signatures, policies to confirm.
- **Why:** Jordan, 2026-10-07: one place to see the important open items, instead of scattered across reports.
- **How to apply elsewhere:** Every site keeps its own `docs/OPEN_LOOPS.md`.
- **Status:** Rivières & Canyons ✅ · Mangrove ⏳ · Template ✅

### 2026-10-07 · Phase 1: content schema, normalized fixtures, content report
- **Layer:** Core (primitives: image with credit, placeholders, completeness) · Directory (operator, guide, offer, review, social post, article, block, declarative selection rules) · Places (place, location policy, access status, safety alert, minute ranges) · Site (vocabularies, mapping)
- **Change:** Zod schemas in `packages/*/src/content/` and `apps/rivieres-canyons/src/content/`. `pnpm content:check` maps the design export (`data/*.json`) to snake_case fixtures in `apps/rivieres-canyons/content/fixtures/`, checks schema and references, and writes `docs/CONTENT_REPORT.md`. `pnpm content:check:prod` also fails on placeholders, draft signatures, guides without a full name, ratings without a source and social posts without an account. Article selection rules are declarative (`{match, conditions[{field, op, value}]}`) and verified against the design's JavaScript rules. Durations and approaches are minute ranges `{min, max, note}`. WhatsApp moves from the operator to the guide.
- **Why:** One data shape for the fixtures adapter now and the Airtable adapter later; invalid content fails the build with a clear message.
- **How to apply elsewhere:** Reuse the package schemas; a new site only writes its vocabularies, its `.extend()` and its mapping.
- **Status:** Rivières & Canyons ✅ · Mangrove ⏳ · Template ⏳

### 2026-10-07 · Directions never stored for guide-only and closed places (decision Q2-A)
- **Layer:** Places
- **Change:** The mapping drops itinerary, itinerary text, access tiles, parking, drive time, access H2 and guided access text from `guide_only` and `closed` places, plus the outings' meeting notes on those places. The place schema fails if any of these fields is filled.
- **Why:** Data that is never meant to be shown should not exist in the content store (no leak through feeds, JSON-LD, Markdown twins or a future template).
- **How to apply elsewhere:** Same rule for every place directory.
- **Status:** Rivières & Canyons ✅ · Mangrove ⏳ · Template ⏳

### 2026-10-07 · Acomat split into Saut d'Acomat and Canyon d'Acomat
- **Layer:** Site
- **Change:** `saut-d-acomat` (closed waterfall site) keeps the site facts. New place `canyon-d-acomat` (`guide_only`) holds the guided experience; the Yalodé and Wild Canyon Acomat outings link to it.
- **Why:** Jordan, 2026-10-07: the trips run in the canyon, not at the closed saut.
- **How to apply elsewhere:** When a closed site and a guided route share a name, model them as two places.
- **Status:** Rivières & Canyons ✅ · Mangrove — · Template —

### 2026-10-07 · Phase order and safety wording (decisions Q1-A, Q3)
- **Layer:** Site
- **Change:** Phases follow `CLAUDE.md` §13 (content, Airtable, then scaffold). "En sécurité" / "en toute sécurité" wording is kept as written, pending confirmation against `CLAUDE.md` §11 and B10.
- **Status:** Rivières & Canyons ✅ · Mangrove — · Template —

### 2026-10-06 · v12: variable rename, single changelog, fonts, images, privacy context
- **Layer:** Core
- **Change:** Variable renames (J-N2, option B): `--w-regular/--w-semibold` → `--fw-*`, `--t-h1…--t-micro` → `--fs-*`; `--w-*` now means width only. The root `Directory Design Changelog.md` is deleted; `docs/CHANGELOG.md` is the only changelog. Fonts documented as Google Fonts (OFL), self-hosted. Image licences are documented in the data files (credit, url); phase 1 only reports gaps. New `docs/PRIVACY_CONTEXT.md`: processing facts, open items and build rules for the privacy page, whose text will be generated later (`[PRIVACY_POLICY_TEXT]` placeholder, noindex, production build fails on it). Signature drafts synced into `data/destinations.json` with `signature_status: draft`.
- **Why:** Remove the width/weight and size/colour naming collisions before any code exists; one source of history; make the privacy page buildable without inventing legal text.
- **How to apply elsewhere:** Use `--fw-*` for weight, `--fs-*` for size, `--w-*` for width, `--text-*` for colour.
- **Status:** Guadeloupe ✅ · Mangrove ⏳ · Template ⏳

### 2026-10-06 · v12: final documentation review and handoff package
- **Layer:** Core
- **Change:** New `docs/ARCHITECTURE.md` (atomic levels L0–L7, naming conventions, decision tree, change process), `docs/COMPONENTS.md` (registry of 66 components by level with composition and mobile behaviour, plus 6 templates) and `docs/REVIEW_2026-10-06.md` (13 contradictions fixed, naming review, open decisions J-N1…J-N3). `DESIGN_SYSTEM.md` §2 rewritten around canonical names. `tokens.css` gains a primitive palette layer (`--c-*`, L0) that semantic tokens reference, so a redesign changes values without renaming. `CLAUDE_CODE_CONTEXT.md` rewritten (precedence, hard rules, definition of done, automated checks, open decisions, session checklist). Root `CLAUDE.md`, README, CONTENT_MODEL updated. Role-based component names applied in the docs (J-N1, reversible); variable renames not applied (J-N2).
- **Why:** A cold Claude Code session must build consistent pages from the documents alone, and the system must survive a visual redesign without renames.
- **How to apply elsewhere:** Copy ARCHITECTURE, COMPONENTS and the CLAUDE_CODE_CONTEXT structure; keep component names role-based; change look only in L0/L1/L2.
- **Status:** Guadeloupe ✅ (docs) · Mangrove ⏳ · Template ⏳

### 2026-10-06 · v12: mobile-first header, filter bar, disclaimers and lead capture
- **Layer:** Directory (header, filter bar, lead capture) · Core (disclaimers)
- **Change:**
  - **Header:** new SiteHeader on every page (wordmark + a borderless icon-only menu button on mobile, inline nav ≥1024) and a MenuSheet (primary rows, guides, types, communes). The old header inside the listing hero is removed. Not sticky.
  - **Filter bar:** one line at every width: search pill + "Filtres" button (44px, count badge). The sheet now holds every filter, including Afficher (all / excursions / sites) and Île. Inline controls only ≥1024. Sheet options 44px.
  - **Disclaimers:** the inline disclaimer and the footer "Avertissement" are `<details>`, folded by default; footer card removed. Inline link opens and scrolls to the footer one.
  - **Lead magnet:** stacked full-width 52px input and button on phones (wrapping row, no media query), 16px text, 24px checkbox with 14px label in a 44px row, `inputmode`/`autocomplete` set, 44px "Non merci". One markup in grid and list.
- **Why:** The previous header existed only on the listing; the filter bar was a scrolling row of seven controls (audit M2); disclaimers were large and always open; the lead form wrapped unpredictably and used 12px consent text.
- **How to apply elsewhere:** Mobile = one line of search + one "Filtres" button; everything else in the sheet. Disclaimers fold. Forms: stacked 52px fields, 16px text, 44px rows, input modes.
- **Status:** Guadeloupe ✅ (v12) · Mangrove ⏳ · Template ⏳

### 2026-10-06 · v12: typography system reduced to 10 styles (fewest families, sizes, weights)
- **Layer:** Core
- **Change:** New `docs/TYPOGRAPHY.md`. 3 families, 6 font files, weights 400/600 only, 10 sizes in 4 groups (display serif h1 · h2 · title · quote · pull; reading serif read; UI sans h3 18 · body 16 · small 14 · micro 12), 4 line heights, 3 letter-spacings, 1 text-shadow, 2 modifiers (strong, upper). Merged `--text-display` into `--text-strong` (#14342A) and `--danger-title` into `--danger-text`. `tokens.css` §1–3 and `text-styles.css` rewritten. Prototype: ink merge, text-shadow merge, letter-spacing merge, odd sizes, blog pull quote in Instrument Serif italic.
- **Why:** Every variation must serve a UX purpose; near-duplicates (13/14/15, 16261F/14342A, 1.35/1.4/1.45) made decisions ambiguous for the build.
- **How to apply elsewhere:** Copy both CSS files and TYPOGRAPHY.md. Decide J-T1…J-T8 once; changing a UI size is a one-line edit in `tokens.css`.
- **Status:** Guadeloupe ✅ (system) · ⏳ (UI sizes, weights, line heights not yet in the prototype: build from tokens) · Mangrove ⏳ · Template ⏳

### 2026-10-06 · v12: design system pass (complete variables, mobile-first, accessibility)
- **Layer:** Core
- **Change:** `tokens.css` rewritten with documented variables for fonts, weights, text tiers, surfaces, borders, brand/accent, focus, status, operators, type scale + line heights, spacing, layout, breakpoints, radius, shadow, z-index and motion. New `text-styles.css`. `DESIGN_SYSTEM.md` §1 rewritten. New `docs/AUDIT_2026-10-06.md` (findings, options J1–J8, build backlog). Site: `--text-muted` #626E67 → #616D66 (4.5:1 on sunken), access ok ink #2C784C, `#7A2A14`/`#8FCDB9`/`#F2C9B2` merged into existing tokens, global `:focus-visible` ring and reduced-motion rule.
- **Why:** Claude Code reads this as its single source of truth; undefined values and desktop-first leftovers would be copied into the build.
- **How to apply elsewhere:** Copy both CSS files, keep names. Layout switches only with `min-width` at 480 / 1024. Resolve J1–J8 before Mangrove and the template reuse the system.
- **Status:** Guadeloupe ✅ (system) · ⏳ (backlog §6 in the build) · Mangrove ⏳ · Template ⏳

### 2026-10-06 · v12: Aperçu shows guide voices only, "Bon à savoir" as tiles, card CTA bottom-right
- **Layer:** Directory (Aperçu, card) · Places (Bon à savoir)
- **Change:**
  - **Aperçu:** the SignatureLine (italic-free one-sentence subtitle under the H2) and its dashed empty placeholder are removed. Aperçu now reads H2, intro, then the guide's voice (InsiderTip) when one exists, then "En sortie guidée". `signature` stays in the data as the card subtitle and SEO snippet source only.
  - **Bon à savoir:** KeyValueList becomes **KeyValueTiles**: auto-fit grid (min 240px, gap 8px) of ValueTile-style tiles (`--surface-subtle`, 1px `--border`, radius 12, IconTile 32px, label 12 muted, value 15/1.5 body). Rows come from `season` ("Quand y aller"), `keyInfo` and "Aussi appelé"; icon picked by keyword in the label, default 🔹.
  - **DestinationCard:** the CTA ("Y aller en sécurité") is pinned to the bottom-right of the footer (`margin-left: auto`, footer `align-items: flex-end`), with or without a price on the left.
- **Why:** Guide quotes and tips carry the voice; a generic subtitle repeated the intro. The two-column table was hard to scan on mobile, and the CTA drifted left on cards without a price.
- **How to apply elsewhere:** Key-value lists with short text use KeyValueTiles. Do not add a one-line subtitle to a section that already has a lead paragraph; use a guide quote or tip when real. Card CTAs always sit bottom-right.
- **Status:** Guadeloupe ✅ (v12) · Mangrove ⏳ · Template ⏳

### 2026-10-06 · v12: Accès, no duplicate guide block for guide_only and closed
- **Layer:** Places
- **Change:** For `guide_only` and `closed`, the "Avec un guide" block (which repeated "rendez-vous donné à la réservation") is removed. The AccessNotice now carries the guide's name (guide_only) and the "Y aller avec {guide} →" TextLink. `commune_only` and `public` keep the separate "Avec un guide" block (it holds the real meeting point).
- **Why:** The notice and the guide block said the same thing twice in a row.
- **How to apply elsewhere:** One message per fact. If an explanatory notice already covers it, the next block adds only what is new, or merges into it.
- **Status:** Guadeloupe ✅ (v12) · Mangrove ⏳ · Template ⏳

### 2026-10-06 · v12: destination page reduced to the type scale
- **Layer:** Places
- **Change:** Reviewed every text style on the destination page against the type scale. FAQ question 16 → 17/600 (h3 token), FAQ answer → read style. "Dans le même secteur" card name 20 → 22 (title token). In-body and review quotes → `--t-quote` (18–21px, display ink). Disclaimer 14 → 13 (caption). Meta lines under hero/tour bar 12–13 → 13. Photo-section type label, type label on nearby cards 13/500. Line heights reduced to 1.1 / 1.3 / 1.4 / 1.5 / 1.6 (was also 1.2, 1.35, 1.65). Star letter-spacing 0.08em.
- **Result:** distinct sizes on the page 17 → 14 (only the scale values, plus icon glyphs, the 60px decorative quote mark and the 28px tour price); line heights 10 → 7.
- **Why:** Near-duplicate sizes (13/14, 15/16, 1.35/1.4) made the page feel uneven without adding hierarchy.
- **How to apply elsewhere:** Before adding a size or line height, find the nearest token. If none fits, log it first.
- **Status:** Guadeloupe ✅ (v12) · Mangrove ⏳ · Template ⏳

### 2026-10-06 · v12: guide quote sized as a pull quote
- **Layer:** Directory
- **Change:** The guide's quote at the top of the tour card (`tour.tip`) goes from 18–21px centred to `--t-quote-l` (23px on a 360px phone → 30px on desktop, 1.28), left-aligned with the 3px `--accent` rule, 640px max width.
- **Why:** It is the guide's voice and the main hook of the card. It was the same size as body text, and long centred italic lines are hard to read on mobile.
- **How to apply elsewhere:** Any guide or editorial pull quote uses `--t-quote-l`, left-aligned with the coral rule. Inline quotes (reviews, insider tip) keep `--t-quote`.
- **Status:** Guadeloupe ✅ (v12) · Mangrove ⏳ · Template ⏳

### 2026-10-06 · v12: draft `signature` for 10 destinations
- **Layer:** Site
- **Change:** `signature` written for the 10 destinations that have enriched data (Saut d'Acomat, Canyon doré, Rivière Bourceau, Canyon Ferry, Canyon Bois Malaisé, Chutes du Carbet, Cascade aux Écrevisses, Saut de la Lézarde, Chutes Moreau, Rivière Bras-David). One sentence each, built only from facts already on the page (height, approach, access, difficulty). The other 12 stay empty.
- **Why:** Fills the "Ce qui la rend unique" slot so the design shows its final state, and gives each place an SEO-friendly one-line snippet and card subtitle.
- **How to apply elsewhere:** Each signature restates a fact already published for that place; none adds a new claim. They are **drafts**: Pascal and Quentin must validate them before launch. In Airtable, add a `signature_status` (draft / validated) and fail the production build on draft values.
- **Status:** Guadeloupe ⏳ (draft, to validate) · Mangrove ⏳ · Template ⏳

### 2026-10-06 · v12: type & colour system (bold budget, h3, accent contrast, prose face)
- **Layer:** Core
- **Change:** Applied the "Typography & Color Audit" with options 1B, 2B, 3A, 4A, 5B, on v12 and Guide Offer Card:
  - **Weights:** Archivo 700 kept only on primary CTA labels and the "!" glyph (120 → 16 uses). 600 values/h3/titles/lead-ins, 500 controls, chips, text links.
  - **Sub-headings:** 14 uppercase 11px h3 ("Bon à savoir", "Programme", "À prévoir"…) → 17/600 sentence case `--text-strong`.
  - **Floor:** no text below 12px. Overlines 12/600/0.08em. Commune line under the destination H1: 15/500, sentence case. Search input 16px.
  - **Headings:** H2 in Instrument Serif on every template (blog H2s reverted from Archivo). Eyebrows above H2 removed unless they add a category (18 → 4 kept).
  - **Prose:** Source Serif 4 (read style) for all long-form paragraphs site-wide, not only the blog.
  - **Colour:** new `--accent-strong` #C24E2B for filled CTAs (white 4.7:1, was 3.5:1); `--accent` no longer used as text or hover; `--danger` → #B8321E. Card names `--text-display` in both views, card subtitles and tile text `--text-body` (content is never muted). White-on-dark opacities reduced from 12 to 3 steps. Two one-off shadows mapped to tokens.
  - **Molecules:** card "Durée / Dès / Guide" use the FactStrip label/value styles. Card name and price 22px. Card CTA 15px.
- **Why:** Bold everywhere flattened the hierarchy, sub-headings were smaller than their text, CTAs failed WCAG AA, and the same prose looked different on blog and destination pages.
- **How to apply elsewhere:** Use only the tokens in `tokens.css` and the "Emphasis rules" in DESIGN_SYSTEM.md §1. Check every new component against them: one emphasis device, weight budget, 12px floor, content in body ink, accent never text.
- **Status:** Guadeloupe ✅ (v12) · Mangrove ⏳ · Template ⏳

### 2026-10-02 · v12: no live or safety-critical status
- **Layer:** Places
- **Change:** Removed the "Praticable aujourd'hui" filter toggle, the per-tour weather status (go / watch / closed, `WEATHER`, `tour.weather`) and any "conditions du jour" field. Replaced the filter slot with "💦 Avec cascade". The auto FAQ "{nom} est-il ouvert en ce moment ?" becomes "… ouvert au public ?".
- **Why:** We cannot guarantee live conditions; a stale "praticable" is a safety and liability risk.
- **How to apply elsewhere:** Never publish real-time state (weather, flow, tide, opening today). Publish only dated, sourced facts and point to official sources.
- **Status:** Guadeloupe ✅ (v12) · Mangrove ⏳ · Template ⏳

### 2026-10-02 · v12: merge near-synonym types ("cascade" + "chutes d'eau" → Cascade)
- **Layer:** Directory
- **Change:** Type `chutes_d_eau` merged into `cascade` (Chutes du Carbet). `SITE_TYPE_META.cascade.aliases = ["Chutes d'eau"]`; the Cascades filter page says both terms. Per-destination "Aussi appelé" names are kept.
- **Why:** Two labels for the same thing split filters, counts and landing pages.
- **How to apply elsewhere:** One type per real-world category; keep old names as aliases for copy and SEO, never as separate types.
- **Status:** Guadeloupe ✅ (v12) · Mangrove ⏳ · Template ⏳

### 2026-10-02 · v12: "Ce qui la rend unique" (`signature`) + "Avec cascade" (`has_waterfall`)
- **Layer:** Directory (signature) · Site (has_waterfall)
- **Change:** Optional per-destination `signature` (one sentence): first line of Aperçu after the H2 (lead token, 18/1.6), and the listing-card subtitle when present (else `desc`). New `has_waterfall` (true / false / null) drives a "💦 Avec cascade" tag (not repeated on type Cascade) and a filter toggle; tours inherit it from their destination. The design reference shows a dashed placeholder where `signature` is empty (prop `showEmptyFields`).
- **Why:** One sharp differentiator per place helps scanning and SEO snippets; "waterfall" is a top search intent.
- **How to apply elsewhere:** Add a `signature` field to every directory item; add one boolean per top intent of the vertical. Leave empty/null when unknown, never invent.
- **Status:** Guadeloupe ✅ (v12, fields in place; signatures to write; has_waterfall set for 6 places) · Mangrove ⏳ · Template ⏳

### 2026-10-02 · v12: contact = WhatsApp, lead form removed
- **Layer:** Directory
- **Change:** Every "Écrire à {guide}" (side card, guides band, guide page) opens `https://wa.me/{whatsapp}?text=…` with "Bonjour {guide}, je vous écris depuis {site} au sujet de {sortie ou lieu}." The empty state "Demander conseil" shows both guides, each opening WhatsApp. The lead form modal and its state are removed. Excursion-card CTA "Y aller en sécurité" opens the destination at `#sortie`. Placeholders `[WHATSAPP_PASCAL]`, `[WHATSAPP_QUENTIN]`.
- **Why:** Guides answer on WhatsApp; a form adds a step and a data-handling duty without value.
- **How to apply elsewhere:** Operator field `whatsapp`; one helper builds the link with the page subject (tour name, place name, or "d'une sortie").
- **Status:** Guadeloupe ✅ (v12) · Mangrove ⏳ · Template ⏳

### 2026-10-02 · v12: lead magnet with explicit consent
- **Layer:** Core
- **Change:** "Top 5" band: e-mail first (phone only in optional step 2). An unchecked consent checkbox with a link to the privacy page; "Recevoir" stays disabled until the e-mail is valid and consent is given. New privacy page template (text to write).
- **Why:** GDPR: consent must be explicit, informed and recorded.
- **How to apply elsewhere:** Every lead magnet: e-mail first, unchecked consent box naming what will be sent, link to `/confidentialite`, store consent timestamp and wording.
- **Status:** Guadeloupe ✅ (v12) · Mangrove ⏳ · Template ⏳

### 2026-10-02 · v12: only real reviews
- **Layer:** Core
- **Change:** Draft reviews ("brouillon") deleted. Reviews render only with a source; the block hides when the list is empty (Yalodé: hidden for now).
- **Why:** Fake or placeholder reviews are misleading and illegal to publish.
- **How to apply elsewhere:** Review = {quote, author, source}; filter out anything without a source before render.
- **Status:** Guadeloupe ✅ (v12) · Mangrove ⏳ · Template ⏳

### 2026-10-02 · v12: "Réserver" → operator booking page
- **Layer:** Directory
- **Change:** Every "Réserver" uses `operator.bookUrl`. Contact-only URLs moved to `contactUrl`; `bookUrl` holds `[BOOKING_URL_YALODE]` / `[BOOKING_URL_WILDCANYON]` until real booking pages exist.
- **Why:** "Réserver" must lead to booking, not to a contact page.
- **How to apply elsewhere:** Keep `bookUrl` and `contactUrl` separate on every operator.
- **Status:** Guadeloupe ✅ (v12) · Mangrove ⏳ · Template ⏳

### 2026-10-02 · v12: location policy per destination
- **Layer:** Places
- **Change:** New field `location_policy`: `public` (official sites with parking: tiles, itinerary, Google Maps link), `commune_only` (commune + "renseignez-vous avant de partir"), `guide_only` (all canyons: no coordinates or itinerary, meeting point given by the guide), `closed` (no directions, closure alert). Accès always renders; its H2 and content follow the policy (AccessNotice component). The closure alert moves from Sécurité to Accès. The "Comment aller à…" FAQ is generated only for `public`. JSON-LD `publicAccess` follows the policy. Set: 4 public, 1 + 7 commune_only, 4 guide_only, 1 closed, 4 empty (commune unknown).
- **Why:** Publishing itineraries to canyons or closed sites sends people to danger; each place needs a deliberate level of disclosure.
- **How to apply elsewhere:** Every place directory gets the same 4 levels. Default to `commune_only` when unset. Supersedes the "never show access status" rule for closures only.
- **Status:** Guadeloupe ✅ (v12; Chutes Moreau = public and Rivière Bourceau = guide_only to confirm with the guides) · Mangrove ⏳ · Template ⏳

### 2026-10-02 · v12: filter landing pages (type / commune), 3+ rule
- **Layer:** Directory
- **Change:** New template: hero, H1 ("Cascades de Guadeloupe", "Rivières et cascades à Petit-Bourg"), intro, "En bref", the matching DestinationCards, FAQ, related intent articles. Only for types and communes with 3+ places (Rivières, Cascades, Canyons, Petit-Bourg, Vieux-Habitants). Footer "Par type" / "Par commune" link only to these pages; "Par île" lists only islands with places.
- **Why:** Capture "type + area" searches without thin pages.
- **How to apply elsewhere:** Pages are computed from data; intro, answer and FAQ use counts and fields only. Threshold 3.
- **Status:** Guadeloupe ✅ (v12) · Mangrove ⏳ · Template ⏳

### 2026-10-02 · v12: guide page
- **Layer:** Directory
- **Change:** New template `/guides/{slug}`: 72px portrait, company overline in the operator colour, H1 full name, diploma · rating, "Réserver" + "Écrire sur WhatsApp", bio + diplomas grid, outings, places, real reviews. Person JSON-LD. Linked from the guides band ("Voir le profil") and the footer.
- **Why:** E-E-A-T: a real, qualified person behind each outing.
- **How to apply elsewhere:** One page per guide; facts must come from the operator.
- **Status:** Guadeloupe ✅ (v12) · Mangrove ⏳ · Template ⏳

### 2026-10-02 · v12: blog index
- **Layer:** Directory
- **Change:** New `/blog` page: blog hero + RelatedCard grid of all intent articles with their intro. The article breadcrumb "Le blog" links to it.
- **How to apply elsewhere:** Same page for any directory with intent articles.
- **Status:** Guadeloupe ✅ (v12) · Mangrove ⏳ · Template ⏳

### 2026-10-02 · v12: stack and data shape for Claude Code
- **Layer:** Core
- **Change:** Target stack is Astro (static), Airtable read at build time, Cloudflare Pages; the Next.js / Supabase recommendation is withdrawn. `data/destinations.json` now holds one object per destination (SITES, SITE_ENRICH, EDITORIAL, INSIDER, ACCESS → `access_status`, ALT_NAMES → `alt_names`, GALLERY → `gallery` merged). Handoff folder renamed ``; v10, its handoff and the Playbook moved to / marked superseded in `_archive/`.
- **Why:** Static pages are fastest and best for SEO; one object per item maps 1:1 to an Airtable row.
- **How to apply elsewhere:** Same stack and one-object-per-item rule for every Orbit lead magnet.
- **Status:** Guadeloupe ✅ (v12) · Mangrove ⏳ · Template ⏳

### 2026-10-02 · Changelog layers
- **Layer:** Core
- **Change:** Every rule is tagged Core / Directory / Places / Site.
- **How to apply elsewhere:** Mangrove takes Core + Directory + Places; the template takes Core + Directory (+ Places when the template is a place directory); Site rules stay local.
- **Status:** Guadeloupe ✅ (v12) · Mangrove ⏳ · Template ⏳

### 2026-10-02 · Design system normalisation (pre-Claude Code)
- **Layer:** Core
- **Change:** v10 values snapped to a single scale:
  - **Radius:** 8 / 12 / 16 / 22 / pill.
  - **Weights:** 400 / 600 / 700 (500 and 800 removed).
  - **Uppercase letter-spacing:** 0.12em for overlines, 0.14em for eyebrows.
  - **Greys and borders:** merged into `--border` / `--border-strong` / `--surface-sunken`.
  - **Serif titles:** display-s unified to clamp(22px, 3vw, 26px).
  - **Line-heights:** 1.1 / 1.3 / 1.35 / 1.4 / 1.5 / 1.65.
  - **Default link colour:** `--brand`.
  - **Handoff package:** `design_handoff_directory_v10/` (tokens, component catalogue, content JSON).
- **Why:** One reusable system for Claude Code.
- **How to apply elsewhere:** Use `tokens/tokens.css` and `docs/DESIGN_SYSTEM.md` as the base for Mangrove and the template.
- **Status:** Guadeloupe ✅ · Mangrove ⏳ · Template ⏳

### 2026-10-02 · Blog articles: component alignment with destination pages
- **Layer:** Directory
- **Change:**
  - Selection entries reuse the destination "Programme" fact strip (emoji + 12px label / 14px bold value, single row, 1px dividers). Tours show Durée, Dès, Niveau and Prix; sites show Difficulté, Marche, Baignade and Guide. The commune moves to the kind line (📍).
  - Each entry adds a topic-angle paragraph ("**Avec des enfants :** …") after the general lead.
  - Body text is aligned to the site standard of 16px/1.65; the standfirst is 18px sans; H3 is 18px.
  - The article closes with "Pourquoi partir avec un guide ?", placed after the FAQ and before the author box. It has a page-specific intro, 4 value tiles (same tile as the destination "Pourquoi y aller avec") and two text links.
- **How to apply elsewhere:** `SEO_ANGLE[pageId] = [label, {entryName: text}]`, `SEO_WHY[pageId]`, shared `SEO_WHY_POINTS`.
- **Status:** Guadeloupe ✅ (v10, 7 articles) · Mangrove ⏳ · Template ⏳

### 2026-10-02 · Blog articles: SEO / LLM-SEO and reading pass
- **Layer:** Core
- **SEO / LLM:**
  - "En bref" answer box (40–60 words) right after the standfirst: a direct answer to the query, quotable by LLMs.
  - Each selection entry has a structured fact grid (Lieu, Durée, Âge, Prix / Marche, Accès, Guide) instead of a meta line.
  - The author link points to "Qui sommes-nous".
  - A "Sources" line with official links at the end.
  - JSON-LD: Article (authors, dates, image), ItemList (the selection), FAQPage and BreadcrumbList.
- **Reading (Medium-like):**
  - Body text clamp(17–18px)/1.75.
  - Sommaire is lighter (left rule, no box).
  - "···" separators between the main parts.
  - Image captions (credit) under each entry photo.
  - The link sits alone on the right under the facts.
- **Status:** Guadeloupe ✅ (v10, 7 articles) · Mangrove ⏳ · Template ⏳

### 2026-10-02 · Theme pages → blog articles (editorial, Medium-style)
- **Layer:** Directory
- **Change:** Theme pages are rebuilt as articles in a 720px reading column:
  - **Hero:** photo hero kept, no CTA. Breadcrumb "Accueil › Le blog › {thème}" → eyebrow → H1 → byline (two avatars, "Par Pascal & Quentin · Mis à jour le … · N min de lecture").
  - **Body order:**
    1. Standfirst (serif 22–26px).
    2. "Sommaire" box with anchors.
    3. "L'essentiel": dot-bullet takeaways, 17px.
    4. "Le guide": H2 + three H3 (20px bold) sections of 17px/1.7 body.
    5. Pull quote (serif italic with a coral left rule).
    6. "Notre sélection : N idées": numbered entries. Each entry has a big grey serif number, an H3 name, a 16:9 image, a kind + guide line, a lead paragraph, a meta line and an underlined text link.
    7. "Bon à savoir" card.
    8. "Avant de partir" alert.
    9. FAQ accordion.
    10. Author box.
    11. "À lire aussi" article cards (3:2 image + serif title).
  - **Removed:** floating cards, featured block, list cards, quote band and image tiles.
- **Why:** Reading flow first (blog), listings woven into the story; strong H2/H3 hierarchy, anchors and an FAQ for SEO.
- **Status:** Guadeloupe ✅ (v10, 7 articles) · Mangrove ⏳ · Template ⏳

### 2026-10-02 · Theme pages: editorial guide block
- **Layer:** Directory
- **Change:** New section before the safety card. Eyebrow "Le guide" + SEO H2 → two columns that stack on mobile: 3 sub-sections (H3 18px bold + 16px paragraph) | "Bon à savoir" card (white, 1px border, 16px radius, key-value list at 15px).
- **Why:** Long-form, intent-matching copy for SEO (age, choice of route, how it works, rules) and a scannable summary.
- **How to apply elsewhere:** `SEO_EDITORIAL[pageId] = { eyebrow, h2, blocks[[h3, p]] (3), tips[[k, v]] (4–5) }`.
- **Status:** Guadeloupe ✅ (v10, 7 theme pages) · Mangrove ⏳ · Template ⏳

### 2026-10-02 · Theme landing pages (e.g. "Canyoning avec enfants") aligned to the system
- **Layer:** Directory
- **Kept (landing feel):** full-bleed photo hero, big serif H1, fact pills, coral CTA, guides' avatars, floating point cards, featured tour, guide quote band, image tiles for related ideas.
- **Aligned:**
  - Removed the stray 'Archivo' font.
  - Breadcrumb: 14px.
  - Fact pills: 14px on solid white.
  - Point cards: card-title serif + 15px body.
  - Featured card: 16px body, the standard quote style on pale sage, guide tag (no fill, colour on hover), 48px CTA.
  - Tour and site cards: 14px meta, chip-style type label, underlined text CTA.
  - Section rhythm: clamp(32–48px).
- **Standardised components:**
  - The safety strip is now the standard coral alert card ("Avant de partir").
  - The FAQ is now the standard accordion (FAQ eyebrow + H2 "{thème} : questions fréquentes", 640px, 16px Q/A).
  - "Autres idées" gets the eyebrow + H2 pattern with a hairline separator.
- **Status:** Guadeloupe ✅ (v10, all 7 theme pages) · Mangrove ⏳ · Template ⏳

### 2026-10-02 · List view row (inline card)
- **Layer:** Directory
- **Change:** Mobile-first horizontal row. Image (32% width, 112–240px) | content:
  1. Serif name 20px.
  2. One meta line at 13px grey: 📍 commune · level dot + level · ⏱️ duration · 👤 age.
  3. Footer, pinned bottom above a hairline: guide (avatar + "avec {op} · rating", 13px 600 in the brand colour) on the left, price (serif 22px + unit 12px) on the right. Sites show "Sortie guidée dès…" or "Non guidé" + →.
  - The centred CTA button and the level chip are removed; the whole row is clickable, with a hover border and shadow.
- **Why:** Clear scan order (what → where/how → who/how much), fewer competing elements, no duplicate CTA.
- **Status:** Guadeloupe ✅ (v10) · Mangrove ⏳ · Template ⏳

### 2026-10-02 · Photo credits everywhere
- **Layer:** Core
- **Change:** Per-site `gallery[{src, credit}]` photos from cited sources. The credit is always shown in the lightbox ("Photo : {author} · {site} · tous droits réservés") and listed once in "Sources et crédits". Under the gallery: a 13px grey line "Photos issues des sites cités dans nos sources, tous droits réservés à leurs auteurs." with a light "Voir les sources" link that opens and scrolls to the sources.
- **Why:** Transparency and respect for image rights.
- **Note:** Get written permission from each source before going live.
- **Status:** Guadeloupe ✅ (v10, Écrevisses: 5 photos from Parc national / Rando Guadeloupe) · Mangrove ⏳ · Template ⏳

### 2026-10-02 · Benchmark audit (Rando Guadeloupe / CTIG / Wikipédia) → new content blocks
- **Layer:** Places
- **Added to the content model** (per site, optional):
  - **Accessibility** (PMR, label) in "Bon à savoir" and the FAQ.
  - **Public transport tile** ("En bus") in Accès.
  - **Services on site** (picnic, bins), **where to get info** (visitor centre), **name origin / fauna** paragraph ("Pourquoi ce nom").
  - **Water-quality notice** (ARS) in the site alert.
- **New sections:**
  - **"Vidéos" (`#social`):** vertical 2:3 thumbnails (16px radius), duration pill bottom-left, 2-line 15px title, then a platform dot + "Platform · author" (13px). Horizontal scroll on mobile (62% cards, snap), 4 columns on desktop. Every video opens in an in-page lightbox using the platform embed (YouTube 16:9 via youtube-nocookie; Instagram and Facebook 9:16), with the title and "Platform · account" below. On mobile only, a small "Ouvrir dans {platform} ↗" pill opens the post URL, which launches the app when it is installed.
  - **"Ils en parlent" (`#ils-en-parlent`):** a list of external pages about the destination. Each row: initial tile, 15px bold page title, "Site · one-line summary" in 14px grey, ↗. Max width 640px, hairlines, 44px rows.
- **Not added** (low value or duplicative): elevation profile, embedded GPX map (linked via Rando Guadeloupe instead), opening hours of the visitor centre.
- **Rule:** every video card shows its source account ("Platform · account"). `author` is required in the data.
- **Data fields:** `press[{site, by, title, note, url}]`, `SOCIAL[site][{platform, url, thumb, author, title, duration, ytId?}]`.
- **Status:** Guadeloupe ✅ (v10, Cascade aux Écrevisses) · other destinations ⏳ · Mangrove ⏳ · Template ⏳

### 2026-10-02 · Optional insider tip ("Le conseil de {guide}")
- **Layer:** Places
- **Change:** An optional block in Aperçu, right after the intro paragraph. Pale sage card (#EFF4F0, 14px radius), 36px guide avatar (or ✦ for the team), an 11px eyebrow "Le conseil de {guide}", and the tip in serif italic clamp(18–21px). One or two sentences max.
- **Why:** A human, local touch that sets the page apart and gives guides a voice.
- **How to apply elsewhere:** Per-site field `insider { op?, text }`. No field = no block. The text must come from the guide.
- **Status:** Guadeloupe ✅ (v10: Acomat, Canyon doré, Bourceau, Carbet, Écrevisses, drafts to validate) · Mangrove ⏳ · Template ⏳

### 2026-10-02 · Operator brand colours
- **Layer:** Directory
- **Change:**
  - **Yalodé:** #0A8577 (tropical turquoise).
  - **Wild Canyon:** #3D4AA0 (deep indigo). Both are cool hues, clearly apart from the site green and the coral CTA, and pass 4.5:1 with white text and as text on white.
  - Both keep white text above 4.5:1 and are clearly different from each other and from the site's green and coral.
- **How to apply elsewhere:** Pick operator colours that are mid-dark, saturated, and distinct from the site's primary/accent. Always use white text on them. Keep them away from the CTA hue.
- **Status:** Guadeloupe ✅ (v10) · Mangrove ⏳ · Template ⏳

### 2026-10-02 · v10 = final detail page; 9 destinations enriched
- **Layer:** Site
- **Change:** v10 is the reference detail page (logged in CLAUDE.md). The editorial structure is applied to the 4 guided destinations (Canyon doré, Rivière Bourceau, Canyon Ferry, Canyon Bois Malaisé) and the top 5 sites (Chutes du Carbet, Cascade aux Écrevisses, Saut de la Lézarde, Chutes Moreau, Rivière Bras-David). Fields: `h2`, `lead`, `intro`, `keyInfo`, `alert`, `accessH2`, `accessShort` (+tips), `accessText` (self-access sites only), `guideH2`, `guideWhy`, `faqH2`, `faq`. Canyons have no self-access text, so only "Avec un guide" shows.
- **Status:** Guadeloupe ✅ (10/10 priority destinations, to review) · Mangrove ⏳ · Template ⏳

### 2026-10-02 · Full-page type & colour audit → design system
- **Layer:** Core
- **Type scale (the only allowed sizes):**
  - Serif (Instrument Serif):
    - Hero H1: clamp(34–44px). Home H1: 38px. SEO H1: clamp(38–64px).
    - H2: clamp(26–32px).
    - Panel / modal title: clamp(22–26px).
    - Card title: clamp(20–23px), or 20px fixed in dense cards.
    - Quote: italic clamp(18–21px). Review quote: 18px.
    - Price: 26px.
  - Sans:
    - 18px: emphasis
    - 16px: body / FAQ / button large
    - 15px: small title / buttons
    - 14px: secondary text, links, chips, tooltips
    - 13px: compact meta / form labels
    - 12px: tile labels, credits
    - 11px: eyebrows, labels, pills (minimum)
  - Removed: 9.5, 10, 10.5, 11.5, 12.5, 13.5, 14.5, 15.5, 16.5, 17, 19, 21, 22, 24, 25, 28px.
- **Text colours:** headings #14342A, strong #16261F, body #26332D, secondary #626E67, eyebrow #3E6B58, alert #5E1F0E / #4A1C0E. Removed one-off greys (#45524B, #46524C, #5C6862, #7A7059, #8A938D).
- **Components (reference):** eyebrow + serif H2 per section; 11px uppercase H3 labels; 3-column hairline fact grid (12px label / 14px 600 value); key-value list (15px, hairlines); coral alert card; neutral white info card; white chips (8px radius, 1px #E9E3D8, 14px); standard tooltip; text CTA (14–15px 700, coral underline); primary button (coral, 12px radius).
- **Status:** Guadeloupe ✅ (v10, all views) · v11 ⏳ · Mangrove ⏳ · Template ⏳

### 2026-10-02 · "Qui sommes-nous" merged with the guide cards
- **Layer:** Directory
- **Change:** One dark green band (#guides) holds one cream card:
  - Overlapping 56px guide avatars.
  - Serif H2 "Nous, c'est {guide} et {guide}".
  - Two 16px paragraphs.
  - Company cards in a 2-up grid (stacked on mobile). Each card has: a brand-colour dot + company name (15px 700), "Avec {guide} · credentials" (14px grey), specialty (14px), and two text CTAs ("Écrire à {guide}" underlined in coral, "{domain} ↗" grey).
  - Only 4 text styles: serif H2, 16 body, 15 bold, 14 secondary.
  - The separate dark/brick guide cards are removed.
- **Why:** One story instead of two blocks saying the same thing; the people sign their own letter; lighter CTAs.
- **How to apply elsewhere:** Any directory with founding guides uses the letter + guide signatures. A single-guide site uses one signature card.
- **Status:** Guadeloupe ✅ (v10) · v11 ⏳ · Mangrove ⏳ · Template ⏳

### 2026-10-02 · SEO FAQ per destination
- **Layer:** Places
- **Change:**
  - **FAQ H2:** "{Nom court} : questions fréquentes"; any "(site naturel)" suffix is stripped.
  - **Curated per-site list** (`faq[[q,a]]`, 10–12 items) covering search intents in this order: location, open or not, swimming, physical facts, canyoning possible, why with a guide, who the guide is, price, kids, best season, what to bring, nearby.
  - **Answers:** start with the direct answer (Oui / Non / figure), then 1–2 sentences of context.
  - **Typography:** questions 16px 600 with a 44px tap target; answers 16px/1.65.
  - **Structured data:** the FAQPage schema is fed from the same list. Sites without a curated list keep the generated fallback.
- **Why:** Target long-tail queries ("Saut d'Acomat ouvert", "canyoning Acomat prix", "hauteur cascade Acomat") and support rich results.
- **How to apply elsewhere:** Write the 12 questions per destination with the destination name in each question.
- **Status:** Guadeloupe ✅ (v10, Acomat) · 9 destinations ⏳ · v11 ⏳ · Mangrove ⏳ · Template ⏳

### 2026-10-02 · "À propos de {guide}" in the tour card
- **Layer:** Directory
- **Change:** New block before the reviews: an 11px H3 label, then an identity row (avatar + full name in serif 20–23px + "Fondateur de {op} · rating" 14px grey), then a 16px bio, then a 2×2 hairline fact grid (icon + 12px label, 14px 600 value: Diplôme, Expérience, Certification, structure).
- **Why:** Trust. Shows who the guide is and their qualifications before the reviews.
- **How to apply elsewhere:** Operator field `about { bio, facts[[icon,k,v]] }` (4 facts) + `guideFullName`. The block is hidden when it's missing. Facts must come from the operator's own site or be confirmed by them.
- **Status:** Guadeloupe ✅ (v10, Pascal; Quentin ⏳ missing data) · v11 ⏳ · Mangrove ⏳ · Template ⏳

### 2026-10-02 · Liability disclaimer (short + full)
- **Layer:** Places
- **Change:**
  - **Short version:** at the end of Sécurité, one 14px grey paragraph above a hairline: directory only, doesn't replace your own checks, a professional's advice or the local rules; you are responsible for your choices. Ends with "Lire l'avertissement ↓".
  - **Full version (#avertissement):** in the footer, replacing the old coral safety strip. A light card (#FFFDF8, 1px #E2D7C2, 16px radius) with an 11px "Avertissement" H3 and 4 short 14px paragraphs: independent directory, indicative information, check official sources and respect the rules, own responsibility and limitation of liability.
- **Why:** Make clear the site lists information and does not organise or supervise activities. Keep it calm and readable rather than alarming.
- **How to apply elsewhere:** Same two blocks on every detail page. Adapt the official sources per territory. Have the wording reviewed by a lawyer before launch.
- **Status:** Guadeloupe ✅ (v10) · v11 ⏳ · Mangrove ⏳ · Template ⏳

### 2026-10-02 · Safety hierarchy, risk tags, folded sources, guide value copy
- **Layer:** Places
- **Safety section:**
  - When a site is closed, the coral site alert card (title + one sentence) comes first.
  - "Les règles en rivière" follows as a neutral white card (🌊 on a pale green circle, dark text), so the two cards don't compete.
  - "Risques signalés sur ce site" is its own H3 section with emoji tags, styled exactly like "Dans le sac" (white, 1px #E9E3D8, 8px radius, 14px).
- **Pourquoi y aller avec {guide}:** opens with one human paragraph (per-site `guideWhy`, generic fallback): the guide takes you where you wouldn't go alone, safely, and you just enjoy it.
- **Explorer aussi:** every intent tag gets an emoji.
- **Sources et crédits:** folded by default in a native `<details>` (eyebrow + one-line subtitle + "Afficher ↓", 44px tap target). Content is a light key-value list (Source, État d'accès, Photos) at 14px.
- **Guide side card:** "Écrire à {guide}" is a minimal underlined text CTA. The "Réponse sous 24 h…" note is removed.
- **Status:** Guadeloupe ✅ (v10) · v11 ⏳ · Mangrove ⏳ · Template ⏳

### 2026-10-02 · Detail page order + guided block copy
- **Layer:** Places
- **Change:**
  - **Section order:** Aperçu → Photos → Accès → Sécurité → Sortie guidée.
  - **Tour block H2:** "Aller au {destination} avec un guide" (per-site `guideH2`, fallback "Aller à {nom} avec un guide").
  - **Card header:** "{Guide} de {Opérateur}" eyebrow → role · rating → tour name → price.
  - **Quote:** sits right under the header, tight spacing, no divider.
  - **"Pourquoi y aller avec {guide}":** 5 short points (conditions vérifiées, terrain connu, guide diplômé, équipement fourni, petit groupe).
  - **Equipment blocks:** no divider above.
  - **Rendez-vous block:** removed; the meeting point lives in Accès › Avec un guide.
  - **Reviews heading:** "Avis sur la sortie avec {guide}".
  - **Accès › Avec un guide:** ends with a light text CTA "Y aller avec {guide} →" (underlined in coral).
- **Why:** Practical info and safety before the commercial block; no duplicated meeting info; titles that say who and what.
- **Status:** Guadeloupe ✅ (v10) · v11 ⏳ · Mangrove ⏳ · Template ⏳

### 2026-10-02 · Guided tour block order
- **Layer:** Directory
- **Change:** "Sortie guidée" order, mobile first: H2 → card: header band (guide avatar, operator, tour name, role · rating, price) → centred guide quote (serif italic, no attribution line) → Programme (facts on one line + "imaginez-vous" list) → "Pourquoi {guide}" value cards → Fourni / À prévoir → Rendez-vous → Avis.
- **Why:** The human voice comes first, then what you'll do, then why this guide, then the logistics.
- **How to apply elsewhere:** Same order for every tour block. The avatar appears once, in the header.
- **Status:** Guadeloupe ✅ (v10) · v11 ⏳ · Mangrove ⏳ · Template ⏳

### 2026-10-02 · Type scale (applied to "Sortie guidée")
- **Layer:** Core
- **Change:** One type scale for the whole detail page:
  - Eyebrow: 11px, 700, uppercase, 0.14em, #3E6B58
  - H2: Instrument Serif clamp(26–32px)
  - Card title: Instrument Serif clamp(20–23px)
  - Quote (hero lead, guide quote): Instrument Serif italic clamp(18–21px)/1.35, #14342A. Short review quote: 18px.
  - H3 label: 11px, 700, uppercase, 0.12em, #626E67
  - Body: 16px/1.65, #26332D
  - Small title: 15px, 700
  - Secondary/meta: 14px, #626E67
  - Fact tiles: 12px label with icon, 14px 600 value, in a 3-column hairline grid
  - Tooltip: 13.5px
- The tour "Programme" tiles now use the same 3-column hairline grid as the facts bar and access tiles. No 11px/12.5px/15.5px text left in the section.
- **Why:** Remove near-duplicate sizes (12.5 / 14 / 15.5) and make every block read as one system.
- **How to apply elsewhere:** Map every text element to one of the levels above; no other sizes.
- **Status:** Guadeloupe ✅ (v10 Sortie guidée) · other sections to audit ⏳ · v11 ⏳ · Mangrove ⏳ · Template ⏳

### 2026-10-02 · Standard hover tooltip
- **Layer:** Core
- **Change:** One tooltip pattern everywhere (hero facts bar, hero "!" alert icon, access tiles): white card, 1px #E9E3D8 border, 10px radius, soft shadow, 13.5px text "**Value** · one-line tip", arrow pointing at the trigger, max 280px. Desktop = hover/focus; touch = tap to toggle. Active tile gets #FAF8F3 background. Edge tiles anchor the tooltip left/right so it stays on screen.
- **Why:** Consistent micro-interactions; extra info without adding text to the page.
- **How to apply elsewhere:** Each tile carries a 4th field `tip` (one sharp sentence). No tip = no tooltip.
- **Status:** Guadeloupe ✅ (v10) · v11 ⏳ · Mangrove ⏳ · Template ⏳

### 2026-10-02 · Access section: compact facts + two editorial paragraphs
- **Layer:** Places
- **Change:** "Accès" = SEO H2 ("Comment aller au {nom}") → compact 3-column facts grid (same hairline style as the mobile facts bar: icon + 12px label, 14px bold value, short micro copy) → "Par vos propres moyens" paragraph → "Avec un guide" paragraph (meeting point, time, approach walk).
- **Why:** Scannable on mobile first, then real text for SEO and context; separates independent vs guided access.
- **How to apply elsewhere:** Per-site fields `accessH2`, `accessShort[[icon,label,value]]` (3 items), `accessText`, `accessGuided`. Fallbacks: drive/parking/approach tiles, `access` text, guided text built from the main tour's meeting point.
- **Status:** Guadeloupe ✅ (v10, Acomat content) · v11 ⏳ · Mangrove ⏳ · Template ⏳

### 2026-10-02 · Mobile sticky CTA, alert icon placement, hero back button
- **Layer:** Directory
- **Change:** (1) On mobile, when a destination has a guided tour, a bottom sticky bar shows guide avatar, "Y aller avec {guide}", duration · price and a "Réserver" button (44px min). It slides away while scrolling down and returns when scrolling up. (2) The red "!" alert icon sits next to the type pill (e.g. "Bassin naturel") in the hero, not after the H1. (3) The "← Tous les résultats" button is aligned with the hero title's content edge (same 1120px container + 20px padding). (4) The "● Ouvert" access pill is removed from the hero.
- **Why:** Constant booking access on mobile without blocking reading; cleaner title line; consistent left alignment.
- **How to apply elsewhere:** Sticky bar only if a tour exists and viewport < 1024px; hide on scroll-down via transform. Hero overlays share one container.
- **Status:** Guadeloupe ✅ (v10: 1, 2 · v11: 3, 4) · Mangrove ⏳ · Template ⏳

### 2026-10-02 · Destination editorial block + unified safety alert
- **Layer:** Places
- **Change:** The "Aperçu" section is now structured as: eyebrow + SEO H2 (name + what it is + commune) → intro paragraph (the one-sentence `lead` now sits in the hero as the H1 subtitle: serif italic 18–21px, white 94%, max 560px) → optional "En sortie guidée" paragraph → "Bon à savoir" key-value list (Quand y aller, physical facts, À proximité, Aussi appelé) → full site alert card (#alerte-site). A small red "!" icon (22px, thin white ring) sits after the hero H1; hover/focus shows a tooltip ("{alert.short} · Voir les risques ↓"), click scrolls to that card. Only three text styles: serif (H2 + lead), 16px body, 11px uppercase H3 labels.
- **Safety alert (one pattern everywhere):** coral card (#FCEBE4, 1px #E7B4A0 border, 14px radius), red "!" circle, bold title, one sentence, optional bullet list of site-specific risks, link to the safety section. Used in Aperçu and Sécurité (risk chips now live inside it). No ⚠️ emoji.
- **Microcopy:** "En images" → "{Nom} en photos"; "Sécurité et équipement" → "Avant de partir : sécurité et équipement"; "À prendre" → "Dans le sac".
- **Photos section:** split into two minimal groups, each with an 11px uppercase label and one grey caption line: "Le site" (what you see on your own) and "En sortie guidée" (what only the guided outing shows). Captions come from per-site `photoCaptions {site, guided}`. Photo slots only show on sites that have that data; "En sortie guidée" only shows when the site has a tour. Sites with neither keep the old single grid, or no section if there are no photos.
- **Guide sidebar card:** removed the "Détails de la sortie" link and the "Aussi proposé par" alternative guide, so the main guide stays the only option.
- **Why:** Clearer first read, a better SEO H1/H2 + intro, and risks shown before the reader commits.
- **How to apply elsewhere:** Add per-destination fields `h2`, `lead`, `intro`, `moreTitle`, `expect`, `season`, `keyInfo[]`, `alert{title,text,items[]}`. Fallbacks: H2 "Découvrir {nom}", intro = desc, generic flood alert.
- **Status:** Guadeloupe ✅ (v10, Saut d'Acomat content; 9 destinations ⏳) · v11 ⏳ · Mangrove ⏳ · Template ⏳

### 2026-10-02 · Facts bar on mobile: 3-column grid
- **Layer:** Places
- **Change:** Below 1024px the facts bar is a full-width 3-column grid (1px hairline dividers, 56px min tap height). Values wrap instead of truncating.
- **Why:** The wrapping flex row left uneven rows and cut values with ellipses on phones.
- **How to apply elsewhere:** `grid-template-columns: repeat(3, minmax(0,1fr))`, gap 1px on a border-coloured background, white cells. Keep 6 facts so the grid fills two full rows.
- **Status:** Guadeloupe ✅ (v10) · v11 ⏳ · Mangrove ⏳ · Template ⏳

### 2026-10-01 · Data rule: parking describes the site
- **Layer:** Places
- **Change:** Parking always describes the site itself (location, cost, capacity), never the guide's meeting point. Removed the "Au RDV" short value. v10 also adds Parking to the facts bar and puts a minimal guide CTA block right next to it.
- **Why:** The facts bar is about the destination; guide logistics belong in the guided tour section.
- **How to apply elsewhere:** In the data, the parking field = site parking only. Meeting point goes in the tour data.
- **Status:** Guadeloupe ✅ (v10, v11) · Mangrove ⏳ · Template ⏳

### 2026-10-01 · Details page (v11): compact hero facts bar + guide CTA
- **Layer:** Places
- **Change:** Hero facts bar uses short labels (Niveau, Durée, Approche, Âge, Baignade) and short values (e.g. "6 h", "14 ans +", "Oui"). Full value shows on hover. Cells size to their content, and a guide CTA sits at the right ("Y aller avec {guide}" · price · Réserver). The mobile grid uses the same short copy.
- **Why:** Save width, read faster, link the facts to booking.
- **How to apply elsewhere:** Keep fact labels to 1 word and values to 1–3 words. Derive the short values from the full data, never edit the source. Show the CTA only when a guided tour exists.
- **Status:** Guadeloupe ✅ (v11) · Mangrove ⏳ · Template ⏳

### 2026-10-01 · Details page: unified key-info card
- **Layer:** Places
- **Change:** "En bref", description, what to expect, key facts, season, alternative names and flood warning are now one card: editorial text on top (one size, 15.5px), an emoji fact grid (Difficulté, Durée, Approche, Âge, Baignade, Route, Parking; only filled fields show), then rows for best period, alternative names and flood risk. Removed the hero stats bar, the mobile stats grid, the jump-nav pills and the open/closed access status (pill + line).
- **Why:** Too many font sizes and styles; key info was scattered. We don't publish open/closed status.
- **How to apply elsewhere:** One sans family, two text sizes (12.5px labels, 15–15.5px body). Facts as dl/dt/dd for SEO. Never show access status. (2026-10-02 v12: still no live status; dated, sourced closures are shown via `location_policy: closed`.)
- **Status:** Guadeloupe ✅ (v10) · Mangrove ⏳ · Template ⏳

### 2026-10-01 · Details page: remove "Y aller seul ou accompagné ?"
- **Layer:** Site
- **Change:** Removed the solo vs guided comparison section and its "Seul ou guidé" nav anchor. "Sortie guidée" stays.
- **Why:** Owner decision: section not wanted.
- **How to apply elsewhere:** Do not include the comparison section on detail pages; drop its jump-nav entry. Supersedes that part of the 2026-09-30 v10 entry.
- **Status:** Guadeloupe ✅ (v10, v11) · Mangrove ⏳ · Template ⏳

### 2026-09-30 · Details page v11: less is more
- **Layer:** Places
- **Change:** Eyebrows and section rules removed; H3 in sentence case; emoji replaced by Lucide line icons (aria-hidden + visible label); Aperçu reduced to one lead; inline safety alert and guide row removed; access status once (hero pill → FAQ); chips → "Sur cette page" disclosure; Sortie header white with operator rule and single mobile CTA; value tiles removed; risks/gear as lists; 3 matched intent links; Sources as footer; mock social hidden. Tour sub-blocks stay open (v8 decision).
- **Why:** Duplicates (guide ×6, access ×4, safety ×4), ≈30 caps labels and ≈25 emoji created noise without adding information.
- **How to apply elsewhere:** (superseded) Playbook §3 "v11". All removed text either duplicated other visible text or moved to a visible equivalent; nothing indexable is hidden behind hover.
- **Status:** Guadeloupe ⏳ (preview: `Guadeloupe v11 Details.dc.html`) · Mangrove ⏳ · Template ⏳

### 2026-09-30 · Details page v10: access status, En bref, seul ou guidé, internal links
- **Layer:** Places
- **Change:** Access status field (pill in hero, En bref, FAQ, Sources). "En bref" answer card with name variants. Key facts as `<dl>`. "Y aller seul ou accompagné ?" comparison before the guided tour. "Explorer aussi" links to intent pages. FAQ drops non-answers. Closed sites excluded from nearby. Canyon Ferry approach aligned with operator (25 min).
- **Why:** SEO audit: the most searched fact (can I go?) was missing; content not extractable; guide pitch lacked a value-first bridge; no internal links to landing pages.
- **How to apply elsewhere:** (superseded) Playbook §3 "v10". Airtable: add statut_acces, note_acces, source_acces, date_verification, noms_alternatifs.
- **Status:** Guadeloupe ⏳ (preview: `Guadeloupe v10 Details.dc.html`) · Mangrove ⏳ · Template ⏳

### 2026-09-30 · Key facts: fixed set, "—" for missing
- **Layer:** Places
- **Change:** Key-info strip/grid always shows all 5 categories; missing values display a grey "—" (was: hidden, or "Non renseigné" on desktop).
- **Why:** A single lone tile looked broken and hid which info exists for comparable sites.
- **How to apply elsewhere:** Same fixed set per vertical; "—" in `#98A19B`.
- **Status:** Guadeloupe ⏳ (v9) · Mangrove ⏳ · Template ⏳

### 2026-09-30 · Details page v9: text display, type scale, value-first order
- **Layer:** Places
- **Change:** Operator removed from the hero (mobile bar → compact row in Aperçu; desktop hero badge removed). Aperçu always present with description as lead; pull quote and hero lede removed. Mobile key facts as 2-col grid. One-line breadcrumb and safety alert. Name in 3 H2s. Reviews in italic serif. Certification tile and "Esprit" fact removed; gear lists in 2 columns; nearby cards compact. Detail page reduced from 24 to 10 font sizes and 11 to 3 line-heights, also in `Guide Offer Card`.
- **Why:** Operator appeared before any value; description shown twice; key facts hidden in a horizontal scroll; headings wrapping; inconsistent type.
- **How to apply elsewhere:** (superseded) Playbook §3 "v9" and §4 type scale.
- **Status:** Guadeloupe ⏳ (preview: `Guadeloupe v9 Details.dc.html`) · Mangrove ⏳ · Template ⏳

### 2026-09-30 · Details page v8: dedupe, chips, social row, sources
- **Layer:** Places
- **Change:** One fact, one place (approach walk only in key-info strip). Guide quote only in Sortie block. Non-wrapping, capitalised chips. Social posts as mobile snap-scroll row. Nearby limited to verified sites. Sources merged into one card with a verification explanation line.
- **Why:** Same data repeated 3×; near-duplicate guide texts; broken chips; heavy stacked social cards; unconfirmed sites promoted; unexplained "Non vérifié".
- **How to apply elsewhere:** (superseded) Playbook §3 "v8 refinements".
- **Status:** Guadeloupe ⏳ (preview: `Guadeloupe v8 Details.dc.html`) · Mangrove ⏳ · Template ⏳

### 2026-09-30 · Details page v7: block system, order, editorial, data cleanup
- **Layer:** Places
- **Change:** New section order (Aperçu → Photos → Sortie → Accès → Sécurité et équipement → Réseaux → FAQ → À proximité → Sources). One section pattern (eyebrow + H2 at column edge, `clamp(32px, 6vw, 48px)` padding, top rule); text sections plain, structured data in white cards (radius 16, padding 20). Editorial measure 65ch, lead 17px. Empty fields hidden. Access as fact tiles; "Âge conseillé" and approach moved to the key-info strip; Type/Île/Commune removed from the strip (already in hero + breadcrumb). Sortie block tabs → stacked sub-blocks, no footer buttons. Fixed bottom bar removed; mobile hero bar CTA now "Réserver". Draft badge and empty "years here" hidden. Source link label depends on publisher. "canyon" type label added.
- **Why:** Mixed boxed/unboxed blocks didn't align; tabs and "Non renseigné" rows made the page hard to scan on mobile; booking CTAs were repeated 3–4 times.
- **How to apply elsewhere:** See (superseded) Playbook §3 "Destination page · v7".
- **Status:** Guadeloupe ⏳ (preview: `Guadeloupe v7 Details.dc.html`) · Mangrove ⏳ · Template ⏳

### 2026-09-30 · Destination page as a small landing page (proposal, v6 preview)
- **Layer:** Places
- **Change:** Tabs replaced by stacked sections, each with an eyebrow + H2 that includes the destination name (Aperçu, Accès, Sécurité, Équipement, Sortie guidée, Photos, Réseaux, FAQ, À proximité, Sources et crédits). Visible breadcrumb + anchor chip row under the hero. Guide Offer Card now sticky beside the first four sections (desktop). FAQ generated from fields (location, baignade, guide, risques, période) as `<details>`. JSON-LD injected: TouristAttraction, FAQPage, BreadcrumbList, + Product/Offer when a tour exists.
- **Social block:** curated posts only (Airtable: site, platform, url, thumb, author, caption). Hidden when a site has none.
- **No partner:** no beige "sorties à proximité" band and no bottom CTA bar; one neutral line "Voir les guides en Basse-Terre →" at the end of Équipement.
- **Why:** Tabbed content has no heading hierarchy for search engines and hides key info; a single page with named H2s works as the reference sheet, the SEO page and the booking entry point.
- **How to apply elsewhere:** Same section order and H2 pattern "{Sujet} à {Nom}". Sections with no data show "Non renseigné" (core sections) or are hidden (Photos, Réseaux, À proximité, Sortie). Add a Social table to Airtable.
- **Status:** Guadeloupe ⏳ (preview: `Guadeloupe v6 Landing detail.dc.html`) · Mangrove ⏳ · Template ⏳

### 2026-09-29 · Desktop side card on detail page (proposal, v5 preview)
- **Layer:** Directory
- **Change:** On viewports ≥1024px, when the destination has at least one guided tour, the info-tabs block sits in a two-column row with a 340px `Guide Offer Card` on the right (guide, tour name + 3 facts, price, "Réserver sur {op}" + "Écrire à {guide}", link to `#sortie`, alt-operator link). No tour → single column, no reserved space. Mobile unchanged.
- **Why:** Puts the guided option next to the free info without colouring the page; the full `#sortie` block stays below.
- **How to apply elsewhere:** Reuse `Guide Offer Card.dc.html` (takes the same `tour` object as the sortie block). Breakpoint via `matchMedia` in logic (inline styles can't hold media queries). Not sticky by default: the tabs row is short, so sticky has no effect; the fixed bottom CTA bar already persists.
- **Desktop hero (same preview):** the key-info bar (difficulté, durée…) replaces the guide bar on the hero's bottom edge (half-overlapping, white, shadow). When a guide proposes the site, a floating pill "Y aller avec {guide}" (avatar, operator, price, links to `#sortie`) sits top-right of the hero. Mobile keeps the guide bar on the edge and the info bar in the body.
- **Hero lede (same preview):** the destination subtitle moves from the body pull quote to directly under the H1 (Instrument Serif italic 19px, white 92%, max 620px), followed by a small uppercase 📍 commune line. Order: type badge → H1 → lede → location. Body pull quote removed (tweak `quotePlacement` keeps the old placement for comparison).
- **Status:** Guadeloupe ⏳ (preview: `Guadeloupe v5 Side card.dc.html`) · Mangrove ⏳ · Template ⏳

### 2026-09-29 · Detail page v4 (simplified, supersedes C16–C18)
- **Layer:** per rule (see the tag in each row)

| # | Rule | Why | How to apply elsewhere | Guadeloupe | Mangrove | Template |
|---|------|-----|------------------------|---|---|---|
| C21 | **[Places]** One default destination page for every item: hero → short intro as a pull quote (serif italic ~23px, oversized “ in the CTA colour, small uppercase caption "Type · Commune", max ~760px) → one-line key-info strip (Type, Île, Commune, Difficulté, Durée, Baignade) → tabbed card (Aperçu · Accès · Sécurité · Équipement · Photos · Source). One tab open at a time, no long scroll. Missing data = "Non renseigné", tab always present. | Simple, scannable, identical structure everywhere. | Same tabs per vertical; rename tab labels only if the vertical requires it. | ✅ v4 | ⏳ | ⏳ |
| C22 | **[Directory]** Guided destinations add three elements only: (1) a white guide bar straddling the hero's bottom edge (avatar, "Guidé par X · Opérateur", duration · age · price, "Voir la sortie"), (2) the fixed bottom booking bar, (3) a dedicated "Y aller avec X" card below the destination tabs. | Guide offer is visible from the first screen without mixing with site info. | Same three elements, driven by the offer ↔ destination link. | ✅ v4 | ⏳ | ⏳ |
| C23 | **[Directory]** Guide card: compact operator-coloured header only (avatar, "Y aller avec X", certification · rating, price); body on white with its own tabs (Le guide · Programme · Inclus · Pratique · Avis); footer actions "Écrire à X" + "Réserver sur Opérateur". Operator colour used only on small elements (header, active tab, icon tiles, dots). | Large coloured backgrounds hurt readability; colour should catch attention on small blocks. | Never put long text on operator-colour backgrounds. | ✅ v4 | ⏳ | ⏳ |
| C24 | **[Site]** No "Autre formule" block. | One guide per destination in practice. | — | ✅ v4 | ⏳ | ⏳ |

### 2026-09-29 · Detail page v3 (Jordan audit)
- **Layer:** per rule (see the tag in each row)

| # | Rule | Why | How to apply elsewhere | Guadeloupe | Mangrove | Template |
|---|------|-----|------------------------|---|---|---|
| C15 | **[Directory]** One page per destination. Guided tours are a block inside it, never separate pages. Offer cards open the destination with that tour selected. | Canyon info and tour info were mixed across 2–3 pages per site. | Destination = listing item; offers link to it via a site ID. Offers without a destination get a destination entry ("Non renseigné" where unknown). | ✅ v3 | ⏳ | ⏳ |
| C16 | **[Directory]** Destination page order: hero (site) → slim guide teaser strip (guided only: avatar, "Guidé par X · dès Y €", "Voir la sortie ↓") → "Le site" (intro, photos, evergreen sheet, sécurité) on neutral cream/white → full-width operator-coloured "Y aller avec [guide]" band → pre-footer/footer. | Canyon info is clearly neutral and complete; the tour is clearly a separate, human offer. | Same order for every vertical; operator colour only on the tour band. | ✅ v3 | ⏳ | ⏳ |
| C17 | **[Directory]** Tour band content, in order: guide card (photo, name, certification, years on this site) + "Le mot du guide" · "Pourquoi je vous emmène ici" (story, flagged "Brouillon à valider" until the guide approves) · facts grid · "Ce que [guide] vous apporte" (only claims true for all operators: équipement fourni, petit groupe, guide diplômé d'État) · programme · fourni / à prévoir · rendez-vous · price card with "Réserver sur [operator]" (primary) + "Écrire à [guide]" (secondary) · reviews naming the guide · "Autre formule sur ce site" (other operator). | Makes going with the guide the obvious choice through a person, not a sales pitch. | Value claims must be validated per operator; drafts always flagged. | ✅ v3 | ⏳ | ⏳ |
| C18 | **[Directory]** Shared destinations have a "main" tour set per destination; the other operator's tour appears as "Autre formule". | Operator decides, no confusing side-by-side. | Store a main flag on the offer. | ✅ v3 | ⏳ | ⏳ |
| C19 | **[Directory]** Unguided destinations end with "Sorties guidées à proximité": one best-matching tour per operator (same commune first), explicitly labelled as not passing through this site. Sticky bar: "Demander conseil à un guide". | Always a next step without misleading. | Same rule per operator. | ✅ v3 | ⏳ | ⏳ |
| C20 | **[Directory]** Listing site cards show "Sortie guidée dès X €" when a tour runs there, "Non guidé" otherwise. Hero uses the site photo, else the tour photo, else an illustration. | Card tells the truth about guided availability. | Derived from the offer ↔ destination link. | ✅ v3 | ⏳ | ⏳ |

### 2026-09-29 · List view card
- **Layer:** per rule (see the tag in each row)

| # | Rule | Why | How to apply elsewhere | Guadeloupe | Mangrove | Template |
|---|------|-----|------------------------|---|---|---|
| C14 | **[Core]** Detail pages show a "Photos" section (thumbnail grid + count) right after the intro whenever the item has real photos. Clicking a thumbnail or the cover opens a full-screen carousel (arrows, dots, counter, credit, Esc / ← →, tap outside to close). Illustration (stock) photos are never included. | Photos are the strongest trust signal; the cover invites exploring them. | Read all photos from the item's photo field (first = cover); hide the section only when there are no real photos. | ✅ | ⏳ | ⏳ |
| C13 | **[Core]** Opening any detail page (card click, CTA, "same spot" link) always lands at the top (hero), never at the previous scroll position. | Visitors must start from the hero and summary, not mid-page. | Reset scroll on every navigation to a detail view. | ✅ | ⏳ | ⏳ |
| C12 | **[Directory]** List (inline) cards: price sits top-right on the badge row (price + unit stacked, right-aligned; "Non guidé" for unguided items). Location, duration, age and style merge into one wrapping meta row. CTA centered on its own row. Image column scales with the card: `clamp(104px, 30%, 260px)`, min-height 128px, cover-cropped. | Saves a full row of height on mobile and desktop; price is scanned first in the top-right, the action stays obvious; the photo carries more weight on desktop without squeezing text on mobile. | Same order in every list-view card: badges ↔ price / title / meta row / centered CTA. | ✅ | ⏳ | ⏳ |

### 2026-09-29 · Jordan review round
- **Layer:** per rule (see the tag in each row)

| # | Rule | Why | How to apply elsewhere | Guadeloupe | Mangrove | Template |
|---|------|-----|------------------------|---|---|---|
| C1 | **[Places]** Safety info lives in a dedicated, always-present "Sécurité, avant d'y aller" section on every detail page (general warning + item-specific risk chips). Risk chips never appear on listing cards. | Cards stay light; safety is never optional on the page where people decide. | One section per detail template, placed after the main content and before the booking/same-spot block. Adapt copy to the vertical's hazard (tide, current, weather). | ✅ | ⏳ | ⏳ |
| C2 | **[Places]** Global safety banner can be folded but never dismissed. Folded state = compact chip with a dedicated icon, sitting in the results toolbar next to the grid/list toggle. Expanded = warning style (red-orange tint, solid "!" icon, "ATTENTION" eyebrow, bold title, one-line body, fold button). | Keeps the warning reachable at all times without eating a full row; must read as a real warning, not an info note. | Same component; swap copy per vertical. Keep warning colours distinct from brand/operator colours. | ✅ | ⏳ | ⏳ |
| C3 | **[Directory]** Each operator gets a clearly distinct brand colour (different hue, not two shades of one hue). Used on badges, CTAs, testimonial block and operator card. | Visitors must tell operators apart at a glance. | Pick operator colours from different hue families; check white text contrast ≥ 4.5:1. | ✅ Yalodé deep green #14342A · Wild Canyon terracotta #A2471F | ⏳ | ⏳ |
| C4 | **[Directory]** Hero operator pills sized for tap (≈ 14px label, 42–49px avatar); wrap on narrow screens; container never clips (no overflow on the pill row) so avatars overflow the pill freely on top. | Readability and mobile tap targets; avatars were cut off. | Same markup; keep avatar size ratio per guide photo weight. | ✅ | ⏳ | ⏳ |
| C5 | **[Directory]** Operator badge on cards shows one visual only (guide avatar). No logo + avatar pairs, no empty circles. The guide avatar appears on every operator mention: hero pills, card badges, filter chips, detail CTA, operator cards. | An empty/failed logo read as a broken avatar. | Prefer guide photo; fall back to logo only when no photo exists. | ✅ | ⏳ | ⏳ |
| C6 | **[Site]** Guided-offer card status reads as a guided experience (🪢 "Canyon guidé"), not a generic landscape icon. | Communicates the offer, not the scenery. | Use an activity/equipment icon + "[activité] guidé(e)". | ✅ | ⏳ | ⏳ |
| C7 | **[Site]** Offer card CTA: "Y aller en sécurité". | Requested by Jordan. Note: tension with B10 (no absolute safety claims). "En sécurité" is accepted as a framing, not a guarantee. | Same label on all guided-offer cards. | ✅ | ⏳ | ⏳ |
| C8 | **[Core]** Ratings: drop the decimal when it's zero (5 not 5,0); small gap between number and ★. Hero pill avatars: tight gap to label (≈4–7px) and a subtle white glow. | Cleaner reading, avatar reads as part of the pill. | Format ratings with one helper everywhere (pills, badges, cards). | ✅ | ⏳ | ⏳ |
| C9 | **[Core]** Primary CTAs (card "Y aller en sécurité", detail "Y aller avec…", "Réserver sur…") always use the site's single CTA colour (#E2603C), never the operator colour. Operator colour stays on badges and operator blocks only. | One recognisable action colour; the brand, not the operator, owns the conversion path. | Define one CTA colour per site; operator colours never on buttons. | ✅ | ⏳ | ⏳ |
| C10 | **[Directory]** Pre-footer (both operator cards + founder letter) and footer appear on every page, including detail pages. Footer always carries the safety disclaimer (warning style) above the legal line. Footer links return to the listing with the filter applied. | The two founders are always pushed; safety disclaimer is never missing. | Shared layout block rendered after any view; add a spacer on pages with a fixed bottom CTA bar. | ✅ | ⏳ | ⏳ |
| C11 | **[Places]** Evergreen detail structure for unguided items, mirroring the guided offer page: "Le site, en détail" card with anchor bar (Aperçu · Accès · Équipement · Sorties guidées · Source), 6-stat grid, "À quoi s'attendre", best period, access rows, gear, guided-offer status, source + verification. Every slot always renders; missing data shows "Non renseigné" (muted italic) instead of hiding. Header shows verification level + "fiche complétée à X %". | Every page has the same strong, scannable structure; gaps are visible, honest and easy to fill later from the database. | Drive all slots from the item's data fields (same field names as the database); never hide a slot because it's empty. | ✅ | ⏳ | ⏳ |

<!-- New entries go here, newest first -->

### 2026-09-29 · SEO intent pages ("Idées de sorties")
- **Layer:** Directory
- **Change:** one page per real search intent (e.g. canyoning with kids, easy-access waterfalls, river swimming, beginner, no-rope, thrill, half-day). Each page: breadcrumb, H1 matching the query, one-line intro, data-driven fact chips (count, price from, min age), results split "Avec un guide" / "Sans guide", safety note, FAQ generated only from data (age, price, gear included, gear to bring), links to the other intent pages. Linked from a footer group "Idées de sorties" (replaces "Pour qui").
- **Why:** match existing searches, mix guided offers with free destinations, add internal links.
- **Rules:** pages are filters over the data, never hand-written lists; FAQ answers are computed, never invented; destinations with an access ban are excluded from free-access lists; each page sets its own title; opening a page scrolls to top.
- **Apply elsewhere:** define 6–8 intents per vertical (Mangrove: kayak en famille, mangrove en paddle, sortie au lever du soleil…) as filter + intro + safety line.
- **Status:** Guadeloupe ✅ (v4) · Mangrove ⏳ · Template ⏳
- **Update (landing layout):** full-bleed photo hero (breadcrumb, eyebrow, H1, intro, fact pills, CTA "Voir les N résultats ↓", both guide avatars) → 3 overlapping "à savoir en bref" tiles → "Notre choix pour vous" featured tour with guide quote → other tours → guide quote band in the other operator's colour → free-access sites → safety note → FAQ (2 columns) → related pages as photo tiles. Per page: eyebrow, hero photo, featured tour id, 3 points written only from data.
