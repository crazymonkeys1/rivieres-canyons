// Place-page content shared by the page and its search/AI outputs, so both say exactly the same thing.
import { t } from './site';
import type { Destination } from './schema';

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
  return answer ? [...p.faq, { question: t('place.faq_access_q', { name: p.name }), answer }] : p.faq;
}
