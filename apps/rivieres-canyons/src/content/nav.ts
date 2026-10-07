// Site-wide navigation, computed from the content: only pages that exist are linked
// (landing pages need 3+ published places, CLAUDE.md §10).
import { landingPages, criteriaDimension } from '@orbit/directory/content';
import { content, publishedPlaces, t, url, types, localities } from './site';
import { LANDING, AREAS } from './site.config';

const dims = [...LANDING.dimensions, criteriaDimension(content.criteria)];
export const landings = landingPages(publishedPlaces, dims, LANDING.min);
const linksOf = (dim: string) => landings.filter((l) => l.dimension === dim);

export const typeLinks = linksOf('type').map((l) => ({ label: types.get(l.value)?.plural ?? l.value, href: url.type(l.value) }));
export const localityLinks = linksOf('locality').map((l) => ({ label: localities.get(l.value)?.name ?? l.value, href: url.locality(l.value) }));
export const areaLinks = AREAS.filter((a) => publishedPlaces.some((p) => p.location.area === a)).map((a) => ({ label: a, href: url.home() }));
export const articleLinks = content.articles.filter((a) => a.status === 'published').map((a) => ({ label: a.label, href: url.article(a.id) }));
export const guideLinks = content.guides.map((g) => ({ label: `${g.first_name} · ${content.operators.find((o) => o.id === g.operator_id)?.name ?? ''}`, href: url.guide(g.id) }));

export const primaryLinks = [
  { label: t('nav.places'), href: url.home() },
  { label: t('nav.ideas'), href: url.blog() },
  { label: t('nav.guides'), href: guideLinks[0]?.href ?? url.about() },
];
export const menuGroups = [
  { title: t('nav.guides'), links: guideLinks },
  { title: t('footer.by_type'), links: typeLinks },
  { title: t('footer.by_locality'), links: localityLinks },
];
export const footerGroups = [
  { title: t('footer.by_type'), links: typeLinks },
  { title: t('footer.by_area'), links: areaLinks },
  { title: t('footer.by_locality'), links: localityLinks },
  { title: t('footer.ideas'), links: articleLinks },
  { title: t('footer.guides'), links: [...guideLinks, { label: t('footer.about'), href: url.about() }, { label: t('footer.contact'), href: url.contact() }, { label: t('footer.legal'), href: url.legal() }, { label: t('footer.privacy'), href: url.privacy() }] },
];
