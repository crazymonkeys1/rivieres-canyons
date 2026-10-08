// robots.txt (CLAUDE.md §10): everyone may crawl, AI crawlers are named explicitly. Click-tracking redirects,
// the lead endpoint and the development style guide are not for crawlers.
import type { APIRoute } from 'astro';
import { robotsTxt } from '@orbit/core/seo';
import { abs } from '../content/pages';

export const GET: APIRoute = () => new Response(
  robotsTxt({ sitemap: abs('/sitemap.xml'), disallow: ['/go/', '/api/', '/style-guide/'] }),
  { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
);
