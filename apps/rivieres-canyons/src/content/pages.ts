// Page registry (phase 5, CLAUDE.md §10): one entry per public page with everything search engines and AI assistants
// read: title, description, canonical path, indexing, social image, JSON-LD, breadcrumb and the Markdown twin.
// The site layout looks every page up here by its path, and the sitemap, robots.txt, llms.txt and the .md twins
// are generated from the same list, so they can never disagree.
import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import {
  graph, breadcrumbList, faqPage, itemList, organization, webSite, person, articleLd, collectionPage, blog, Md, type JsonLd,
} from '@orbit/core/seo';
import { touristAttraction } from '@orbit/places/seo';
import { productOffer } from '@orbit/directory/seo';
import {
  content, publishedPlaces, t, tList, url, types, operators, guides, offersOf, guideOf, imagesOf, sourcesOf,
  localityNames, photoFile, portraitOf,
} from './site';
import { keyFacts, minutes, risk, date } from './format';
import { PLACE_FACTS, OFFER_FACTS, ACCESS_STATUS_LABELS } from './site.config';
import { placeScore } from './completeness';
import { placeFaq } from './place';
import { publishedArticles, articleView } from './article';
import { collections } from './collection';
import { landings } from './nav';
import { listingItems } from './listing';
import type { Destination } from './schema';

const LANG = 'fr-FR';
const SITE_NAME = t('site.name');
/** Absolute URL on the site's domain (astro.config `site`, set from SITE_URL). */
export const abs = (path: string) => new URL(path, import.meta.env.SITE).href;
/** "/destinations/x/" → "/destinations/x.md"; "/" → "/index.md". */
export const twinPath = (path: string) => (path === '/' ? '/index.md' : `${path.replace(/\/$/, '')}.md`);
const link = (label: string, href: string) => `[${label}](${href})`;
const titled = (title: string) => t('seo.page_title', { title, site: SITE_NAME });
const snippet = (s: string | null | undefined) => {
  const x = (s ?? '').replace(/\s+/g, ' ').trim();
  return x.length <= 155 ? x : `${x.slice(0, 154).replace(/\s+\S*$/, '')}…`;
};
const ogImage = async (img: ImageMetadata | null | undefined) => (img ? abs((await getImage({ src: img, width: 1200, format: 'jpg' })).src) : undefined);
const heroFile = (kind: 'listing' | 'article', id: string) => { const i = imagesOf(kind, id, 'hero')[0]; return i ? photoFile(i.id) : null; };

export interface Crumb { name: string; url?: string }
export interface PageEntry {
  path: string; title: string; description: string; noindex: boolean; lastmod?: string | null; image?: string;
  jsonLd: JsonLd[]; breadcrumb: Crumb[];
  /** Markdown twin and llms.txt line: only for indexable pages. */
  markdown?: string; llms?: { section: string; title: string; description: string };
}
const crumbLd = (crumbs: Crumb[]) => breadcrumbList(crumbs.map((c) => ({ name: c.name, url: c.url ? abs(c.url) : undefined })));
const home: Crumb = { name: t('nav.home'), url: url.home() };
const footer = (md: Md, path: string) =>
  md.add('---').p(`**${t('md.disclaimer')}** : ${t('legal.inline_text')}`).p(`${t('md.page')} : ${abs(path)}`).toString();
const authorsLd = (ids: string[]) => ids.map((id) => guides.get(id)).filter((g): g is NonNullable<typeof g> => !!g)
  .map((g) => person({ name: g.full_name ?? g.first_name, jobTitle: g.role, url: abs(url.guide(g.id)) }));

