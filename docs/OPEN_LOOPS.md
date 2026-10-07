# Open loops

Things still to validate, get or do. Hand-maintained: add a line when a loop opens, tick it and add the date when it closes.
The detailed, always-current list of data gaps is generated in `docs/CONTENT_REPORT.md` ("To fill before launch"); this file keeps the important loops in one readable place.

**Blocking** = the production build fails until it is done.

## Before launch (blocking)

| # | Loop | Who | Opened | Status |
|---|---|---|---|---|
| L1 | **5 Parc national photos of Cascade aux Écrevisses** (via randoguadeloupe.gp, "tous droits réservés"). They are in the site and show in development. Before launch: get written permission from the owner, or replace them. Then set their rights to `partner` or `free` in Airtable. | Jordan | 2026-10-07 | open |
| L2 | Booking URLs for Yalodé and Wild Canyon | Jordan → Airtable | 2026-10-07 | open |
| L3 | WhatsApp numbers for Pascal and Quentin | Jordan → Airtable | 2026-10-07 | open |
| L4 | Quentin's full name (guide page title and Person JSON-LD) | Jordan → Airtable | 2026-10-07 | open |
| L5 | Validate or rewrite the 10 draft "Ce qui la rend unique" sentences (Saut d'Acomat's no longer fits: the site is closed) | Jordan | 2026-10-07 | open |
| L6 | Operator ratings (4.9 and 5): add the source and the number of reviews, or remove them | Jordan → Airtable | 2026-10-07 | open |
| L7 | Account names for 2 social posts on Cascade aux Écrevisses | Jordan → Airtable | 2026-10-07 | open |
| L8 | Privacy policy text (generated later from `docs/PRIVACY_CONTEXT.md`; open items in its §3) | Jordan | 2026-10-07 | open |
| L9 | 7 guide stories ("Pourquoi je vous emmène ici") drafted from the guides' tips: each guide approves or rewrites, then sets "Histoire — statut" to Validée | Guides | 2026-10-07 | open |

## To validate (not blocking)

| # | Loop | Who | Opened | Status |
|---|---|---|---|---|
| V1 | Location policies: Chutes Moreau = `public`, Rivière Bourceau = `guide_only` | Guides | 2026-10-07 | open |
| V2 | Outing name "Canyon d'Acomat" for Yalodé's Acomat trip | Yalodé | 2026-10-07 | open |
| V3 | 4 rivers with no commune and no policy (Grande Anse, Pérou, Lostau, Ziotte) | Jordan / guides | 2026-10-07 | open |
| V4 | Values marked "À confirmer" (estimates, see the last column of the completeness table in `CONTENT_REPORT.md`) | Guides | 2026-10-07 | open |
| V5 | Yalodé logo | Jordan → Airtable | 2026-10-07 | open |
| V7 | Near-duplicate outing tags, kept as written: "Famille" / "Formule Family"; "Journée" / "Journée complète" / "Journée entière"; "Rappel encadré" / "Rappels enchaînés" / "Rappels hauts". Merge? | Guides | 2026-10-07 | open |
| V8 | Yalodé brand colour: old base `#14342A`, v12 design `#0A8577` (kept) | Jordan | 2026-10-07 | open |

## Next actions (phase 2)

| # | Action | Who | Opened | Status |
|---|---|---|---|---|
| N1 | Run the GitHub job "Airtable" → `build-new-base` with the workspace ID (decision 2026-10-07: new base, the old base `appiXWOUutTEdu4PK` stays as an archive) | Jordan | 2026-10-07 | open |
| N2 | Save a personal access token as the GitHub secret `AIRTABLE_TOKEN` (scopes: records read/write, schema read/write; access: the workspace) | Jordan | 2026-10-07 | open |
| N3 | ~~Allow `api.airtable.com` in the cloud environment~~: the settings screen fails ("Couldn't update environment"); replaced by the GitHub job, which reaches Airtable | — | 2026-10-07 | replaced |
| N4 | Build the two interfaces ("Orbit · Contenu", "Mon espace") and invite the guides as interface-only collaborators (SPEC §2, §5) | Jordan + Claude | 2026-10-07 | open |

## Worth adding (improves SEO, not blocking)

| # | Loop | Opened | Status |
|---|---|---|---|
| W1 | `last_reviewed_on` on every place ("Mis à jour le", freshness for Google and AI assistants) | 2026-10-07 | open |
| W2 | Coordinates for the 4 public places (map link, "À proximité"), from a published source only | 2026-10-07 | open |
| W3 | `price_checked_on` on the 7 outings | 2026-10-07 | open |
| W4 | Fill the 11 places below 60 % completeness so they can be indexed | 2026-10-07 | open |
| W5 | Landing-page introductions for the types, communes and criteria that get a page (`Introduction de la page`) | 2026-10-07 | open |
| W6 | Site texts: the old base's 41 "Blocs" come from the v4 design; the v12 interface texts get their keys in phase 4, when the templates exist | 2026-10-07 | open |

## Closed

| # | Loop | Closed |
|---|---|---|
| — | Pointe-Noire commune landing page: kept | 2026-10-07 |
| — | Icon style: Rivières & Canyons uses emoji; each future site chooses | 2026-10-07 |
| V6 | Airtable base choices D1–D6 (all recommendations) and Q1–Q3 (old base audited, Business plan, the guides edit) | 2026-10-07 |
