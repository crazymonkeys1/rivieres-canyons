# Typography system (2026-10-06)

> Component names in this file are the canonical role-based ones from `COMPONENTS.md` (legacy names appear only in the historical audit table §2.1).

**Single source of truth for text.** Values: `tokens/tokens.css` §1–3. Classes: `tokens/text-styles.css`. This document explains what exists, when to use it and why.
**Rule for every future decision:** a size, weight, style, colour or effect exists only if it serves a UX purpose listed here. If a new component seems to need a new one, it does not: pick the nearest style. If it truly cannot, add the purpose to this file and the value to `tokens.css` in the same change.

Read order for a build session: §4 (styles) → §5 (where each applies) → §3 (forbidden) → §6 (migration, only when porting the HTML reference).

---

## 0. Summary of the system

| | Before (HTML reference) | After |
|---|---|---|
| Families | 3 (+ `inherit`, + 2 stray `system-ui` declarations) | **3**, one job each |
| Font files | 8–9 weights/styles | **6** (Instrument Serif 400 + 400 italic · Source Serif 4 400 + 600 · Archivo 400 + 600) |
| Distinct sizes | 25 values (fixed and fluid, 6 of them odd) | **10** (5 display serif, 1 reading serif, 4 UI) |
| Weights (sans) | 400, 500, 600, 700 | **400, 600** |
| Line heights | 11 (1, 1.1, 1.15, 1.28, 1.3, 1.35, 1.4, 1.45, 1.5, 1.6, 1.65) | **4** (1.1, 1.3, 1.5, 1.6) |
| Letter-spacings | 8 values | **3** (read, overline, wordmark) |
| Text-shadows | 4 values | **1** |
| Text ink colours (light) | 5 (two near-identical greens) | **3 + 1 decorative** |
| Named text styles | 17 (incl. 4 that no longer render) | **10 + 2 modifiers** |

---

## 1. Families: what each is for and why it stays

| Family | Job | UX reason | Why it cannot be removed |
|---|---|---|---|
| **Instrument Serif** (400, 400 italic) | Identity: H1, H2, names, prices, quotes | A condensed display serif gives the brand its recognisable voice and makes titles scannable at a glance. Italic marks *someone's voice* (quotes). | It is the brand. Without it the site is generic. It is unreadable as prose (single weight, condensed), so it never carries sentences. |
| **Source Serif 4** (400, 600) | Reading: every paragraph of real prose | A text serif with an optical-size axis is the most comfortable face for 3–6 line paragraphs on a phone, and matches the Medium-style reading standard requested. The 600 weight is the lead-in for scanning definitions. | Archivo at paragraph length tires the eye; Instrument Serif cannot do it. |
| **Archivo** (400, 600) | Scanning and action: facts, meta, chips, buttons, links, h3, inputs | A neutral grotesque stays legible at 12–16px and at 600 reads clearly as "interactive or data". Separating UI from editorial is the main reason for a sans. | Serif at 12–14px in dense fact cells and controls loses legibility. |

**Editorial vs data:** serif = someone speaks or you read; sans = you scan, compare, tap. That one distinction explains every family choice below.
**Justified alternative with 2 families → see J-T1.**

Font source and licence: all three families come from **Google Fonts** under the SIL Open Font License 1.1 (free for commercial use, self-hosting allowed). Self-host WOFF2, Latin subset, `font-display: swap`; get the files from Google Fonts or the `@fontsource` packages, keep each OFL notice in the repo, never call the Google CDN at runtime. Preload Instrument Serif 400 and Archivo 400 (above the fold). Italics are only needed for Instrument Serif; do not load Source Serif or Archivo italics.

---

## 2. Audit

