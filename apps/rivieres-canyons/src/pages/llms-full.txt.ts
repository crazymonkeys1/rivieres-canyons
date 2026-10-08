// llms-full.txt: every Markdown twin in one file, for assistants that read a site in one request.
import type { APIRoute } from 'astro';
import { allPages } from '../content/pages';
import { t } from '../content/site';

export const GET: APIRoute = async () => new Response(
  [`# ${t('site.name')}\n\n> ${t('llms.summary')}\n`, ...(await allPages()).filter((p) => p.markdown).map((p) => p.markdown!)].join('\n\n'),
  { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
);
