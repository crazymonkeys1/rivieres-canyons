// The home listing: one card per guided outing and one per place (as in the v12 design), the tokens each card carries
// for the filters, and the filter groups. Filters follow the site's facts and criteria (site.config.ts, Airtable).
import type { ImageMetadata } from 'astro';
import {
  content, publishedPlaces, t, url, types, operators, criteria, guideOf, offersOf, imagesOf, photoFile, portraitOf, localityNames, places,
} from './site';
import { keyFacts, minutes } from './format';
import { PLACE_FACTS, DIFFICULTIES, SPIRITS, CONFIDENCE, AREAS } from './site.config';

export interface ListingItem {
  id: string; kind: 'offer' | 'place'; href: string; name: string; image: ImageMetadata | null; typeLabel: string; typeEmoji?: string;
  meta: string; subtitle: string | null; alert: string | null; tags: { label: string; emoji?: string }[]; facts: { label: string; value: string; emoji?: string }[];
  guided: { guideName: string; portrait: ImageMetadata | null; color: string; label: string; price?: { amount: number; prefix: string; unit: string } } | null;
  cta: string; tokens: Record<string, string[]>; search: string; sort: Record<string, string>;
}

const KIDS_MAX_AGE = 8;
const minApproach = (r: unknown) => (r && typeof r === 'object' && 'max' in (r as any) ? (r as any).max as number : null);
const approachTokens = (m: number | null) => (m == null ? [] : [...(m <= 15 ? ['15'] : []), ...(m <= 30 ? ['30'] : [])]);
const yes = (b: boolean) => (b ? ['yes'] : []);

const offerItems: ListingItem[] = content.offers.filter((o) => o.status === 'published').map((o) => {
  const place = places.get(o.listing_id)!;
  const op = operators.get(o.operator_id)!;
  const guide = guideOf(op.id);
  const type = types.get(place.type);
  const hero = imagesOf('offer', o.id, 'hero')[0] ?? imagesOf('listing', place.id, 'hero')[0];
  const level = o.facts.level as string | null, spirit = o.facts.spirit as string | null, age = o.facts.min_age as number | null;
  const tags = [
    ...(level ? [{ label: (DIFFICULTIES as any)[level] }] : []),
    ...(spirit ? [{ label: (SPIRITS as any)[spirit], emoji: spirit === 'sensations' ? '⚡' : '🌿' }] : []),
    ...o.criteria.map((k) => criteria.get(k)).filter((c) => c?.badge).map((c) => ({ label: c!.label, emoji: c!.icon ?? undefined })),
  ];
  return {
    id: o.id, kind: 'offer', href: `${url.place(place.id)}#sortie`, name: o.name, image: hero ? photoFile(hero.id) : null,
    typeLabel: t('listing.guided_kind', { type: type?.label ?? place.type }), typeEmoji: '🪢',
    meta: localityNames(place.location.localities).join(' / '), subtitle: o.subtitle, alert: null, tags,
    facts: [{ label: t('place.offer_duration'), value: minutes(o.duration_min) }, ...(age ? [{ label: t('place.offer_min_age'), value: t('place.age', { n: age }) }] : []), { label: 'Guide', value: guide?.first_name ?? op.name }],
    guided: { guideName: guide?.first_name ?? op.name, portrait: guide ? portraitOf(guide.photo) : null, color: op.brand_color, label: t('listing.with', { company: op.name }),
      price: { amount: o.price_eur, prefix: t('place.offer_from'), unit: t('place.offer_per_adult') } },
    cta: t('listing.cta_guided'),
    tokens: {
      show: ['guided'], type: [place.type], level: level ? [level] : [], spirit: spirit ? [spirit] : [], guide: guide ? [guide.id] : [],
      duration: [o.duration_min <= 270 ? 'half' : 'day'], approach: approachTokens((o.facts.approach_min as number | null) ?? null),
      confidence: place.confidence ? [place.confidence] : [], area: [place.location.area],
      kids: yes(age != null && age <= KIDS_MAX_AGE), guided: ['yes'],
      ...Object.fromEntries(content.criteria.filter((c) => c.filter).map((c) => [`c-${c.key}`, yes(o.criteria.includes(c.key) || place.criteria.includes(c.key))])),
    },
    search: [o.name, place.name, ...localityNames(place.location.localities), op.name].join(' '),
    sort: { default: `0-${o.name}`, name: o.name, price: String(o.price_eur) },
  };
});

