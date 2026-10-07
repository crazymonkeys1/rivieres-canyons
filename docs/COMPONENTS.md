# Component registry

One row per component. **Name** is canonical (role-based, see `ARCHITECTURE.md` §3). **Legacy** is the name used in docs and changelog before 2026-10-06 (kept so old entries can be looked up; do not use it in code). Rename decision J-N1 is in `REVIEW_2026-10-06.md` §4 (applied, reversible: swap the two columns).

How to read: **Composed of** lists lower-level pieces. **Variants** are props (never separate components). **Text** lists text styles from `TYPOGRAPHY.md`. **Mobile** is the base layout (≈360px); **≥480** and **≥1024** list only what changes. "Reference" is the section of `Guadeloupe v12 Details.dc.html` that shows it (the prototype is a visual reference only; where it disagrees with this file, this file wins, see `CLAUDE.md` §3 precedence).

Status: ✅ in the reference · 🆕 needed by the system but only implied in the reference (build it from this spec).

---

## L3 Atoms

| Name | Legacy | Composed of | Variants / props | Text | Mobile · ≥480 · ≥1024 | Notes |
|---|---|---|---|---|---|---|
| **Button** ✅ | ButtonPrimary, ButtonGhost | label (+ optional Icon) | `variant: primary \| secondary \| quiet` · `tone: neutral \| danger` · `fullWidth` · `disabled` | `t-body` + `is-strong` | Min-height 44px (52px in forms). `primary` = `--accent-strong` fill, white label; `secondary` = white fill, `--border-strong`; `quiet` = text only. One size. | One `primary` per viewport region. Disabled: opacity .5, `aria-disabled`. |
| **TextLink** ✅ | TextLink | text (+ arrow) | `emphasis: action \| quiet` | `t-body` + `is-strong` (action) / `t-small` (quiet) | `action`: `--text-strong`, 2px `--accent` underline, hover `--brand-hover`. Min-height 44px when standalone. | Opens external links with `rel="noopener"`. |
| **Avatar** ✅ | Avatar | image or initials | `size: 18 \| 32 \| 44 \| 72` · `ring` | n/a | Circle. Stacked avatars overlap by -8 to -10px with a 2px ring of the surface colour. | 72 may carry a second ring in the operator colour. |
| **Badge** ✅ | DangerBadge, Badge | text or glyph | `tone: neutral \| danger \| info` · `onPhoto` | `t-micro` + `is-strong` | `onPhoto` uses `--surface-chip-on-photo`. `danger` = 24px circle "!" `--danger`. | Never carries a sentence. |
| **Tag** ✅ | TagChip | emoji + label | none | `t-small` | Radius `--r-s`, `--surface-sunken`, `--text-body`. | Static; not interactive. |
| **FilterOption** ✅ | Pill / Chip | label (+ Avatar) | `selected` | `t-small` | 44px. Selected: strong + `--surface-dark-2` fill, white text. Pill radius. | Interactive; `aria-pressed`. |
| **Icon** ✅ | IconTile | emoji or SVG | `size: 32` · `framed` | n/a | 32×32, radius `--r-s`, white fill, `--border`. Decorative: `aria-hidden`. | Emoji are decorative and always followed by text. |
| **Divider** ✅ | Separator | rule or "···" | `variant: line \| ornament` | n/a | Ornament: centred, `--text-faint`, 0.6em. | |
| **Rating** 🆕 | (stars inline) | star glyphs + number | `value`, `count` | `t-small` | Stars `--star` are decorative; the number is the information and is always shown as text. | |
| **TextInput** ✅ | (inline) | input | `type: text \| email \| tel \| search` · `invalid` | `t-body` (16px) | 44px (52px on the dark lead form). `inputmode`, `autocomplete`, `enterkeyhint` set per type. | Focus: two-tone ring (global). |
| **Checkbox** ✅ | (inline) | input + label | `checked` | label `t-small` | 24px box inside a 44px row. | Consent checkbox is never pre-checked. |
| **Toggle** ✅ | (inline) | switch + label + hint | `on` | `t-body` + `is-strong`, hint `t-small` | 44px row; knob `--sh-knob`. | Used in FiltersSheet. |
| **Select** ✅ | (inline) | native select | | `t-small` | Desktop inline filters only. | |

## L4 Molecules

