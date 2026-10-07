# Airtable base design: audit and boilerplate

Status: **applied 2026-10-07** (Jordan chose every recommendation, D1–D6 in §6). The generated base spec is `apps/rivieres-canyons/airtable/SPEC.md`.
Inputs:
- Base 1: the **Mangroves** base (17 tables, CSV export + `README.md`, from `Guadeloupe_Mangrove_Directory_3.zip`).
- Base 2: the old **Rivières & Canyons** base "v2" (7 tables, CSV export + `README.md`, from `airtable-v2 2.zip`, built from the v4 design), plus the phase 1b data model.
- Jordan's answers: Business plan; the clients (the guides) edit their own content.

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
- **Canyons (old base v2 and the 1b model):**
  - a Types table (one row per type, with icon and SEO description);
  - operators as rows, not tables, so every site has the same structure;
  - a `Published` checkbox and an `Order` on every table;
  - "Histoire validée" on outings: guide stories stay drafts until the guide approves;
  - links checked before conversion, expected counts after each step (its README);
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
| 8b | **Durations twice** ("Durée" text + "Durée (h)", "Approche" + "Approche (min)") | Old canyon base | Two values drift apart | One number in minutes (+ précision) |
| 8c | **"Conditions du jour"** ("Praticable") on outings | Old canyon base | Live data, forbidden (`CLAUDE.md` §8): it goes stale the next day | Dropped |
| 8d | **Commune on outings** | Old canyon base | Duplicates the place's commune | Comes from the place |
| 8e | **Photos as URL columns** inside each table, one credit for all | Old canyon base | No rights per photo, no order, no caption | Photos table |
| 8f | **41 "Blocs" with layout fields** (Fond, Groupe, Bouton lien) | Old canyon base | Layout belongs to code; copy belongs to keys | Textes du site (key → text or list); layout stays in templates |
| 9 | **Rejected sites as a separate table** | Mangroves | Re-research can't see a duplicate | Status "Rejeté" + reason in Listings (D4) |
| 10 | **Mixed naming** (English Title Case in Mangroves, snake_case in canyons, French values) | Both | Renaming a column silently breaks the site | Field IDs in the adapter (§4) |

### Differences with a good reason (handle, don't merge)
- **Place facts:** Mangroves has activities and protection; canyons have difficulty, approach and swimming. These are site facts (§3).
- **Location:** Mangroves uses Island / Zone / Commune; canyons use area / zone / localities. It is the same three levels with different labels (already in `site.config.ts`).
- **Access:** Mangroves "libre / guidé / payant" describes cost and supervision. The canyon location policy describes what we publish. These are two different facts, so keep both concepts.
- **Compare table:** a Mangroves article feature. It stays in that site only.

## 2. The boilerplate base: 13 generic tables + site extras

Built from code (`packages/*/src/airtable`, composed in `apps/rivieres-canyons/src/content/airtable.ts`). Column names are French (D6). Table names a site may rename are in brackets.

| # | Table | Layer | One row is | Clients (guides) | Notes |
|---|---|---|---|---|---|
| 1 | Types | Directory | a listing type | read | Label, plural, icon, aliases, landing intro + SEO (D2) |
| 2 | [Communes] | Directory | a locality | read | Name, area, landing intro + SEO (D2) |
| 3 | Critères | Directory | a yes/no criterion | read | Applies to places or outings; filter / badge / key fact / landing page; icon, group, order (D1) |
| 4 | Opérateurs | Directory | a business | own row | Brand colour, logo, URLs, rating + source, "Comptes" (Airtable users) |
| 5 | Guides | Directory | a person | own row | Operator, names, photo, bio, "Repères", WhatsApp, "Compte Airtable" |
| 6 | [Lieux] | Directory + Places | a listing | read + comment | Generic columns, fact columns, location policy, access, safety; status incl. Rejeté (D4); "Ce qui manque" |
| 7 | [Sorties] | Directory | an outing | own rows | Place, operator, main flag, minutes, prices + date, criteria, fact columns, lists, guide story + status |
| 8 | Avis | Directory | a review | read + comment | Operator / outing / guide, quote, rating, date, source, status |
| 9 | Articles | Directory | an intent page | read | Texts + selection: types, communes, criteria with / without, named rule, include / exclude (D3) |
| 10 | Sections d'article | Directory | a block of an article | read | Point clé · Section · Conseil · Note d'angle (on a place or outing) |
| 11 | FAQ | Directory | a question | read + comment | On a place or an article |
| 12 | Photos | Directory | a photo | own rows | Owner (place / outing / article / site), role, order, credit, licence, rights, source |
| 13 | Sources | Directory | a source | read | Owner, type; "Presse" + title shows it in "Ils en parlent" |
| 14 | Textes du site | Core | a site text | hidden | Key → text or list with icons; status "À écrire" fails production |
| + | Publications | Site (canyons) | a social post | read | Account name required for production |

Mangroves' Compare Rows would be its own site extra.

