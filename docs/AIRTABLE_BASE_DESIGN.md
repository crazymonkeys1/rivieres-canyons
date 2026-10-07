# Airtable base design: audit and boilerplate proposal

Status: **proposal, waiting for Jordan's choices** (§6). Written 2026-10-07, before phase 2.
Inputs:
- Base 1: the **Mangroves** base (17 tables, CSV export + `README.md`, from `Guadeloupe_Mangrove_Directory_3.zip`).
- Base 2: **Rivières & Canyons**. Its Airtable base is "to be rebuilt" (`CONTENT_MODEL.md`), so there is no live base to audit. Its data model is the phase 1b schema (`packages/*/src/content`, `site.config.ts`) and the fixtures.

**Goal:** one generic base that any directory reuses, which a non-technical person can run day to day. The two easiest actions must be **adding a listing** and **adding a criterion**.

## 1. Audit of the two bases

### What holds up (keep)
- **Mangroves:**
  - one main table (Sites) with status and confidence;
  - Images as their own table, with rights status and source page;
  - typed Sources;
  - SEO fields on each record;
  - Site Copy keyed by a stable key;
  - Article Sections and Article FAQ as child tables;
  - "never rename a slug or key" as a written rule;
  - the suggested views ("À compléter", "Droits à obtenir").
- **Canyons:**
  - outings (Offers) as their own table, linked to one place and one operator;
  - guides separate from operators (WhatsApp, guide page);
  - location policy;
  - numbers as numbers (minutes, euros);
  - sourced reviews only;
  - signature drafts flagged.

### What doesn't hold up (fix)
| # | Issue | Where | Why it matters | Fix |
|---|---|---|---|---|
| 1 | **Durations as free text** ("20 min (caillebotis) à 3 h", "Demi-journée") | Mangroves Sites | Can't filter, sort or put in JSON-LD | Minutes min / max + a short note |
| 2 | **Filter rules as sentences** ("Activities contient kayak") | Mangroves Articles | The site can't read a sentence; it is code in disguise | Links to criteria (§3, D3) |
| 3 | **Tours inside the Operators table** (tour name, price, programme…: 32 columns) | Mangroves | One tour per operator only; Yalodé has several outings | Offers table (as canyons) |
| 4 | **Design settings in content** (Hero Palettes, card background, accent on dark, island emoji and colour, "Rating (header)", "Meta line") | Mangroves | The operator can break the look; the CMS would inherit design debt | Drop. Keep `brand_color` only; the rest lives in code and Site Copy |
| 5 | **Page-specific tables** (Compare Rows, Operator Features, Operator Practical, global Tips) | Mangroves | One table per page section doesn't scale | Compare Rows stays Mangroves-only; Features/Practical become Offer fields; Tips go to Site Copy |
| 6 | **Multi-value fields as comma text** (Activities "Kayak, Bateau", Protection) | Mangroves | Order and spelling drift ("Bateau, Kayak" vs "Kayak, Bateau") | Linked criteria (§3) |
| 7 | **Two source tables** (Sources + Reference Sources) | Mangroves | Same thing twice | One Sources table; site-wide sources have no listing |
| 8 | **FAQ stored inside the listing** (list of Q/A) | Canyons | Long text with a convention is easy to break | One FAQ table for listings and articles |
| 9 | **Rejected sites as a separate table** | Mangroves | Re-research can't see a duplicate | Status "Rejeté" + reason in Listings (D4) |
| 10 | **Mixed naming** (English Title Case in Mangroves, snake_case in canyons, French values) | Both | Renaming a column silently breaks the site | Field IDs in the adapter (§4) |

### Differences with a good reason (handle, don't merge)
- **Place facts:** Mangroves has activities and protection; canyons have difficulty, approach and swimming. These are site facts (§3).
- **Location:** Mangroves uses Island / Zone / Commune; canyons use area / zone / localities. It is the same three levels with different labels (already in `site.config.ts`).
- **Access:** Mangroves "libre / guidé / payant" describes cost and supervision. The canyon location policy describes what we publish. These are two different facts, so keep both concepts.
- **Compare table:** a Mangroves article feature. It stays in that site only.