### 2.1 Findings (HTML reference, whole file)
| # | Finding | Evidence | Resolution |
|---|---|---|---|
| T1 | Near-duplicate sizes | 12 / 12.5 / 13 / 14 / 15 / 15.5 / 16 / 17 / 18 fixed; 20 / 22 / 24 / 26 / 28 serif | UI scale cut to 12 · 14 · 16 · 18; serif to 22 · 20 |
| T2 | Seven different display headings | `clamp(38,7vw,60)`, `clamp(34,7vw,44)`, fixed 38, `clamp(26,4vw,32)`, `clamp(22,3vw,26)`, 22, 20, 26, 28 | **h1, h2, title** (3 serif display styles) |
| T3 | Four sizes of quote | 18–21 fluid, 20, 18, 23–30, plus a sans-italic-less 1.1em in Source Serif | **quote** (20) + **pull** (one per tour card, and the blog pull quote) |
| T4 | Weights 500 and 700 for small distinctions | 500: 14 uses (controls, links, commune line); 700: 17 uses (CTA, "!") | Dropped. 600 is the only emphasis |
| T5 | Eleven line heights | see §0 | 4 values by role |
| T6 | Eight letter-spacings | -0.016em … 0.6em | 3 values; separators keep a literal "···" |
| T7 | Four text-shadows | 20px/.35, 6px/.55, 18px/.4, 10px/.35 | One token; chip on card photo still uses the tight one (see §6 open item) |
| T8 | Two almost-identical inks | `#16261F` (104 uses) vs `#14342A` (53 uses): 1.1:1 apart | Merged to `--text-strong #14342A` |
| T9 | Two danger inks | `#4A1C0E` text, `#5E1F0E` title | Merged to `--danger-text` (title = 600) |
| T10 | Uppercase used for 3 different jobs | section eyebrows, kind labels, fact labels in footer, "Avertissement", card kind | One job: **overline** (a short category label). Everything else is sentence case |
| T11 | Same element, different style | Card name 20 (grid, ink 16261F) vs 22 (list); price 20 vs 22 vs 26/28; FAQ question 16/600 vs 17/600; hero commune uppercase vs sentence | One style per role (see §5) |
| T12 | Unjustified decoration | italic + serif only needed for quotes, but a sans-less italic `1.1em` appeared in the blog | Italic only on Instrument Serif quotes |
| T13 | Style on elements that no longer render | SignatureLine, hero `lead` | Removed from the system |

### 2.2 Measured against best practice (mobile-first)
| Principle | Standard | Status |
|---|---|---|
| Hierarchy by few, clear steps | 5–8 steps; each step ≥ 1.15× the previous or clearly different in weight/face | Before: too many near-equal steps (13/14/15/16/17). After: 12 · 14 · 16 · 18 (each +2px) and weight/face carry the rest |
| Type scale logic | One ratio or one rule | Display: 22 → 26–32 → 34–48 fluid. UI: even 2px steps; prose 18–20 = UI h3 18 at the lower bound |
| Reading line length | 45–75 characters | `--w-read` 680px at 20px ≈ 70 chars ✔. UI paragraphs ≤ 640px |
| Mobile body size | ≥ 16px for UI text, ≥ 18px for long reading | UI body 16 ✔, prose 18 ✔, inputs 16 ✔ (no iOS zoom) |
| Floor | ≥ 12px, never light-on-light | 12px used only for labels/badges/credits |
| Line height | 1.5–1.6 for text, ≤ 1.3 for headings | ✔ |
| Contrast | 4.5:1 text, 3:1 large | ✔ every pair (see tokens.css notes). White on `--accent` forbidden for text |
| Scanning vs reading | Scan = sans, short, weighted; read = serif, long, regular | Enforced by family split |
| Emphasis budget | One device per element | Weight (600) only; uppercase only on overline; italic only on quotes |

### 2.3 Where the design system itself was wrong or bloated
- Listed 17 styles (display-xl/l/m/s, title, price, price-l, quote, quote-l, read, signature, h3, body, ui, caption, label, overline) where 10 suffice.
- `signature` style for an element no longer shown.
- Sans weights 500 and 700 documented as normal.
- Two heading inks, two danger inks, line-heights and letter-spacings with no rule.
- Mixed pixel documentation (11px overlines, 15px body) after the earlier pass; now one scale.

---

## 3. What is NOT allowed (the reasons a developer would otherwise improvise)
1. A fifth UI size, or any size between the steps (13, 15, 17, 19…). Use the nearest.
2. Weights 500, 700 or 300, anywhere. Need more emphasis → 600; less → 400 + `--text-muted`.
3. Italic on anything but Instrument Serif quotes. Source Serif italic and Archivo italic are not loaded.
4. Uppercase outside the overline. Letter-spacing outside the three tokens.
5. Instrument Serif for a paragraph, or Source Serif / Archivo for an H1/H2/name.
6. More than one 600 run inside a paragraph.
7. Muted text for content; accent colour for text; white text on `--accent`.
8. Text-shadow anywhere except white text directly on a photo.
9. A new colour for text. The set is §4.1.
10. Fixed H1 sizes. H1 is one fluid token.