| Name | Legacy | Composed of | Variants / props | Text | Mobile · ≥480 · ≥1024 | Notes |
|---|---|---|---|---|---|---|
| **FactCell** ✅ | (cell of FactStrip) | Icon (emoji) + label + value | `compact` | label `t-micro` muted · value `t-small` + `is-strong` | One cell; label sentence case. | Atom of every fact list. |
| **KeyFact** ✅ | (tile of KeyValueTiles) | Icon + label + value | | label `t-micro` muted · value `t-body` | Tile: `--surface-subtle`, `--border`, `--r-m`, padding `--space-3`/14. | Value may wrap. |
| **Price** ✅ | (price block) | amount + unit | `size: card \| header` | amount `t-title` (`t-h2` in header, J-T4) · unit `t-small` muted | Right-aligned in the card footer. | Add `.tnum`. |
| **Breadcrumb** 🆕 | (nav in heroes) | TextLinks + "›" | | `t-small` | Wraps; current page not a link. | `<nav aria-label="Fil d'Ariane">`. On photo: `--text-on-dark-2`. |
| **Tooltip** ✅ | Tooltip | text + arrow | | `t-small` | Opens on hover, focus **and tap**; `role="tooltip"`; `--sh-tooltip`, `--r-m`. | Never the only way to reach information. |
| **Disclosure** ✅ | Accordion item, Disclaimer, SourcesFold | `<details>` summary + content | `summaryStyle: question \| overline \| note` | summary `t-h3` / overline / `t-small`; content `t-read` or `t-small` | Summary min-height 44px with "+" glyph. Native `<details>`. | Base for FaqList, LegalNotice, SourceList. |
| **FilterOptionGroup** ✅ | (group in sheet) | title + hint + FilterOptions | `multi` | title `t-body` + `is-strong` | Wraps. | |
| **SearchField** ✅ | (search pill) | Icon + TextInput | | `t-body` | 44px pill, flex 1. | |
| **Quote** ✅ | QuoteBlock, InsiderTip quote | serif italic text + attribution | `size: inline \| pull` · `rule` | `t-quote` / `t-pull`; attribution `t-small` | `pull`: one per tour card or article, 3px `--accent` rule, left-aligned. | |
| **Byline** ✅ | AuthorBox (small) | stacked Avatars + names + date | | `t-small` | One line, wraps. | |
| **SectionHeader** ✅ | SectionHeading, Eyebrow | optional overline + H2 | `eyebrow?` | overline = `t-micro` + `is-upper` · `t-h2` | Eyebrow only when it adds a category. | |
| **Callout** ✅ | (InsiderTip card) | Avatar + overline + Quote | `source` | | `--surface-info`, `--r-l`. | Only when the guide's tip is real. |

## L5 Organisms

