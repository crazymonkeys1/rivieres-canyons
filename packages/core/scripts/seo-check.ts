// SEO and AI-access checks on a built site (CLAUDE.md §10), run after every build: `pnpm seo:check`
// (`--production` adds: the real domain is set). Usage: tsx seo-check.ts <dist> [--production]
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const dist = resolve(process.argv[2] ?? 'dist');
const production = process.argv.includes('--production');
const problems: string[] = [];
const walk = (dir: string): string[] => readdirSync(dir).flatMap((f) => statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]);
if (!existsSync(dist)) { console.error(`seo:check · ${dist} is missing: build first`); process.exit(1); }
const files = walk(dist);
const read = (f: string) => readFileSync(f, 'utf8');
const pages = files.filter((f) => f.endsWith('.html') && !relative(dist, f).startsWith('style-guide') && relative(dist, f) !== '404.html');
const pathOf = (f: string) => '/' + relative(dist, f).replace(/index\.html$/, '');

const sitemapFile = join(dist, 'sitemap.xml');
const sitemap = existsSync(sitemapFile) ? [...read(sitemapFile).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname) : [];
if (!sitemap.length) problems.push('sitemap.xml: missing or empty');
const site = existsSync(sitemapFile) ? new URL(read(sitemapFile).match(/<loc>([^<]+)<\/loc>/)?.[1] ?? 'https://invalid').origin : '';

for (const f of pages) {
  const html = read(f), path = pathOf(f), rel = relative(dist, f);
  const one = (re: RegExp, what: string) => { const n = (html.match(re) ?? []).length; if (n !== 1) problems.push(`${rel}: ${n} ${what} (expected 1)`); };
  one(/<h1[\s>]/g, '<h1>');
  one(/<title>[^<]+<\/title>/g, '<title>');
  one(/<meta name="description" content="[^"]+"/g, 'meta description');
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (!canonical) problems.push(`${rel}: no canonical`);
  else if (new URL(canonical).pathname !== path) problems.push(`${rel}: canonical ${canonical} is not this page`);
  for (const m of html.matchAll(/<h2([^>]*)>/g)) if (!/\sid="/.test(m[1])) problems.push(`${rel}: an <h2> has no id`);
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch { problems.push(`${rel}: JSON-LD does not parse`); }
  }
  if (!/application\/ld\+json/.test(html)) problems.push(`${rel}: no JSON-LD`);
  const noindex = /<meta name="robots" content="noindex/.test(html);
  if (noindex && sitemap.includes(path)) problems.push(`${rel}: noindex page listed in sitemap.xml`);
  if (!noindex && !sitemap.includes(path)) problems.push(`${rel}: indexable page missing from sitemap.xml`);
  const twin = html.match(/<link rel="alternate" type="text\/markdown" href="([^"]+)"/)?.[1];
  if (!noindex && !twin) problems.push(`${rel}: indexable page without a Markdown twin`);
  if (noindex && twin) problems.push(`${rel}: noindex page with a Markdown twin`);
  if (twin && !existsSync(join(dist, twin))) problems.push(`${rel}: Markdown twin ${twin} not built`);
}

const robots = existsSync(join(dist, 'robots.txt')) ? read(join(dist, 'robots.txt')) : '';
for (const bot of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'])
  if (!new RegExp(`User-agent: ${bot}\\nAllow: /`).test(robots)) problems.push(`robots.txt: ${bot} not explicitly allowed`);
if (!/Sitemap: /.test(robots)) problems.push('robots.txt: no Sitemap line');
for (const f of ['llms.txt', 'llms-full.txt']) if (!existsSync(join(dist, f))) problems.push(`${f}: missing`);

if (production) {
  if (/example\.org/.test(site)) problems.push('the site domain is not set: build with SITE_URL=https://… (canonical URLs, sitemap, llms.txt)');
  for (const f of files.filter((x) => /\.(md|txt|xml|json)$/.test(x))) for (const m of read(f).matchAll(/\[[A-Z][A-Z0-9_]*\]/g)) problems.push(`${relative(dist, f)}: placeholder ${m[0]}`);
}

console.log(`seo:check · ${pages.length} pages · ${sitemap.length} in sitemap · ${problems.length ? `${problems.length} problem(s)` : 'pass'}`);
for (const p of problems) console.error('SEO', p);
if (problems.length) process.exit(1);
