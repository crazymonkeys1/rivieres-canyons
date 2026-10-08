// Place-page content shared by the page and its search/AI outputs, so both say exactly the same thing.
import { t } from './site';
import type { CopyKey } from './copy';
import type { Destination } from './schema';

type NameHeading = 'place.access_title_public' | 'place.access_title_guide' | 'place.offer_title' | 'place.faq_access_q';
/** A heading built on the place's name: "Comment aller au Canyon doré" when the name with its preposition is filled in,
 *  otherwise a wording that is correct with any name ("Canyon doré : comment y aller"). */
export const nameHeading = (key: NameHeading, p: Destination) =>
  p.name_with_preposition ? t(`${key}_to` as CopyKey, { to: p.name_with_preposition }) : t(key, { name: p.name });

/** The place's FAQ, plus "{lieu} : comment y aller ?" answered from its location policy (never more than the policy allows). */
export function placeFaq(p: Destination) {
  const has = p.faq.some((q) => /comment (y )?(aller|accéder|se rendre)/i.test(q.question));
  const directions = p.itinerary_text ?? p.itinerary;
  const answer = has ? null
    : p.location_policy === 'public' ? directions
    : p.location_policy === 'guide_only' ? t('place.access_guide_text')
    : p.location_policy === 'closed' ? t('place.access_closed_text')
    : p.location_policy === 'commune_only' ? t('place.access_commune_text')
    : null;
  return answer ? [...p.faq, { question: nameHeading('place.faq_access_q', p), answer }] : p.faq;
}
