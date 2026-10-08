// Markdown twin of every indexable page (CLAUDE.md §10): /destinations/canyon-dore/ → /destinations/canyon-dore.md,
// / → /index.md. Built from the same data as the page (src/content/pages.ts), not from its HTML.
import type { APIRoute, GetStaticPaths } from 'astro';
import { allPages, twinPath } from '../content/pages';

export const getStaticPaths: GetStaticPaths = async () => (await allPages()).filter((p) => p.markdown)
  .map((p) => ({ params: { twin: twinPath(p.path).slice(1).replace(/\.md$/, '') }, props: { markdown: p.markdown } }));

export const GET: APIRoute = ({ props }) => new Response(props.markdown as string, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
