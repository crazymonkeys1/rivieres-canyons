// Layer 2 · Directory: entities shared by any directory (would still make sense if we listed cars).
// Site vocabularies (levels, spirits, tags…) are plain strings here; each app narrows them to enums.
import { z } from 'zod';
import { slug, httpUrl, urlOrPlaceholder, placeholder, image, faqItem } from '@orbit/core/content';

/** A WhatsApp number in international digits (no +, no spaces), or a placeholder. */
export const whatsappNumber = z.union([z.string().regex(/^\d{8,15}$/, 'digits only, country code first'), placeholder]);

export const labelledFact = z.object({ icon: z.string(), label: z.string().min(1), value: z.string().min(1) });

/** A company that sells outings (one booking site, one brand colour). */
export const operator = z.object({
  id: slug,
  name: z.string().min(1),
  brand_color: z.string().regex(/^#[0-9A-F]{6}$/i),
  logo_url: httpUrl.nullable(),
  website_url: httpUrl,
  contact_url: httpUrl.nullable(),
  booking_url: urlOrPlaceholder,
  rating: z.number().min(0).max(5).nullable(),
  rating_source: z.string().nullable(),
});

/** The person who guides; owns the WhatsApp contact and the /guides/{slug} page. */
export const guide = z.object({
  id: slug,
  operator_id: slug,
  first_name: z.string().min(1),
  full_name: z.string().nullable(),
  photo: z.string().min(1),
  role: z.string().min(1),
  bio: z.string().min(1),
  facts: z.array(labelledFact),
  whatsapp: whatsappNumber,
});

/** A bookable outing. Linked to exactly one directory listing. */
export const offerShape = z.object({
  id: slug,
  operator_id: slug,
  listing_id: slug,
  is_main: z.boolean(),
  name: z.string().min(1),
  subtitle: z.string().min(1),
  commune: z.string().min(1),
  duration_min: z.number().int().positive(),
  approach_min: z.number().int().nonnegative().nullable(),
  min_age: z.number().int().positive(),
  level: z.string(),
  spirit: z.string(),
  has_rappel: z.boolean(),
  pets_allowed: z.boolean(),
  price_eur: z.number().positive(),
  price_child_eur: z.number().positive().nullable(),
  child_price_under_age: z.number().int().positive().nullable(),
  image: image.nullable(),
  tags: z.array(z.string()),
  highlights: z.array(z.string()),
  included: z.array(z.string()),
  to_bring: z.array(z.string()),
  meeting_note: z.string().nullable(),
  guide_tip: z.string().nullable(),
  guide_story: z.string().nullable(),
  on_site_since: z.number().int().min(1950).max(2100).nullable(),
});

export function offerRules(o: z.infer<typeof offerShape>, ctx: z.RefinementCtx) {
  if ((o.price_child_eur === null) !== (o.child_price_under_age === null)) {
    ctx.addIssue({ code: 'custom', path: ['child_price_under_age'], message: 'a child price needs child_price_under_age, and only then' });
  }
}
export const offer = offerShape.superRefine(offerRules);

/** Only real reviews with a source are published; drafts never render. */
export const review = z.object({
  id: slug,
  operator_id: slug,
  offer_id: slug.nullable(),
  quote: z.string().min(1),
  author: z.string().min(1),
  source: z.string().min(1, 'a review without a source is never published'),
  status: z.enum(['published', 'draft']),
});

export const socialPost = z.object({
  id: slug,
  listing_id: slug,
  platform: z.enum(['Facebook', 'Instagram', 'YouTube', 'TikTok']),
  url: httpUrl,
  youtube_id: z.string().nullable(),
  thumbnail_url: httpUrl.nullable(),
  account: z.string().nullable(), // required for production (always show the account name)
  title: z.string().min(1),
  duration_sec: z.number().int().positive().nullable(),
});

/**
 * Selection rule: declarative, so it can live in Airtable and run at build time.
 * `match: all` = every condition holds; `any` = at least one.
 */
export const condition = z.object({
  field: z.string().min(1),
  op: z.enum(['eq', 'lte', 'gte', 'includes', 'filled']),
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
});
export const rule = z.object({ match: z.enum(['all', 'any']), conditions: z.array(condition).min(1) });
export type Rule = z.infer<typeof rule>;

export function matchesRule(record: Record<string, unknown>, r: Rule): boolean {
  const test = (c: z.infer<typeof condition>) => {
    const v = record[c.field];
    switch (c.op) {
      case 'eq': return v === c.value;
      case 'lte': return typeof v === 'number' && typeof c.value === 'number' && v <= c.value;
      case 'gte': return typeof v === 'number' && typeof c.value === 'number' && v >= c.value;
      case 'includes': return Array.isArray(v) && v.includes(c.value);
      case 'filled': return v !== null && v !== undefined && v !== '' && v !== false;
    }
  };
  return r.match === 'all' ? r.conditions.every(test) : r.conditions.some(test);
}

/** Intent article ("Canyoning avec enfants"): editorial copy + a computed selection. */
export const article = z.object({
  id: slug,
  label: z.string().min(1),
  h1: z.string().min(1),
  eyebrow: z.string().min(1),
  intro: z.string().min(1),
  answer: z.string().min(1),
  hero_image: image.nullable(),
  featured_offer_id: slug.nullable(),
  takeaways: z.array(z.object({ title: z.string().min(1), text: z.string().min(1) })),
  editorial: z.object({
    eyebrow: z.string(),
    h2: z.string().min(1),
    sections: z.array(z.object({ title: z.string().min(1), text: z.string().min(1) })),
    tips: z.array(z.object({ label: z.string().min(1), value: z.string().min(1) })),
  }).nullable(),
  offer_rule: rule.nullable(),
  listing_ids: z.array(slug),
  listing_rule: rule.nullable(),
  angle_label: z.string().nullable(),
  angle_notes: z.array(z.object({ kind: z.enum(['offer', 'listing']), id: slug, text: z.string().min(1) })),
  why_intro: z.string().min(1),
  safety_note: z.string().min(1),
  published_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  updated_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/** Static page copy (privacy policy, shared lists). `placeholder` blocks fail a production build. */
export const block = z.object({
  key: z.string().regex(/^[a-z0-9_]+$/),
  status: z.enum(['placeholder', 'final']),
  body: z.unknown(),
  updated_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});

export { faqItem };