---

## 4. The system

### 4.1 Tokens (see `tokens.css` for values)
| Group | Tokens | Purpose |
|---|---|---|
| Families | `--font-display`, `--font-read`, `--font-ui` | §1 |
| Weights | `--fw-regular` 400, `--fw-semibold` 600 | 600 is the only emphasis |
| Sizes (display serif) | `--fs-h1` 34→48 · `--fs-h2` 26→32 · `--fs-title` 22 · `--fs-quote` 20 · `--fs-pull` 24→30 | identity |
| Size (reading serif) | `--fs-read` 18→20 | prose |
| Sizes (UI sans) | `--fs-h3` 18 · `--fs-body` 16 · `--fs-small` 14 · `--fs-micro` 12 | scanning and action |
| Line heights | `--lh-display` 1.1 · `--lh-tight` 1.3 · `--lh-ui` 1.5 · `--lh-read` 1.6 | by role |
| Letter-spacing | `--ls-read` -0.003em · `--ls-overline` 0.08em · `--ls-wordmark` 0.06em | by role |
| Ink on light | `--text-strong` · `--text-body` · `--text-muted` · `--text-faint` (decoration only) | strong = names and values; body = content; muted = meta |
| Ink on dark | `--text-on-dark` · `-2` (0.85) · `-3` (0.7) · `--text-on-dark-accent` | 3 steps |
| Link and action ink | `--brand` (quiet link), `--brand-hover`, button text `#FFF` on `--accent-strong` | |
| Status ink | `--danger-text`, `--success-ink`, `--warning-ink`, operator colours | per component |
| Effect | `--text-shadow-photo` | legibility on photo only |

### 4.2 Text styles (10 + 2 modifiers)

| Style | Spec | What it is for | When to use | UX reason it exists |
|---|---|---|---|---|
| **h1** | display serif 34→48 / 1.1, `--text-strong` (white on photo + `.on-photo`) | The title of the page | Once per page, in the hero | The brand voice at its biggest. One style, so every page opens the same way |
| **h2** | display serif 26→32 / 1.1 | Section headings | Every `<h2>` in every template (blog included) | A repeated, recognisable rhythm lets users scan the page by its H2s |
| **title** | display serif 22 / 1.1 | Names and prices | Card names, tour name, sheet titles, nearby cards, prices | Names must stand out from UI text without competing with H2. Prices in the same face as names make "what it costs" part of the name line |
| **quote** | display serif **italic** 20 / 1.3 | Someone's voice, inside a card | Reviews, insider tip, in-body quote | Italic serif signals "this is a person speaking", separating testimony from facts |
| **pull** | display serif **italic** 24→30 / 1.3 | The guide's voice as a hook | One per tour card; one per blog article | The largest voice on the page: trust at the moment of booking. Bigger than `quote` on purpose |
| **read** | reading serif 18→20 / 1.6, -0.003em, `--text-body` | Sentences people read | Intro, access text, FAQ answers, bios, tour programme, article body. Max 680px | Comfort over several lines on a phone. `strong` inside = lead-in (600) |
| **h3** | sans 600 18 / 1.3, `--text-strong` | Sub-headings and questions | Sub-sections, FAQ questions, tile titles that introduce text | Bigger or stronger than the text it introduces; sentence case so it never shouts |
| **body** | sans 400 16 / 1.5 | UI text | Card subtitles, tile text, alerts, notices, form text, list rows | The default "interface sentence". 16 = comfortable and equals the input size |
| **small** | sans 400 14 / 1.5 | Secondary information | Meta lines, captions, breadcrumbs, disclaimers, tooltips, chips, filter controls, fact values (+strong) | Info that supports but does not lead. Must stay in `--text-muted` or ink; never below this for sentences |
| **micro** | sans 400 12 / 1.3 | Smallest labels | Fact labels, badges (+strong), photo credits, overline (+upper) | A floor for text that is labelled or credited, not read |
| **+ strong** | weight 600 | Emphasis | Values, buttons, links, selected state, badges | The only emphasis weight. One device per element |
| **+ upper** | uppercase + 0.08em + 600 | Overline | Short category labels (≤ 3 words): "Aperçu", "En bref", "Guide · Yalodé" | A kicker that adds a category the heading does not state. Nothing else is uppercase |

