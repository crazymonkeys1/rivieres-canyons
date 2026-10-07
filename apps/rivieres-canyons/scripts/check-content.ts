// Checks the content in content/fixtures/ and writes docs/CONTENT_REPORT.md.
//   pnpm content:check        development: schema, references and copy-rule errors fail
//   pnpm content:check:prod   also fails on placeholders, drafts, images needing permission…
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkContent, renderReport } from '../src/content/check';
import type { Content } from '../src/content/schema';

const here = dirname(fileURLToPath(import.meta.url));
const dir = resolve(here, '../content/fixtures');
const production = process.argv.includes('--production');
const source = process.argv.find((a) => a.startsWith('--source='))?.slice(9) ?? '`data/*.json` (design migration)';

const content = Object.fromEntries(readdirSync(dir).filter((f) => f.endsWith('.json'))
  .map((f) => [f.replace(/\.json$/, ''), JSON.parse(readFileSync(resolve(dir, f), 'utf8'))])) as Content;
const r = checkContent(content);
writeFileSync(resolve(here, '../../../docs/CONTENT_REPORT.md'), renderReport(content, r, source));

console.log(`errors ${r.errors.length} · production items ${r.prod.length} · indexable ${r.scores.filter((s) => s.indexable).length}/${r.scores.length}`);
for (const e of r.errors) console.error('ERROR', e);
if (production) for (const p of r.prod) console.error('PRODUCTION', p);
if (r.errors.length || (production && r.prod.length)) process.exit(1);
