# Orbit Directory: design system (from Guadeloupe v12)

Source of truth: `design/Guadeloupe v12 Details.dc.html` (v12 only). Tokens: `tokens/tokens.css`.
Documents (read in this order): `ARCHITECTURE.md` (hierarchy, naming, placement) → `tokens/tokens.css` + `TYPOGRAPHY.md` + `tokens/text-styles.css` → `COMPONENTS.md` (registry) → this file (foundations, behaviour, page templates, SEO) → `CONTENT_MODEL.md` + `data/*.json` → `CHANGELOG.md` (history) → `AUDIT_2026-10-06.md`, `REVIEW_2026-10-06.md` (rationale and open decisions).
Precedence: see `CLAUDE_CODE_CONTEXT.md`. The HTML prototype is a visual and behavioural reference only; where it disagrees with the documents above on type scale, weights, spacing or names, the documents win.

## 1. Foundations

Values live in `tokens/tokens.css` (variables) and `tokens/text-styles.css` (one class per text role). This section explains **what each variable is for and when to use it**. Never hard-code a value that has a token.

### 1.0 Principles
1. **Mobile-first.** Design and code the ~360px layout first. Larger screens add, never subtract. One real breakpoint (1024px); everything else is fluid (`clamp()`, `auto-fit` grids, `flex-wrap`).
2. **No layout from JavaScript.** The site is static (Astro). Layout switches use CSS `@media (min-width: …)`, never a JS flag, so there is no flash and no layout shift. (The HTML reference uses an `isWide` JS flag only because it is a prototype.)
3. **Content first.** Key information is shown in the reading size and the body ink, not muted. Decoration never carries meaning.
4. **One emphasis device per element.** Weight, colour or case, not all three.
5. **Brand = three voices.** Serif display (Instrument Serif) for identity, reading serif (Source Serif 4) for prose, Archivo for UI. Coral and green are the only brand colours; coral is for action decoration, green for information.

### 1.1 Typography
**Full reference: `docs/TYPOGRAPHY.md`** (what each style is for, when to use it, the UX reason, forbidden variations, migration from the HTML reference, open options J-T1…J-T8). Summary:
- **3 families, one job each:** Instrument Serif (identity: H1, H2, names, prices, quotes) · Source Serif 4 (reading: all prose) · Archivo (scanning and action: facts, meta, buttons, links, h3, inputs).
- **Weights:** 400 and 600 only. 600 is the single emphasis. No 500, no 700.
- **10 text styles + 2 modifiers:** `h1` `h2` `title` `quote` `pull` (display serif) · `read` (reading serif) · `h3` `body` `small` `micro` (UI sans: 18 · 16 · 14 · 12) · modifiers `is-strong` (600), `is-upper` (overline = micro + upper).
- **Line heights:** 1.1 · 1.3 · 1.5 · 1.6. **Letter-spacing:** read, overline, wordmark only. **Text-shadow:** one, for white text on a photo.
- **Floor:** nothing below 12px; prose ≥18px; inputs 16px (= `body`).
- **Hierarchy:** a sub-heading is bigger or stronger than what it introduces; uppercase only for overlines; eyebrows only when they add a category.
- Text sizes cited in §2 and §3 below are shorthand: the style names in TYPOGRAPHY.md §5 govern.

