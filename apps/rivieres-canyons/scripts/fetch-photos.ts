// Downloads every photo of the content (and operator logos) into src/assets/, so the site serves its own copies
// (CLAUDE.md §4: never hotlink). Astro then resizes and compresses them at build time.
// Runs where the internet is reachable (the GitHub job "Airtable"); a photo that cannot be fetched is reported and
// the page shows a placeholder. Re-downloads a photo only when its link changed (manifest.json).
//   pnpm photos:fetch
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = resolve(here, '../content/fixtures');
const read = (f: string) => JSON.parse(readFileSync(resolve(fixtures, f), 'utf8'));
const MAX_BYTES = 12 * 1024 * 1024;
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' };

/** Wikimedia "Special:FilePath" serves the original (often 5–20 MB): ask for a 2000px rendition instead. */
const downloadUrl = (src: string) => (/Special:FilePath\//.test(src) && !/[?&]width=/.test(src) ? `${src}${src.includes('?') ? '&' : '?'}width=2000` : src);

async function sync(dir: string, items: { id: string; src: string }[]) {
  mkdirSync(dir, { recursive: true });
  const manifestFile = resolve(dir, 'manifest.json');
  const manifest: Record<string, string> = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, 'utf8')) : {};
  const files = new Map(readdirSync(dir).filter((f) => !f.startsWith('.') && f !== 'manifest.json').map((f) => [f.replace(/\.\w+$/, ''), f]));
  const failed: string[] = []; let fetched = 0;
  for (const { id, src } of items) {
    if (manifest[id] === src && files.has(id)) continue;
    try {
      const res = await fetch(downloadUrl(src), { headers: { 'User-Agent': 'OrbitDirectories/1.0 (photo cache for a static site; contact via site)' }, redirect: 'follow' });
      const type = (res.headers.get('content-type') ?? '').split(';')[0];
      if (!res.ok || !EXT[type]) throw new Error(`${res.status} ${type || 'no content type'}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > MAX_BYTES) throw new Error(`too large (${Math.round(buf.length / 1e6)} MB)`);
      if (files.has(id)) unlinkSync(resolve(dir, files.get(id)!));
      writeFileSync(resolve(dir, `${id}.${EXT[type]}`), buf);
      manifest[id] = src; fetched++;
    } catch (e) { failed.push(`${id}: ${src} → ${(e as Error).message}`); }
  }
  // Photos no longer in the content are removed.
  const keep = new Set(items.map((i) => i.id));
  for (const [id, f] of files) if (!keep.has(id)) { unlinkSync(resolve(dir, f)); delete manifest[id]; }
  writeFileSync(manifestFile, JSON.stringify(Object.fromEntries(Object.entries(manifest).sort()), null, 2) + '\n');
  return { fetched, failed, total: items.length };
}

const images = read('images.json') as { id: string; src: string }[];
const operators = read('operators.json') as { id: string; logo_url: string | null }[];
const photos = await sync(resolve(here, '../src/assets/photos'), images.filter((i) => /^https?:/.test(i.src)));
const logos = await sync(resolve(here, '../src/assets/logos'), operators.filter((o) => o.logo_url).map((o) => ({ id: o.id, src: o.logo_url! })));
console.log(`photos:fetch · photos ${photos.total - photos.failed.length}/${photos.total} (${photos.fetched} downloaded) · logos ${logos.total - logos.failed.length}/${logos.total}`);
for (const f of [...photos.failed, ...logos.failed]) console.error('NOT FETCHED', f);
// A photo that cannot be fetched does not stop the site: the page shows a placeholder and the report lists it.
