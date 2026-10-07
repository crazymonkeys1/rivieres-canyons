// Layer 2 · Directory: entities shared by any directory (would still make sense if we listed cars).
// Site-specific facts live in `facts` (declared per site); vocabularies are strings the app narrows.
import { z } from 'zod';
import { slug, isoDate, httpUrl, urlOrPlaceholder, placeholder, faqItem, seoOverrides, getPath } from '@orbit/core/content';

/** A WhatsApp number in international digits (no +, no spaces), or a placeholder. */
export const whatsappNumber = z.union([z.string().regex(/^\d{8,15}$/, 'digits only, country code first'), placeholder]);
export const labelledFact = z.object({ icon: z.string(), label: z.string().min(1), value: z.string().min(1) });

/** Where a listing is: area (island, region) > zone (optional group) > localities (communes). Labels come from the site config. */
export const location = z.object({
  area: z.string().min(1),
  zone: z.string().nullable(),
  localities: z.array(z.string().min(1)),
  geo: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).nullable(),
});

/** Every directory entry. Places, products or services extend it. */
export const listingShape = z.object({
  id: slug,
  name: z.string().min(1),
  type: z.string(),
  alt_names: z.array(z.string()),
  // Publication gates: status = shown or not; confidence = how verified (site levels); completeness = indexed or not (computed).
  status: z.enum(['published', 'hidden']),
  confidence: z.string().nullable(),
  last_reviewed_on: isoDate.nullable(),
  location,
  // Editorial
  summary: z.string().min(1),
  signature: z.string().nullable(),
  signature_status: z.enum(['draft', 'validated']).nullable(),
  lead: z.string().nullable(),
  intro: z.string().nullable(),
  more_title: z.string().nullable(),
  more_text: z.string().nullable(),
  tip: z.object({ guide_id: slug.nullable(), text: z.string().min(1) }).nullable(),
  faq: z.array(faqItem),
  key_facts: z.array(z.object({ label: z.string().min(1), value: z.string().min(1) })),  // "Bon à savoir"
  press: z.array(z.object({ site: z.string().min(1), by: z.string().nullable(), title: z.string().min(1), note: z.string().nullable(), url: httpUrl })),
  // Site-declared facts and their optional notes ("possible sous conditions, dans les petits bassins")
  facts: z.record(z.unknown()),
  fact_notes: z.record(z.string()),
  estimated_fields: z.array(z.string()),
  // Optional overrides: templates compute these when empty
  headings: z.object({ overview: z.string().nullable(), access: z.string().nullable(), offer: z.string().nullable(), faq: z.string().nullable() }),
  offer_why: z.string().nullable(),
  seo: seoOverrides,
});

export function listingRules(l: z.infer<typeof listingShape>, ctx: z.RefinementCtx) {
  if (l.signature && !l.signature_status) ctx.addIssue({ code: 'custom', path: ['signature_status'], message: 'signature needs a status' });
  if (!l.signature && l.signature_status) ctx.addIssue({ code: 'custom', path: ['signature_status'], message: 'status without signature' });
}

/** A company that sells (one booking site, one brand colour). */
export const operator = z.object({
  id: slug,
  name: z.string().min(1),
  brand_color: z.string().regex(/^#[0-9A-F]{6}$/i),
  logo_url: httpUrl.nullable(),
  website_url: httpUrl,
  contact_url: httpUrl.nullable(),
  booking_url: urlOrPlaceholder,
  rating: z.number().min(0).max(5).nullable(),
  rating_count: z.number().int().positive().nullable(),
  rating_source: z.string().nullable(),
});

/** The person behind the offer; owns the WhatsApp contact and the /guides/{slug} page. */
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

/** A bookable offer, linked to exactly one listing. Price and duration are generic; the rest is site facts. */
export const offerShape = z.object({
  id: slug,
  operator_id: slug,
  listing_id: slug,
  is_main: z.boolean(),
  name: z.string().min(1),
  subtitle: z.string().min(1),
  duration_min: z.number().int().positive(),
  price_eur: z.number().positive(),
  price_child_eur: z.number().positive().nullable(),
  child_price_under_age: z.number().int().positive().nullable(),
  price_checked_on: isoDate.nullable(),
  facts: z.record(z.unknown()),
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
 * `field` may be a dotted path (`facts.min_age`). `match: all` = every condition; `any` = at least one.
 */
export const condition = z.object({
  field: z.string().min(1),
  op: z.enum(['eq', 'lte', 'gte', 'includes', 'filled']),
  value: z.union([z.string(), z.number(), z.boolean()]).optional(),
});
export const rule = z.object({ match: z.enum(['all', 'any']), conditions: z.array(condition).min(1) });
export type Rule = z.infer<typeof rule>;

export function matchesRule(record: unknown, r: Rule): boolean {
  const test = (c: z.infer<typeof condition>) => {
    const v = getPath(record, c.field);
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
  author_ids: z.array(slug).min(1),
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
  published_on: isoDate,
  updated_on: isoDate,
  seo: seoOverrides,
});

/** Structured page copy (privacy policy, shared lists). `placeholder` blocks fail a production build. */
export const block = z.object({
  key: z.string().regex(/^[a-z0-9_]+$/),
  status: z.enum(['placeholder', 'final']),
  body: z.unknown(),
  updated_on: isoDate.nullable(),
});

/** A dimension that can produce landing pages (type, locality, zone, an activity…). */
export interface LandingDimension {
  key: string;
  label: string;
  /** Values of a listing for this dimension (a listing can have several). */
  values: (listing: z.infer<typeof listingShape>) => string[];
}

/** Landing pages exist only for values with at least `min` published listings. */
export function landingPages(listings: z.infer<typeof listingShape>[], dims: LandingDimension[], min: number) {
  return dims.flatMap((d) => {
    const by = new Map<string, string[]>();
    for (const l of listings.filter((x) => x.status === 'published'))
      for (const v of d.values(l)) by.set(v, [...(by.get(v) ?? []), l.id]);
    return [...by].filter(([, ids]) => ids.length >= min).map(([value, ids]) => ({ dimension: d.key, value, listing_ids: ids }));
  });
}