### 1.2 Colour
| Group | Variables | When to use |
|---|---|---|
| Text on light | `--text-strong` · `--text-body` · `--text-muted` · `--text-faint` | strong: headings, names, prices, values, controls · **body: all content text** · muted: meta only (dates, units, credits, labels) · faint: decoration only |
| Text on dark / photo | `--text-on-dark`, `-2` (0.85), `-3` (0.7), `--text-on-dark-accent` | Three steps only. `-3` for credits and captions at ≥12px. Accent for overlines on dark bands |
| Surfaces | `--surface-page` · `-card` · `-subtle` · `-sunken` · `-info` · `-footer` · `-dark` · `-dark-2` · `-glass` · `-chip-on-photo` · `-scrim` | page: background · card: white cards and inputs · subtle: tiles inside cards · sunken: chips, segmented controls · info: green-tinted help (AnswerBox, AccessNotice) · dark: hero base · dark-2: lead band, dark buttons · glass / chip-on-photo: pills and badges on photos · scrim: lightbox |
| Borders | `--border`, `--border-strong`, `--border-on-dark` | border: hairlines and card edges · strong: inputs, pills, sticky edge |
| Brand / action | `--brand`, `--brand-hover`, `--accent`, `--accent-strong`, `--accent-strong-hover` | brand: text links, overlines, active filter · **accent: decoration only (underline, bullet, quote rule), never text or a fill behind text** · accent-strong: filled CTAs and count badges · hover tokens for states |
| Focus | `--focus-ring`, `--focus-halo`, `--focus-ring-dark` | See 1.6 |
| Status | `--danger` (+ `-surface`, `-border`, `-text`, `-title`), `--success-*`, `--warning-*`, `--star` | danger: safety only, max one danger surface per viewport · success / warning: access tiles · star: decorative, always with the number |
| Operators | `--op-yalode`, `--op-wildcanyon`, `--avatar-pascal`, `--avatar-quentin` | Avatar ring, guide name, "Sortie guidée" kind label, tour header band. Yalodé teal is 4.53:1 on white: ≥14px/600 only |

Contrast (all verified): `--text-body` on white 13.2:1 · `--text-muted` ≥4.5:1 on every light surface (page, card, subtle, sunken, info) · `--brand` on page 5.5:1 · white on `--accent-strong` 4.75:1 · white on `--danger` 6.0:1. **White on `--accent` is 3.5:1 and is forbidden for text.**

### 1.3 Emphasis rules
1. One emphasis device per element: weight, colour or case. Uppercase only for overlines and badges.
2. Weights: 400 default · 600 emphasis (values, h3, buttons, links, selected, badges, lead-ins). Nothing else.
3. Inline bold (600) at most once per paragraph, only as a definition lead-in ("Quand y aller :").
4. Key information stands out through contrast (muted label, strong value), not size or stacked bold.
5. Content is never muted. Accent is never text. Every size, weight, colour, shadow and duration comes from a token.

### 1.4 Spacing, layout, breakpoints
- **Scale** (`--space-*`): 2 · 4 · 6 · 8 · 10 · 12 · 16 · 20 · 24 · (28 avoid) · 32 · 40 · 48 · 64. Padding, margin and gap use only these. Typical: tile padding 12/14, card padding 16, gap between tiles 8, between chips 6.
- **Rhythm:** `--section-y` (destination and guide sections, with a top border), `--article-gap` (between blog parts), `--entry-gap` (between blog selection entries).
- **Containers:** `--w-layout` 1120 (page) · `--w-article` 728 / `--w-read` 680 (articles, blog and filter hero text) · `--w-text` 640 (destination text blocks) · `--w-narrow` 480 (forms, hero subtitle) · `--w-side` 340 (offer card, ≥1024 only).
- **Gutters:** `--gutter` 20 on pages, `--gutter-read` 24 inside articles.
- **Breakpoints (mobile-first, min-width only):** `--bp-sm` 480 (fact strips 2 → 3–4 columns) and `--bp-lg` 1024 (two-column destination page with sticky offer card, floating hero fact bar, inline filters). Nothing else.
- **Touch:** `--target` 44px minimum hit area for every tappable element (visually smaller icons use the `.hit` utility).

### 1.5 Radius, shadow, layers, motion
- **Radius:** `--r-s` 8 (icon tiles, tag chips) · `--r-m` 12 (inputs, tiles, buttons, tooltips) · `--r-l` 16 (cards, alerts, images, fact strips) · `--r-sheet` 22 · `--r-pill` · circle `50%`.
- **Shadow:** only on floating layers: `--sh-float` (hero bar, floating CTA), `--sh-tooltip`, `--sh-sheet`, `--sh-sticky-bottom`, `--sh-card-hover` (list view), `--sh-input`, `--sh-knob`, `--sh-avatar-ring`. Flat cards use a border, not a shadow.
- **Layers:** `--z-raised` 1 < `--z-float` 2 < `--z-tooltip` 5 < `--z-sticky` 40 < `--z-cta` 50 < `--z-sheet` 90 < `--z-lightbox` 95.
- **Motion:** `--dur-fast` 150 (hover) · `--dur-base` 200 (toggles, fades) · `--dur-slow` 300 (sheets, sticky CTA) · `--dur-enter` 400 (card entrance). Sheets use `--ease-out`. `prefers-reduced-motion` removes animations globally.