## 2. Proposed boilerplate base: 13 tables

Legend:
- **Core** = every directory.
- **Places** = every directory of places.
- **Site** = generated from `site.config.ts`.
- **Who** = who edits it day to day.

| # | Table | Layer | What one row is | Who | Notes |
|---|---|---|---|---|---|
| 1 | **Listings** | Core + Places | a place | Operator | Generic fields + fact columns (§3). Grouped in the editing interface: Contenu · Lieu & accès · Sécurité · SEO · Suivi |
| 2 | **Images** | Core | a photo | Operator | Link to Listing / Offer / Article; rights; credit; order |
| 3 | **Sources** | Core | a source | Operator | Link to Listing or Article, or none (= site-wide); type |
| 4 | **FAQ** | Core | a question | Operator | Link to Listing **or** Article; order |
| 5 | **Criteria** | Core | a yes/no criterion ("Avec cascade", "Kayak", "Accessible PMR") | Operator | Group, label, icon, "show as filter", "landing page", landing intro (§3) |
| 6 | **Types** | Core | a listing type | Technical | Label, plural, icon, landing intro and SEO |
| 7 | **Localities** | Core | a commune | Operator | Zone, area, landing intro and SEO. The site counts 3+ listings |
| 8 | **Operators** | Directory | a business | Operator | Name, brand colour, logo, URLs, rating + source |
| 9 | **Guides** | Directory | a person | Operator | Operator, names, photo, bio, WhatsApp |
| 10 | **Offers** | Directory | an outing | Operator | Listing, operator, main flag, minutes, prices, price checked on, lists (one per line), offer fact columns |
| 11 | **Reviews** | Directory | a review | Operator | Operator / offer, quote, author, source, status |
| 12 | **Articles** + **Article Sections** | Directory | an intent page / a section | Operator | Selection by Criteria / Types / Localities + include / exclude (D3) |
| 13 | **Site Copy** | Core | a text on the site | Operator (value only) | Key, page, section, value. Also holds long blocks (privacy text) and global tips |

**Site-only extras** stay outside the boilerplate: Social posts (canyons; it could become a table if Mangroves needs it), Compare Rows (Mangroves).

**Rules that keep it simple:**
- A list whose items are one line each (things to bring, highlights, key facts) is a **long text with one item per line**.
- A list whose items have several fields (FAQ, sections, photos, sources) is a **child table**.
- The site **never reads formulas, lookups or rollups**. Helper fields for the operator (e.g. "Ce qui manque") are allowed. They sit in a "Suivi" group and the site ignores them.

## 3. Adding listings and criteria (the operator's main jobs)

- **Add a listing:**
  1. "Nouveau lieu" form in the interface: name, type, commune, status = Brouillon.
  2. The slug is suggested from the name and locked once published.
  3. A "Ce qui manque" panel shows the missing key fields (same list as the completeness score).
- **Add a yes/no criterion** (most filters: kid friendly, waterfall, kayak, PMR, pets…):
  1. Add one row in **Criteria** (label, icon, group, filter yes/no).
  2. Tick it on the listings.
  3. Done: the filter, the card icon and, at 3+ listings, a landing page appear on the next build. No column and no code.
- **Add a measured fact** (a number, duration, level: e.g. "Profondeur max", "Marche d'approche"):
  1. The technical owner adds a column and one line in `site.config.ts`.
  2. This takes about 5 minutes and is rare.
  3. A typed value needs a typed column to be filtered and sorted correctly.

## 4. Roles and safety nets

