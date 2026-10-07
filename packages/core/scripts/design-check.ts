// Design-system checks (CLAUDE.md §6.12), run on every change: `pnpm design:check` (add --production after a build
// to also scan the built pages for [PLACEHOLDER]s). Scans the CSS of every component, layout and page:
// <style> blocks, style="" attributes and .css files. tokens.css and text-styles.css are the only places for raw values.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(import.meta.url), '../../../..');
const production = process.argv.includes('--production');
const SCAN = ['packages/core/src/components', 'packages/directory/src/components', 'packages/places/src/components', 'apps/rivieres-canyons/src/components', 'apps/rivieres-canyons/src/layouts', 'apps/rivieres-canyons/src/pages'];
const SYSTEM_FILES = ['tokens.css', 'text-styles.css', 'fonts.css', 'index.css', 'theme.css'];

const walk = (dir: string): string[] => !existsSync(dir) ? [] : readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : /\.(astro|css)$/.test(f) && !SYSTEM_FILES.includes(f) ? [p] : [];
});

/** The CSS of a file, with the line each piece starts on. */
function cssOf(file: string, text: string): { css: string; line: number; inline: boolean }[] {
  if (file.endsWith('.css')) return [{ css: text, line: 1, inline: false }];
  const parts: { css: string; line: number; inline: boolean }[] = [];
  const lineAt = (i: number) => text.slice(0, i).split('\n').length;
  for (const m of text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) parts.push({ css: m[1], line: lineAt(m.index!), inline: false });
  for (const m of text.matchAll(/\sstyle=(?:"([^"]*)"|\{`([^`]*)`\})/g)) parts.push({ css: (m[1] ?? m[2]).replace(/\$\{[^}]*\}/g, '--template'), line: lineAt(m.index!), inline: true });
  // A declaration may opt out with a comment naming why: /* design-check-allow: reason */ (reviewed in code review).
  return parts.map((p) => ({ ...p, css: p.css.replace(/[^;{}]*;\s*\/\*\s*design-check-allow:[^*]*\*\//g, ';') }));
}

type Rule = { id: string; why: string; test: (css: string) => string[] };
const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');
/** Declarations outside custom-property definitions (component-local --x: 52px is allowed: tier 3). */
const declarations = (css: string) => strip(css).split(/[;{}]/).map((d) => d.trim()).filter((d) => d.includes(':') && !d.startsWith('--') && !d.startsWith('@'));
const RULES: Rule[] = [
  { id: 'raw-colour', why: 'colours come from --color-* tokens', test: (c) => [...strip(c).matchAll(/#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?)\(/gi)].map((m) => m[0]) },
  { id: 'palette-in-component', why: 'components use semantic tokens, never --palette-*', test: (c) => [...c.matchAll(/--palette-[a-z0-9-]+/g)].map((m) => m[0]) },
  { id: 'typography-property', why: 'text comes from the text-* classes; components never set font, size, weight, line-height or letter-spacing',
    test: (c) => declarations(c).filter((d) => /^(font|font-family|font-size|font-weight|line-height|letter-spacing)\s*:/.test(d)) },
  { id: 'raw-px', why: 'sizes come from tokens (1–4px allowed for borders and rings; component sizes go in a local --variable)',
    test: (c) => declarations(c).flatMap((d) => [...d.matchAll(/(?<![\w-])(\d*\.?\d+)px/g)].filter((m) => +m[1] > 4).map(() => d)) },
  { id: 'raw-duration', why: 'durations come from --duration-*', test: (c) => declarations(c).filter((d) => /(?<![\w-])\d*\.?\d+m?s\b/.test(d) && /^(transition|animation)/.test(d)) },
  { id: 'raw-z-index', why: 'layers come from --z-*', test: (c) => declarations(c).filter((d) => /^z-index\s*:\s*-?\d/.test(d)) },
  { id: 'raw-shadow', why: 'shadows come from --elevation-* (a 0 0 0 Npx ring is allowed)',
    test: (c) => declarations(c).filter((d) => /^box-shadow\s*:/.test(d) && d.replace(/^box-shadow\s*:/, '').split(/,(?![^(]*\))/).some((s) => !/^\s*(var\(--[a-z0-9-]+\)|0 0 0 [1-4]px var\(--[a-z0-9-]+\)|none)\s*$/.test(s))) },
  { id: 'outline-removed', why: 'never remove the focus outline', test: (c) => declarations(c).filter((d) => /^outline\s*:\s*(none|0)\b/.test(d)) },
  { id: 'max-width-query', why: 'mobile-first: min-width queries only', test: (c) => [...c.matchAll(/@media[^{]*max-width[^{]*/g)].map((m) => m[0]) },
  { id: 'off-scale-breakpoint', why: 'breakpoints are 480px and 1024px only', test: (c) => [...c.matchAll(/@media[^{]*min-width:\s*(\d+)px/g)].filter((m) => !['480', '1024'].includes(m[1])).map((m) => m[0]) },
];

const problems: string[] = [];
const files = SCAN.flatMap((d) => walk(resolve(root, d)));
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const rel = relative(root, file);
  // Pages hold no styling (CLAUDE.md §5). The dev-only style guide pages are the exception.
  if (/\/src\/pages\//.test(rel) && !/\/pages\/style-guide\//.test(rel) && /<style|\sstyle=/.test(text)) problems.push(`${rel}: page-styling — pages contain no styling; move it into a component`);
  for (const part of cssOf(file, text))
    for (const r of RULES) for (const hit of r.test(part.css)) problems.push(`${rel}:${part.line}: ${r.id} — ${r.why}: \`${hit.slice(0, 90)}\``);
}

// Production: no [PLACEHOLDER] may remain in the built pages.
if (production) {
  const dist = resolve(root, 'apps/rivieres-canyons/dist');
  const html = (dir: string): string[] => readdirSync(dir).flatMap((f) => statSync(join(dir, f)).isDirectory() ? html(join(dir, f)) : f.endsWith('.html') ? [join(dir, f)] : []);
  if (!existsSync(dist)) problems.push('dist/ is missing: build the site before --production');
  else for (const f of html(dist)) for (const m of readFileSync(f, 'utf8').matchAll(/\[[A-Z][A-Z0-9_]*\]/g)) problems.push(`${relative(root, f)}: placeholder ${m[0]}`);
}

console.log(`design:check · ${files.length} files · ${problems.length ? `${problems.length} problem(s)` : 'pass'}`);
for (const p of problems) console.error('DESIGN', p);
if (problems.length) process.exit(1);
