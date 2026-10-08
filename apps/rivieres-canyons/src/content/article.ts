// An intent article as the page shows it: the selection (guided outings, then places), each entry's facts and prose,
// the computed FAQ, the table of contents and the reading time (logic of the v12 design, see docs/DESIGN_SYSTEM.md).
import type { ImageMetadata } from 'astro';
import { select, type Rule } from '@orbit/directory/content';
import {
  content, t, url, places, operators, guides, types, guideOf, imagesOf, photoFile, portraitOf, localityNames,
} from './site';
import { factValue, keyFacts, minutes, offerFact } from './format';
import { ARTICLE_RULES, PLACE_FACTS, ACCESS_STATUS_LABELS } from './site.config';
import type { Content } from './schema';

type Article = Content['articles'][number];
type Offer = Content['offers'][number];
type Place = Content['destinations'][number];

export interface Entry {
  id: string; number: string; title: string; href: string; linkLabel: string;
  kind: string; place: string; by: { label: string; portrait: ImageMetadata | null; name: string } | null; color?: string;
  image: ImageMetadata | null; imageAlt: string; credit: string | null; facts: { label: string; value: string; emoji?: string }[];
  lead: string | null; paragraphs: string[]; listTitle: string; list: { label?: string; text: string }[];
  story: { text: string; attribution: string } | null; angle: string | null; season: string | null;
}

const RULES: Record<string, Rule> = Object.fromEntries(Object.entries(ARTICLE_RULES).map(([k, v]) => [k, v.rule]));
const published = content.articles.filter((a) => a.status === 'published');
export const publishedArticles = published;

/** Places an article may send readers to on their own: never a closed site (no directions, CLAUDE.md §8). */
const listable = (p: Place) => p.status === 'published' && p.location_policy !== 'closed' && p.access_status?.status !== 'closed';