### 1.6 States and accessibility
- **Hover:** text link → `--brand-hover`; filled CTA → `--accent-strong-hover`; card → `--border-strong` (list view adds `--sh-card-hover`). Never the only way to reach information: tooltips also open on tap and keyboard focus.
- **Focus:** `:focus-visible` two-tone ring (3px `--focus-ring` outline, 2px offset, plus 2px `--focus-halo` inside) so it shows on light, dark and photo. Never `outline: none` without a replacement. Inputs in the dark lead band use `--focus-ring-dark`.
- **Active:** darken the fill one step, or `--surface-subtle` on tiles. No scale transforms.
- **Disabled:** opacity 0.5, `aria-disabled`, label still readable.
- **Semantics:** interactive things are `<button>` or `<a>`, never a `div` with `role="button"`. One H1 per page, H2 per section (with id), H3 inside. Emoji icons are decorative (`aria-hidden`) and always followed by text.
- **Targets and text:** 44px hit areas; 12px text floor; inputs 16px; contrast per 1.2.

## 2. Component behaviour and content rules
**Structure, levels and composition live in `COMPONENTS.md`** (canonical names, props, mobile layout). This section holds what that table cannot: content rules, behaviour and edge cases. Names here are the canonical ones; the prototype and old changelog entries use legacy names (mapping in COMPONENTS.md). Styles are cited by text-style name (`t-body`, `is-strong`…) and colours by token; never by pixel value, except component dimensions.

### Atoms and molecules
- **Button:** one `primary` per region. `primary` = `--accent-strong` fill (hover `--accent-strong-hover`), white `t-body` + `is-strong`, radius `--r-m`, min-height `--target` (52px in forms). `secondary` = white fill, 1px `--border-strong`. `quiet` = text. Disabled = opacity 0.5 + `aria-disabled`.
- **TextLink:** action links `t-body` + `is-strong`, `--text-strong`, 2px `--accent` underline, hover `--brand-hover`. Quiet links `t-body`/`t-small`, `--brand`, underline on hover.
- **Badge / Tag / FilterOption / Icon / Divider / Avatar:** sizes and tones in COMPONENTS.md. Avatar sizes 18 / 32 / 44 / 72 (no 34 or 56). Stacked avatars overlap 8–10px with a 2px ring of the surface colour; 72 may carry a second ring in the operator colour. Divider ornament "···" in `--text-faint`.
- **Tooltip:** white, 1px `--border`, `--r-m`, `--sh-tooltip`, `t-small`, arrow 10px. Opens on hover, keyboard focus and tap. One standard everywhere.
- **FactCell / FactList:** label `t-micro` muted (sentence case, never uppercase), value `t-small` + `is-strong`. Columns: 2 below `--bp-sm`, then one per cell (max 4 per row); odd last cell spans. 1px `--border` gaps, radius `--r-l`, overflow hidden. The card "Durée / Dès / Guide" row uses the same cells. On blog entries the list is attached directly under the photo (shared border and radius), credit below.
- **HeroFacts:** the same cells, built once. Mobile: in the page body. ≥1024: floats over the hero bottom edge with `--sh-float`, tooltip per cell.
- **KeyFacts** ("Bon à savoir"): label `t-micro` muted, value `t-body`; rows from `season` ("Quand y aller"), `keyInfo` and "Aussi appelé"; icon by keyword in the label (default 🔹). On blog articles the same data is a plain `t-read` list with `is-strong` lead-ins.
- **Quote:** `inline` = reviews, Callout, in-body (`t-quote`). `pull` = the guide's quote at the top of the tour card and one per article (`t-pull`, left-aligned, 3px `--accent` rule, max 640px). Attribution `t-small` muted.
- **Disclosure:** native `<details>`, summary min-height `--target` with a "+" glyph. Always paired with matching JSON-LD where it is a FAQ.
- **SectionHeader:** H2 (`t-h2`), optional overline above only when it adds a category. In v12: "Aperçu", "Réseaux sociaux", "Ils en parlent", "Qui sommes-nous".

