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
| L10 | Legal notice ("Mentions légales"): publisher, director of publication, host. The page exists with the token `[LEGAL_NOTICE_TEXT]` above the safety disclaimer | Jordan | 2026-10-08 | open |
| L11 | The site's domain (`SITE_URL`): canonical URLs, sitemap and llms.txt use it. Until then `example.org` stands in and `pnpm seo:check:prod` fails | Jordan | 2026-10-08 | open |

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
| V9 | Site texts pending your OK (wording in `copy.ts`): C1 neutral first sentence of the disclaimer; C2 footer "Site indépendant…" instead of "Prototype"; C3 listing subtitle without "en toute sécurité"; the listing card button "Y aller en sécurité" is kept (it describes a guided outing) | Jordan | 2026-10-08 | open |
| V10 | Site texts written in phase 4 for the new pages: blog intro, author line "Guides diplômés d'État en canyoning, en Basse-Terre depuis plus de 8 ans" (from the v12 design), contact intro, menu label "Les lieux" (instead of "Sites en accès libre") | Jordan | 2026-10-08 | open |
| V11 | "Baignade en rivière" lists every place whose swimming is filled in, so Saut de la Lézarde appears without a note (its access is "à vérifier"). Add an angle note or exclude it in the article's selection | Jordan | 2026-10-08 | open |
| V13 | Headings built from a place's name read badly when the name needs an article: "Comment aller à Canyon doré", "Accéder à Canyon Ferry avec un guide". Options: add a field "Nom avec préposition" ("au Canyon doré"), or rephrase these headings ("Canyon doré : accès") | Jordan | 2026-10-08 | open |
| V12 | Footer link colour: the muted grey on the cream footer was too light, so footer titles use body text. Darken `--palette-ink-500` for every muted text, or keep as is | Jordan | 2026-10-08 | open |

## Next actions (phase 2)

| # | Action | Who | Opened | Status |
|---|---|---|---|---|
| N1 | ~~Build the base~~: done, `appQss9sjY59pUxtM` (verified identical; the old base `appiXWOUutTEdu4PK` stays as an archive) | — | 2026-10-07 | done |
| N2 | ~~GitHub secret `AIRTABLE_TOKEN`~~: done | — | 2026-10-07 | done |
| N5 | ~~"Ce qui manque" formula and "Comptes" lookup~~: done | — | 2026-10-07 | done |
| N3 | ~~Allow `api.airtable.com` in the cloud environment~~: the settings screen fails ("Couldn't update environment"); replaced by the GitHub job, which reaches Airtable | — | 2026-10-07 | replaced |
| N4 | Interfaces (`docs/AIRTABLE_INTERFACES.md`): **deferred** (Jordan, 2026-10-07: only Orbit edits for now, in the base directly). "Mon espace" for the guides when they start editing; "Orbit · Contenu" optional | Jordan | 2026-10-07 | deferred |
| N6 | ~~`pull-content` test~~: done, content identical | — | 2026-10-07 | done |

## Noted for later phases

| # | What | Phase | Opened | Status |
|---|---|---|---|---|
| P1 | ~~JSON-LD, sitemap, `robots.txt`, `llms.txt`, Markdown twins, completeness `noindex`~~ | 5 | 2026-10-08 | done |
| P2 | ~~Computed FAQ "{lieu} : comment y aller ?"~~ (every place, answered by its location policy) | 5 | 2026-10-08 | done |
| P7 | Cloudflare: turn off "Block AI bots" for the domain (CLAUDE.md §10) | 7 | 2026-10-08 | open |
| P8 | Google Rich Results test and Search Console on the real domain (not reachable from here) | 8 | 2026-10-08 | open |
| P3 | `/go/book/{offer or company}/` and `/go/whatsapp/{guide}/` redirects (the guide page's "Réserver sur {company}" uses the company id) | 6 | 2026-10-08 | open |
| P4 | Lead form: steps 2 and 3 (phone, thank you), Turnstile, `/api/lead`, D1 | 6 | 2026-10-08 | open |
| P5 | Social posts show no thumbnail (we never hotlink); download them with the photos if wanted | later | 2026-10-08 | open |
| P6 | Small UI choices kept from the build: the listing safety banner is not collapsible; 2 quick filters inline on desktop (the rest in "Filtres"); default sort: guided outings first, then by name | review | 2026-10-08 | open |

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
