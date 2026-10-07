# Content model (v12)

## Data files
| File | Contents |
|---|---|
| `data/destinations.json` | `destinations[]`: 21 objects, one per destination, all fields merged. Also `SOCIAL`, `ACCESS_RESTRICTED`, `STOCK_POOL`. |
| `data/operators-and-tours.json` | `OPERATORS` (2), `DATA` (7 tours), `TOUR_META`, `TEST_ARR` (real reviews only) |
| `data/blog-articles.json` | 7 blog articles and their blocks; `tours_rule` / `sites_rule` hold the selection filters as text |
| `data/taxonomies.json` | Types, access meta, risks, gear/tag emoji, levels, `LOCATION_POLICY`, `FILTER_PAGES` |
| `data/ui-copy.json` | Static copy from the template |

These are fixtures and the schema draft for the Airtable base (to be rebuilt). Astro reads Airtable at build time and must produce the same shape.

## Destination (`destinations.json → destinations[]`)
One object per destination. v10 kept this data in 7 separate constants (SITES, SITE_ENRICH, EDITORIAL, INSIDER, ACCESS, ALT_NAMES, GALLERY); they are now merged.

| Field | Type | Component |
|---|---|---|
| id, name, type, island, communes | string | Hero, cards, breadcrumb, filter pages |
| **signature** | string | DestinationCard subtitle and SEO snippet source (not shown on the destination page since 2026-10-06). `''` until written. 10 drafts exist (to validate with the guides); add `signature_status` (`draft` \| `validated`) in Airtable and fail the production build on `draft` |
| **has_waterfall** | boolean \| null | "Avec cascade" tag and filter. `null` = unknown |
| **location_policy** | `public` \| `commune_only` \| `guide_only` \| `closed` \| `''` | Accès section (see DESIGN_SYSTEM › Accès by location policy). `''` renders as `commune_only` |
| alt_names[] | string[] | "Aussi appelé" (was `ALT_NAMES[id]`) |
| access_status {status, note, sourceName, sourceUrl, checked} \| null | object | Sources fold, closure, FAQ (was `ACCESS[id]`) |
| desc, h2, lead, intro, moreTitle, expect, season | string | Aperçu, Accès, SEO (`lead` is no longer shown in the hero) |
| difficulty, duration, approach, minAge, swimming, drive, parking | string/number | HeroFacts, FactList |
| access, accessH2, accessShort[[icon,k,v,tip]], accessText, accessGuided | mixed | Accès (rendered only when the policy allows) |
| risks[] | `RISK_ICON` keys | RiskList |
| alert {short, title, text, items[]} | object | SafetyAlert |
| bring[], keyInfo[[k,v]] | list | GearList, KeyValueList |
| insider {op, text} | object | InsiderTip (was `INSIDER[id]`) |
| guideH2, guideWhy | string | Sortie guidée |
| faq[[q,a]], faqH2 | list | Accordion + FAQPage |
| press[] {site, title, url} | list | PressList |
| img, credit, gallery[] {src, credit, url}, sitePhotos[], sitePhotosCredit, guidePhotos[], photoCaptions | media | Gallery, Lightbox (gallery was `GALLERY[id]`) |
| verif, sourcePublisher, sourceUrl | string | SourcesFold |
| est[] | string[] | Fields that are estimates to confirm |

`SOCIAL[id]` stays separate: the `canyon_ferry` entries are mock posts to replace.

Type `chutes_d_eau` is merged into `cascade` (Chutes du Carbet). `SITE_TYPE_META.cascade.aliases` keeps "Chutes d'eau".

## Operator (`OPERATORS[key]`)
- **Identity:** name, color, logoUrl, website, slug (`pascal`, `quentin` → `/guides/{slug}`).
- **Guide:** guideFirstName, guideFullName, guidePhoto, guideRole, rating.
- **About:** `about {bio, facts[[icon,k,v]]}` (Yalodé, also shown in the tour card) or `profile {bio, facts}` (Wild Canyon, guide page only).
- **Contact:** `whatsapp` (`[WHATSAPP_PASCAL]`, `[WHATSAPP_QUENTIN]`). Link = `https://wa.me/{whatsapp}?text={message}`.
- **Booking:** `bookUrl` (`[BOOKING_URL_YALODE]`, `[BOOKING_URL_WILDCANYON]`), `contactUrl` (the current contact page, kept for reference).

## Tour (`DATA[]` + `TOUR_META[id]`)
id, op, name, subtitle, commune, duration, hours, minAge, level, esprit, rappel, price, priceChild, approach, imagine[], included[], bring[], tip, meeting, tags[], img. `weather` is removed. `TOUR_META[id].siteId` links a tour to its destination.

## Review (`TEST_ARR[op][]`)
{quote, author, source}. Only reviews with a real source. Yalodé has none for now, so its reviews block is hidden.

## Blog article (`blog-articles.json`)
Unchanged from v10, plus `tours_rule` / `sites_rule` (the selection filters, as JavaScript source text).

## Filter page (computed, `taxonomies.json → FILTER_PAGES`)
Built from destinations: one page per type and per commune with 3+ destinations. Intro, "En bref" and FAQ are generated from counts, `location_policy` and tours; related articles are those whose selection includes one of the places.