export function articleView(a: Article) {
  const offerPool = content.offers.filter((o) => o.status === 'published' && places.get(o.listing_id)?.status === 'published');
  const offerList = a.offer_selection ? select(offerPool, a.offer_selection, RULES, (o) => places.get(o.listing_id)!) : [];
  const placeList = a.listing_selection ? select(content.destinations.filter(listable), a.listing_selection, RULES) : [];

  const featured = offerList.find((o) => o.id === a.featured_offer_id) ?? offerList[0] ?? null;
  const orderedOffers = featured ? [featured, ...offerList.filter((o) => o !== featured)] : offerList;
  const angleOf = (kind: 'offer' | 'listing', id: string) => a.angle_notes.find((n) => n.kind === kind && n.id === id)?.text ?? null;
  const seen = new Set<string>();
  const introOnce = (p: Place) => (p.intro && !seen.has(p.id) ? (seen.add(p.id), p.intro) : null);
  const pad = (i: number) => String(i + 1).padStart(2, '0');

  const offerEntry = (o: Offer, i: number): Entry => {
    const place = places.get(o.listing_id)!;
    const op = operators.get(o.operator_id)!;
    const guide = guideOf(op.id);
    const img = imagesOf('offer', o.id, 'hero')[0] ?? imagesOf('listing', place.id, 'guided')[0] ?? imagesOf('listing', place.id, 'hero')[0] ?? null;
    const age = o.facts.min_age as number | null, level = o.facts.level as string | null;
    return {
      id: `sel-${i + 1}`, number: pad(i), title: o.name, href: `${url.place(place.id)}#sortie`, linkLabel: t('article.view_offer'),
      kind: t('listing.guided_kind'), place: localityNames(place.location.localities).join(' / '), color: op.brand_color,
      by: guide ? { label: t('article.with', { guide: guide.first_name, operator: op.name }), portrait: portraitOf(guide.photo), name: guide.first_name } : null,
      image: img ? photoFile(img.id) : null, imageAlt: img?.caption ?? '', credit: img?.credit ?? null,
      facts: [
        { label: t('place.offer_duration'), value: minutes(o.duration_min), emoji: '⏱️' },
        ...(age ? [{ label: t('place.offer_min_age'), value: t('place.age', { n: age }), emoji: '👤' }] : []),
        ...(level ? [{ label: t('place.offer_level'), value: factValue(offerFact('level'), level)!, emoji: '📶' }] : []),
        { label: t('article.price'), value: o.price_child_eur ? t('article.price_child', { adult: o.price_eur, child: o.price_child_eur }) : t('article.price_value', { n: o.price_eur }), emoji: '💶' },
      ],
      lead: o.subtitle, paragraphs: [introOnce(place)].filter((x): x is string => !!x),
      listTitle: t('article.highlights'), list: o.highlights.map((text) => ({ text })),
      story: o.guide_story && guide ? { text: o.guide_story, attribution: `${guide.first_name}, ${op.name}` } : null,
      angle: angleOf('offer', o.id), season: (place.facts.season as string | null) ?? null,
    };
  };

  const placeEntry = (p: Place, i: number): Entry => {
    const type = types.get(p.type);
    const img = imagesOf('listing', p.id, 'hero')[0] ?? imagesOf('listing', p.id)[0] ?? null;
    const facts = keyFacts(p, PLACE_FACTS).filter((f) => ['difficulty', 'approach', 'swimming'].includes(f.key)).map(({ label, value, emoji }) => ({ label, value, emoji }));
    const access = p.location_policy === 'guide_only' ? t('article.access_guide')
      : p.access_status ? ACCESS_STATUS_LABELS[p.access_status.status]
      : p.location_policy === 'commune_only' ? t('article.access_commune') : null;
    const lead = p.lead ?? p.summary;
    return {
      id: `sel-${i + 1}`, number: pad(i), title: p.name, href: url.place(p.id), linkLabel: t('article.view_place'),
      kind: type?.label ?? p.type, place: localityNames(p.location.localities).join(' / ') || p.location.area, by: null,
      image: img ? photoFile(img.id) : null, imageAlt: img?.caption ?? '', credit: img?.credit ?? null,
      facts: [...facts, ...(access ? [{ label: t('article.access'), value: access, emoji: '🧭' }] : [])].slice(0, 4),
      lead, paragraphs: [introOnce(p), p.more_text].filter((x): x is string => !!x && x !== lead),
      listTitle: t('article.landmarks'), list: p.key_facts.map((k) => ({ label: k.label, text: k.value })),
      story: null, angle: angleOf('listing', p.id), season: (p.facts.season as string | null) ?? null,
    };
  };

  const entries = [...orderedOffers.map(offerEntry), ...placeList.map((p, i) => placeEntry(p, i + orderedOffers.length))];

  // FAQ: the editors' questions, then the ones computed from the outings (same wording as the design).
  const uniq = (xs: string[]) => [...new Set(xs)];
  const computed: { question: string; answer: string }[] = [];
  const aged = offerList.filter((o) => typeof o.facts.min_age === 'number');
  if (aged.length) {
    const minAge = Math.min(...aged.map((o) => o.facts.min_age as number));
    computed.push({ question: t('article.faq_age_q'), answer: t('article.faq_age_a', { age: minAge, names: aged.filter((o) => o.facts.min_age === minAge).map((o) => o.name).join(', ') }) });
  }
  if (offerList.length) {
    const cheapest = [...offerList].sort((x, y) => x.price_eur - y.price_eur)[0];
    computed.push({ question: t('article.faq_price_q'), answer: t('article.faq_price_a', { price: cheapest.price_eur, name: cheapest.name, operator: operators.get(cheapest.operator_id)!.name })
      + (offerList.some((o) => o.price_child_eur) ? ` ${t('article.faq_price_child')}` : '') });
    const gear = uniq(offerList.flatMap((o) => o.included));
    if (gear.length) computed.push({ question: t('article.faq_gear_q'), answer: t('article.faq_gear_a', { list: gear.join(', ') }) });
    const bring = uniq(offerList.flatMap((o) => o.to_bring));
    if (bring.length) computed.push({ question: t('article.faq_bring_q'), answer: t('article.faq_bring_a', { list: bring.join(', ') }) });
  }
  const own = a.faq.map((f) => f.question.toLowerCase());
  const faq = [...a.faq, ...computed.filter((c) => !own.includes(c.question.toLowerCase()))];

  const ed = a.editorial;
  const toc = [
    ...(a.takeaways.length ? [{ href: '#essentiel', label: t('article.takeaways') }] : []),
    ...(ed ? [{ href: '#guide', label: ed.h2 }] : []),
    ...(entries.length ? [{ href: '#selection', label: t('article.selection') }] : []),
    ...(ed?.tips.length ? [{ href: '#bon-a-savoir', label: t('article.tips') }] : []),
    { href: '#avant-de-partir', label: t('article.before') },
    ...(faq.length ? [{ href: '#faq-theme', label: t('article.faq') }] : []),
    { href: '#avec-un-guide', label: t('article.why_toc') },
  ];

  const words = [a.intro, ...(ed?.sections.map((s) => s.text) ?? []),
    ...entries.flatMap((e) => [e.lead, e.story?.text, e.season, e.angle, ...e.paragraphs, ...e.list.map((l) => l.text)])]
    .filter(Boolean).join(' ').split(/\s+/).length;
  const pull = featured?.guide_tip ? { text: featured.guide_tip, attribution: `${guideOf(featured.operator_id)?.first_name ?? ''}, ${operators.get(featured.operator_id)!.name}` } : null;
  const authors = a.author_ids.map((id) => guides.get(id)).filter((g): g is NonNullable<typeof g> => !!g)
    .map((g) => ({ name: g.first_name, photo: portraitOf(g.photo)?.src, href: url.guide(g.id) }));
  const hero = imagesOf('article', a.id, 'hero')[0] ?? null;

  return {
    entries, faq, toc, pull, authors, hero, offers: offerList, places: placeList,
    readTime: Math.max(3, Math.round(words / 200)),
    selectionTitle: entries.length > 1 ? t('article.selection_n', { n: entries.length }) : t('article.selection'),
  };
}