// ---------- place ----------
async function placePage(p: Destination): Promise<PageEntry> {
  const path = url.place(p.id);
  const type = types.get(p.type);
  const communes = localityNames(p.location.localities);
  const offerList = offersOf(p.id);
  const faq = placeFaq(p);
  const { indexable } = placeScore(p, content.images);
  const typeLanding = landings.find((l) => l.dimension === 'type' && l.value === p.type);
  const breadcrumb: Crumb[] = [home, ...(typeLanding && type ? [{ name: type.plural, url: url.type(p.type) }] : []), { name: p.name }];
  const description = snippet(p.seo.description ?? p.signature ?? p.summary);
  const image = await ogImage(heroFile('listing', p.id));
  const offerLd = offerList.map((o) => {
    const op = operators.get(o.operator_id)!;
    return productOffer({ name: o.name, description: o.subtitle, url: abs(`${path}#sortie`), brand: op.name, price: o.price_eur, currency: 'EUR', bookUrl: abs(url.book(o.id)), image });
  });

  const md = new Md().h1(p.name).p(p.signature ?? p.summary)
    .facts([
      { label: t('md.type'), value: type?.label ?? p.type },
      ...(communes.length ? [{ label: t('md.locality'), value: communes.join(' / ') }] : []),
      { label: t('md.area'), value: p.location.area },
      ...keyFacts(p, PLACE_FACTS).map((f) => ({ label: f.label, value: f.estimated ? `${f.value} (${t('place.estimate')})` : f.value })),
      ...(p.last_reviewed_on ? [{ label: t('md.updated'), value: date(p.last_reviewed_on) }] : []),
    ]);
  md.h2(p.headings.overview ?? p.name).p(p.intro ?? p.summary).p(p.more_text);
  if (p.tip) md.quote(p.tip.text, p.tip.guide_id ? guides.get(p.tip.guide_id)?.first_name : SITE_NAME);
  const known = [...(p.facts.season ? [{ label: t('place.when'), value: String(p.facts.season) }] : []), ...p.key_facts];
  if (known.length) md.h2(t('place.key_facts')).facts(known);
  md.h2(t('md.access'));
  if (p.location_policy === 'public') md.facts(p.access_tiles.map((a) => ({ label: a.label, value: a.value }))).p(p.itinerary_text ?? p.itinerary).p(p.guided_access_text);
  if (p.location_policy === 'commune_only' || !p.location_policy) md.p(t('place.access_commune_text'));
  if (p.location_policy === 'guide_only') md.p(t('place.access_guide_text'));
  if (p.location_policy === 'closed') md.p(t('place.access_closed_text'));
  if (p.access_status) md.p(`${ACCESS_STATUS_LABELS[p.access_status.status]} : ${p.access_status.note}${p.access_status.checked_on ? ` (${t('place.access_status_checked', { date: date(p.access_status.checked_on) })})` : ''}`);
  md.h2(t('md.safety'));
  if (p.safety_alert) md.p(`**${p.safety_alert.title}** ${p.safety_alert.text}`).list(p.safety_alert.items);
  md.p(t('place.rules_text'));
  if (p.risks.length) md.p(`${t('place.risks_title')} : ${p.risks.map((r) => risk(r).label).join(', ')}.`);
  if (p.to_bring.length) md.p(`${t('place.bring_title')} : ${p.to_bring.join(', ')}.`);
  if (offerList.length) {
    md.h2(t('md.offers'));
    for (const o of offerList) {
      const op = operators.get(o.operator_id)!;
      const g = guideOf(op.id);
      md.h3(o.name).p(o.subtitle).facts([
        { label: t('place.offer_kind'), value: g ? t('place.offer_with', { guide: g.first_name, company: op.name }) : op.name },
        { label: t('place.offer_duration'), value: minutes(o.duration_min) },
        ...keyFacts({ facts: o.facts }, OFFER_FACTS).map(({ label, value }) => ({ label, value })),
        { label: t('md.price'), value: `${o.price_eur} €${o.price_child_eur && o.child_price_under_age ? ` (${t('place.offer_child', { age: o.child_price_under_age, price: `${o.price_child_eur} €` })})` : ''}` },
      ]).list(o.highlights);
      if (o.included.length) md.p(`${t('place.offer_provided')} : ${o.included.join(', ')}.`);
      if (o.to_bring.length) md.p(`${t('place.offer_bring')} : ${o.to_bring.join(', ')}.`);
      md.p([link(t('md.book'), abs(url.book(o.id))), g ? link(t('md.contact'), abs(url.whatsapp(g.id, path))) : null].filter(Boolean).join(' · '));
    }
  }
  md.faq(faq, p.headings.faq ?? t('place.faq_title', { name: p.name }));
  const sources = sourcesOf('listing', p.id);
  if (sources.length) md.h2(t('md.sources')).list(sources.map((s) => link(s.label, s.url)));
  const credits = [...new Set(imagesOf('listing', p.id).map((i) => i.credit))];
  if (credits.length) md.p(`${t('md.photos')} : ${credits.join(' · ')}.`);

  return {
    path, title: p.seo.title ?? titled(p.name), description, noindex: !indexable, lastmod: p.last_reviewed_on, image, breadcrumb,
    jsonLd: [graph(
      touristAttraction({ name: p.name, url: abs(path), description: p.summary, image, lang: LANG, locality: communes.join(' / ') || null, region: p.location.area, country: 'FR',
        geo: p.location.geo, policy: p.location_policy, alternateName: p.alt_names, dateModified: p.last_reviewed_on }),
      ...offerLd, faqPage(faq), crumbLd(breadcrumb),
    )],
    ...(indexable ? { markdown: footer(md, path), llms: { section: t('llms.places'), title: p.name, description } } : {}),
  };
}

