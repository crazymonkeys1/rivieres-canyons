# Directory blueprint: how to start a new directory site

The boilerplate is the four packages (`core`, `directory`, `places`) plus one app per site. Rivières & Canyons is the reference app. Origin and reasoning: `docs/BOILERPLATE_AUDIT_2026-10-07.md`.

**Principle:** the packages hold what every directory has. A new site writes **only** its settings, its theme and its content mapping. If a site needs something the packages lack, add it to the packages when a second site needs it too. Until then, keep it in the app.

## 1. What every directory gets for free (packages)

| Layer | Entities and rules |
|---|---|
| **Core** | Images: rights (`free` / `partner` / `permission_needed`), credit, licence, source page. Typed sources (featured = press). Site texts and lists by key. SEO overrides. Placeholder check. Completeness score. The facts system (`FactDefinition` → generated schema). The Airtable engine (field spec, CSV, round trip, API by field ID). |
| **Directory** | Listing (generic fields, criteria, `facts`, status incl. draft / rejected, three publication gates). Types and localities (with landing text). Criteria (yes/no rows: filter, badge, key fact, landing). Operator, Guide, Offer (0..n per listing, one main). Review (sourced only). Social post. Article (selection: types, localities, criteria with/without, named rule, include/exclude; sections; FAQ). Landing pages (`landingPages`, threshold, criteria dimension). The Airtable tables for all of these. |
| **Places** | Location policy (`public` / `commune_only` / `guide_only` / `closed`), dated access status, restricted access, directions (public only), safety alert, risks, things to bring. The places table in Airtable, with its "Ce qui manque" formula. |

## 2. What a new site writes (the app)

1. **`src/content/site.config.ts`**:
   - **Facts** (measured values only; yes/no attributes are Criteria rows in Airtable): place facts and offer facts (`FactDefinition[]`): key, label, type, options + labels, unit, icon, `filter`, `key_fact`, `completeness`, `schema_org`, `note`.
   - **Vocabularies:** risks, levels and others. Types, communes and criteria are Airtable tables.
   - **Location labels** (area / zone / locality), the list of areas and zones.
   - **Article rules:** named comparisons on facts (`ARTICLE_RULES`), picked by editors from a list.
   - **Confidence levels:** label, note, and `hide`.
   - **Completeness:** key fields and threshold (default 0.6).
   - **Landing dimensions** and minimum (default 3): type, locality, zone, an activity, an audience.
   - **Conversion:** UTM source name, icon style (`svg` line icons or `emoji`: choose per site, no default), copy rules (e.g. where safety claims are allowed).
2. **`src/content/schema.ts`:** narrows the package shapes with the site's vocabularies and facts. It is usually a copy of the reference app's file.
3. **Theme:** tier-1 palette values, font files and families, radius values, breakpoint values. Semantic token names never change (§6.13 of `CLAUDE.md`).
4. **Content:** a mapping from the design export (first time), then Airtable: `pnpm airtable:export` writes the base spec and import-ready CSVs from the packages' tables and the site config (table names, facts, vocabularies), checks the round trip, and `content:pull` reads the base at build time. Copy `src/content/airtable.ts` from the reference app and change the table names and site extras.
5. **Glossary:** the site's domain words (Mangroves: site, zone, operator, guide, tour, article).

## 3. Gap analysis for a new design (what matches, what's missing, what doesn't fit)

For each item in the new design or dataset, ask in this order:

1. **Is it a generic field?** (name, location, summary, FAQ, photos, sources, offer price…) → it **matches**: map it.
2. **Is it a fact of this kind of place?** (difficulty, depth, opening hours, activities…) → declare it in the site's facts. Not a gap.
3. **Is it a vocabulary value?** (a new type, risk or activity) → add it to the site's vocabularies.
4. **Is it a new section or component?**
   - It exists in `COMPONENTS.md` under another name → **matches**: use the canonical name.
   - It doesn't exist → **missing**: build it in the app, or in a package if two sites need it, and register it.
5. **Does it contradict a rule?** (published directions to a closed place, an invented rating, a hotlinked photo, layout decided in JavaScript, a raw colour) → it **doesn't fit**: list it for Jordan with options.

The output is three lists (matches / missing / doesn't fit) plus the filled `site.config.ts`.

## 4. Checklist before a site goes live

- [ ] `pnpm content:check:prod` passes: no placeholders, no draft signatures, no `permission_needed` images, ratings sourced, guides with full names, social posts with account names.
- [ ] Every listing has a status. Confidence levels that hide are applied.
- [ ] Indexable pages = published and completeness ≥ threshold. Everything else has `noindex` and stays out of the sitemap.
- [ ] Landing pages exist only for values with enough published listings.
- [ ] JSON-LD per page type (`CLAUDE.md` §10). No self-marked ratings. `dateModified` from `last_reviewed_on`.
- [ ] `llms.txt`, `llms-full.txt`, a Markdown twin per indexable page, robots rules allowing AI crawlers.
- [ ] Every outbound booking and contact link goes through `/go/` with UTM parameters.
- [ ] Lead form: consent unticked, privacy page live, Turnstile on.
