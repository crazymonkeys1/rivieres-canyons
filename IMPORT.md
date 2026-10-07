# Import into Claude Code

1. Create an empty folder for the repo and copy the **contents** of this folder into it (CLAUDE.md must be at the repo root).
2. `git init`, commit as-is ("handoff v12"). Open the folder in Claude Code.
3. First message: "Read CLAUDE.md, then docs/ARCHITECTURE.md, tokens/tokens.css, docs/TYPOGRAPHY.md and docs/COMPONENTS.md. Run phase 0 (check the handoff) and report; no code."
4. Delete this IMPORT.md after step 3.

Contents: `CLAUDE.md` (rules) · `docs/` · `tokens/` · `data/` (all content, photo URLs and credits) · `design/` (visual reference; serve with `npx serve design`; contains the guide portraits in `assets/`).
Photos are remote URLs listed with credits in `data/destinations.json`; Claude Code downloads them at build time (phase 1 and 3).
