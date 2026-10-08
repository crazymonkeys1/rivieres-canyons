// Filter landing pages (/cascades/, /communes/petit-bourg/): one per type, commune or landing criterion with 3+ published
// places (CLAUDE.md §10). Intro, answer and FAQ are computed from the data, never hand-written facts (logic of the v12 design).
import type { CopyKey } from './copy';
import { t, url, types, localities, criteria, places, offersOf, operators, guideOf, imagesOf } from './site';
import { landings } from './nav';
import { listingItems } from './listing';
import { publishedArticles, articleView } from './article';

type Place = NonNullable<ReturnType<typeof places.get>>;
const joinFr = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} ${t('collection.and')} ${xs[xs.length - 1]}` : xs[0] ?? '');
const one = <K extends CopyKey>(n: number, oneKey: K, manyKey: K) => (n > 1 ? manyKey : oneKey);
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const upper = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export interface Collection {
  path: string; dimension: string; value: string; crumbParent: string; h1: string; intro: string; answer: string;
  listTitle: string; faq: { question: string; answer: string }[]; cards: typeof listingItems;
  related: { href: string; title: string; image: ReturnType<typeof imagesOf>[number] | undefined }[];
  hero: ReturnType<typeof imagesOf>[number] | null; seo: { title: string | null; description: string | null };
}

function build(dimension: string, value: string, ids: string[]): Collection | null {
  const list = ids.map((id) => places.get(id)!).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  const n = list.length;
  const names = (xs: Place[]) => joinFr(xs.map((x) => x.name));
  const typesIn = [...new Set(list.map((x) => x.type))].map((k) => lower(types.get(k)?.plural ?? k));
  let h1: string, noun: string, where: string, path: string, crumbParent: string, editorIntro: string | null, seo;
  if (dimension === 'type') {
    const ty = types.get(value)!;
    h1 = t('collection.h1_type', { plural: ty.plural }); noun = lower(ty.plural); where = t('collection.where_type');
    path = url.type(value); crumbParent = t('collection.by_type'); editorIntro = ty.intro; seo = ty.seo;
  } else if (dimension === 'locality') {
    const lo = localities.get(value)!;
    h1 = t('collection.h1_locality', { types: upper(joinFr(typesIn)), place: lo.name }); noun = t('collection.noun_places'); where = t('collection.where_locality', { place: lo.name });
    path = url.locality(value); crumbParent = t('collection.by_locality'); editorIntro = lo.intro; seo = lo.seo;
  } else if (dimension === 'criterion') {
    const c = criteria.get(value)!;
    h1 = t('collection.h1_criterion', { label: c.label }); noun = t('collection.noun_places'); where = t('collection.where_type');
    path = `/${value}/`; crumbParent = t('collection.by_criterion'); editorIntro = c.intro; seo = c.seo;
  } else return null;   // zones: none on this site

  const guided = list.filter((x) => offersOf(x.id).length);
  const pub = list.filter((x) => x.location_policy === 'public');
  const closed = list.filter((x) => x.location_policy === 'closed');
  const guideOnly = list.filter((x) => x.location_policy === 'guide_only');
  const rest = list.filter((x) => !['public', 'closed', 'guide_only'].includes(x.location_policy ?? '')).length;

  const intro = editorIntro ?? t('collection.intro', { n, noun, where, types: dimension === 'locality' ? ` : ${joinFr(typesIn)}` : '' });
  const bits = [
    ...(guided.length ? [t(one(guided.length, 'collection.answer_guided_one', 'collection.answer_guided_many'), { n: guided.length, names: names(guided) })] : []),
    ...(pub.length ? [t(one(pub.length, 'collection.answer_public_one', 'collection.answer_public_many'), { n: pub.length, names: names(pub) })] : []),
  ];
  const answer = [
    t('collection.answer', { n, noun, where, bits: bits.length ? joinFr(bits) : t('collection.answer_none') }),
    ...(closed.length ? [t('collection.answer_closed', { names: names(closed) })] : []),
    ...(rest ? [rest > 1 ? t('collection.answer_rest_many', { n: rest }) : t('collection.answer_rest_one')] : []),
  ].join(' ');

  const guidesOf = (x: Place) => joinFr([...new Set(offersOf(x.id).map((o) => guideOf(o.operator_id)?.first_name ?? operators.get(o.operator_id)!.name))]);
  const faq = [
    dimension === 'locality'
      ? { question: t('collection.faq_see_q', { place: localities.get(value)!.name }), answer: t('collection.faq_see_a', { items: joinFr(list.map((x) => `${x.name} (${lower(types.get(x.type)?.label ?? x.type)})`)) }) }
      : { question: t('collection.faq_count_q', { noun }), answer: t('collection.faq_count_a', { n, names: names(list) }) },
    { question: t('collection.faq_alone_q'), answer: [
      pub.length ? t(one(pub.length, 'collection.faq_alone_public_one', 'collection.faq_alone_public_many'), { names: names(pub) }) : t('collection.faq_alone_none'),
      ...(guideOnly.length ? [t('collection.faq_alone_guide_only', { names: names(guideOnly) })] : []),
    ].join(' ') },
    { question: t('collection.faq_guided_q'), answer: guided.length
      ? t('collection.faq_guided_yes', { items: joinFr(guided.map((x) => t('collection.faq_guided_item', { name: x.name, guides: guidesOf(x) }))) })
      : t('collection.faq_guided_no') },
    ...(closed.length ? [{ question: t('collection.faq_closed_q'), answer: t('collection.faq_closed_a', { names: names(closed) }) }] : []),
    { question: t('collection.faq_fresh_q'), answer: t('collection.faq_fresh_a') },
  ];

  // Articles whose selection includes one of these places (or an outing on one of them).
  const inList = new Set(ids);
  const rel = publishedArticles.filter((a) => {
    const v = articleView(a);
    return v.places.some((p) => inList.has(p.id)) || v.offers.some((o) => inList.has(o.listing_id));
  });
  const related = (rel.length ? rel : publishedArticles.slice(0, 3)).map((a) => ({ href: url.article(a.id), title: a.label, image: imagesOf('article', a.id, 'hero')[0] }));
  const heroPlace = list.find((x) => imagesOf('listing', x.id, 'hero').length) ?? null;

  return {
    path, dimension, value, crumbParent, h1, intro, answer, faq, related, seo,
    listTitle: t('collection.list_title', { n, noun, where }),
    cards: listingItems.filter((i) => i.kind === 'place' && inList.has(i.id)),
    hero: heroPlace ? imagesOf('listing', heroPlace.id, 'hero')[0] : null,
  };
}

export const collections = landings.map((l) => build(l.dimension, l.value, l.listing_ids)).filter((c): c is Collection => !!c);