### Organisms (content and behaviour)
- **AnswerSummary** ("En bref"): `--surface-info`, `--r-l`, overline in `--brand`, then `t-read`. 40–60 words, a direct answer to the search query. Computed from data on filter pages, never hand-written facts.
- **TableOfContents** ("Sommaire"): 2px left rule, overline, ordered anchor links, 44px rows.
- **TakeawayList** ("L'essentiel"): `t-read` list, `is-strong` lead-in on each item.
- **Callout** (guide tip): white or `--surface-info`, Avatar, overline "Le conseil de {guide}", `Quote inline`. Only when the tip is real.
- **BenefitList** ("Pourquoi y aller avec…" / "Pourquoi partir avec un guide"): tiles with Icon, `t-body` + `is-strong` title, `t-body` text in `--text-body`.
- **GearList** ("Fourni par le guide" / "Dans le sac" / "À prévoir"): emoji + label (`t-small`) on `--surface-info` or `--surface-subtle`. **RiskList:** Tags with a risk emoji (`RISK_ICON`).
- **SafetyAlert:** danger surface and border, `--r-l`, Badge danger, title `t-body` + `is-strong`, text `t-body`, both `--danger-text`. `compact`: `t-small`, no uppercase label (listing banner, collapsible to a "Sécurité" pill). `site-closed`: renders in Aperçu (`#alerte-site`) and in Accès (policy `closed`); not repeated in Sécurité. At most one danger surface per viewport.
- **AccessNotice:** `--surface-info`, `--r-l`, Icon (📍 commune_only, 🧭 guide_only, 🚫 closed), title `t-body` + `is-strong`, text `t-body`. Replaces itinerary content when the policy hides it. For `guide_only` and `closed` it also carries the guide name and the "Y aller avec {guide} →" TextLink (no separate "Avec un guide" block).
- **SignatureLine:** removed. `signature` is only the card subtitle and an SEO snippet source. Never ship a placeholder.
- **LegalNotice:** always folded, never a card. `inline` (destination page): one-line summary "Annuaire informatif : à vérifier avant de partir"; opened it shows the short notice and a link that opens and scrolls to the full one. `full` (`#avertissement`, footer): summary is an overline "Avertissement", closed by default, four short paragraphs in `t-small` muted.
- **FaqList:** `Disclosure` items; question `t-h3`, answer `t-read`. Always with FAQPage JSON-LD.
- **SourceList:** a folded Disclosure with sources and photo credits.
- **Gallery:** tabs "Accès libre" / "En sortie guidée · {guide}"; thumbnails 4:3, `--r-m`; "Photos : sources ↓" credit line. **Lightbox:** full-screen `--surface-scrim`, counter, source link per image, swipe and arrow keys, Esc.
- **SocialPosts** ("{Destination} sur les réseaux"): thumbnails with platform, account and title; click opens the Lightbox (YouTube embedded); "Ouvrir dans l'app" on touch only. Scroll-snap row below 1024, grid above. **PressMentions:** source, page title, link.
- **DestinationCard:** 3:2 media, `--r-l`; `guided` shows the operator Avatar and a tinted hover state; `free-access` shows "Accès libre" label. Grid: `auto-fill minmax(290px, 1fr)` (one column on phones). `row` layout (list toggle): image left, compact. CTA bottom-right, label from `ui-copy.json`.
- **GuideOfferCard** (`Guide Offer Card.dc.html`): sticky 340px column ≥1024, inline on mobile. Destination title, "avec {guide} de {company}", diploma (muted), Price, Button "Réserver", TextLink "Écrire à {guide}" (GuideContactLink), alternative-tour switch.
- **ArticleEntry:** serif entry number (`--brand`, regular) + `t-title` name, image with attached FactList, credit, `t-read` lead, optional place intro (once per place), "Au programme"/"Repères" list, Quote, "Quand y aller", TextLink.
- **RelatedCard:** 3:2 image and `t-title` name; `auto-fill minmax(240px)`.
- **ReviewCard:** only real reviews with a source (author · source). Drafts never render; the block hides when empty.
- **SiteHeader / MenuSheet:** SiteHeader on every page, above the hero, **not sticky** (the sticky filter bar is the only sticky strip on the listing: a second one would cost ~120px of a phone screen). Wordmark (serif 18, `--ls-wordmark`) left; on mobile one icon-only menu button (two 20×2px lines, no border or fill, 44×44 hit area, `aria-label="Ouvrir le menu"`, `aria-expanded`; hover/active = `--surface-sunken` circle; −10px right margin so the lines align with the gutter). ≥1024: inline nav ("Les lieux", "Idées de sorties", "Les guides") and the RC mark. MenuSheet drops from the top (scrim, `--r-sheet` bottom corners, `--z-sheet`): primary rows in `t-title` (56px), then overline groups "Les guides", "Par type", "Par commune" with 44px link rows; a chosen link closes it; Esc and scrim close it.
- **FilterToolbar** (listing, sticky): **one line at every width**: SearchField (flex 1, 44px, 16px input) + "Filtres" Button (dark, 44px, count Badge). Every filter lives in FiltersSheet. ≥1024: the excursion Toggle and Selects (île, esprit, durée, public) also appear inline.
- **FiltersSheet:** bottom sheet, `--r-sheet`, 44px options, 52px footer Buttons ("Effacer", "Voir N résultats"). Groups: Afficher (Tout / Excursions guidées / Sites en accès libre), Île, Trier, Esprit, Guide, Durée, Secteur, Marche d'approche, Encadrement, Fiabilité (sites); toggles "Adapté aux enfants", "Animaux acceptés", "💦 Avec cascade" (`has_waterfall`). No live-conditions toggle.
- **StickyBooking:** mobile only, when a tour exists. Hides on scroll-down, reappears on scroll-up. White 0.97, blur, top border, `--sh-sticky-bottom`, `--z-cta`. Must never cover the "Avec un guide" link.
- **GuideContactLink:** every "Écrire à {guide}" and "Demander conseil à {guide}" is a link to `https://wa.me/{whatsapp}?text=…` (new tab, via `/go/whatsapp/{guide}`). Message: "Bonjour {guide}, je vous écris depuis {site} au sujet de {sortie ou lieu}." Subject = tour name on tour context, destination name on place context, "d'une sortie" when generic. Numbers `[WHATSAPP_PASCAL]`, `[WHATSAPP_QUENTIN]`. No lead form.
- **BookingLink:** every "Réserver" points to `operator.bookUrl` (new tab, via `/go/book/{offer}`). Placeholders `[BOOKING_URL_YALODE]` / `[BOOKING_URL_WILDCANYON]` until real pages exist.
- **LeadCapture** ("Le top 5, par message"): dark `--surface-dark-2` panel in the listing feed (one markup for grid and list). Overline, `t-title` heading, `t-body` line (≤480px). Form = wrapping row: e-mail input (`flex: 1 1 240px`, 52px, 16px, `inputmode="email"`, `autocomplete="email"`) and "Recevoir" (`flex: 1 1 160px`, 52px, primary): stacked on phones, one row from ~480px without a media query. Consent: 24px checkbox, `t-small` label, 44px row, link to the privacy page; never pre-checked. "Recevoir" is disabled (opacity 0.5, `aria-disabled`) until the e-mail is valid and consent is given. Step 2 (optional): `tel` input (`inputmode="tel"`, `autocomplete="tel"`) + "Ajouter", then "Non merci" as a 44px text button. Step 3: confirmation (`role="status"`).
- **SiteFooter:** `--surface-footer`, link groups (Par type, Par île, Par commune, Idées de sorties, Les guides) that only link to existing pages, then LegalNotice `full`, then the independence note in `t-micro`.
- **Byline** (article): stacked Avatars, "Écrit par {names}" link, one-line bio.