// ---------- intent article ----------
async function articlePage(a: (typeof publishedArticles)[number]): Promise<PageEntry> {
  const path = url.article(a.id);
  const v = articleView(a);
  const breadcrumb: Crumb[] = [home, { name: t('blog.crumb'), url: url.blog() }, { name: a.label }];
  const description = snippet(a.seo.description ?? a.answer);
  const image = await ogImage(heroFile('article', a.id));
  const md = new Md().h1(a.h1).p(a.intro).p(`**${t('article.answer')}** : ${a.answer}`);
  if (a.takeaways.length) md.h2(t('article.takeaways')).list(a.takeaways.map((k) => `**${k.title}.** ${k.text}`));
  if (a.editorial) { md.h2(a.editorial.h2); for (const s of a.editorial.sections) md.h3(s.title).p(s.text); }
  if (v.pull) md.quote(v.pull.text, v.pull.attribution);
  if (v.entries.length) {
    md.h2(v.selectionTitle);
    for (const e of v.entries) {
      md.h3(`${e.number}. ${e.title}`).p([e.kind, e.place, e.by?.label].filter(Boolean).join(' · ')).facts(e.facts).p(e.lead);
      for (const x of e.paragraphs) md.p(x);
      if (e.list.length) md.p(`**${e.listTitle}**`).list(e.list.map((l) => (l.label ? `**${l.label}** : ${l.text}` : l.text)));
      if (e.story) md.quote(e.story.text, e.story.attribution);
      if (e.angle && a.angle_label) md.p(`**${a.angle_label}** : ${e.angle}`);
      if (e.season) md.p(`**${t('article.season')}** : ${e.season}`);
      md.p(link(e.linkLabel, abs(e.href)));
    }
  }
  if (a.editorial?.tips.length) md.h2(t('article.tips')).facts(a.editorial.tips);
  md.h2(t('article.before')).p(a.safety_note);
  md.faq(v.faq, t('article.faq_title', { label: a.label }));
  md.h2(t('article.why_title')).p(a.why_intro).list(tList('why_guide_points').map((b) => `**${b.label}** : ${b.value}`));
  return {
    path, title: a.seo.title ?? titled(a.h1), description, noindex: false, lastmod: a.updated_on, image, breadcrumb,
    jsonLd: [graph(
      articleLd({ headline: a.h1, description, url: abs(path), lang: LANG, published: a.published_on, modified: a.updated_on, image, authors: authorsLd(a.author_ids), publisher: abs('/') }),
      itemList(v.selectionTitle, v.entries.map((e) => ({ name: e.title, url: abs(e.href), description: e.lead }))),
      faqPage(v.faq), crumbLd(breadcrumb),
    )],
    markdown: footer(md, path), llms: { section: t('llms.articles'), title: a.h1, description },
  };
}

