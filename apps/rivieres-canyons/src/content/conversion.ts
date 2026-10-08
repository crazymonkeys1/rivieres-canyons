// Conversion settings (CLAUDE.md §9): where every /go/ link leads, and the lead magnet's fixed values.
// Published at /go/targets.json for the edge functions (functions/), which hold no site data themselves.
import { createHash } from 'node:crypto';
import type { GoTargets } from '@orbit/core/edge';
import { content, t, url, operators } from './site';
import { SITE } from './site.config';

/** Changes only when the consent wording changes (PRIVACY_CONTEXT §4): a short hash of the text itself. */
export const consentVersion = (text: string) => createHash('sha256').update(text).digest('hex').slice(0, 12);

export const LEAD = {
  site: SITE.utm_source,
  magnet: 'top5',
  sources: ['listing'],
  consentText: () => t('lead.consent'),
};

export function goTargets(): GoTargets {
  const publishedOffers = content.offers.filter((o) => o.status === 'published');
  const book: GoTargets['book'] = {};
  for (const op of content.operators) book[op.id] = { url: op.booking_url, fallback: op.website_url, campaign: op.id };
  for (const o of publishedOffers) {
    const op = operators.get(o.operator_id)!;
    book[o.id] = { url: op.booking_url, fallback: op.website_url, campaign: o.id };
  }
  const whatsapp: GoTargets['whatsapp'] = {};
  for (const g of content.guides) {
    const op = operators.get(g.operator_id)!;
    const subjects: Record<string, string> = {};
    // On a place page: the guide's outing there when there is one, else the place.
    for (const p of content.destinations.filter((d) => d.status === 'published')) {
      const offer = publishedOffers.find((o) => o.listing_id === p.id && o.operator_id === op.id);
      subjects[url.place(p.id)] = t('contact.subject_named', { name: offer?.name ?? p.name });
    }
    whatsapp[g.id] = {
      number: g.whatsapp, fallback: op.contact_url ?? op.website_url,
      message: t('contact.whatsapp_message', { guide: g.first_name, site: t('site.name'), subject: '{subject}' }),
      subjects, subject_default: t('contact.subject_default'),
    };
  }
  return {
    site: LEAD.site, home: url.home(), book, whatsapp,
    lead: { magnets: [LEAD.magnet], sources: LEAD.sources, consent_versions: [consentVersion(LEAD.consentText())] },
  };
}
