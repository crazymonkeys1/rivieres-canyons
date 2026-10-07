// Layer 1 · Core: content primitives shared by every Orbit lead magnet.
import { z } from 'zod';

/** Permanent URL key: lowercase ASCII words joined by hyphens. */
export const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase-kebab-case');
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD');
export const httpUrl = z.string().url().refine((u) => /^https?:\/\//.test(u), 'must be an http(s) URL');

/** `[SOMETHING]` tokens allowed in development only; a production build fails on any of them. */
export const PLACEHOLDER = /\[[A-Z][A-Z0-9_]*\]/;
export const placeholder = z.string().regex(/^\[[A-Z][A-Z0-9_]*\]$/, 'placeholder must look like [NAME]');
/** A URL, or a `[PLACEHOLDER]` until the real value is known. */
export const urlOrPlaceholder = z.union([httpUrl, placeholder]);

/** A range in minutes ("2 à 3 h" → 120–180) with the words that did not fit a number. */
export const minutesRange = z.object({
  min: z.number().int().nonnegative(),
  max: z.number().int().nonnegative(),
  note: z.string().nullable(),
}).refine((r) => r.max >= r.min, 'max must be ≥ min');

export const faqItem = z.object({ question: z.string().min(1), answer: z.string().min(1) });

// ---------- Images: one record per photo, with its rights ----------
export const IMAGE_RIGHTS = ['free', 'partner', 'permission_needed'] as const;
/** What the image belongs to, and its job on that page. */
export const image = z.object({
  id: slug,
  owner_kind: z.enum(['listing', 'offer', 'article', 'site']),
  owner_id: z.string().min(1),
  role: z.enum(['hero', 'gallery', 'site', 'guided', 'illustration']),
  order: z.number().int().nonnegative(),
  src: z.string().min(1),
  caption: z.string().nullable(),
  credit: z.string().min(1, 'every image needs a credit'),
  licence: z.string().nullable(),
  rights: z.enum(IMAGE_RIGHTS),        // permission_needed fails a production build
  source_name: z.string().nullable(),
  source_url: httpUrl.nullable(),
});
export type Image = z.infer<typeof image>;

// ---------- Sources: typed, several per record ----------
export const SOURCE_TYPES = ['official', 'tourism_office', 'operator', 'media', 'reference'] as const;
export const source = z.object({
  id: slug,
  owner_kind: z.enum(['listing', 'article', 'site']),
  owner_id: z.string().min(1),
  label: z.string().min(1),
  url: httpUrl,
  type: z.enum(SOURCE_TYPES),
  used_for: z.string().nullable(),  // "accès", "statut", "description"…
});

/** Interface text editable without code, found by a permanent key. */
export const copyEntry = z.object({ key: z.string().regex(/^[a-z0-9_.]+$/), page: z.string(), section: z.string(), value: z.string() });

/** Research memory: candidates deliberately left out, so nobody re-adds them. */
export const rejectedListing = z.object({ name: z.string().min(1), reason: z.string().min(1) });

/** Optional overrides; templates compute the default when empty. */
export const seoOverrides = z.object({ title: z.string().nullable(), description: z.string().nullable() });

// ---------- Facts: each site declares its own; the schema is generated from the declaration ----------
export type FactType = 'number' | 'minutes_range' | 'choice' | 'choices' | 'boolean' | 'text';
export interface FactDefinition {
  key: string;
  label: string;
  type: FactType;
  /** Allowed values for choice / choices (stable keys). */
  options?: readonly string[];
  unit?: string;
  icon?: string;
  /** Usable as a listing filter. */
  filter?: boolean;
  /** Shown in the key facts under the hero. */
  key_fact?: boolean;
  /** Counts in the completeness score. */
  completeness?: boolean;
  /** schema.org property for JSON-LD (additionalProperty when omitted). */
  schema_org?: string;
}

function factValue(def: FactDefinition): z.ZodTypeAny {
  switch (def.type) {
    case 'number': return z.number();
    case 'minutes_range': return minutesRange;
    case 'boolean': return z.boolean();
    case 'text': return z.string().min(1);
    case 'choice': return z.enum(def.options as [string, ...string[]]);
    case 'choices': return z.array(z.enum(def.options as [string, ...string[]])).min(1);
  }
}

/** Zod object for a record's `facts`: every declared fact is optional (null = unknown), nothing else is allowed. */
export function factsSchema(defs: readonly FactDefinition[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const d of defs) shape[d.key] = factValue(d).nullable();
  return z.object(shape).strict();
}

// ---------- Checks ----------
/** Lists every `[PLACEHOLDER]` left in a value, with its path. */
export function findPlaceholders(value: unknown, path = ''): { path: string; token: string }[] {
  if (typeof value === 'string') {
    const m = value.match(new RegExp(PLACEHOLDER, 'g'));
    return m ? m.map((token) => ({ path, token })) : [];
  }
  if (Array.isArray(value)) return value.flatMap((v, i) => findPlaceholders(v, `${path}[${i}]`));
  if (value && typeof value === 'object')
    return Object.entries(value).flatMap(([k, v]) => findPlaceholders(v, path ? `${path}.${k}` : k));
  return [];
}

/** Reads `a.b.c` from an object. */
export function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<any>((o, k) => (o == null ? undefined : o[k]), obj);
}

/** True when a field counts as filled for the completeness score. */
export function isFilled(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === 'string') return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

/** Share of key fields (dotted paths allowed) that are filled, plus the missing ones. */
export function completeness(item: unknown, keys: readonly string[]) {
  const missing = keys.filter((k) => !isFilled(getPath(item, k)));
  return { score: (keys.length - missing.length) / keys.length, missing };
}
