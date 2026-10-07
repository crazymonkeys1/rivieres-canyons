# Phase 0: handoff check (2026-10-07)

Scope: `CLAUDE.md` compared with `docs/*`, `tokens/*`, `data/*.json` and `design/`. No code written.

**Verdict:** the handoff is complete and mostly consistent. Phase 1 can start once Jordan answers the 3 questions in §3. Every other open point has a default written in the docs.

## 1. What is in place
- Rules, architecture, naming, tokens, text styles, component registry, page templates, content model, privacy context and changelog are all present and agree on the essentials:
  - Astro static site, pnpm monorepo with 4 layers, Cloudflare;
  - 10 text styles, weights 400/600, mobile-first, no layout in JavaScript;
  - role-based component names.
- Data:
  - 21 destinations, one object each, with `signature`, `signature_status`, `has_waterfall` and `location_policy`;
  - 2 operators, 7 tours, 7 articles;
  - reviews are real and sourced only (Wild Canyon 3, Yalodé 0);
  - no draft reviews and no live-conditions data.
- Every image in the data has a credit and a source, with one exception (see §4).
- Placeholders are limited to the expected four: `[WHATSAPP_PASCAL]`, `[WHATSAPP_QUENTIN]`, `[BOOKING_URL_YALODE]`, `[BOOKING_URL_WILDCANYON]`. `[PRIVACY_POLICY_TEXT]` comes later, from the privacy block.

## 2. Contradictions found

| # | Where | Contradiction | Proposal |
|---|---|---|---|
| C1 | Claude Design import note, step 5 vs `CLAUDE.md` §13 | The import note says "Phase 1: scaffold". `CLAUDE.md` says phase 1 = content audit + schema, phase 2 = Airtable, phase 3 = scaffold. `docs/README.md` also says phase 3 for the scaffold. | Follow `CLAUDE.md` (it wins by its own precedence rule). **Decision Q1.** |
| C2 | `CLAUDE.md` §8 vs `data/destinations.json` | The build must fail if a `guide_only` or `closed` place carries an itinerary. The data still holds directions on 5 places: <br>• Saut d'Acomat (`closed`): `access`, `accessText`, `accessShort`, `parking`, `drive`;<br>• Bourceau, Canyon doré, Canyon Ferry, Bois Malaisé (`guide_only`): `access`, `accessShort`, `parking`, `drive`. <br>Canyon doré's `access` names the meeting point publicly. | The design already hides these fields. In the phase 1 mapping, drop them for `closed` and `guide_only` places, so the build check passes and nothing leaks later. **Decision Q2.** |
| C3 | `CLAUDE.md` §11 (no absolute safety claims) vs data | "…on vous accompagne **en toute sécurité**…" (listing hero, `ui-copy.json`); "Glisser sur des toboggans naturels **en toute sécurité**" (Wild Canyon tour); "Les sensations fortes **en sécurité**" (Wild Canyon bio, twice); "découvrir ces lieux **en sécurité**" (disclaimer). | Reword calmly when the content is mapped in phase 1, then list the new wording in the content report for Jordan to approve. **Decision Q3.** |
| C4 | `CLAUDE.md` §8 (never invent facts) vs `SOCIAL.canyon_ferry` | 3 mock social posts (`@exemple_compte`). `CONTENT_MODEL.md` already says to replace them. | Exclude them from the data in phase 1 (the section hides when empty). |
| C5 | 4 rivers (Grande Anse, Pérou, Lostau, Ziotte) | `location_policy` empty and commune "inconnu". The rule "empty renders as commune_only" would show "Commune : inconnu". | The design already shows "Commune non confirmée". Keep that, and keep these places out of commune pages. Their completeness score will likely put them under `noindex`. |
| C6 | `DESIGN_SYSTEM.md` §3 F (blog index) | Intro text at "15/1.5": 15px is not in the type scale. | Use `t-body` (16px). Doc fix only. |
| C7 | `DESIGN_SYSTEM.md` §3 B and C | Legacy names "display-l" / "display-xl" for H1. | Read as `t-h1`. Doc fix only. |
| C8 | `docs/README.md`, `DESIGN_SYSTEM.md` | They point to `CLAUDE_CODE_CONTEXT.md` for precedence; that file is now `CLAUDE.md`. README says "12 signatures still empty"; there are 21 − 10 = 11. | Doc fix only. |
| C9 | Programme bullets (question from Claude Design) | The prototype shows them at 15px. | No conflict: `TYPOGRAPHY.md` §4.2 assigns "tour programme" to `t-read`. The docs win. |

## 3. Questions for Jordan (needed before phase 1)
- **Q1 · Order of phases.** A) Follow `CLAUDE.md`: content audit first, then Airtable, then scaffold (recommended: the site and the database are both built on the data schema). B) Scaffold and design atoms first, as the import note says.
- **Q2 · Directions on guide-only and closed places.** A) Drop them in the mapping (recommended). B) Keep them in the data but never render them; the build check then needs an exception.
- **Q3 · Safety wording.** A) Claude proposes calm replacements in the content report, Jordan approves (recommended). B) Jordan writes them.

## 4. Gaps to fill (not blocking phase 1)
- **Missing contact and booking details:** WhatsApp numbers and booking URLs (4 placeholders).
- **Yalodé logo:** `logoUrl` is empty.
- **Quentin's surname:** `guideFullName` is missing for Wild Canyon. The guide page H1 and the Person JSON-LD need it.
- **Yalodé rating:** shown as "4,9", but there are no sourced reviews. Its source needs confirming (an FAQ cites "plus de 1 880 avis").
- **Saut d'Acomat:** it is `closed`, yet it has 2 bookable tours. Should "Réserver" show? The data itself says "statut des sorties encadrées à confirmer".
- **Saut d'Acomat guide photos:** 8 `guidePhotos` with no per-photo credit field. The design credits them to the operator (Yalodé). Fine if Yalodé confirms.
- **Signatures:** 10 drafts to validate with the guides. 11 places have no signature.
- **Location policies to confirm:** Chutes Moreau = `public`, Rivière Bourceau = `guide_only`.
- **Privacy page:** the open items listed in `PRIVACY_CONTEXT.md` §3.
- **Photo downloads:** photos are remote URLs. Downloading them at build time needs network access to those sites, either from Cloudflare's build or from Claude Code's cloud environment, whose allowed domains currently block them.

## 5. Open design decisions (defaults already in the docs, no action needed now)
J1–J8 (`AUDIT_2026-10-06.md` §5) and J-T1…J-T8 (`TYPOGRAPHY.md` §7). Phase 3 will use the recommended defaults unless Jordan says otherwise.
