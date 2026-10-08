// The one data layer pages read (CLAUDE.md §4): the content in content/fixtures/ (pulled from Airtable),
// validated at build time, plus site texts, photos and URLs. Components never read this file: pages do,
// and pass plain props down.
import type { ImageMetadata } from 'astro';
import { contentSchema, type Content } from './schema';
import { COPY_DEFAULTS, type CopyKey } from './copy';
import { SITE } from './site.config';

// ---------- content ----------
const files = import.meta.glob<Content[keyof Content]>('../../content/fixtures/*.json', { eager: true, import: 'default' });
const raw = Object.fromEntries(Object.entries(files).map(([path, data]) => [path.replace(/^.*\/|\.json$/g, ''), data]));
const parsed = contentSchema.safeParse(raw);
if (!parsed.success) {
  const lines = parsed.error.issues.slice(0, 20).map((i) => `  - ${i.path.join('.')}: ${i.message}`);
  throw new Error(`Content is invalid (run pnpm content:check for the full report):\n${lines.join('\n')}`);
}
export const content: Content = parsed.data;

// ---------- site texts ----------
const overrides = new Map(content.copy.filter((c) => c.status === 'final' && c.format === 'text' && c.text).map((c) => [c.key, c.text!]));
/** A site text by key, Airtable first, then the default; {vars} filled in. */
export function t(key: CopyKey, vars: Record<string, string | number> = {}): string {
  const text = overrides.get(key) ?? (COPY_DEFAULTS as Record<string, string>)[key] ?? '';
  return text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}
/** A list text (icon + label + value), or [] when absent or not final. */
export const tList = (key: string) => content.copy.find((c) => c.key === key && c.status === 'final' && c.format === 'list')?.items ?? [];

// ---------- lookups ----------
const byId = <T extends { id: string }>(list: T[]) => new Map(list.map((x) => [x.id, x]));
const byKey = <T extends { key: string }>(list: T[]) => new Map(list.map((x) => [x.key, x]));
export const places = byId(content.destinations);
export const offers = byId(content.offers);
export const operators = byId(content.operators);
export const guides = byId(content.guides);
export const types = byKey(content.types);
export const localities = byKey(content.localities);
export const criteria = byKey(content.criteria);
export const publishedPlaces = content.destinations.filter((d) => d.status === 'published');

export const offersOf = (placeId: string) => content.offers
  .filter((o) => o.listing_id === placeId && o.status === 'published')
  .sort((a, b) => Number(b.is_main) - Number(a.is_main));
export const guideOf = (operatorId: string) => content.guides.find((g) => g.operator_id === operatorId) ?? null;
export const imagesOf = (kind: 'listing' | 'offer' | 'article' | 'site', id: string, role?: string) => content.images
  .filter((i) => i.owner_kind === kind && i.owner_id === id && (!role || i.role === role))
  .sort((a, b) => a.order - b.order);
export const sourcesOf = (kind: 'listing' | 'article' | 'site', id: string) => content.sources.filter((s) => s.owner_kind === kind && s.owner_id === id);
export const socialOf = (placeId: string) => content.social_posts.filter((p) => p.listing_id === placeId);
export const reviewsOf = (operatorId: string, offerId?: string) => content.reviews
  .filter((r) => r.status === 'published' && r.operator_id === operatorId && (!offerId || !r.offer_id || r.offer_id === offerId));
export const localityNames = (keys: string[]) => keys.map((k) => localities.get(k)?.name ?? k);

// ---------- URLs (French at the root, CLAUDE.md §10) ----------
export const url = {
  home: () => '/',
  place: (id: string) => `/destinations/${id}/`,
  type: (key: string) => `/${(types.get(key)?.plural ?? key).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}/`,
  locality: (key: string) => `/communes/${key}/`,
  article: (id: string) => `/blog/${id}/`,
  blog: () => '/blog/',
  guide: (id: string) => `/guides/${id}/`,
  privacy: () => '/confidentialite/',
  legal: () => '/mentions-legales/',
  about: () => '/qui-sommes-nous/',
  contact: () => '/contact/',
  /** Every outbound booking goes through /go/ (CLAUDE.md §9; the redirect itself comes in phase 6). */
  book: (offerId: string) => `/go/book/${offerId}/`,
  /** A company's booking page, when no single outing is meant (guide page). Same /go/book/ route; ids never collide with offers. */
  bookOperator: (operatorId: string) => `/go/book/${operatorId}/`,
  whatsapp: (guideId: string, ref: string) => `/go/whatsapp/${guideId}/?ref=${encodeURIComponent(ref)}`,
  maps: (lat: number, lng: number) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
};

// ---------- photos (downloaded by `pnpm photos:fetch`, served by the site; never hotlinked) ----------
const photoFiles = import.meta.glob<ImageMetadata>('../assets/photos/*.{jpg,jpeg,png,webp,avif}', { eager: true, import: 'default' });
const photosById = new Map(Object.entries(photoFiles).map(([p, img]) => [p.replace(/^.*\/|\.\w+$/g, ''), img]));
/** The local file of a photo, or null while it has not been downloaded (the page shows a placeholder). */
export const photoFile = (imageId: string) => photosById.get(imageId) ?? null;
const portraitFiles = import.meta.glob<ImageMetadata>('../assets/guides/*.{jpg,jpeg,png,webp}', { eager: true, import: 'default' });
/** A guide's portrait, matched by file name (guides.photo is a name like "pascal-head.png"). */
export const portraitOf = (photo: string) => Object.entries(portraitFiles).find(([p]) => p.endsWith('/' + photo.split('/').pop()))?.[1] ?? null;

export const iconStyle = SITE.icon_style;
