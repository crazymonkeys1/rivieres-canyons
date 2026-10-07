// Site schema: the package shapes narrowed to this site's settings (site.config.ts).
import { z } from 'zod';
import { image, source, copyEntry, rejectedListing, factsSchema } from '@orbit/core/content';
import { location, offerShape, offerRules, operator, guide, review, socialPost, article, block } from '@orbit/directory/content';
import { placeShape, placeRules } from '@orbit/places/content';
import { LISTING_TYPES, AREAS, CONFIDENCE, RISKS, PLACE_FACTS, OFFER_FACTS } from './site.config';

const keys = <T extends object>(o: T) => Object.keys(o) as [keyof T & string, ...(keyof T & string)[]];
const factNotes = (defs: { key: string }[]) =>
  z.record(z.string()).refine((n) => Object.keys(n).every((k) => defs.some((d) => d.key === k)), 'note for an undeclared fact');

export const destination = placeShape.extend({
  type: z.enum(keys(LISTING_TYPES)),
  location: location.extend({ area: z.enum(AREAS) }),
  confidence: z.enum(keys(CONFIDENCE)).nullable(),
  risks: z.array(z.enum(keys(RISKS))),
  facts: factsSchema(PLACE_FACTS),
  fact_notes: factNotes(PLACE_FACTS),
}).superRefine(placeRules);
export type Destination = z.infer<typeof destination>;

export const siteOffer = offerShape.extend({ facts: factsSchema(OFFER_FACTS) }).superRefine(offerRules);
export type SiteOffer = z.infer<typeof siteOffer>;

export const contentSchema = z.object({
  destinations: z.array(destination),
  operators: z.array(operator),
  guides: z.array(guide),
  offers: z.array(siteOffer),
  reviews: z.array(review),
  social_posts: z.array(socialPost),
  articles: z.array(article),
  blocks: z.array(block),
  images: z.array(image),
  sources: z.array(source),
  copy: z.array(copyEntry),
  rejected: z.array(rejectedListing),
});
export type Content = z.infer<typeof contentSchema>;
