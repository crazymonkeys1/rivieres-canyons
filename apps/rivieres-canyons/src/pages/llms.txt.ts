// llms.txt (llmstxt.org): what the site is, and a link to the Markdown twin of every indexable page, by section.
import type { APIRoute } from 'astro';
import { llmsTxt } from '@orbit/core/seo';
import { allPages, abs, twinPath } from '../content/pages';
import { t } from '../content/site';

export const GET: APIRoute = async () => {
  const pages = (await allPages()).filter((p) => p.llms && p.markdown);
  const order = [t('llms.about'), t('llms.places'), t('llms.articles'), t('llms.collections'), t('llms.guides')];
  return new Response(llmsTxt({
    name: t('site.name'), summary: t('llms.summary'), notes: [t('llms.note_1'), t('llms.note_2'), `${abs('/llms-full.txt')}`],
    sections: order.map((title) => ({ title, links: pages.filter((p) => p.llms!.section === title).map((p) => ({ title: p.llms!.title, url: abs(twinPath(p.path)), description: p.llms!.description })) })),
  }), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
