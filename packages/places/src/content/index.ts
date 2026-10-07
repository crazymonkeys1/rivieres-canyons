// Layer 3 · Places: what only a directory of physical places needs
// (location policy, access status, safety, key facts). Site vocabularies stay strings; the app narrows them.
import { z } from 'zod';
import { slug, httpUrl, image, faqItem } from '@orbit/core/content';

/** How much of the way there we publish. See CLAUDE.md §8. */
export const LOCATION_POLICIES = ['public', 'commune_only', 'guide_only', 'closed'] as const;
export const locationPolicy = z.enum(LOCATION_POLICIES);

export const accessStatus = z.object({
  status: z.enum(['open', 'partial', 'closed']),
  note: z.string().min(1),
  source_name: z.string().nullable(),
  source_url: httpUrl.nullable(),
  checked_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});

export const safetyAlert = z.object({
  short_label: z.string().min(1),
  title: z.string().min(1),
  text: z.string().min(1),
  items: z.array(z.string().min(1)),
});

export const accessTile = z.object({ icon: z.string(), label: z.string().min(1), value: z.string().min(1), tip: z.string().nullable() });

/** A range in minutes ("2 à 3 h" → 120–180) with the words that did not fit a number. */
export const minutesRange = z.object({
  min: z.number().int().nonnegative(),
  max: z.number().int().nonnegative(),
  note: z.string().nullable(),
}).refine((r) => r.max >= r.min, 'max must be ≥ min');

/** Itinerary fields: published only for `public` places. */
export const ITINERARY_FIELDS = ['itinerary', 'itinerary_text', 'access_tiles', 'parking', 'drive', 'latitude', 'longitude'] as const;

/** Field shape; apps narrow `type`, `risks`, `verification`… with `.extend()` then add `placeRules`. */
export const placeShape = z.object({
  id: slug,
  name: z.string().min(1),
  type: z.string(),
  island: z.string().min(1),
  communes: z.array(z.string().min(1)),
  signature: z.string().nullable(),
  signature_status: z.enum(['draft', 'validated']).nullable(),
  has_waterfall: z.boolean().nullable(),
  location_policy: locationPolicy.nullable(),
  alt_names: z.array(z.string()),
  access_status: accessStatus.nullable(),
  summary: z.string().min(1),
  overview_h2: z.string().nullable(),
  lead: z.string().nullable(),
  intro: z.string().nullable(),
  more_title: z.string().nullable(),
  more_text: z.string().nullable(),
  season: z.string().nullable(),
  difficulty: z.string().nullable(),
  duration: minutesRange.nullable(),
  approach: minutesRange.nullable(),
  min_age: z.number().int().positive().nullable(),
  swimming: z.enum(['yes', 'conditional', 'no']).nullable(),
  swimming_note: z.string().nullable(),
  // Itinerary (public only)
  access_h2: z.string().nullable(),
  itinerary: z.string().nullable(),
  itinerary_text: z.string().nullable(),
  access_tiles: z.array(accessTile),
  parking: z.string().nullable(),
  drive: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  guided_access_text: z.string().nullable(),
  // Safety
  risks: z.array(z.string()),
  safety_alert: safetyAlert.nullable(),
  to_bring: z.array(z.string()),
  key_facts: z.array(z.object({ label: z.string().min(1), value: z.string().min(1) })),
  insider_tip: z.object({ guide_id: slug.nullable(), text: z.string().min(1) }).nullable(),
  offer_h2: z.string().nullable(),
  offer_why: z.string().nullable(),
  faq_h2: z.string().nullable(),
  faq: z.array(faqItem),
  press: z.array(z.object({ site: z.string().min(1), by: z.string().nullable(), title: z.string().min(1), note: z.string().nullable(), url: httpUrl })),
  // Media
  hero_image: image.nullable(),
  gallery: z.array(image),
  site_photos: z.array(image),
  guided_photos: z.array(image),
  photo_caption_site: z.string().nullable(),
  photo_caption_guided: z.string().nullable(),
  // Trust
  verification: z.string().nullable(),
  source_publisher: z.string().min(1),
  source_url: httpUrl,
  estimated_fields: z.array(z.string()),
});

export function placeRules(p: z.infer<typeof placeShape>, ctx: z.RefinementCtx) {
  // CLAUDE.md §8: guide_only and closed places never carry directions.
  if (p.location_policy === 'guide_only' || p.location_policy === 'closed') {
    for (const f of ITINERARY_FIELDS) {
      const v = p[f];
      if (Array.isArray(v) ? v.length > 0 : v !== null) {
        ctx.addIssue({ code: 'custom', path: [f], message: `${p.location_policy} place must not carry "${f}"` });
      }
    }
  }
  if (p.signature && !p.signature_status) ctx.addIssue({ code: 'custom', path: ['signature_status'], message: 'signature needs a status' });
  if (!p.signature && p.signature_status) ctx.addIssue({ code: 'custom', path: ['signature_status'], message: 'status without signature' });
}

export const place = placeShape.superRefine(placeRules);
export type Place = z.infer<typeof placeShape>;
