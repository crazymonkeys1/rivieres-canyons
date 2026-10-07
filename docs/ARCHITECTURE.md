# Design system architecture and naming (read this before creating anything)

Audience: Claude Code at the start of every session, and Jordan.
Purpose: make every new token, text style and component land in the right place with the right name, so the system stays consistent and can be restyled without renames.

Companion files: `tokens/tokens.css` (values) · `tokens/text-styles.css` (text classes) · `docs/TYPOGRAPHY.md` · `docs/COMPONENTS.md` (registry) · `docs/DESIGN_SYSTEM.md` (rules and page templates) · `docs/CONTENT_MODEL.md` (data).

---

## 1. The atomic hierarchy (7 levels, strictly bottom-up)

| Level | What it is | Where it lives | May use |
|---|---|---|---|
| **L0 Primitives** | Raw palette values (`--palette-green-900`) | `tokens.css` §0 | nothing |
| **L1 Tokens** | Semantic variables: colour roles, type scale, spacing, radius, shadow, z-index, motion, layout | `tokens.css` §1–10 | L0 |
| **L2 Text styles** | Named combinations of font, size, weight, line-height, spacing (`text-heading`, `text-body`…) | `text-styles.css` | L1 |
| **L3 Atoms** | One element with one job: Button, TextLink, Avatar, Badge, Tag, Icon, Divider, TextInput, Checkbox, Toggle, Rating | `packages/core/atoms/` | L1, L2 |
| **L4 Molecules** | 2+ atoms with one purpose: FactCell, KeyFact, Price, Breadcrumb, Tooltip, FilterOption, Disclosure, SearchField, Byline | `packages/core/molecules/` (generic) or `packages/{directory,places}/molecules/` | L1–L3 |
| **L5 Organisms** | A self-contained section or card: DestinationCard, FactList, SafetyAlert, FaqList, SiteHeader, FilterBar, FiltersSheet, LeadCapture | `packages/{core,directory,places}/organisms/` | L1–L4 |
| **L6 Templates** | Page layouts: slots and order, no content | `packages/{directory,places}/templates/` | L1–L5 |
| **L7 Pages** | A template filled with content from the data layer | `apps/rivieres-canyons/pages/` | everything |

**Composition rules**
1. A level only imports from levels below it. An atom never imports a molecule. A molecule never imports an organism.
2. Same-level imports are not allowed, except an organism composed of other organisms through a slot (children), never by import.
3. Pages contain no styling. Templates contain layout only (grid, spacing between organisms), no text styles of their own.
4. Content comes in through props or slots. A component never reads Airtable, JSON or the router.
5. Every component is documented in `docs/COMPONENTS.md` before or in the same change that creates it.

## 2. Decision tree: where does this go, and does it already exist?

1. **Search `COMPONENTS.md` and `tokens.css` first.** If something is within one variant of what you need, extend it with a variant or a prop. Do not clone.
2. **A value (colour, size, space, radius, shadow, duration)?** Use an existing token. If none fits, use the nearest one. Create a token only if: (a) the value serves a UX purpose no existing token serves, and (b) you can name it by role (§3). Add it to `tokens.css` with a comment (what it is for, when to use it) and log it in `docs/CHANGELOG.md` in the same change.
3. **A text treatment?** Use one of the 10 text styles + 2 modifiers. A new text style needs a UX reason added to `TYPOGRAPHY.md` §4 first. In practice: never.
4. **A new UI piece?** Classify it:
   - one element, one job → **atom**;
   - atoms combined for one purpose, reused in 2+ places → **molecule**;
   - a labelled section, card, bar or sheet → **organism**;
   - if it exists in only one place and is not reusable, build it inside the page, not in the system.
5. **Generic (any directory) or specific?** Ask: "Would this still make sense if we listed cars?" Yes → `packages/directory` (or `core` if it is not even directory-specific). Only for places (access, safety, location policy) → `packages/places`. Only for Guadeloupe (names, copy, local data) → `apps/rivieres-canyons`. Packages never contain Guadeloupe words or data.
6. **Still unsure after this?** Stop and ask Jordan. Do not guess.

## 3. Naming conventions (strict)

### 3.1 The one principle
**A name states the role (what it communicates or does), never the appearance (what it looks like now).** Test: *if the colour, size, shape or layout changes, does the name stay true?* If not, rename.

### 3.2 Components
- **PascalCase, `{Subject}{Role}`**: the subject (Destination, Fact, Filter, Safety, Lead…) plus the role (Card, List, Alert, Sheet, Field, Header…). Examples: `DestinationCard`, `FactList`, `SafetyAlert`, `FilterBar`, `LeadCapture`.
- **Allowed role nouns** (they describe structure or function): Card, List, Alert, Notice, Sheet, Dialog, Header, Footer, Nav, Field, Group, Summary, Byline, Breadcrumb, Disclosure, Gallery, Link, Button, Tag, Badge, Avatar, Rating, Price, Hero, Section, Divider, Tooltip, Toolbar, Facts, Summary.
- **Banned in names (appearance or layout shape):** Pill, Chip, Tile, Strip, Bar (use Toolbar), Band, Box, Glass, Dark, Light, Big, Small, Round, Ghost, Primary-as-colour, Blue/Green/Coral, Left/Right, Top/Bottom (except a real position role like `StickyFooter`), numbers (`Card2`).
- **Variants are props, not names.** `Button variant="primary|secondary|quiet"` (emphasis, by purpose), `size="md"`, `tone="neutral|danger"`. Never `ButtonGhost`, `CardDark`, `AlertRed`.
- **Variant values describe purpose:** `primary` = the one main action; `secondary` = alternative action; `quiet` = low-emphasis; `danger`/`info`/`neutral` = meaning. Never colours.
- **State** is a prop or attribute (`selected`, `disabled`, `open`), never a name.
- **Files:** `PascalCase.astro` (or `.tsx`), one component per file, folder = level: `atoms/Button.astro` with its scoped `<style>`; its documentation is its row in `COMPONENTS.md` (2026-10-07: no separate `.css`/`.md` per component).
- **Slots / props:** camelCase, role-named (`title`, `meta`, `media`, `actions`). Not `left`, `right`, `top`.
- **CSS classes inside a component:** `{component}__{part}` and `{component}--{modifier}` in kebab-case (`destination-card__title`). Never reused across components.

