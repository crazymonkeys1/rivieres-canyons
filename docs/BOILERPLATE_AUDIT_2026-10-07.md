# Directory boilerplate: Rivières & Canyons vs Mangroves (2026-10-07)

**Goal:** one boilerplate for directory websites used as lead magnets. It should be strong where every directory needs the same thing, and open where sites differ.
**Compared:**
- Rivières & Canyons: this repo, after phase 1.
- Mangroves Gwada: Claude Design export "Guadeloupe Mangrove Directory 3", including:
  - `Mangroves Guadeloupe (Detail landing v12).dc.html`, `docs/`, `design-system/`, `data/mangroves-db.json` and `airtable/` (17 tables).

**Method:** I read both projects' rules, design values, component lists, data and SEO documents, and the Mangroves design's built-in data and search-engine logic. I did not render either prototype.

## 1. Verdict

The two projects were built by the same method and agree on most things:
- the same atomic levels (L0 to L7);
- names that describe a role, not a look; variants as props;
- weights 400 and 600 only; mobile-first with no layout decided in JavaScript;
- folded disclaimers; one filled action per area;
- real, sourced reviews only, and a credit on every photo.

That shared core is the boilerplate. Each project also solved problems the other hasn't:
- **Mangroves is ahead on content governance and data:** publish status and confidence, a separate table for images with their usage rights, typed sources, SEO fields on each record, interface text editable in Airtable, zones and activities.
- **Rivières & Canyons is ahead on build safety and conversion:**
  - location policy and dated closures;
  - completeness score with `noindex`;
  - selection rules stored as data;
  - strict validation with Zod; the production build fails on placeholders;
  - tracked links and a lead form with a defined format.

The boilerplate should take the best of both and keep site-specific choices (palette, fonts, emoji or icons, exact breakpoints) out of the rules.

## 2. Side by side

| Topic | Rivières & Canyons | Mangroves | Boilerplate |
|---|---|---|---|
| **Atomic levels** | L0–L7, folder = layer (core / directory / places / app) | L0–L7, folders by level only | Keep both axes: level **and** layer (the layer axis is what makes a second site cheap) |
| **Token naming** | `--text-*`, `--surface-*`, `--border-*`, `--brand`, `--accent`, `--fs-*`, `--fw-*` | `--color-{text,surface,border,action,status,operator,overlay,social}-*`, `--font-size-1…8`, `--radius-control/container/full`, `--elevation-*` | One convention. Mangroves' grouped `--color-*` scales better and is free to adopt before code exists. **Decision B1** |
| **Tiers** | Primitives + semantic | Primitives + semantic + **tier-3 local component tokens** | Add tier 3 (local tokens set from tier 2): lets a component vary per site without new global tokens |
| **Text styles** | 10 + 2 modifiers; 3 families (display serif, **reading serif for prose**, UI sans) | 11 (`display, heading, title, quote, lead, body, body-strong, caption, caption-strong, legal, eyebrow`); 2 families | A common set of text **roles** (§5.3); each site maps them to its own faces. Number of font families = site choice |
| **Breakpoints** | 480 / 1024 | 600 / 880 / 1180 | Boilerplate fixes the *rule* (mobile-first, `min-width` only, ≤ 3 steps); values per site theme |
| **Icons** | Emoji, decorative (J5 open) | SVG line icons, no emoji | SVG icon set in core (one meaning, one icon); emoji allowed as a site theme option. **Decision B2** |
| **Unverified data** | `estimated_fields` in data, no component | `CautionNote` "à confirmer" component + confidence per site | Take both: data flag **and** a component that shows it |
| **Publishing gate** | Completeness score → `noindex` | `Status` (Publié / Masqué) + `confidence` (`à vérifier` hides) | Three separate gates: **status** (shown or not), **confidence** (verified, partial, to check), **completeness** (indexed or not) |
| **Location** | island + communes; `location_policy`; dated access status | island + commune + **zone**; `access` (libre / guidé / payant); GPS when a source publishes it | Area, then zone, then localities, plus `location_policy` and geo (when sourced and allowed) |
| **Facts** | Canyon facts hard-coded in the shared layer | Mangrove facts (activities, kidFriendly, birdwatching, pmr…) hard-coded | **Facts defined per site in config** (the main gap in both) |
| **Images** | Inside each place record | **Own table**: order, cover, rights status, relevance, source page, licence | Own entity, with rights status; the build refuses images whose rights are "permission needed" in production |
| **Sources** | One source per place + press | **List per site, typed** (officiel / office-tourisme / opérateur / média) + ranked reference sources | Typed list per listing + a ranked source list per site (research method) |
| **Offers per listing** | 0..n, one `is_main` | `servedBy`: none, one or both operators | Same model (0..n offers, one main) |
| **Listing pages** | By type and commune, 3+ places | By island, commune, **activity**, guided; no threshold | Any configured dimension (type, locality, zone, activity, audience), 3+ published listings |
| **Articles** | Selection rules as data, angle notes per entry | Sections + FAQ tables, "Filter rule" as text, quick answers | Our rules + their Sections/FAQ tables |
| **Interface text** | `ui-copy.json` (not mapped yet) | **`Site Copy` table** keyed by page/section | Copy table keyed by stable key (Airtable-editable) |
| **Research memory** | none | **Rejected Sites** with reason | Keep: stops re-adding places already excluded |
| **SEO fields** | Computed in templates | SEO title, SEO description, URL path per record | Computed by default, **optional override** per record |
| **JSON-LD** | TouristAttraction, FAQPage, BreadcrumbList, Product/Offer | TouristAttraction (+ImageObject with credit and licence, geo, containedInPlace, dateModified), **TouristTrip + Offer + LocalBusiness**, FAQPage, BreadcrumbList | Mangroves' destination graph is the better default; rating never self-marked |
| **LLM layer** | llms.txt, llms-full.txt, Markdown twins, AI bots allowed | Opening answer sentence = meta description; no-JS HTML required | Both |
| **Conversion** | `/go/book`, `/go/whatsapp` with logging; lead form with D1, Turnstile, consent | UTM convention per placement; lead form "intent only" | Ours, plus Mangroves' UTM naming |
| **Stack** | Decided (Astro, Cloudflare) | Undecided | Ours |
| **Process** | Stop and ask on any judgment call | Use the nearest option, list a **"Proposed addition"** | Mangroves' way for small things, ours for content, legal and money (less blocking) |