**Rules that keep it simple:**
- A list of one-line items (things to bring, highlights) is a **long text, one item per line**.
- A list of short labelled items ("Bon à savoir", a guide's "Repères", access hints) is a long text, one "Libellé : valeur" per line (optionally an icon first, " — précision" last). The build names the row and line when the format is wrong.
- Items with several long fields (FAQ, article sections, photos, sources) are **child tables**.
- The site **never reads formulas, lookups or rollups**. Helper fields ("Ce qui manque", "Comptes") exist for editors only.

## 3. Adding listings and criteria (the editor's main jobs)

- **Add a listing:** "Nouveau lieu" form: name, type, commune, status = Brouillon. The slug is calculated from the name when empty, and locked (Tech field) once set. "Ce qui manque" lists the empty key fields (same list as the completeness score).
- **Add a yes/no criterion** (kid friendly, kayak, PMR, pets…): one row in **Critères**, then tick it on the places or outings. The filter, the badge or key fact and, at 3+ places, a landing page follow on the next build. No column, no code.
- **Add a measured fact** (a number, duration, level): the technical owner adds a column and one line in `site.config.ts`, then reruns `pnpm airtable:export`. About 5 minutes; rare.

## 4. Roles and safety nets (Business plan; the clients edit)

| Who | Airtable role | Sees and edits |
|---|---|---|
| Orbit technical owner | Creator | Everything; the only role that changes tables and fields |
| Orbit team | Editor | Interface "Orbit · Contenu" and grids; fields marked **Orbit** are theirs only (status, verification, rights, main outing…) |
| Clients (guides, operators) | Interface-only Editor | Interface "Mon espace": their outings, profile, company and photos (edit); places, articles, reviews (read + comment) |

- **Field permissions:** Tech fields (slugs, keys, formats) editable by Creators only; Orbit fields by Orbit only. A guide can change a price or a programme, not publish an outing or move it to another place.
- **Their rows only:** interface pages filter on "Comptes contains current user" (through the operator for outings and photos). Interface-only collaborators never see the base. Airtable has no hard row-level security: this keeps each guide in their own rows, and the build refuses anything invalid.
- **Guide stories and reviews:** the guide validates "Pourquoi je vous emmène ici" ("Histoire — statut"); reviews are added by Orbit with their source (guides comment).
- **Nothing breaks the live site silently:** the adapter reads fields **by ID** (renaming a column is harmless); every update runs the content checks; an error stops the update with the row and field named, and the current site stays online.

## 5. Generating the base for a new directory; CMS migration

- **One description, three uses** (`pnpm airtable:export`):
  1. `airtable/SPEC.md`: tables, fields, types, options, who edits, help text, import steps, views and interfaces;
  2. `airtable/csv/`: import-ready CSVs, in link order;
  3. a round-trip check: content → CSV → content must be identical, so nothing is lost on import.
- After import: `pnpm airtable:link` saves the table and field IDs (`airtable/map.json`); `pnpm content:pull` reads the base, runs the checks, and writes the content only if everything passes.
- **A new directory** = its `site.config.ts` (facts, vocabularies, table names) + the same command. The tables come from the packages.
- **Kept CMS-ready:** stable keys as identity (never Airtable record IDs); links resolved to keys; no site logic in formulas; plain text; photos downloaded at build time (Airtable attachment URLs expire within hours); option labels mapped to stable keys, unknown values refused.

## 6. Decisions (Jordan, 2026-10-07: every recommendation)

| ID | Question | Decision |
|---|---|---|
| **D1** | How are criteria added? | **B:** yes/no criteria are rows in Critères (editors add them); measured facts are columns (technical owner adds them) |
| **D2** | Types and communes | **A:** their own tables, with landing-page text |
| **D3** | How does an article pick its places and outings? | **A:** types, communes, criteria with / without, include / exclude in Airtable; comparisons on measured facts are named rules in `site.config.ts` (`ARTICLE_RULES`), picked from a list |
| **D4** | Rejected places | **A:** status "Rejeté" + reason in Lieux |
| **D5** | One base per site or one for all | **A:** one per site |
| **D6** | Column names | **A:** French, read by field ID |

Answers: Q1 old canyon base audited (§1); Q2 Business plan (field permissions used, §4); Q3 the clients edit (interface-only access, §4).

## 7. What changed in the code
- `has_waterfall` → criterion "Avec cascade"; `has_rappel` → "Rappel"; `pets_allowed` → "Animaux acceptés"; the 18 offer tags → criteria shown as badges.
- `LISTING_TYPES` moved from code to the Types table; communes became records linked by key.
- Article `offer_rule` / `listing_rule` / `listing_ids` → `offer_selection` / `listing_selection`; the check confirms every article picks exactly what the design picked.
- Listing status adds `draft` and `rejected` (+ `status_note`); the `rejected` entity is gone. Outings and articles get a status; outings get `guide_story_status`; reviews get guide, rating and date; articles get a FAQ.
- Press is a featured source; page blocks are site texts.
- Checks moved to `src/content/check.ts` (same checks for the design migration and for Airtable).