| Name | Legacy | Composed of | Variants / props | Mobile · ≥480 · ≥1024 | Reference / notes |
|---|---|---|---|---|---|
| **SiteHeader** ✅ | SiteHeader | wordmark + menu button (mobile) / nav links (≥1024) | | Not sticky. Menu button is icon-only, 44×44, no border. ≥1024: inline nav + RC mark. | Every page. |
| **MenuSheet** ✅ | MenuSheet | primary links (`t-title` rows 56px) + link groups | | Drops from the top, scrim, closes on link, scrim and Escape. | Opened by SiteHeader. |
| **FilterToolbar** ✅ | FilterBar | SearchField + Button (Filtres, count Badge) | | **One line at every width.** ≥1024: excursion Toggle + Selects inline. Sticky. | Listing only. |
| **FiltersSheet** ✅ | FiltersSheet | FilterOptionGroups + Toggles + footer Buttons | | Bottom sheet, `--r-sheet`, 44px options, 52px footer buttons, `--z-sheet`. Holds **every** filter. | |
| **DestinationCard** ✅ | DestinationCard | media + Badges + title + Meta + subtitle + Tags + FactList + Price + Button | `layout: grid \| row` · `kind: guided \| free-access` | 1 column; `auto-fill minmax(290px)`. CTA bottom-right. | Listing, filter pages, nearby, guide pages. |
| **FactList** ✅ | FactStrip | FactCells | `columns` | 2 columns <480, one cell per column up to 4 (J1-A); odd last cell spans. 1px `--border` gaps. | Tour programme, article entry, access tiles. |
| **HeroFacts** ✅ | HeroFactBar | FactCells | | Mobile: FactList in the body. ≥1024: floats over the hero edge with `--sh-float`. Build once, switch with CSS. | Destination page. |
| **KeyFacts** ✅ | KeyValueTiles | KeyFacts | | `auto-fit minmax(min(100%, 240px), 1fr)`, gap `--space-2`. | "Bon à savoir". |
| **BenefitList** ✅ | ValueTiles | Icon + title + text | | `auto-fit minmax(min(100%, 220px), 1fr)`. | "Pourquoi y aller avec…". |
| **SafetyAlert** ✅ | SafetyAlert | Badge (danger) + title + text (+ items) | `variant: default \| compact \| site-closed` | `--danger-*` surface. Max one danger surface per viewport. | Listing banner (compact, collapsible), destination, access, article. |
| **AccessNotice** ✅ | AccessNotice | Icon + title + text (+ TextLink) | `policy: commune_only \| guide_only \| closed` | `--surface-info`. Merges the guide CTA for guide_only and closed. | Accès section. |
| **AnswerSummary** ✅ | AnswerBox | overline + text | | `--surface-info`, `t-read`. 40–60 words. | Article, filter page. |
| **TableOfContents** ✅ | TOC | overline + ordered links | | 2px left rule; 44px rows. | Article. |
| **TakeawayList** ✅ | TakeawayList | list with lead-ins | | `t-read`, 600 lead-in. | "L'essentiel". |
| **ArticleSection** ✅ | EditorialSection | SectionHeader + h3 + prose | | `t-read` column 680px. | |
| **ArticleEntry** ✅ | ArticleEntry | title + meta + image + FactList + prose + KeyFacts + Quote + TextLink | | Facts attached under the photo. | Blog selection. |
| **GearList** ✅ | GearList | Icon + label rows | `tone: provided \| bring` | `auto-fill minmax(140px)`. | |
| **RiskList** ✅ | RiskTags | Tags with risk emoji | | | |
| **FaqList** ✅ | Accordion / FAQ | Disclosures | | Native `<details>`; FAQPage JSON-LD. | |
| **LegalNotice** ✅ | Disclaimer | Disclosure | `scope: inline \| full` | Always folded. Inline: one-line summary; link opens the full footer one. | Destination (inline), footer (full, `#avertissement`). |
| **SourceList** ✅ | SourcesFold | Disclosure + links + credits | | | |
| **Gallery** ✅ | Gallery | tabs + thumbnails | | 2 columns of 4:3, `--r-m`. | |
| **Lightbox** ✅ | Lightbox | image/video + controls | | `--z-lightbox`, swipe, Esc, source link. | |
| **SocialPosts** ✅ | SocialStrip | thumbnails + titles | | Scroll-snap row (62% cards) <1024; 4-column grid ≥1024. | |
| **PressMentions** ✅ | PressList | link rows | | 44px rows. | |
| **RelatedCard** ✅ | RelatedCard | image (3:2) + `t-title` name | | `auto-fill minmax(min(100%, 240px), 1fr)`. | Article and filter-page "À lire aussi". |
| **ReviewCard** ✅ | ReviewCard | Rating + Quote + attribution | | Real, sourced reviews only. | |
| **GuideOfferCard** ✅ | GuideOfferCard | operator Avatar + name + Price + Button + TextLink + alt switch | | Inline on mobile. ≥1024: sticky 340px column. | `Guide Offer Card.dc.html` |
| **StickyBooking** ✅ | MobileStickyCTA | Avatar + summary + Button | | Mobile only, hides on scroll-down, `--z-cta`, `--sh-sticky-bottom`. | |
| **LeadCapture** ✅ | LeadMagnetBand | overline + title + body + TextInput + Button + Checkbox | `step: main \| secondary \| done` | Stacks (52px field, 52px button) on phones, one row from ~480px without a media query. Consent never pre-checked; button disabled until valid. | Listing feed. |
| **GuideContactLink** ✅ | WhatsAppLink | Button/TextLink → `wa.me` | | Pre-filled message (see DESIGN_SYSTEM). | |
| **BookingLink** ✅ | BookingLink | Button → `operator.bookUrl` | | New tab; goes through `/go/book/*`. | |
| **Hero** 🆕 | (hero blocks) | photo + scrim + Breadcrumb + H1 + meta/Byline | `variant: destination \| article \| listing` | Photo with `--scrim-hero`; H1 `t-h1` white + `.on-photo`. Destination: Badges + commune line. | Three heroes in the reference share this. |
| **SiteFooter** ✅ | Footer | link groups + LegalNotice | | Groups `auto-fit minmax(150px)`. | |
| **EmptyState** ✅ | (isEmpty block) | title + text + Buttons | | | Listing with no results. |

## L6 Templates (slots and order only)

| Name | Slots in order | Legacy / page |
|---|---|---|
| **ListingTemplate** | SiteHeader · Hero · FilterToolbar · SafetyAlert(compact) · results (DestinationCards + LeadCapture) · SiteFooter | listing `/` |
| **PlaceTemplate** | SiteHeader · Hero · HeroFacts · Overview (SectionHeader, prose, Callout, KeyFacts) · Photos · Access (by `location_policy`) · Safety · GuidedOffer · Guides · Social · Press · FaqList · Nearby · Explore · Sources · SiteFooter | destination |
| **ArticleTemplate** | SiteHeader · Hero · AnswerSummary · TableOfContents · TakeawayList · ArticleSections · ArticleEntries · KeyFacts · SafetyAlert · FaqList · BenefitList · Byline · SourceList · Related · SiteFooter | blog article |
| **CollectionTemplate** | SiteHeader · Hero · intro · AnswerSummary · DestinationCard grid · FaqList · Related · SiteFooter | filter page, blog index |
| **ProfileTemplate** | SiteHeader · header (Avatar, H1, Buttons) · About · Offers · Places · Reviews · SiteFooter | guide page |
| **DocumentTemplate** | SiteHeader · H1 · prose · SiteFooter | privacy, legal |

## Gaps closed by this registry (items present in the reference but missing from the previous system)
Breadcrumb, Hero (shared), Rating, TextInput / Checkbox / Toggle / Select, Disclosure (generic), SearchField, FilterOptionGroup, EmptyState, Callout, FactCell/KeyFact as separate molecules, MenuSheet and FilterToolbar (added 2026-10-06).
