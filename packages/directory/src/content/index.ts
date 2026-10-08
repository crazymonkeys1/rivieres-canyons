// Layer 2 · Directory: entities shared by any directory (would still make sense if we listed cars).
// Site-specific facts live in `facts` (declared per site); vocabularies are strings the app narrows.
import { z } from 'zod';
import { slug, isoDate, httpUrl, urlOrPlaceholder, placeholder, faqItem, seoOverrides, getPath } from '@orbit/core/content';

/** A WhatsApp number in international digits (no +, no spaces), or a placeholder. */
export const whatsappNumber = z.union([z.string().regex(/^\d{8,15}$/, 'digits only, country code first'), placeholder]);
export const labelledFact = z.object({ icon: z.string(), label: z.string().min(1), value: z.string().min(1) });

/** Where a listing is: area (island, region) > zone (optional group) > localities (communes, by key). Labels come from the site config. */
export const location = z.object({
  area: z.string().min(1),
  zone: z.string().nullable(),
  localities: z.array(slug),
  geo: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).nullable(),
});

export const LISTING_STATUSES = ['draft', 'published', 'hidden', 'rejected'] as const;

/** Every directory entry. Places, products or services extend it. */
export const listingShape = z.object({
  id: slug,
  name: z.string().min(1),
  type: z.string(),
  alt_names: z.array(z.string()),
  /** The name after the preposition meaning "to", for headings like "Comment aller au Canyon doré" (FR: au / à la / à l' / aux). Empty = neutral headings. */
  name_with_preposition: z.string().nullable(),
  // Publication gates: status = shown or not; confidence = how verified (site levels); completeness = indexed or not (computed).
  // `rejected` keeps research memory in the same table (decision D4): never shown, reason in status_note.
  status: z.enum(LISTING_STATUSES),
  status_note: z.string().nullable(),
  confidence: z.string().nullable(),
  last_reviewed_on: isoDate.nullable(),
  location,
  // Editorial
  summary: z.string().nullable(),
  signature: z.string().nullable(),
  signature_status: z.enum(['draft', 'validated']).nullable(),
  lead: z.string().nullable(),
  intro: z.string().nullable(),
  more_title: z.string().nullable(),
  more_text: z.string().nullable(),
  tip: z.object({ guide_id: slug.nullable(), text: z.string().min(1) }).nullable(),
  faq: z.array(faqItem),
  key_facts: z.array(z.object({ label: z.string().min(1), value: z.string().min(1) })),  // "Bon à savoir"
  // Yes/no criteria (keys of the Criteria table, decision D1) and site-declared measured facts
  criteria: z.array(slug),
  facts: z.record(z.unknown()),
  fact_notes: z.record(z.string()),
  estimated_fields: z.array(z.string()),
  // Optional overrides: templates compute these when empty
  headings: z.object({ overview: z.string().nullable(), access: z.string().nullable(), offer: z.string().nullable(), faq: z.string().nullable() }),
  offer_why: z.string().nullable(),
  seo: seoOverrides,
});