### 4.3 Button, link and input rules (they are styles, not extra sizes)
- **Button / CTA:** `body` + strong, white on `--accent-strong` (hover `--accent-strong-hover`). One size.
- **TextLink (action):** `body` + strong, `--text-strong`, 2px `--accent` underline (`.link`).
- **Quiet link:** `body` or `small`, `--brand`, underline on hover.
- **Filter pill / chip:** `small`; selected state = strong + dark fill. Not a different size.
- **Inputs, selects:** `body` (16px).
- **Numbers:** prices, durations, ratings add `.tnum` (tabular figures) so values align in grids.

---

## 5. Atomic mapping

### 5.1 Atoms
| Atom | Style | Ink |
|---|---|---|
| Page title | h1 | strong (white on photo) |
| Section title | h2 | strong |
| Name / price | title | strong |
| Prose paragraph | read | body |
| Sub-heading | h3 | strong |
| UI sentence | body | body |
| Meta / caption | small | muted |
| Label / credit / badge | micro (+ strong for badge) | muted / strong |
| Overline | micro + upper | brand (muted in boxes) |
| Link (action) | body + strong, `.link` | strong |
| Button label | body + strong | white |
| Input text | body | strong |
| Quote / pull | quote / pull | strong |

### 5.2 Molecules
| Molecule | Composition |
|---|---|
| FactCell | label = micro muted · value = small + `is-strong`, ink strong |
| KeyFact | label = micro muted · value = body body |
| Tag | small, body ink, no weight |
| Badge / pill | micro + strong |
| Price block | price = title · unit = small muted |
| Meta line | small muted (pin + commune, duration · age · level) |
| Eyebrow + H2 (only where it adds a category) | overline brand + h2 |
| Fact label/value in AccessNotice, alerts | title = body + strong, text = body |
| Quote block | quote or pull with 3px accent rule; attribution small muted |

### 5.3 Organisms
| Organism | Name | Text | Facts / meta | CTA |
|---|---|---|---|---|
| DestinationCard | title | body (muted→body ink) | small + FactCell | body strong |
| Hero (destination) | h1 on photo | commune = body on-dark-2 | badges micro strong | n/a |
| HeroFacts | n/a | n/a | FactCell | link (body strong) |
| Tour card header | title | "Avec X" = body strong; role = small on-dark-2 | price = title | n/a |
| Tour card quote | pull | n/a | n/a | n/a |
| Alert / Notice | body strong title | body | n/a | link |
| FAQ item | question = h3 (600), answer = read | n/a | n/a | n/a |
| Article entry | name = title | read | FactCell | link |
| BenefitList | tile title = body + strong | body | n/a | n/a |
| SiteFooter | overline for group titles, body for links, small for legal | n/a | n/a | n/a |

Note: the entry number in front of an article entry name is `--brand`, regular weight.

### 5.4 Templates
Every template has the same ladder: **h1 → h2 → h3 → read/body → small → micro**. A page never invents a rung. Blog article = h1 (hero), h2 sections, h3 for sub-blocks and FAQ questions, read for everything else. Destination = same, with body/small/micro dominating the fact blocks. Listing = h1, then cards (title / body / small).

---

## 6. Migration map (HTML reference → system)

