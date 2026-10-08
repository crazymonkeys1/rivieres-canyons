// sitemap.xml: indexable pages only (a place below the completeness threshold and placeholder pages are left out).
import type { APIRoute } from 'astro';
import { sitemapXml } from '@orbit/core/seo';
import { allPages, abs } from '../content/pages';

export const GET: APIRoute = async () => new Response(
  sitemapXml((await allPages()).filter((p) => !p.noindex).map((p) => ({ url: abs(p.path), lastmod: p.lastmod }))),
  { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
);