export function listingRules(l: z.infer<typeof listingShape>, ctx: z.RefinementCtx) {
  if (l.status === 'published' && !l.summary) ctx.addIssue({ code: 'custom', path: ['summary'], message: 'a published listing needs a summary' });
  if (l.status === 'rejected' && !l.status_note) ctx.addIssue({ code: 'custom', path: ['status_note'], message: 'a rejected listing needs the reason' });
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

/** A bookable offer, linked to exactly one listing. Price and duration are generic; the rest is criteria and site facts. */
export const offerShape = z.object({
  id: slug,
  status: z.enum(['draft', 'published']),
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
  criteria: z.array(slug),
  facts: z.record(z.unknown()),
  highlights: z.array(z.string()),
  included: z.array(z.string()),
  to_bring: z.array(z.string()),
  meeting_note: z.string().nullable(),
  guide_tip: z.string().nullable(),
  guide_story: z.string().nullable(),
  /** Stories written for a guide stay drafts until the guide approves them (production fails on draft). */
  guide_story_status: z.enum(['draft', 'validated']).nullable(),
  on_site_since: z.number().int().min(1950).max(2100).nullable(),
});

export function offerRules(o: z.infer<typeof offerShape>, ctx: z.RefinementCtx) {
  if (!!o.guide_story !== !!o.guide_story_status) ctx.addIssue({ code: 'custom', path: ['guide_story_status'], message: 'a guide story needs a status, and only then' });
  if ((o.price_child_eur === null) !== (o.child_price_under_age === null)) {
    ctx.addIssue({ code: 'custom', path: ['child_price_under_age'], message: 'a child price needs child_price_under_age, and only then' });
  }
}

/** Only real reviews with a source are published; drafts never render. */
export const review = z.object({
  id: slug,
  operator_id: slug,
  offer_id: slug.nullable(),
  guide_id: slug.nullable(),
  quote: z.string().min(1),
  author: z.string().min(1),
  rating: z.number().min(0).max(5).nullable(),
  date: isoDate.nullable(),
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

/**
 * What an article lists (decision D3): editors pick types, localities and criteria (with / without),
 * plus manual include / exclude. A rule on measured facts ("dès 10 ans") is named by key and lives in the site config.
 * Result = (items matching every filled filter) ∪ include − exclude. No filter and no rule = include only.
 */
export const selection = z.object({
  types: z.array(slug),
  localities: z.array(slug),
  with: z.array(slug),
  without: z.array(slug),
  rule: z.string().nullable(),
  include: z.array(slug),
  exclude: z.array(slug),
});
export type Selection = z.infer<typeof selection>;
type Selectable = { id: string; type?: string; location?: { localities: string[] }; criteria: string[] };

function hasFilter(s: Selection) {
  return s.types.length + s.localities.length + s.with.length + s.without.length > 0 || !!s.rule;
}
/** Applies a selection. `context` gives an offer its listing (for types and localities); `rules` are the site's named rules. */
export function select<T extends Selectable>(items: T[], s: Selection, rules: Record<string, Rule>, context: (x: T) => Selectable = (x) => x): T[] {
  if (s.rule && !rules[s.rule]) throw new Error(`unknown selection rule "${s.rule}"`);
  const base = !hasFilter(s) ? [] : items.filter((x) => {
    const c = context(x);
    return (!s.types.length || s.types.includes(c.type ?? ''))
      && (!s.localities.length || (c.location?.localities ?? []).some((l) => s.localities.includes(l)))
      && s.with.every((k) => x.criteria.includes(k))
      && !s.without.some((k) => x.criteria.includes(k))
      && (!s.rule || matchesRule(x, rules[s.rule]));
  });
  const ids = new Set([...base.map((x) => x.id), ...s.include].filter((id) => !s.exclude.includes(id)));
  return items.filter((x) => ids.has(x.id));
}

/** Intent article ("Canyoning avec enfants"): editorial copy + a computed selection. */
export const article = z.object({
  id: slug,
  status: z.enum(['draft', 'published']),
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
  listing_selection: selection.nullable(),
  offer_selection: selection.nullable(),
  angle_label: z.string().nullable(),
  angle_notes: z.array(z.object({ kind: z.enum(['offer', 'listing']), id: slug, text: z.string().min(1) })),
  faq: z.array(faqItem),
  why_intro: z.string().min(1),
  safety_note: z.string().min(1),
  published_on: isoDate,
  updated_on: isoDate,
  seo: seoOverrides,
});

/** A yes/no criterion ("Avec cascade", "Kayak", "Rappel"): a row editors add without code (decision D1). */
export const criterion = z.object({
  key: slug,
  label: z.string().min(1),
  applies_to: z.enum(['listing', 'offer']),
  group: z.string().nullable(),       // filter group ("Activités", "Public")
  icon: z.string().nullable(),
  order: z.number().int().nonnegative(),
  filter: z.boolean(),                // offered as a filter
  badge: z.boolean(),                 // shown as a tag on cards and pages
  key_fact: z.boolean(),              // shown as "Label : Oui / Non" in the key facts
  landing: z.boolean(),               // gets a landing page at the site's minimum count
  intro: z.string().nullable(),       // landing-page introduction
  seo: seoOverrides,
});
export type Criterion = z.infer<typeof criterion>;

/** A listing type, with its landing-page text (decision D2). */
export const listingType = z.object({
  key: slug,
  label: z.string().min(1),
  plural: z.string().min(1),
  icon: z.string().nullable(),
  order: z.number().int().nonnegative(),
  aliases: z.array(z.string()),       // other names people use ("Chutes d'eau")
  intro: z.string().nullable(),
  seo: seoOverrides,
});

/** A locality (commune), with its landing-page text (decision D2). */
export const locality = z.object({
  key: slug,
  name: z.string().min(1),
  area: z.string().min(1),
  intro: z.string().nullable(),
  seo: seoOverrides,
});

/** A dimension that can produce landing pages (type, locality, zone, an activity…). */
export interface LandingDimension {
  key: string;
  label: string;
  /** Values of a listing for this dimension (a listing can have several). */
  values: (listing: z.infer<typeof listingShape>) => string[];
}

/** Landing dimension for the criteria marked `landing`. */
export function criteriaDimension(criteria: Criterion[]): LandingDimension {
  const keys = new Set(criteria.filter((c) => c.applies_to === 'listing' && c.landing).map((c) => c.key));
  return { key: 'criterion', label: 'Par critère', values: (l) => l.criteria.filter((c) => keys.has(c)) };
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