## 3. Adopt from Mangroves

1. **Publish status and confidence on every listing.** These are separate from completeness: a page can be complete but hidden, or shown but not indexed.
2. **An Images entity:** order, cover, caption, credit, licence, rights status (`free` / `permission_needed` / `partner`), relevance (subject or context), source page. The production build refuses `permission_needed`.
3. **Typed sources per listing,** plus a ranked list of reference sources per site. It documents how research is done and is reused for the next site.
4. **Zone level** (a group of places, such as Grand Cul-de-Sac Marin) and `containedInPlace` in JSON-LD. Zones become hub pages when they have 3+ places.
5. **Activities and audiences as data** (multi-select and yes/no), driving filters and listing pages.
6. **Optional SEO overrides** per record (title, description), computed when empty.
7. **A copy table** for interface text, editable in Airtable without code.
8. **Research memory:** rejected listings with a reason.
9. **`CautionNote`** ("à confirmer") wherever a value is an estimate.
10. **Tier-3 component tokens** and the `(hover: hover)` rule for hover-only effects.
11. **SEO details:**
    - an opening answer sentence that also serves as the meta description;
    - question-style H2s where they read naturally;
    - title pattern `{Listing} ({Locality}) : {activité}, infos pratiques`;
    - `ImageObject` with credit and licence; `TouristTrip` + `LocalBusiness` for offers; `dateModified`;
    - `hreflang` ready;
    - FAQ: a question without data for this listing is omitted, never filled with generic text.
12. **A comparison page pattern** ("Bateau ou kayak"): one neutral choice page when a site has two ways of doing the same thing.
13. **A glossary of domain words** per site (site / zone / operator / guide / tour / article). It prevents the "guide = person or article?" confusion.

## 4. Keep from Rivières & Canyons

1. **Location policy** (`public`, `commune_only`, `guide_only`, `closed`) and dated access status. Mangroves has `access` (libre / guidé / payant), which answers another question (how you get in). Keep both.
2. **Completeness score → `noindex`,** with key fields from site config.
3. **Selection rules stored as data,** checked at build. Mangroves' "Filter rule" is text and its activity pages are JavaScript functions.
4. **Validation that fails the build:** schema, links between records, placeholders, draft texts, unsourced ratings, images without credit.
5. **`signature` + `signature_status`,** and a safety-claim rule per site (here: only in guided content).
6. **Tracked exits** (`/go/book`, `/go/whatsapp`) and the lead format with consent and Turnstile.
7. **llms.txt, llms-full.txt, Markdown twins,** and robots rules that allow AI crawlers.
8. **The four layers.** Mangroves has no layer split, so its operator colours, zones and copy would leak into shared code.

## 5. The boilerplate (proposal)

### 5.1 What every directory has (core + directory)
- **Entities:**
  - Listing; Operator; Guide; Offer (0..n per listing, one main); Review;
  - Article (+ sections, FAQ, selection rule); Image; Source;
  - Copy (interface text); Rejected listing.
