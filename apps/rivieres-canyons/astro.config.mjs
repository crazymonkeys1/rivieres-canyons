// Astro, static output (CLAUDE.md §4). No integrations yet: sitemap, images and the edge functions come in phases 5–7.
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://example.org', // [SITE_URL]: the real domain is set before launch (phase 8)
  trailingSlash: 'always',
  build: { format: 'directory' },
});
