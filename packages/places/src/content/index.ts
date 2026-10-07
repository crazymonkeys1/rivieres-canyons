// Layer 3 · Places: what only a directory of physical places adds to a listing
// (location policy, access status, directions, safety).
import { z } from 'zod';
import { httpUrl, isoDate } from '@orbit/core/content';
import { listingShape, listingRules } from '@orbit/directory/content';

/** How much of the way there we publish. See CLAUDE.md §8. */
export const LOCATION_POLICIES = ['public', 'commune_only', 'guide_only', 'closed'] as const;
export const locationPolicy = z.enum(LOCATION_POLICIES);

export const accessStatus = z.object({
  status: z.enum(['open', 'partial', 'closed']),
  note: z.string().min(1),
  source_name: z.string().nullable(),
  source_url: httpUrl.nullable(),
  checked_on: isoDate.nullable(),
});

export const safetyAlert = z.object({
  short_label: z.string().min(1),
  title: z.string().min(1),
  text: z.string().min(1),
  items: z.array(z.string().min(1)),
});

export const accessTile = z.object({ icon: z.string(), label: z.string().min(1), value: z.string().min(1), tip: z.string().nullable() });

/** Directions: published only for `public` places (location.geo counts too). */
export const DIRECTION_FIELDS = ['itinerary', 'itinerary_text', 'access_tiles', 'parking', 'drive'] as const;

export const placeShape = listingShape.extend({
  location_policy: locationPolicy.nullable(),
  access_status: accessStatus.nullable(),
  /** Access may be restricted (arrêté, private land): never presented as "accès libre". */
  access_restricted: z.boolean(),
  // Directions (public only)
  itinerary: z.string().nullable(),
  itinerary_text: z.string().nullable(),
  access_tiles: z.array(accessTile),
  parking: z.string().nullable(),
  drive: z.string().nullable(),
  guided_access_text: z.string().nullable(),
  // Safety
  risks: z.array(z.string()),
  safety_alert: safetyAlert.nullable(),
  to_bring: z.array(z.string()),
});

export function placeRules(p: z.infer<typeof placeShape>, ctx: z.RefinementCtx) {
  listingRules(p, ctx);
  // CLAUDE.md §8: guide_only and closed places never carry directions or coordinates.
  if (p.location_policy === 'guide_only' || p.location_policy === 'closed') {
    for (const f of DIRECTION_FIELDS) {
      const v = p[f];
      if (Array.isArray(v) ? v.length > 0 : v !== null) ctx.addIssue({ code: 'custom', path: [f], message: `${p.location_policy} place must not carry "${f}"` });
    }
    if (p.location.geo) ctx.addIssue({ code: 'custom', path: ['location', 'geo'], message: `${p.location_policy} place must not carry coordinates` });
    if (p.guided_access_text) ctx.addIssue({ code: 'custom', path: ['guided_access_text'], message: `${p.location_policy} place: the meeting point is given by the guide` });
  }
}

export const place = placeShape.superRefine(placeRules);
export type Place = z.infer<typeof placeShape>;
