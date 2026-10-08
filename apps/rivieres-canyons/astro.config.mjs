// Astro, static output (CLAUDE.md §4). Sitemap, robots.txt and llms.txt are endpoints in src/pages (phase 5); edge functions come in phase 6.
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  // The domain comes from SITE_URL (GitHub / Cloudflare setting). Until it is set, a stand-in is used and
  // `design:check --production` fails, so no build can go live with the wrong canonical URLs.
  site: process.env.SITE_URL ?? 'https://example.org',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
