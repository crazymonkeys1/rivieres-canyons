// Layer 3 · Places: structured data for a physical place. publicAccess follows the location policy
// (docs/DESIGN_SYSTEM.md §4): false when closed, true when public, left out otherwise.
import type { JsonLd } from '@orbit/core/seo';

export function touristAttraction(p: {
  name: string; url: string; description?: string | null; image?: string; lang: string;
  locality?: string | null; region?: string | null; country: string;
  geo?: { lat: number; lng: number } | null; policy: string | null; alternateName?: string[]; dateModified?: string | null;
}): JsonLd {
  const ld: JsonLd = {
    '@type': 'TouristAttraction', name: p.name, url: p.url, inLanguage: p.lang,
    address: Object.fromEntries(Object.entries({ '@type': 'PostalAddress', addressLocality: p.locality, addressRegion: p.region, addressCountry: p.country }).filter(([, v]) => v)),
  };
  if (p.description) ld.description = p.description;
  if (p.image) ld.image = p.image;
  if (p.alternateName?.length) ld.alternateName = p.alternateName;
  if (p.dateModified) ld.dateModified = p.dateModified;
  // Coordinates only where the place's policy allows directions (guide_only and closed never carry them; the schema enforces it).
  if (p.geo && p.policy === 'public') ld.geo = { '@type': 'GeoCoordinates', latitude: p.geo.lat, longitude: p.geo.lng };
  if (p.policy === 'public') ld.publicAccess = true;
  if (p.policy === 'closed') ld.publicAccess = false;
  return ld;
}