## 3. Page templates
Pages A–G below map to templates in `COMPONENTS.md`: A listing → ListingTemplate · B destination → PlaceTemplate · C article → ArticleTemplate · D filter page and F blog index → CollectionTemplate · E guide → ProfileTemplate · G privacy → DocumentTemplate. Section lists use canonical component names.

### A. Directory listing (`view: 'list'`)
SiteHeader, then Hero (H1 `h1`), then Filters, then grid/list toggle, then the DestinationCard grid. It ends with a lead magnet band and the SiteFooter.

### B. Destination page (`view: 'detail'`)
1. Hero. It has:
   - a photo,
   - a breadcrumb and back link aligned with the title,
   - a type pill with a "!" DangerBadge (tooltip, links to `#alerte-site`),
   - H1 display-l,
   - the commune line (`body`, on-dark-2). No subtitle: guide voice appears in the Callout and the tour-card quote only.
2. HeroFacts.
4. `#apercu`: Aperçu (intro in the read style, Callout when real, "Bon à savoir" as KeyFacts incl. "Aussi appelé").
5. Inline disclaimer.
6. `#alerte-site`: SafetyAlert (site-closed), if any.
7. `#photos`: Gallery.
8. `#acces`: always present; content depends on `location_policy` (table below).
9. `#securite`: "Les règles en rivière" card, RiskList and the "Dans le sac" GearList (the closure alert moved to Accès).