const placeItems: ListingItem[] = publishedPlaces.map((p) => {
  const type = types.get(p.type);
  const hero = imagesOf('listing', p.id, 'hero')[0] ?? imagesOf('listing', p.id)[0];
  const facts = keyFacts(p, PLACE_FACTS).filter((f) => ['difficulty', 'duration', 'approach'].includes(f.key)).map((f) => ({ label: f.label, value: f.value, emoji: f.emoji }));
  const age = p.facts.min_age as number | null;
  const confidence = p.confidence ? (CONFIDENCE as any)[p.confidence] : null;
  return {
    id: p.id, kind: 'place', href: url.place(p.id), name: p.name, image: hero ? photoFile(hero.id) : null,
    typeLabel: type?.label ?? p.type, typeEmoji: type?.icon ?? undefined,
    meta: localityNames(p.location.localities).join(' / ') || t('place.access_unknown_commune'),
    subtitle: p.signature ?? p.summary, alert: p.safety_alert?.short_label ?? null,
    tags: [...(confidence ? [{ label: confidence.label }] : []), ...p.criteria.map((k) => criteria.get(k)).filter((c) => c?.badge || c?.filter).map((c) => ({ label: c!.label, emoji: c!.icon ?? undefined }))],
    facts, guided: null, cta: t('listing.cta_place'),
    tokens: {
      show: ['places'], type: [p.type], level: p.facts.difficulty ? [p.facts.difficulty as string] : [], spirit: [], guide: offersOf(p.id).map((o) => guideOf(o.operator_id)?.id ?? '').filter(Boolean),
      duration: [], approach: approachTokens(minApproach(p.facts.approach)), confidence: p.confidence ? [p.confidence] : [], area: [p.location.area],
      kids: yes(age != null && age <= KIDS_MAX_AGE), guided: yes(offersOf(p.id).length > 0),
      ...Object.fromEntries(content.criteria.filter((c) => c.filter).map((c) => [`c-${c.key}`, yes(p.criteria.includes(c.key))])),
    },
    search: [p.name, ...p.alt_names, ...localityNames(p.location.localities), type?.label ?? ''].join(' '),
    sort: { default: `1-${p.name}`, name: p.name, price: '99999' },
  };
});

export const listingItems = [...offerItems, ...placeItems].sort((a, b) => a.sort.default.localeCompare(b.sort.default, 'fr'));

/** Filter groups, shown only when they have at least two options among the items. */
const present = (key: string) => new Set(listingItems.flatMap((i) => i.tokens[key] ?? []));
const opts = (key: string, all: [string, string][]) => all.filter(([v]) => present(key).has(v)).map(([value, label]) => ({ value, label }));
export const filterGroups = [
  { name: 'show', title: t('listing.f_show'), multi: false, options: [{ value: '', label: t('listing.f_show_all'), selected: true }, { value: 'guided', label: t('listing.f_show_guided') }, { value: 'places', label: t('listing.f_show_places') }] },
  { name: 'type', title: t('listing.f_type'), multi: true, options: opts('type', [...content.types].sort((a, b) => a.order - b.order).map((x) => [x.key, x.plural])) },
  { name: 'area', title: t('listing.f_area'), multi: true, options: opts('area', AREAS.map((a) => [a, a])) },
  { name: 'level', title: t('listing.f_level'), multi: true, options: opts('level', Object.entries(DIFFICULTIES)) },
  { name: 'spirit', title: t('listing.f_spirit'), multi: true, options: opts('spirit', Object.entries(SPIRITS)) },
  { name: 'guide', title: t('listing.f_guide'), multi: true, options: opts('guide', content.guides.map((g) => [g.id, g.first_name])) },
  { name: 'duration', title: t('listing.f_duration'), multi: false, options: [{ value: '', label: t('listing.f_show_all'), selected: true }, ...opts('duration', [['half', t('listing.f_half_day')], ['day', t('listing.f_day')]])] },
  { name: 'approach', title: t('listing.f_approach'), multi: false, options: [{ value: '', label: t('listing.f_show_all'), selected: true }, ...opts('approach', [['15', t('listing.f_approach_15')], ['30', t('listing.f_approach_30')]])] },
  { name: 'confidence', title: t('listing.f_confidence'), multi: true, options: opts('confidence', Object.entries(CONFIDENCE).map(([k, v]) => [k, v.label])) },
].filter((g) => g.options.filter((o) => o.value).length >= 2);

export const filterToggles = [
  { name: 'f-guided', label: t('listing.f_show_guided'), hint: t('listing.f_guided_hint') },
  { name: 'f-kids', label: t('listing.f_kids'), hint: t('listing.f_kids_hint') },
  ...content.criteria.filter((c) => c.filter).map((c) => ({ name: `f-c-${c.key}`, label: `${c.icon ?? ''} ${c.label}`.trim(), hint: undefined as string | undefined })),
];
