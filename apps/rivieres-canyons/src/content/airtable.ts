// Layer 4 · The Rivières & Canyons Airtable base: package tables + this site's settings + one site-only table.
// toTables() and fromTables() are exact inverses (checked by `pnpm airtable:export` on every run).
import { f, fSelect, fLink, toRow, fromRow, type Table, type Row } from '@orbit/core/airtable';
import {
  DEFAULT_NAMES, typesTable, localitiesTable, criteriaTable, operatorsTable, guidesTable, offersTable, reviewsTable,
  articlesTable, sectionsTable, faqTable, imagesTable, sourcesTable, copyTable, type TableNames,
} from '@orbit/directory/airtable';
import { placesTable } from '@orbit/places/airtable';
import type { Content } from './schema';
import {
  AREAS, ZONES, LOCATION_LABELS, CONFIDENCE, PLACE_FACTS, OFFER_FACTS, RISKS, ACCESS_STATUS_LABELS, COMPLETENESS, ARTICLE_RULES,
} from './site.config';

export const NAMES: TableNames = {
  ...DEFAULT_NAMES, listing: 'Lieux', listing_one: 'Lieu', offer: 'Sorties', offer_one: 'Sortie', locality: 'Communes',
};

/** Fields an editor can mark "À confirmer" (content path → column label). */
const ESTIMABLE = [
  { key: 'summary', label: 'Résumé' }, { key: 'itinerary', label: 'Itinéraire' }, { key: 'drive', label: 'Temps de route' }, { key: 'parking', label: 'Parking' },
  ...PLACE_FACTS.map((d) => ({ key: `facts.${d.key}`, label: d.label })),
];
const rulesFor = (k: 'listing' | 'offer') => Object.entries(ARTICLE_RULES).filter(([, r]) => r.applies_to === k).map(([key, r]) => ({ key, label: r.label }));

const socialTable: Table = {
  name: 'Publications', id: 'social_posts', primary: 'Réf', key: 'Réf', client: 'read',
  about: 'Une vidéo ou publication sur un lieu (le nom du compte est toujours affiché).',
  fields: [
    f('Réf', 'singleLineText', 'id', { edit: 'orbit' }),
    fLink(NAMES.listing_one, 'listing_id', NAMES.listing, { single: true }),
    fSelect('Réseau', 'platform', ['Facebook', 'Instagram', 'YouTube', 'TikTok'].map((p) => ({ key: p, label: p }))),
    f('Lien', 'url', 'url'), f('ID YouTube', 'singleLineText', 'youtube_id'), f('Miniature', 'url', 'thumbnail_url'),
    f('Compte', 'singleLineText', 'account', { help: 'Obligatoire pour la mise en ligne.' }),
    f('Titre', 'singleLineText', 'title'), f('Durée (s)', 'number', 'duration_sec'),
  ],
};

/** Every table, in import order (a table's links point to tables above it, except reverse links Airtable adds). */
export const TABLES: Table[] = [
  typesTable(NAMES),
  localitiesTable(NAMES, LOCATION_LABELS.area, AREAS),
  criteriaTable(NAMES),
  operatorsTable(NAMES),
  guidesTable(NAMES),
  placesTable({
    names: NAMES, areas: AREAS, zones: ZONES, locationLabels: LOCATION_LABELS, confidence: CONFIDENCE, facts: PLACE_FACTS,
    estimable: ESTIMABLE, risks: RISKS, accessStatus: ACCESS_STATUS_LABELS, completeness: COMPLETENESS.keys,
  }),
  offersTable(NAMES, OFFER_FACTS),
  reviewsTable(NAMES),
  articlesTable(NAMES, { listing: rulesFor('listing'), offer: rulesFor('offer') }),
  sectionsTable(NAMES),
  faqTable(NAMES),
  imagesTable(NAMES),
  sourcesTable(NAMES),
  socialTable,
  copyTable(NAMES),
];
export const table = (id: string) => TABLES.find((t) => t.id === id)!;

