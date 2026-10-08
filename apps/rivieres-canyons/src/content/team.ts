// The two guides' companies, as the "Qui sommes-nous" block shows them (place pages, about page).
import { content, t, url, guideOf, portraitOf } from './site';

/** One block per operator; `ref` is the page the WhatsApp link is sent from. */
export const teamCompanies = (ref: string) => content.operators.map((o) => {
  const g = guideOf(o.id);
  return {
    name: o.name, color: o.brand_color, guideName: g?.first_name ?? o.name, portrait: g ? portraitOf(g.photo) : null,
    withLine: t('team.with', { guide: g?.first_name ?? '' }), credential: t(`team.credential.${o.id}` as any), text: t(`team.operator.${o.id}` as any),
    write: { label: t('place.offer_write', { guide: g?.first_name ?? '' }), href: g ? url.whatsapp(g.id, ref) : o.contact_url ?? o.website_url },
    profile: { label: t('team.profile'), href: g ? url.guide(g.id) : url.about() },
    website: { label: new URL(o.website_url).hostname.replace(/^www\./, ''), href: o.website_url },
  };
});
