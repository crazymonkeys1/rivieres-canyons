// Site schema: the package shapes narrowed to this site's vocabularies.
import { z } from 'zod';
import { image } from '@orbit/core/content';
import { offerShape, offerRules, operator, guide, review, socialPost, article, block } from '@orbit/directory/content';
import { placeShape, placeRules } from '@orbit/places/content';
import { PLACE_TYPES, ISLANDS, COMMUNES, DIFFICULTIES, OFFER_LEVELS, SPIRITS, RISKS, VERIFICATION } from './vocabularies';

const keys = <T extends object>(o: T) => Object.keys(o) as [keyof T & string, ...(keyof T & string)[]];

export const destination = placeShape.extend({
  type: z.enum(keys(PLACE_TYPES)),
  island: z.enum(ISLANDS),
  communes: z.array(z.enum(COMMUNES)),
  difficulty: z.enum(keys(DIFFICULTIES)).nullable(),
  risks: z.array(z.enum(keys(RISKS))),
  verification: z.enum(keys(VERIFICATION)).nullable(),
}).superRefine(placeRules);
export type Destination = z.infer<typeof destination>;

export const siteOffer = offerShape.extend({
  level: z.enum(keys(OFFER_LEVELS)),
  spirit: z.enum(keys(SPIRITS)),
  commune: z.enum(COMMUNES),
}).superRefine(offerRules);
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
  illustration_images: z.array(image),
});
export type Content = z.infer<typeof contentSchema>;