// ---------- filter landing page ----------
async function collectionPageEntry(c: (typeof collections)[number]): Promise<PageEntry> {
  const breadcrumb: Crumb[] = [home, { name: c.crumbParent }, { name: c.h1 }];
  const description = snippet(c.seo.description ?? c.answer);
  const image = await ogImage(c.hero ? photoFile(c.hero.id) : null);
  const md = new Md().h1(c.h1).p(c.intro).p(`**${t('article.answer')}** : ${c.answer}`)
    .h2(c.listTitle).list(c.cards.map((x) => `${link(x.name, abs(x.href))}${x.subtitle ? ` : ${x.subtitle}` : ''}`))
    .faq(c.faq, t('collection.faq_title', { h1: c.h1 }));
  return {
    path: c.path, title: c.seo.title ?? titled(c.h1), description, noindex: false, image, breadcrumb,
    jsonLd: [graph(
      collectionPage({ name: c.h1, description, url: abs(c.path), lang: LANG }),
      itemList(c.h1, c.cards.map((x) => ({ name: x.name, url: abs(x.href) }))),
      faqPage(c.faq), crumbLd(breadcrumb),
    )],
    markdown: footer(md, c.path), llms: { section: t('llms.collections'), title: c.h1, description },
  };
}

// ---------- guide ----------
async function guidePage(g: (typeof content.guides)[number]): Promise<PageEntry> {
  const path = url.guide(g.id);
  const op = operators.get(g.operator_id)!;
  const name = g.full_name ?? g.first_name;
  const breadcrumb: Crumb[] = [home, { name }];
  const description = snippet(t('guide.description', { name, role: g.role, company: op.name }));
  const portrait = portraitOf(g.photo);
  const image = portrait ? abs((await getImage({ src: portrait, width: 400, format: 'jpg' })).src) : undefined;
  const offerList = content.offers.filter((o) => o.status === 'published' && o.operator_id === op.id);
  const md = new Md().h1(name).p(`${t('guide.eyebrow', { company: op.name })} · ${g.role}`).p(g.bio).facts(g.facts);
  if (offerList.length) md.h2(t('guide.offers', { guide: g.first_name })).list(offerList.map((o) => `${link(o.name, abs(`${url.place(o.listing_id)}#sortie`))} : ${o.subtitle} (${minutes(o.duration_min)}, ${o.price_eur} €)`));
  md.p([link(t('guide.book', { company: op.name }), abs(url.bookOperator(op.id))), link(t('guide.write', { guide: g.first_name }), abs(url.whatsapp(g.id, path)))].join(' · '));
  return {
    path, title: titled(`${name} · ${op.name}`), description, noindex: false, image, breadcrumb,
    jsonLd: [graph(person({ name, url: abs(path), jobTitle: g.role, image, description: g.bio, worksFor: { name: op.name, url: op.website_url } }), crumbLd(breadcrumb))],
    markdown: footer(md, path), llms: { section: t('llms.guides'), title: `${name} (${op.name})`, description },
  };
}

// ---------- the other pages ----------
async function homePage(): Promise<PageEntry> {
  const path = url.home();
  const description = snippet(t('listing.description'));
  const indexablePlaces = new Set(publishedPlaces.filter((p) => placeScore(p, content.images).indexable).map((p) => p.id));
  const md = new Md().h1(t('listing.title')).p(t('listing.subtitle'))
    .h2(t('md.offers')).list(listingItems.filter((i) => i.kind === 'offer').map((i) => `${link(i.name, abs(i.href))} (${i.meta}) : ${i.subtitle ?? ''}`))
    .h2(t('md.places')).list(listingItems.filter((i) => i.kind === 'place' && indexablePlaces.has(i.id)).map((i) => `${link(i.name, abs(i.href))} (${i.typeLabel}, ${i.meta})${i.subtitle ? ` : ${i.subtitle}` : ''}`))
    .p(`**${t('listing.alert_title')}** ${t('listing.alert_text')}`);
  return {
    path, title: t('seo.home_title', { site: SITE_NAME, tagline: t('site.tagline') }), description, noindex: false, breadcrumb: [{ name: t('nav.home') }],
    jsonLd: [graph(
      organization({ name: SITE_NAME, url: abs('/'), description: t('site.tagline') }),
      webSite({ name: SITE_NAME, url: abs('/'), description, lang: LANG }),
      itemList(t('listing.results_title'), listingItems.filter((i) => i.kind === 'offer' || indexablePlaces.has(i.id)).map((i) => ({ name: i.name, url: abs(i.href) }))),
    )],
    markdown: footer(md, path), llms: { section: t('llms.about'), title: SITE_NAME, description },
  };
}
async function blogPage(): Promise<PageEntry> {
  const path = url.blog();
  const breadcrumb: Crumb[] = [home, { name: t('blog.crumb') }];
  const description = snippet(t('blog.description'));
  const md = new Md().h1(t('blog.title')).p(t('blog.intro')).list(publishedArticles.map((a) => `${link(a.label, abs(url.article(a.id)))} : ${a.intro}`));
  return {
    path, title: titled(t('blog.title')), description, noindex: false, breadcrumb,
    jsonLd: [graph(blog({ name: t('blog.title'), description, url: abs(path), lang: LANG }),
      itemList(t('blog.title'), publishedArticles.map((a) => ({ name: a.h1, url: abs(url.article(a.id)), description: a.intro }))), crumbLd(breadcrumb))],
    markdown: footer(md, path), llms: { section: t('llms.articles'), title: t('blog.title'), description },
  };
}
function documentPage(path: string, title: string, description: string, body: Md | null): PageEntry {
  const breadcrumb: Crumb[] = [home, { name: title }];
  return {
    path, title: titled(title), description: snippet(description), noindex: !body, breadcrumb, jsonLd: [graph(crumbLd(breadcrumb))],
    ...(body ? { markdown: footer(body, path), llms: { section: t('llms.about'), title, description: snippet(description) } } : {}),
  };
}
const isPlaceholder = (s: string | null | undefined) => !s || /^\[[A-Z][A-Z0-9_]*\]$/.test(s.trim());
function staticPages(): PageEntry[] {
  const privacy = content.copy.find((c) => c.key === 'privacy_policy');
  const privacyText = privacy?.status === 'final' ? privacy.text : null;
  return [
    documentPage(url.about(), t('footer.about'), t('about.description'),
      new Md().h1(t('team.title')).p(t('team.text_1')).p(t('team.text_2'))
        .list(content.operators.map((o) => { const g = guideOf(o.id); return `**${o.name}**${g ? ` (${g.first_name})` : ''} : ${t(`team.operator.${o.id}` as any)} ${o.website_url}`; }))),
    documentPage(url.contact(), t('contact.title'), t('contact.description'),
      new Md().h1(t('contact.title')).p(t('contact.intro')).list(content.guides.map((g) => `[${t('place.offer_write', { guide: g.first_name })}](${abs(url.whatsapp(g.id, url.contact()))})`))),
    documentPage(url.legal(), t('legal.title'), t('legal.description'), isPlaceholder(t('legal.publisher')) ? null
      : new Md().h1(t('legal.title')).p(t('legal.publisher')).h2(t('legal.full_summary')).p(t('legal.full_1')).p(t('legal.full_2')).p(t('legal.full_3')).p(t('legal.full_4'))),
    documentPage(url.privacy(), t('privacy.title'), t('privacy.description'), isPlaceholder(privacyText) ? null : new Md().h1(t('privacy.title')).add(privacyText!)),
    documentPage(url.notFound(), t('notfound.title'), t('notfound.text'), null),
  ];
}

// ---------- the registry ----------
let registry: Promise<PageEntry[]> | null = null;
/** Every public page of the site (the style guide is a development page and is not listed). */
export function allPages(): Promise<PageEntry[]> {
  registry ??= (async () => [
    await homePage(), await blogPage(),
    ...(await Promise.all(publishedPlaces.map(placePage))),
    ...(await Promise.all(publishedArticles.map(articlePage))),
    ...(await Promise.all(collections.map(collectionPageEntry))),
    ...(await Promise.all(content.guides.map(guidePage))),
    ...staticPages(),
  ])();
  return registry;
}
/** The entry of one page; a page that is not registered fails the build (no page ships without its SEO data). */
export async function pageMeta(path: string): Promise<PageEntry> {
  const p = (await allPages()).find((x) => x.path === path);
  if (!p) throw new Error(`No page registry entry for "${path}" (add it in src/content/pages.ts)`);
  return p;
}