- **Technical owner = Creator.** Owns the tables, the fields, the Types and the field IDs.
- **Operator = Editor.**
  - Edits records, cannot add, rename or delete fields or tables.
  - Works through an **Airtable Interface** (one page per job: Lieux, Sorties, Photos, Articles, Textes du site), so the operator never sees the raw structure.
  - Read-only fields in the interface: slug after publication, Image rights "libre" (only after a check), field IDs.
- **Nothing the operator does can break the live site silently:**
  - The adapter reads fields **by ID**, so renaming a column label changes nothing.
  - The build validates every record (Zod) and stops with a clear French message ("Lieu *Rivière Moustique* : commune inconnue « Petit Bourg »").
  - The previous version stays online.
  - A deleted published slug is reported by the build (a redirect is needed).
- **Field-level and table-level edit restrictions** depend on the Airtable plan (to check with Jordan, Q2). The interface plus the build checks cover the free plan.

## 5. Generating the base for a new directory; CMS migration

- **Generation:** the base comes from code, not by hand.
  1. `pnpm airtable:spec` reads the package schemas + `site.config.ts` and writes `airtable/SPEC.md` (tables, fields, types, help text) and one empty CSV per table.
  2. Optionally (later), the same script creates the tables and fields through the Airtable API (needs a token with schema rights) and records the field IDs in `airtable.map.json`.
  3. A new directory = a new `site.config.ts` + one command.
- **Kept CMS-ready:**
  - stable `slug`/`key` as identity (never Airtable record IDs);
  - links resolved to slugs in the adapter;
  - no site logic in formulas;
  - plain paragraphs in long text;
  - every photo downloaded at build time.
- **Things that would make the migration harder (avoided):**
  - **Airtable attachment URLs expire after a few hours**, so never store them. Download at build, or keep the original URL in `src`.
  - Rules written as text.
  - Design settings in content.
  - Single-select labels used as identifiers. Labels are mapped to stable keys in `site.config.ts`. An unknown value fails the build; it is never guessed.

## 6. Choices for Jordan

| ID | Question | Options | Recommendation |
|---|---|---|---|
| **D1** | How are criteria added? | **A** Columns only (tech adds each) · **B** Yes/no criteria as rows in a Criteria table (operator adds), measured facts as columns (tech adds) · **C** Everything as rows (very flexible, hard to edit and filter) | **B**: the most frequent change becomes a no-code one |
| **D2** | Types and communes | **A** Linked tables with their landing-page text · **B** Simple dropdowns | **A**: they become pages and need SEO text |
| **D3** | How does an article pick its listings and outings? | **A** Links to criteria (with / without), types and communes, plus manual include/exclude; numeric rules ("dès 10 ans", "≤ 4 h 30") stay in code · **B** Manual list only · **C** Rule rows in Airtable | **A**: covers every Mangroves rule with no code. The canyon numeric rules stay as they are |
| **D4** | Rejected listings | **A** Status "Rejeté" + reason in Listings · **B** Separate table | **A**: one place to check before adding |
| **D5** | One base per site or one for all? | **A** One per site · **B** One shared base | **A**: simpler, per-client access, smaller record limits. Yalodé (in both sites) is entered twice until the CRM holds partners |
| **D6** | Column names | **A** French names for the operator, read by ID · **B** English names | **A**: easiest to use, safe because of the IDs |

**Questions:**
- **Q1:** Is there an old canyon Airtable base, or a CSV export of it? If yes, I audit it too.
- **Q2:** Which Airtable plan (Free, Team, Business)? It decides the field-level permissions.
- **Q3:** Who will edit day to day: your team, the guides (Pascal, Quentin), or both? If the guides edit, they should only see their own outings and profile.

## 7. What changes in the current code if D1-B is chosen
- `has_waterfall` (place) and `has_rappel` / `pets_allowed` (offer) move from `facts` to Criteria. Measured and level facts stay in `facts`.
- The canyon article rules that test them become criteria links, and `matchesRule` keeps the numeric rules.
- Done at the start of phase 2, with the same "selects exactly the same items" check as in phase 1.