### 3.3 Variables (CSS custom properties)
Pattern: **`--{category}-{role}[-{variant}]`**, lowercase kebab-case.

| Category | Prefix | Examples | Name by |
|---|---|---|---|
| Primitive colour (tier 1 only) | `--palette-{hue}-{step}` | `--palette-green-900` | hue + step (the only place appearance is allowed) |
| Colour (tier 2) | `--color-{group}-{role}[-{variant}]`, groups: `text`, `surface`, `border`, `action`, `status`, `overlay`, `focus`, plus `--color-brand*`, `--color-rating` | `--color-text-strong`, `--color-surface-inverse`, `--color-action-primary` | role |
| Font | `--font-family-{role}`, `--font-weight-{regular|strong}`, `--font-size-{text style}` | `--font-family-read`, `--font-size-heading` | role / text style |
| Line height / letter-spacing | `--line-height-{role}`, `--letter-spacing-{role}` | `--line-height-read` | role |
| Space | `--space-{n}` | `--space-4` | scale step |
| Radius | `--radius-{tag|control|container|sheet|full}` | `--radius-container` | what it shapes |
| Elevation | `--elevation-{role}` | `--elevation-overlap`, `--elevation-tooltip` | the layer it serves |
| Z-index | `--z-{role}` | `--z-sheet` | role |
| Motion | `--duration-{speed}`, `--easing-{role}` | `--duration-fast`, `--easing-sheet` | scale / role |
| Layout | `--container-{role}`, `--page-gutter*`, `--breakpoint-*`, `--tap-size-min` | `--container-read` | role |
| Component-local | `--{component}-{property}` | `--destination-card-gap` | declared on the component, never global |

- **Scale tokens** (`--space-*`) may use an ordinal because the scale itself is the meaning. Everything else is named by role.
- **Never** reference a primitive (`--palette-*`) from a component. Never write a raw value (hex, px outside the scale, ms, shadow) in a component.
- **Component-local variables** are allowed for values specific to one component, but they must be set from global tokens (`--card-padding: var(--space-4)`). This is tier 3: local, never in `tokens.css`.

### 3.4 Text styles
Classes `text-{role}` (`text-heading`, `text-body`) and modifiers `is-{state}` (`is-strong`, `is-upper`). See `TYPOGRAPHY.md`.

### 3.5 Renames (decisions J-N1 and J-N2 applied, see `REVIEW_2026-10-06.md` §4)
- **Components (J-N1): applied in the docs, reversible.** `COMPONENTS.md` uses the role-based names (e.g. `FactList`, `LeadCapture`) and lists the legacy name next to each. No code exists yet, so nothing breaks. If Jordan chooses to keep the legacy names, swap the two columns; no other change.
- **Variables and text styles (B1, 2026-10-07): grouped naming shared with the Mangroves directory.** Colours `--color-{group}-{role}`, fonts `--font-{family|weight|size}-*`, `--radius-*`, `--elevation-*`, `--duration-*`, `--container-*`; text styles `text-{role}`. Full old → new table: `docs/CHANGELOG.md` (2026-10-07). Supersedes J-N2.

## 4. How the pieces work together (worked example)

`DestinationCard` (L5) =
- `Media` slot: image with `Badge` (type) and `Badge` (status);
- body: `text-title` name · `Meta` line (`text-caption`, muted) · `text-body` subtitle · `TagList` of `Tag`s;
- `FactList` (L5, compact) of `FactCell` (L4) = `text-label` label + `text-caption` strong value;
- footer: `Price` (L4: `text-title` + `text-caption` unit) and `Button variant="primary"` (L3) pinned bottom-right.

All colour, spacing and type come from L1/L2. The card knows nothing about Airtable: it receives `{name, commune, subtitle, tags, facts, price, cta}`. A redesign that changes surfaces, radii or fonts only edits L0/L1/L2.

## 5. Mobile-first contract
- Write the base CSS for ~360px. Add `@media (min-width: 480px)` and `(min-width: 1024px)` only (`--breakpoint-sm`, `--breakpoint-lg`). No `max-width` queries. No layout switching in JavaScript.
- Prefer intrinsic layout: `grid-template-columns: repeat(auto-fit, minmax(min(100%, Npx), 1fr))`, `flex-wrap`, `clamp()`.
- Every tappable element has a 44px hit area. Inputs are 16px.
- A component's documentation states its mobile layout first, then what changes at 480 and 1024.

## 6. Change process
1. Check `COMPONENTS.md` and tokens (§2).
2. Build bottom-up. No component before its atoms exist.
3. Document in `COMPONENTS.md` (name, level, composition, props, text styles, mobile behaviour, a11y).
4. Add the token or component to `docs/CHANGELOG.md` with: date, layer (Core / Directory / Places / Site), the change, why, how to apply elsewhere, status per site.
5. If a decision is a judgment call (a new token, a rename, a deviation), stop and ask Jordan with 2–3 options.
