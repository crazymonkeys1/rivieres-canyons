// Layer 2 · Directory: structured data for a bookable offer (Product + Offer). No rating unless it has a source
// and a count (a rating without a source is never published).
import type { JsonLd } from '@orbit/core/seo';

export function productOffer(o: {
  name: string; description: string; url: string; image?: string; brand: string;
  price: number; currency: string; bookUrl: string;
  rating?: { value: number; count: number } | null;
}): JsonLd {
  const ld: JsonLd = {
    '@type': 'Product', name: o.name, description: o.description, url: o.url,
    brand: { '@type': 'Brand', name: o.brand },
    offers: { '@type': 'Offer', price: o.price, priceCurrency: o.currency, url: o.bookUrl, seller: { '@type': 'Organization', name: o.brand } },
  };
  if (o.image) ld.image = o.image;
  if (o.rating) ld.aggregateRating = { '@type': 'AggregateRating', ratingValue: o.rating.value, reviewCount: o.rating.count };
  return ld;
}