- **Listing, generic fields:**
  - identity: slug, name, type, alt names;
  - state: status, confidence, `last_reviewed_on`;
  - location: area, zone?, localities[], geo?, `location_policy`;
  - editorial: summary/answer, signature (+status), intro, tip (+guide);
  - safety: alert, risks, folded disclaimer;
  - FAQ; images[]; sources[]; estimated fields; SEO overrides;
  - `facts{}`.
- **Page types:**
  - home/listing;
  - detail;
  - landing page per dimension;
  - article and article index;
  - guide profile;
  - comparison (optional);
  - document (privacy, legal).
- **Detail page sections:**
  - hero + key facts; overview (answer, signature, tip, good to know);
  - photos; access (by policy); safety;
  - guided offer(s); social; press;
  - FAQ; nearby; explore; sources and breadcrumb; about us.
  - **Each section renders only when its data exists.**

### 5.2 What each site defines (one config file)
- **Facts:** key, label, type (number, range, choice, yes/no, text), unit, icon, filter yes/no, shown in key facts yes/no, counts for completeness yes/no, JSON-LD property.
  - Canyons: difficulty, duration, approach, min age, swimming, has waterfall, season.
  - Mangroves: activities, difficulty, duration, distance, kid friendly, birdwatching, PMR, protection.
- Vocabularies: listing types, activities, risks, protection labels, verification labels.
- Location levels and their labels ("Île", "Zone", "Commune").
- Landing-page dimensions and the 3+ threshold.
- Conversion: operators, booking and WhatsApp channels, UTM source name.
- Copy rules (safety-claim scope, tone) and the domain glossary.
- Theme: palette (tier 1), fonts, radii, breakpoint values, emoji or icons. Operator colours come from operator data.

### 5.3 Shared text roles (each site maps them to its fonts)

| Role | Canyons today | Mangroves today | Use |
|---|---|---|---|
| display | `t-h1` | `text-display` | the H1 |
| heading | `t-h2` | `text-heading` | section H2 |
| title | `t-title` | `text-title` | names, prices |
| quote | `t-quote` (+ `t-pull`) | `text-quote` | a person speaking |
| lead | (none) | `text-lead` | first paragraph |
| read | `t-read` | (`text-body`) | long prose (a site may map it to body) |
| body / body-strong | `t-body` / `is-strong` | `text-body` / `text-body-strong` | UI text and values |
| caption / caption-strong | `t-small` | `text-caption` / `-strong` | meta, chips |
| legal | (`t-small`) | `text-legal` | folded fine print (may map to caption) |
| eyebrow | `t-micro is-upper` | `text-eyebrow` | orientation label |

Twelve roles at most. A site can point two roles to the same style (for example `read` to `body`), and no site adds a thirteenth.

## 6. Issues found in Mangroves (relevant when it is built on this boilerplate)
- **Hash routes, and title, meta and JSON-LD added by JavaScript.** The boilerplate's static Astro build solves both.
- **Operator colours in global tokens** (same issue as ours). Move them to operator data.
- **Free-text facts** ("Demi-journée à journée", "3 h à 1 journée"), and the `island` field mixes island and sub-island. They become minute ranges and location levels.
- **Leftover development tables:** `Hero Palettes`, plus `Islands` emoji and colour columns. Drop them.
- **Placeholder guide photos (`randomuser.me`) and an unconfirmed Parc national status** for Yalodé. The production checks would block both.
- **Much editorial content still lives in the prototype's code** (`V9`, `ARTICLE`, `OP_ABOUT`, `VIDEOS`). It moves into data, as was done here in phase 1.

## 7. Decisions for Jordan
- **B1 · Token and text-style names.**
  - A) Adopt Mangroves' grouped names (`--color-text-primary`, `text-heading`…) for the boilerplate and rename Rivières & Canyons now (recommended: no code uses them yet).
  - B) Keep ours and rename Mangroves when it is built.
- **B2 · Icons.**
  - A) SVG line icons in the boilerplate, emoji as a site option (recommended).
  - B) Emoji everywhere.
  - C) SVG everywhere.
- **B3 · Way of working on small gaps.**
  - A) "Use the nearest, list a proposed addition" for design values; stop and ask only for content, legal, money and renames (recommended: less blocking).
  - B) Always stop and ask (today's rule).
- **B4 · Order of work.**
  - A) Phase 1b now: generic listing + site config + Images and Sources entities, re-map the canyon content, then phase 2 Airtable, reusing Mangroves' 17-table base as the starting point (recommended).
  - B) Go to phase 2 now and generalize later.