### 6.1 Sizes
| Reference | → | Where |
|---|---|---|
| `clamp(38,7vw,60)`, `clamp(34,7vw,44)`, 38, 60 | **h1** | all H1 |
| `clamp(26,4vw,32)` | **h2** | all H2 |
| `clamp(22,3vw,26)`, 22, 20, 24, 26 (serif names, tour name, entry names) | **title** | names |
| 28 (tour price), 22 (card price) | **title** (tour header price uses **h2**: it is the focal point; J-T4) | prices |
| `clamp(18,2.4vw,21)`, 18 italic, 20 italic | **quote** | in-card quotes |
| `clamp(23,1.4vw+17,30)`, blog 1.1em | **pull** | guide / article quote |
| `clamp(18,1vw+14,20)`, 19–22 signature, 16/1.65 prose | **read** | prose |
| 17, 18, 16 (FAQ q), card sub-heads | **h3** | sub-headings |
| 16, 15, 15.5, 17 (body-ish) | **body** | UI text |
| 14, 13 | **small** | meta, values, chips |
| 12, 12.5, 11, 10 | **micro** | labels, badges, credits |

### 6.2 Weights
| Reference | → |
|---|---|
| 700 (CTA label, "!") | 600 (CTA white on `--accent-strong`; "!" 600) |
| 600 | 600 (strong) |
| 500 (chips, controls, links, commune, social/press titles) | 400 for static text, controls and unselected chips · 600 for links and selected state |
| 400 | 400 |

### 6.3 Line heights, letter-spacing, effects, colour
- Line heights: 1.1 (display) · 1.15 → 1.1 · 1.28 / 1.3 / 1.35 / 1.4 (single line, quote, h3) → 1.3 · 1.45 / 1.5 → 1.5 · 1.6 / 1.65 → 1.6 · `1` only for icon glyphs.
- Letter-spacing: 0.06em / 0.1em / 0.12em / 0.14em → 0.08em (overline only) except the logo (0.06em); -0.012em / -0.016em / 0.02em → 0; `0.6em` stays on the decorative separator only.
- Text-shadow: all → `--text-shadow-photo`. **Open:** the operator chip on card photos (`0 1px 6px .55`) should become a badge with a solid `--surface-chip-on-photo` background so no tight shadow is needed.
- Ink: `#16261F` → `#14342A` (`--text-strong`); `#5E1F0E` → `#4A1C0E` (`--danger-text`).
- Uppercase: only overline; all fact labels, card kinds, footer group titles become sentence-case `micro` / `body strong`, except short category labels that adopt the overline.

### 6.4 Already applied to the HTML reference
Ink merge (`#16261F`→`#14342A`, `#5E1F0E`→`#4A1C0E`), text-shadow merge, letter-spacing merge, odd sizes (10, 12.5, 15.5) and the blog pull-quote face. The **UI size scale, weights and line heights are not applied to the prototype**; they are for the build (see J-T2, J-T3).

---

## 7. Judgment calls (options; recommended default is already in the tokens)

- **J-T1 · Families.** A) 3 families (recommended): editorial/data split and the Medium reading standard. B) 2 families: drop Source Serif, set prose in Archivo 17–18px (as in the earlier 3B). Saves ~35 KB and one decision; loses reading comfort and the editorial/data contrast. C) 2 families: drop Archivo, use Source Serif for UI too. Warm but weak for dense facts at 12–14px.
- **J-T2 · UI scale.** A) 12 · 14 · 16 · 18 (recommended): even steps, body = input = 16, readable on phones, fewer sizes. B) 12 · 13 · 15 · 17 + input 16: denser (what the prototype shows), but five sizes and body ≠ input. Switching = editing four lines in `tokens.css`.
- **J-T3 · Weights.** A) 400 + 600 only (recommended). B) add 500 for controls/links (3 weights, one more file, subtle distinctions that disappear on phones). C) add 700 for CTA (heavier buttons; a 4th file).
- **J-T4 · Tour header price.** A) `h2` size (recommended: the price is the call to action, so it outranks the 22px name). B) `title` size (stricter, price equals name).
- **J-T5 · Headings ink.** A) one `--text-strong #14342A` for serif and sans headings (recommended). B) keep `#16261F` for sans (invisible difference).
- **J-T6 · Pull vs quote.** A) two italic sizes (recommended: the guide's hook must outrank a review). B) merge to one 22px (simpler; the tour-card quote loses the importance you asked for on 2026-10-06).
- **J-T7 · Uppercase.** A) overline only (recommended). B) also fact labels in the footer. No UX reason found.
- **J-T8 · Tabular numerals.** A) `.tnum` on prices, durations, ratings (recommended). B) skip.

If anything is unclear in a build session, ask before adding a style.