#### Accès by location policy
| Policy | H2 | Shows | Hides |
|---|---|---|---|
| `public` (official sites with parking) | `accessH2` or "Comment accéder à {nom}" | Access tiles (drive, parking, approach), "Par vos propres moyens" text, "Ouvrir dans Google Maps ↗", guided paragraph | — |
| `commune_only` | "Où se trouve {nom}" | AccessNotice 📍 "Commune : {commune}" + "renseignez-vous avant de partir", guided paragraph if a tour exists | Tiles, itinerary, map, coordinates |
| `guide_only` (all canyons) | "Accéder à {nom} avec un guide" | AccessNotice 🧭 "Point de rendez-vous donné par le guide", generic guided line + "Y aller avec {guide} →" | Tiles, itinerary, map, coordinates, the tour's meeting point |
| `closed` | "Accès : site fermé" | SafetyAlert site-closed, AccessNotice 🚫 "Pas d'itinéraire publié", generic guided line if a tour exists | All directions |
Empty policy renders as `commune_only`. The auto FAQ "Comment aller à {nom} ?" is generated only for `public`. Preview each case with the prop `accessPolicyPreview`.
10. `#sortie`: "Aller au {destination} avec un guide". It contains:
    - the guide quote,
    - FactList "Programme",
    - "Pourquoi y aller avec {guide}" as BenefitList plus a human paragraph,
    - GearLists (Fourni / À prévoir),
    - the Callout,
    - the reviews block "Avis sur la sortie avec {guide}".
11. `#guides`: "Qui sommes-nous" (merged guide profile). It contains:
    - avatars,
    - the "Nous c'est Pascal et Quentin…" text,
    - company blocks with logo, "avec {guide}" and diplomas.
12. `#social`: SocialPosts.
13. `#ils-en-parlent`: PressMentions.
14. `#faq`: FaqList.
15. `#proximite`: nearby destinations.
16. `#explorer`: intent links (Tags with emoji).
17. `#sources`: SourceList.
18. SiteFooter, with `#avertissement` (LegalNotice `full`).

GuideOfferCard sits in the right column on desktop. StickyBooking appears on mobile.

No live or safety-critical status is ever shown (no "praticable aujourd'hui", no go / watch / closed per tour, no "conditions du jour"). Closures come from a dated, sourced `access_status` and are shown as a closure, not as a live state.

### C. Blog article / theme page (`view: 'seo'`)
1. Hero. It has:
   - a photo with a dark gradient,
   - the breadcrumb "Accueil › Le blog › {thème}",
   - a glass pill eyebrow,
   - H1 display-xl,
   - a byline (stacked avatars, "Par Pascal & Quentin · Mis à jour le … · N min de lecture").
   - No CTA.
2. Article column (`--w-article` 728px, text 680px):
   1. Standfirst (lead).
   2. AnswerSummary.
   3. TableOfContents.
   4. `#essentiel`: TakeawayList.
   5. `#guide`: ArticleSection ×3.
   6. Quote.
   7. Divider.
   8. `#selection`: ArticleEntry ×N.
   9. KeyValueList "Bon à savoir".
   10. `#avant-de-partir`: SafetyAlert.
   11. Divider.
   12. `#faq-theme`: FaqList.
   13. `#avec-un-guide`: BenefitList card "Pourquoi partir avec un guide ?".
   14. Byline.
   15. Sources line.
3. Then RelatedCard grid (1120px), then SiteFooter.