/** Content → logical rows (option keys, linked keys), one list per table. */
export function toTables(c: Content): Record<string, Row[]> {
  const rows = (id: string, list: unknown[]) => list.map((r) => toRow(table(id), r));
  const sections = c.articles.flatMap((a) => [
    ...a.takeaways.map((t, i) => ({ article_id: a.id, kind: 'takeaway', order: i + 1, title: t.title, text: t.text })),
    ...(a.editorial?.sections ?? []).map((s, i) => ({ article_id: a.id, kind: 'section', order: i + 1, title: s.title, text: s.text })),
    ...(a.editorial?.tips ?? []).map((t, i) => ({ article_id: a.id, kind: 'tip', order: i + 1, title: t.label, text: t.value })),
    ...a.angle_notes.map((n, i) => ({ article_id: a.id, kind: 'angle', order: i + 1, title: null, text: n.text,
      listing_id: n.kind === 'listing' ? n.id : null, offer_id: n.kind === 'offer' ? n.id : null })),
  ]);
  const faq = [
    ...c.destinations.flatMap((d) => d.faq.map((q, i) => ({ ...q, listing_id: d.id, article_id: null, order: i + 1 }))),
    ...c.articles.flatMap((a) => a.faq.map((q, i) => ({ ...q, listing_id: null, article_id: a.id, order: i + 1 }))),
  ];
  return {
    types: rows('types', c.types), localities: rows('localities', c.localities), criteria: rows('criteria', c.criteria),
    operators: rows('operators', c.operators), guides: rows('guides', c.guides), listings: rows('listings', c.destinations),
    offers: rows('offers', c.offers), reviews: rows('reviews', c.reviews), articles: rows('articles', c.articles),
    sections: rows('sections', sections), faq: rows('faq', faq), images: rows('images', c.images), sources: rows('sources', c.sources),
    social_posts: rows('social_posts', c.social_posts), copy: rows('copy', c.copy),
  };
}

const slugify = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/['’]/g, '-').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const byOrder = (a: { order: number | null }, b: { order: number | null }) => (a.order ?? 0) - (b.order ?? 0);

/** Logical rows → content (child rows folded back into their parent). Validate the result with contentSchema. */
export function fromTables(t: Record<string, Row[]>, errors?: string[]): Content {
  const read = (id: string, init?: () => any) => (t[id] ?? []).map((row) => fromRow(table(id), row, init, errors));
  const sections = read('sections').sort(byOrder);
  const faq = read('faq').sort(byOrder);
  const faqOf = (k: 'listing_id' | 'article_id', id: string) => faq.filter((q) => q[k] === id).map((q) => ({ question: q.question, answer: q.answer }));
  const of = (id: string, kind: string) => sections.filter((s) => s.article_id === id && s.kind === kind);
  const destinations = read('listings', () => ({ location: { zone: null } })).map((d) => {
    d.id ||= slugify(d.name);
    return { ...d, faq: faqOf('listing_id', d.id) };
  });
  const articles = read('articles').map((a) => ({
    ...a,
    takeaways: of(a.id, 'takeaway').map((s) => ({ title: s.title, text: s.text })),
    editorial: a.editorial && {
      ...a.editorial,
      sections: of(a.id, 'section').map((s) => ({ title: s.title, text: s.text })),
      tips: of(a.id, 'tip').map((s) => ({ label: s.title, value: s.text })),
    },
    angle_notes: of(a.id, 'angle').map((s) => (s.listing_id ? { kind: 'listing', id: s.listing_id, text: s.text } : { kind: 'offer', id: s.offer_id, text: s.text })),
    faq: faqOf('article_id', a.id),
  }));
  return {
    destinations, articles,
    types: read('types'), localities: read('localities'), criteria: read('criteria'), operators: read('operators'), guides: read('guides'),
    offers: read('offers'), reviews: read('reviews'), images: read('images'), sources: read('sources'),
    social_posts: read('social_posts'), copy: read('copy'),
  } as Content;
}
