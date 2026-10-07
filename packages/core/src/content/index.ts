// Layer 1 · Core: content primitives shared by every Orbit lead magnet.
import { z } from 'zod';

/** Permanent URL key: lowercase ASCII words joined by hyphens. */
export const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase-kebab-case');

export const httpUrl = z.string().url().refine((u) => /^https?:\/\//.test(u), 'must be an http(s) URL');

/** `[SOMETHING]` tokens allowed in development only; a production build fails on any of them. */
export const PLACEHOLDER = /\[[A-Z][A-Z0-9_]*\]/;
export const placeholder = z.string().regex(/^\[[A-Z][A-Z0-9_]*\]$/, 'placeholder must look like [NAME]');

/** A URL, or a `[PLACEHOLDER]` until the real value is known. */
export const urlOrPlaceholder = z.union([httpUrl, placeholder]);

/** Every image carries its credit and, for third-party photos, the page it comes from. */
export const image = z.object({
  src: z.string().min(1),
  credit: z.string().min(1, 'every image needs a credit'),
  source_url: httpUrl.nullable(),
  source_name: z.string().nullable(),
});
export type Image = z.infer<typeof image>;

/** One editable answer: question + answer, rendered as <details> and FAQPage JSON-LD. */
export const faqItem = z.object({ question: z.string().min(1), answer: z.string().min(1) });

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

/** True when a field counts as filled for the completeness score. */
export function isFilled(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === 'string') return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

/** Share of key fields that are filled (0–1), plus the names of the missing ones. */
export function completeness<T extends Record<string, unknown>>(item: T, keys: readonly (keyof T & string)[]) {
  const missing = keys.filter((k) => !isFilled(item[k]));
  return { score: (keys.length - missing.length) / keys.length, missing };
}
