// Completeness gate (CLAUDE.md §8): filled key fields / total key fields. Below the threshold a place page is
// `noindex` and left out of the sitemap, llms.txt and the Markdown twins. Shared by the build and `content:check`.
import { completeness } from '@orbit/core/content';
import { COMPLETENESS } from './site.config';
import type { Content } from './schema';

export function placeScore(d: Content['destinations'][number], images: Content['images']) {
  const hero = images.find((i) => i.owner_kind === 'listing' && i.owner_id === d.id && i.role === 'hero') ?? null;
  const s = completeness({ ...d, hero }, COMPLETENESS.keys);
  return { ...s, indexable: d.status === 'published' && s.score >= COMPLETENESS.threshold };
}