### D. Filter landing page (`view: 'filter'`, e.g. `/cascades`, `/communes/petit-bourg`)
Only for types and communes with 3+ destinations (computed: Rivières 13, Cascades 4, Canyons 3, Petit-Bourg 6, Vieux-Habitants 3). Reuses blog hero, AnswerSummary, DestinationCard, FaqList and RelatedCard.
1. Hero: breadcrumb "Accueil › Par type|Par commune › {H1}", glass pill, H1 display-xl ("Cascades de Guadeloupe", "Rivières et cascades à Petit-Bourg"), photo credit.
2. Column 720: intro (lead), AnswerSummary "En bref". Intro and answer are computed from data (counts, guided places, public access, closures); never hand-written facts.
3. `#lieux`: overline "Les lieux", H2 "{n} {type} {où}", DestinationCard grid.
4. `#faq-filtre`: FaqList (computed questions) + FAQPage JSON-LD.
5. "À lire aussi": RelatedCard grid of the blog articles whose selection includes one of these places.
6. SiteFooter. SiteFooter "Par type" and "Par commune" link only to existing filter pages; "Par île" lists only islands that have places (Basse-Terre).

### E. Guide page (`view: 'guide'`, `/guides/pascal`, `/guides/quentin`)
Back button, then a header: 72px portrait, overline "Guide · {company}" in the operator colour, H1 display-l (full name), "{diploma} · {rating} ★", Button primary "Réserver sur {company} →" (BookingLink) + Button secondary "Écrire à {guide} sur WhatsApp" (GuideContactLink). Sections (destination section style): `#a-propos` (bio + 2-column fact grid: diplomas, experience), `#sorties` (nearby-card list of the guide's tours), `#lieux` (places), `#avis` (real reviews only, hidden when none). JSON-LD: Person (name, jobTitle, image, worksFor) + BreadcrumbList.

### F. Blog index (`view: 'blog'`, `/blog`)
Blog hero (breadcrumb "Accueil › Le blog", pill, H1 "Idées de sorties en Guadeloupe", byline with the article count), then a RelatedCard grid of all intent articles with their intro (15/1.5 `--text-body`). JSON-LD: Blog + ItemList + BreadcrumbList. The blog breadcrumb "Le blog" links here.

### G. Privacy page (`view: 'privacy'`, `/confidentialite`)
DocumentTemplate. Linked from the lead-capture consent and the footer. **The text is not written yet and will be generated later.** Build the page with a placeholder block (`[PRIVACY_POLICY_TEXT]`, `noindex` while present, production build fails on it) and follow `PRIVACY_CONTEXT.md`.

## 4. SEO and structured data
- **Destination:** TouristAttraction + FAQPage + BreadcrumbList JSON-LD (`syncLd`). `publicAccess` is false for `closed`, true for `public`, omitted otherwise.
- **Filter page:** CollectionPage + ItemList + FAQPage + BreadcrumbList.
- **Guide page:** Person + BreadcrumbList.
- **Blog index:** Blog + ItemList + BreadcrumbList.
- **Blog:** Article (authors, dates, image) + ItemList (selection) + FAQPage + BreadcrumbList.
- **Headings:** one H1 per page. Every section starts with an H2, and items inside are H3.
- **Anchors:** every H2 has an id (`scroll-margin-top: 80px`) for the TableOfContents and deep links.
- **Copy rules:**
  - short sentences, French, no AI markers,
  - never copy sources verbatim,
  - always credit the photo source and the social account.

## 5. Known gaps / to decide
- The Yalodé logo is a placeholder (`logoUrl: null`).
- Placeholders to replace: `[WHATSAPP_PASCAL]`, `[WHATSAPP_QUENTIN]`, `[BOOKING_URL_YALODE]`, `[BOOKING_URL_WILDCANYON]`, `[PRIVACY_POLICY_TEXT]`.
- `signature`: 10 drafts exist (card subtitle only, not shown on the destination page); the other 12 are empty. Drafts must be validated by the guides. `has_waterfall` is null where unknown; 4 rivers with an unknown commune have no `location_policy`.
- Open decisions from the 2026-10-06 audit (J1–J8) are listed in `docs/AUDIT_2026-10-06.md` §5.
- The privacy page text must be written (and reviewed) before launch.
- Two console errors (`{}`) on load come from the preview runtime and are not part of the design.
- Remote images (Wikimedia, Parc national, operators) must be downloaded or re-licensed before production. Credits are in `data/destinations.json`.
