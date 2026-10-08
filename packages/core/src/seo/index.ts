// Layer 1 · Core: search-engine and AI-assistant output for any Orbit lead magnet (CLAUDE.md §10).
// Pure functions: the site gives absolute URLs and plain values; nothing here knows a site's words or data.

export type JsonLd = Record<string, unknown>;
const clean = <T extends JsonLd>(o: T): T =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && !(Array.isArray(v) && !v.length))) as T;

// ---------- JSON-LD (schema.org) ----------
export const graph = (...nodes: (JsonLd | null | undefined | false)[]): JsonLd => ({ '@context': 'https://schema.org', '@graph': nodes.filter(Boolean) });

export const breadcrumbList = (items: { name: string; url?: string }[]): JsonLd => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => clean({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
});
/** FAQPage only when there are questions (Google ignores an empty one, and so do we). */
export const faqPage = (items: { question: string; answer: string }[]): JsonLd | null => items.length ? ({
  '@type': 'FAQPage',
  mainEntity: items.map((q) => ({ '@type': 'Question', name: q.question, acceptedAnswer: { '@type': 'Answer', text: q.answer } })),
}) : null;
export const itemList = (name: string, items: { name: string; url?: string; description?: string | null }[]): JsonLd | null => items.length ? ({
  '@type': 'ItemList', name,
  itemListElement: items.map((it, i) => clean({ '@type': 'ListItem', position: i + 1, name: it.name, url: it.url, description: it.description ?? undefined })),
}) : null;
export const organization = (o: { name: string; url: string; description?: string; logo?: string; sameAs?: string[] }): JsonLd =>
  clean({ '@type': 'Organization', '@id': `${o.url}#organization`, name: o.name, url: o.url, description: o.description, logo: o.logo, sameAs: o.sameAs });
export const webSite = (o: { name: string; url: string; description?: string; lang: string }): JsonLd =>
  clean({ '@type': 'WebSite', '@id': `${o.url}#website`, name: o.name, url: o.url, description: o.description, inLanguage: o.lang, publisher: { '@id': `${o.url}#organization` } });
export const person = (p: { name: string; url?: string; jobTitle?: string; image?: string; description?: string; worksFor?: { name: string; url?: string } }): JsonLd =>
  clean({ '@type': 'Person', name: p.name, url: p.url, jobTitle: p.jobTitle, image: p.image, description: p.description, worksFor: p.worksFor ? clean({ '@type': 'Organization', ...p.worksFor }) : undefined });
export const articleLd = (a: { headline: string; description: string; url: string; lang: string; published: string; modified: string; image?: string; authors: JsonLd[]; publisher?: string }): JsonLd =>
  clean({ '@type': 'Article', headline: a.headline, description: a.description, mainEntityOfPage: a.url, inLanguage: a.lang, datePublished: a.published, dateModified: a.modified, image: a.image, author: a.authors, publisher: a.publisher ? { '@id': `${a.publisher}#organization` } : undefined });
export const collectionPage = (c: { name: string; description: string; url: string; lang: string }): JsonLd =>
  ({ '@type': 'CollectionPage', name: c.name, description: c.description, url: c.url, inLanguage: c.lang });
export const blog = (b: { name: string; description: string; url: string; lang: string }): JsonLd =>
  ({ '@type': 'Blog', name: b.name, description: b.description, url: b.url, inLanguage: b.lang });

// ---------- robots.txt ----------
/** Everyone may crawl; AI crawlers are named explicitly so a host-level default cannot silently block them. */
export function robotsTxt(o: { sitemap: string; disallow?: string[]; aiBots?: string[] }): string {
  const bots = o.aiBots ?? ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'];
  const rules = (o.disallow ?? []).map((d) => `Disallow: ${d}`);
  const group = (agent: string) => [`User-agent: ${agent}`, 'Allow: /', ...rules].join('\n');
  return [group('*'), ...bots.map(group), `Sitemap: ${o.sitemap}`].join('\n\n') + '\n';
}

// ---------- sitemap.xml ----------
const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export function sitemapXml(urls: { url: string; lastmod?: string | null }[]): string {
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + urls.map((u) => `  <url><loc>${xml(u.url)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')
    + '\n</urlset>\n';
}

// ---------- llms.txt (llmstxt.org) ----------
export function llmsTxt(o: { name: string; summary: string; notes?: string[]; sections: { title: string; links: { title: string; url: string; description?: string | null }[] }[] }): string {
  return [
    `# ${o.name}`, '', `> ${o.summary}`, '',
    ...(o.notes?.length ? [...o.notes, ''] : []),
    ...o.sections.filter((s) => s.links.length).flatMap((s) => [`## ${s.title}`, '', ...s.links.map((l) => `- [${l.title}](${l.url})${l.description ? `: ${l.description}` : ''}`), '']),
  ].join('\n');
}

// ---------- Markdown twins ----------
/** A small Markdown writer: the twin of a page is built from the same data as the page, not from its HTML. */
export class Md {
  private out: string[] = [];
  h1(s: string) { return this.add(`# ${s}`); }
  h2(s: string) { return this.add(`## ${s}`); }
  h3(s: string) { return this.add(`### ${s}`); }
  p(s?: string | null) { return s ? this.add(s) : this; }
  quote(s?: string | null, by?: string) { return s ? this.add(`> ${s}${by ? `\n>\n> — ${by}` : ''}`) : this; }
  list(items: (string | null | undefined | false)[]) { const xs = items.filter(Boolean) as string[]; return xs.length ? this.add(xs.map((x) => `- ${x}`).join('\n')) : this; }
  facts(items: { label: string; value: string }[]) { return this.list(items.map((f) => `**${f.label}** : ${f.value}`)); }
  faq(items: { question: string; answer: string }[], title?: string) {
    if (!items.length) return this;
    if (title) this.h2(title);
    for (const q of items) this.h3(q.question).p(q.answer);
    return this;
  }
  add(block: string) { this.out.push(block); return this; }
  toString() { return this.out.join('\n\n') + '\n'; }
}
