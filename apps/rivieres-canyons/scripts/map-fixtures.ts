// Maps the Claude Design export (data/*.json) to the site schema, validates it,
// writes normalized fixtures to content/fixtures/ and docs/DESIGN_MIGRATION.md.
// One-off migration from the prototype: once Airtable is the source (phase 2), the Airtable adapter
// produces the same fixtures and this script is retired.
// RETIRED as a source since 2026-10-07: Airtable is the source (content:pull). Running it again (pnpm content:migrate)
// overwrites content/fixtures/ with the design export; only do that on purpose.
// The content checks and docs/CONTENT_REPORT.md come from scripts/check-content.ts, which runs right after.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Image } from '@orbit/core/content';
import { select, type Selection, type Criterion } from '@orbit/directory/content';
import { DIRECTION_FIELDS } from '@orbit/places/content';
import { type Destination, type SiteOffer, type Content } from '../src/content/schema';
import { RISKS, PLACE_FACTS, ARTICLE_RULES } from '../src/content/site.config';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const outDir = resolve(here, '../content/fixtures');
const read = (f: string) => JSON.parse(readFileSync(resolve(root, 'data', f), 'utf8'));

const D = read('destinations.json');
const O = read('operators-and-tours.json');
const B = read('blog-articles.json');

const notes: string[] = [];   // mapping decisions worth reviewing
const dropped: string[] = []; // data removed by a rule
const errors: string[] = [];

// ---------- helpers ----------
const kebab = (id: string) => id.replace(/_/g, '-');
const slugOf = (id: string) => (id === 'saut_d_acomat_site' ? 'saut-d-acomat' : kebab(id));
const blank = (v: unknown) => (v === undefined || v === '' ? null : (v as any));
/** "Formule Family" → "formule-family", "Pointe-Noire" → "pointe-noire". */
const slugify = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/['’]/g, '-').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const SEO_EMPTY = { title: null, description: null };

// ---------- types (decision D2: a table with landing-page text; text to write in Airtable) ----------
const types: Content['types'] = [
  { key: 'canyon', label: 'Canyon', plural: 'Canyons', icon: '⛰️', order: 1, aliases: [], intro: null, seo: SEO_EMPTY },
  { key: 'riviere', label: 'Rivière', plural: 'Rivières', icon: '🌊', order: 2, aliases: [], intro: null, seo: SEO_EMPTY },
  { key: 'cascade', label: 'Cascade', plural: 'Cascades', icon: '💦', order: 3, aliases: ["Chutes d'eau"], intro: null, seo: SEO_EMPTY },
  { key: 'bassin-naturel', label: 'Bassin naturel', plural: 'Bassins naturels', icon: '🛁', order: 4, aliases: [], intro: null, seo: SEO_EMPTY },
];
const TYPE_OF: Record<string, string> = { 'rivière': 'riviere', bassin_naturel: 'bassin-naturel' };

// ---------- criteria (decision D1): yes/no attributes, editable as rows in Airtable ----------
const criteria: Criterion[] = [];
function addCriterion(applies_to: Criterion['applies_to'], label: string, icon: string | null, opts: Partial<Criterion> = {}) {
  const key = slugify(label);
  if (!criteria.some((c) => c.key === key))
    criteria.push({ key, label, applies_to, group: null, icon, order: criteria.filter((c) => c.applies_to === applies_to).length + 1,
      filter: false, badge: false, key_fact: false, landing: false, intro: null, seo: SEO_EMPTY, ...opts });
  return key;
}
addCriterion('listing', 'Avec cascade', '💦', { filter: true });
addCriterion('offer', 'Rappel', '🪢', { filter: true, key_fact: true });
addCriterion('offer', 'Animaux acceptés', '🐕', { filter: true });
/** Former offer tags: now criteria shown as badges (icons were OFFER_TAG_ICONS). */
const TAG_ICONS: Record<string, string> = {
  Famille: '👨‍👩‍👧', 'Formule Family': '👨‍👩‍👧', 'Toboggans naturels': '🎢', 'Bain de forêt': '🌳', 'Petit groupe': '👥',
  'Forêt primaire': '🌲', 'Hors sentiers': '🥾', Journée: '☀️', 'Journée complète': '☀️', 'Journée entière': '☀️',
  'Demi-journée': '🕐', 'Initiation technique': '🎓', 'Rappel encadré': '🪢', 'Rappels enchaînés': '🪢', 'Rappels hauts': '🪢',
  'Pique-nique': '🧺', 'Sauts engagés': '💦', 'Expérience requise': '⚠️',
};

// ---------- localities (decision D2): communes become records, listings link to them by key ----------
const localities: Content['localities'] = [];
function localityKey(name: string, area: string) {
  const key = slugify(name);
  if (!localities.some((l) => l.key === key)) localities.push({ key, name, area: area as any, intro: null, seo: SEO_EMPTY });
  return key;
}

/** "2 à 3 h", "45 min à 1 h", "1 h 30 sur place", "20 à 25 min aller" → minutes + leftover words. */
function parseMinutes(text: string | null | undefined, where: string) {
  if (!text) return null;
  const re = /^\s*(\d+)(?:\s*(h|min)(?:\s*(\d+))?)?(?:\s*à\s*(\d+)(?:\s*(h|min)(?:\s*(\d+))?)?)?/;
  const m = text.match(re);
  if (!m || (!m[2] && !m[5])) { errors.push(`${where}: cannot read a duration in "${text}"`); return null; }
  const unitA = m[2] ?? m[5], unitB = m[5] ?? m[2];
  const toMin = (n: string, unit: string, extra?: string) => (unit === 'h' ? +n * 60 + (extra ? +extra : 0) : +n);
  const min = toMin(m[1], unitA!, m[3]);
  const max = m[4] ? toMin(m[4], unitB!, m[6]) : min;
  let note = text.slice(m[0].length).replace(/^[\s,]+|\s+$/g, '');
  if (/^\(.*\)$/.test(note) && !/\).*\(/.test(note.slice(1, -1))) note = note.slice(1, -1); // "(journée)" → "journée"
  return { min, max, note: note || null };
}

const DIFFICULTY: Record<string, string> = {
  'Très facile': 'tres_facile', Facile: 'facile', 'Facile (avec guide)': 'facile', Moyen: 'moyen',
  Sportif: 'sportif', Difficile: 'difficile', Engagé: 'engage',
};
const RISK: Record<string, string> = {
  'traversées de rivière': 'traversees_riviere', 'traversées de rivières': 'traversees_riviere',
  'baignade non surveillée': 'baignade_non_surveillee', 'parking non surveillé': 'parking_non_surveille',
  'travaux éventuels': 'travaux_eventuels', 'conditions météorologiques': 'conditions_meteo', 'parois raides': 'parois_raides',
};
const CONFIDENCE_OF: Record<string, string> = { 'élevé': 'eleve', 'élevé_pour_le_nom': 'eleve_nom', moyen: 'moyen', faible: 'faible' };
const ACCESS: Record<string, 'open' | 'partial' | 'closed'> = { ouvert: 'open', partiel: 'partial', ferme: 'closed' };
const GUIDE_OF: Record<string, string> = { yalode: 'pascal', wildcanyon: 'quentin' };
const EST_FIELD: Record<string, string> = {
  desc: 'summary', access: 'itinerary', minAge: 'facts.min_age', difficulty: 'facts.difficulty', duration: 'facts.duration',
  approach: 'facts.approach', season: 'facts.season', swimming: 'facts.swimming',
};

function swimming(text: string | null | undefined): 'yes' | 'conditional' | 'no' | null {
  if (!text) return null;
  if (/^non\b/i.test(text)) return 'no';
  if (/sous conditions/i.test(text)) return 'conditional';
  return 'yes';
}

// ---------- images: one record each, with rights ----------
const images: Image[] = [];
const OPERATOR_SITES: Record<string, string> = { 'kayak-guadeloupe.fr': O.OPERATORS.yalode.website, 'wild-canyon.fr': O.OPERATORS.wildcanyon.website };
/** Rights are read from where the photo comes from: Wikimedia = free licence, partner sites = partner, anything else needs permission. */
function addImage(owner_kind: Image['owner_kind'], owner_id: string, role: Image['role'], src: string, credit: string,
  extra: { caption?: string | null; source_url?: string | null; source_name?: string | null } = {}) {
  const host = new URL(src).hostname.replace(/^www\./, '');
  const wiki = /wikimedia\.org$/.test(host);
  const partner = Object.keys(OPERATOR_SITES).find((h) => host.endsWith(h));
  const order = images.filter((i) => i.owner_id === owner_id && i.role === role).length;
  images.push({
    id: `${owner_id}-${role}-${order + 1}`, owner_kind, owner_id, role, order, src,
    caption: extra.caption ?? null, credit,
    licence: credit.match(/CC BY(?:-SA)? \d\.\d/)?.[0] ?? null,
    rights: wiki ? 'free' : partner ? 'partner' : 'permission_needed',
    source_name: extra.source_name ?? (wiki ? 'commons.wikimedia.org' : partner ?? host),
    source_url: extra.source_url ?? (wiki ? src.replace('Special:FilePath/', 'File:') : partner ? OPERATOR_SITES[partner] : null),
  });
}

// ---------- sources: typed, several per record ----------
const sources: Content['sources'] = [];
const sourceType = (label: string, url: string): Content['sources'][number]['type'] =>
  /Parc national|Préfecture|DEAL|legifrance|guadeloupe-parcnational|randoguadeloupe|Rando Guadeloupe/i.test(`${label} ${url}`) ? 'official'
    : /lesilesdeguadeloupe|Les îles de Guadeloupe|Comité du tourisme/i.test(`${label} ${url}`) ? 'tourism_office'
      : /Yalodé|Wild Canyon|kayak-guadeloupe|wild-canyon/i.test(`${label} ${url}`) ? 'operator' : 'media';
type Press = { title: string; publisher: string | null; note: string | null };
function addSource(owner_kind: 'listing' | 'site', owner_id: string, label: string, url: string, used_for: string | null, press?: Press) {
  const existing = sources.find((s) => s.owner_id === owner_id && s.url === url);
  if (existing) { if (press) Object.assign(existing, { featured: true, ...press }); return; }
  const n = sources.filter((s) => s.owner_id === owner_id).length + 1;
  sources.push({ id: `${owner_id}-source-${n}`, owner_kind, owner_id, label, url, type: sourceType(label, url), used_for,
    featured: !!press, title: press?.title ?? null, publisher: press?.publisher ?? null, note: press?.note ?? null });
}

// ---------- destinations ----------
const restricted = new Set((D.ACCESS_RESTRICTED as string[]).map(slugOf));
function mapDestination(x: any): Destination {
  const id = slugOf(x.id);
  const risks = (x.risks ?? []).map((r: string) => RISK[r] ?? r);
  for (const r of risks) if (!(r in RISKS)) errors.push(`${x.id}: unknown risk "${r}"`);
  if (x.img) addImage('listing', id, 'hero', x.img, x.credit);
  for (const g of x.gallery ?? []) addImage('listing', id, 'gallery', g.src, g.credit, { source_url: g.url, source_name: g.sourceName });
  for (const src of x.sitePhotos ?? []) addImage('listing', id, 'site', src, x.sitePhotosCredit, { caption: x.photoCaptions?.site });
  addSource('listing', id, x.sourcePublisher, x.sourceUrl, 'description');
  if (x.access_status?.sourceUrl) addSource('listing', id, x.access_status.sourceName ?? x.access_status.sourceUrl, x.access_status.sourceUrl, "statut d'accès");
  // Press ("Ils en parlent") is now a featured source.
  for (const p of x.press ?? []) addSource('listing', id, p.site, p.url, 'presse', { title: p.title, publisher: blank(p.by), note: blank(p.note) });
  return {
    id, name: x.name, type: TYPE_OF[x.type] ?? x.type, alt_names: x.alt_names ?? [],
    status: 'published', status_note: null, confidence: x.verif ? (CONFIDENCE_OF[x.verif] as any) : null, last_reviewed_on: null,
    location: { area: x.island, zone: null, localities: x.communes === 'inconnu' ? [] : x.communes.split(' / ').map((c: string) => localityKey(c, x.island)), geo: null },
    summary: x.desc,
    signature: blank(x.signature), signature_status: x.signature ? (x.signature_status === 'validated' ? 'validated' : 'draft') : null,
    lead: blank(x.lead), intro: blank(x.intro), more_title: blank(x.moreTitle), more_text: blank(x.expect),
    tip: x.insider ? { guide_id: x.insider.op ? GUIDE_OF[x.insider.op] : null, text: x.insider.text } : null,
    faq: (x.faq ?? []).map(([question, answer]: string[]) => ({ question, answer })),
    key_facts: (x.keyInfo ?? []).map(([label, value]: string[]) => ({ label, value })),
    criteria: x.has_waterfall ? ['avec-cascade'] : [],
    facts: {
      difficulty: x.difficulty ? DIFFICULTY[x.difficulty] : null,
      duration: parseMinutes(x.duration, `${x.id}.duration`),
      approach: parseMinutes(x.approach, `${x.id}.approach`),
      min_age: x.minAge ?? null,
      swimming: swimming(x.swimming),
      season: blank(x.season),
    },
    fact_notes: x.swimming ? { swimming: x.swimming } : {},
    estimated_fields: (x.est ?? []).map((f: string) => EST_FIELD[f] ?? f),
    headings: { overview: blank(x.h2), access: blank(x.accessH2), offer: blank(x.guideH2), faq: blank(x.faqH2) },
    offer_why: blank(x.guideWhy),
    seo: { title: null, description: null },
    location_policy: blank(x.location_policy),
    access_status: x.access_status
      ? { status: ACCESS[x.access_status.status], note: x.access_status.note, source_name: blank(x.access_status.sourceName),
          source_url: blank(x.access_status.sourceUrl), checked_on: blank(x.access_status.checked) }
      : null,
    access_restricted: restricted.has(id),
    itinerary: blank(x.access), itinerary_text: blank(x.accessText),
    access_tiles: (x.accessShort ?? []).map(([icon, label, value, tip]: string[]) => ({ icon, label, value, tip: tip ?? null })),
    parking: blank(x.parking), drive: blank(x.drive), guided_access_text: blank(x.accessGuided),
    risks: risks as any,
    safety_alert: x.alert ? { short_label: x.alert.short ?? x.alert.title, title: x.alert.title, text: x.alert.text, items: x.alert.items ?? [] } : null,
    to_bring: x.bring ?? [],
  } as Destination;
}

const destinations: Destination[] = D.destinations.map(mapDestination);

// ---------- Acomat split (decision 2026-10-07): the waterfall site is closed; guided trips run in the canyon ----------
{
  const src = D.destinations.find((x: any) => x.id === 'saut_d_acomat_site');
  const saut = destinations.find((d) => d.id === 'saut-d-acomat')!;
  const CANYON_FAQ = /canyoning|guide|coûte|enfants|prévoir/i;
  const f = saut.facts as any;
  const canyon = {
    ...saut,
    id: 'canyon-d-acomat', name: "Canyon d'Acomat", type: 'canyon', alt_names: [], confidence: null,
    signature: null, signature_status: null, location_policy: 'guide_only', access_status: null, access_restricted: false,
    summary: saut.more_text!, lead: null, intro: null, more_title: null, more_text: null,
    facts: { difficulty: f.difficulty, duration: f.duration, approach: f.approach, min_age: f.min_age, swimming: null, season: f.season },
    criteria: [], fact_notes: {}, safety_alert: null, to_bring: [], key_facts: [],
    tip: saut.tip, faq: saut.faq.filter((q) => CANYON_FAQ.test(q.question)),
    headings: { overview: null, access: null, offer: null, faq: null },
    estimated_fields: ['facts.difficulty', 'facts.duration'],
  } as Destination;
  Object.assign(saut, {
    name: "Saut d'Acomat",
    facts: { ...f, difficulty: null, duration: null, approach: null, min_age: null },
    more_title: null, more_text: null, tip: null, offer_why: null,
    headings: { ...saut.headings, offer: null },
    faq: saut.faq.filter((q) => !CANYON_FAQ.test(q.question)),
    estimated_fields: saut.estimated_fields.filter((e) => !['facts.difficulty', 'facts.duration'].includes(e)),
  });
  // Photos: the old hero (a guided outing) and the 8 guided photos go to the canyon; the saut's hero is its first site photo.
  for (const im of images.filter((i) => i.owner_id === 'saut-d-acomat' && i.role === 'hero')) Object.assign(im, { owner_id: 'canyon-d-acomat', id: 'canyon-d-acomat-hero-1' });
  for (const s of src.guidePhotos as string[]) addImage('listing', 'canyon-d-acomat', 'guided', s, 'Photo : Yalodé', { caption: src.photoCaptions?.guided });
  const firstSite = images.find((i) => i.owner_id === 'saut-d-acomat' && i.role === 'site')!;
  addImage('listing', 'saut-d-acomat', 'hero', firstSite.src, firstSite.credit, { source_url: firstSite.source_url, source_name: firstSite.source_name });
  addSource('listing', 'canyon-d-acomat', 'Yalodé (kayak-guadeloupe.fr)', O.OPERATORS.yalode.website, 'description');
  destinations.splice(destinations.indexOf(saut) + 1, 0, canyon);
  notes.push(
    "**Acomat split.** `saut-d-acomat` (closed waterfall site) keeps the site facts: description, history, height, pool, closure, season, risks, site photos and 6 FAQ answers about the site. Its hero photo is now the first site photo; the old hero showed a guided outing.",
    "`canyon-d-acomat` (`guide_only`) receives the guided experience: the guided text as summary, difficulty, duration, approach, minimum age, Pascal's tip, \"why with a guide\", the 8 guided-outing photos, and 6 FAQ answers about canyoning, price, children and gear. Both Acomat outings link to it. Its season and risks are copied from the saut (same river). Everything else on this place is empty, to fill in Airtable.",
    "The draft signature of `saut-d-acomat` ends with \"que l'on découvre de l'intérieur avec un guide\": no longer true for the closed site. Rewrite it when validating.",
  );
}

// ---------- Location policy rule (decision Q2 A): no directions for guide_only / closed ----------
for (const d of destinations) {
  if (d.location_policy !== 'guide_only' && d.location_policy !== 'closed') continue;
  const removed: string[] = [];
  for (const f of DIRECTION_FIELDS) {
    const v = (d as any)[f];
    if (Array.isArray(v) ? v.length : v !== null) { removed.push(f); (d as any)[f] = Array.isArray(v) ? [] : null; }
  }
  if (d.headings.access) { removed.push('headings.access'); d.headings.access = null; }
  if (d.guided_access_text) { removed.push('guided_access_text'); d.guided_access_text = null; }
  d.estimated_fields = d.estimated_fields.filter((f) => !removed.includes(f));
  if (removed.length) dropped.push(`\`${d.id}\` (${d.location_policy}): ${removed.map((f) => `\`${f}\``).join(', ')}`);
}

// ---------- operators, guides, reviews ----------
const operators = Object.entries(O.OPERATORS).map(([id, o]: [string, any]) => ({
  id, name: o.name, brand_color: o.color, logo_url: o.logoUrl ?? null, website_url: o.website,
  contact_url: o.contactUrl ?? null, booking_url: o.bookUrl,
  rating: o.rating ? Number(String(o.rating).replace(',', '.')) : null, rating_count: null, rating_source: null,
}));
const guides = Object.entries(O.OPERATORS).map(([opId, o]: [string, any]) => {
  const prof = o.about ?? o.profile;
  return {
    id: o.slug, operator_id: opId, first_name: o.guideFirstName, full_name: o.guideFullName ?? null,
    photo: o.guidePhoto, role: o.guideRole, bio: prof.bio,
    facts: prof.facts.map(([icon, label, value]: string[]) => ({ icon, label, value })),
    whatsapp: o.whatsapp,
  };
});
const reviews = Object.entries(O.TEST_ARR).flatMap(([opId, list]: [string, any]) =>
  list.map((r: any, i: number) => ({ id: `${opId}-${i + 1}`, operator_id: opId, offer_id: null, quote: r.quote, author: r.author,
    guide_id: GUIDE_OF[opId] ?? null, rating: null, date: null,
    source: r.source, status: /brouillon/i.test(r.source ?? '') ? 'draft' : 'published' })));

// ---------- offers ----------
const LISTING_OF = (tourId: string) => (tourId === 'acomat' || tourId === 'wc-acomat' ? 'canyon-d-acomat' : slugOf(O.TOUR_META[tourId].siteId));
const offers: SiteOffer[] = O.DATA.map((t: any) => {
  const meta = O.TOUR_META[t.id];
  if (t.img) addImage('offer', t.id, 'hero', t.img, `Photo : ${O.OPERATORS[t.op].name}`);
  const crit = [...(t.rappel ? ['rappel'] : []), ...(t.pets ? ['animaux-acceptes'] : []),
    ...(t.tags as string[]).map((tag) => addCriterion('offer', tag, TAG_ICONS[tag] ?? null, { badge: true }))];
  const story = meta.story && meta.story !== t.tip ? meta.story : null;
  return {
    id: t.id, status: 'published', operator_id: t.op, listing_id: LISTING_OF(t.id), is_main: !!meta.main,
    name: t.name, subtitle: t.subtitle,
    duration_min: Math.round(t.hours * 60),
    price_eur: t.price, price_child_eur: t.priceChild ?? null, child_price_under_age: t.priceChild ? 12 : null, price_checked_on: null,
    criteria: crit,
    facts: { level: DIFFICULTY[t.level], spirit: t.esprit, min_age: t.minAge, approach_min: t.approachMin ?? null },
    highlights: t.imagine, included: t.included, to_bring: t.bring,
    meeting_note: t.meeting ?? null, guide_tip: t.tip ?? null,
    // Old base: "Histoire validée" unticked on all 7: stories were drafted from the guides' tips.
    guide_story: story, guide_story_status: story ? 'draft' : null,
    on_site_since: meta.yearsHere ? Number(String(meta.yearsHere).match(/\d{4}/)?.[0]) : null,
  } as SiteOffer;
});
for (const o of offers) {
  const d = destinations.find((x) => x.id === o.listing_id);
  if (d && (d.location_policy === 'guide_only' || d.location_policy === 'closed') && o.meeting_note) {
    dropped.push(`offer \`${o.id}\`: \`meeting_note\` ("${o.meeting_note}")`);
    o.meeting_note = null;
  }
}
notes.push('Offer durations come from the design\'s `hours` (3.5 h → 210 min). The child price rule "-12 ans" from the template is stored as `child_price_under_age: 12`. An outing\'s commune is no longer stored: it comes from its place.');

// ---------- social posts (mock posts excluded: CLAUDE.md §8 never invent) ----------
const social_posts = Object.entries(D.SOCIAL).flatMap(([siteId, posts]: [string, any]) => {
  const mock = posts.every((p: any) => /exemple/i.test(`${p.author} ${p.caption ?? ''}`));
  if (mock) { dropped.push(`social posts of \`${slugOf(siteId)}\`: ${posts.length} mock entries ("@exemple_compte")`); return []; }
  return posts.map((p: any, i: number) => {
    const [m, s] = String(p.duration || '').split(':');
    return { id: `${slugOf(siteId)}-${i + 1}`, listing_id: slugOf(siteId), platform: p.platform, url: p.url,
      youtube_id: p.ytId ?? null, thumbnail_url: p.thumb || null, account: p.author || null, title: p.title || p.caption,
      duration_sec: p.duration ? +m * 60 + +s : null };
  });
});

// ---------- articles ----------
// Selections (decision D3): criteria / types / communes picked in Airtable; comparisons are named rules (ARTICLE_RULES).
const sel = (s: Partial<Selection>): Selection => ({ types: [], localities: [], with: [], without: [], rule: null, include: [], exclude: [], ...s });
const SELECTIONS: Record<string, { offer: Selection; listing: Partial<Selection> | null }> = {
  'canyoning-enfants': { offer: sel({ rule: 'des_10_ans' }), listing: null },
  'cascades-faciles-acces': { offer: sel({ rule: 'facile_approche_courte' }), listing: null },
  'baignade-riviere': { offer: sel({ rule: 'niveau_facile' }), listing: { rule: 'baignade_renseignee' } },
  'canyoning-debutant': { offer: sel({ rule: 'debutant' }), listing: null },
  'randonnee-aquatique': { offer: sel({ without: ['rappel'] }), listing: null },
  'canyoning-sensations': { offer: sel({ rule: 'sensations' }), listing: null },
  'canyoning-demi-journee': { offer: sel({ rule: 'demi_journee' }), listing: null },
};
const RULES = Object.fromEntries(Object.entries(ARTICLE_RULES).map(([k, r]) => [k, r.rule]));
const creditFor = (url: string) =>
  /kayak-guadeloupe\.fr/.test(url) ? 'Photo : Yalodé' : D.destinations.find((x: any) => x.img === url)?.credit ?? 'Photo : Wikimedia Commons';
const idByName = (name: string): { kind: 'offer' | 'listing'; id: string } | null => {
  const o = offers.find((x) => x.name === name);
  if (o) return { kind: 'offer', id: o.id };
  const d = destinations.find((x) => x.name === name || x.name === name.replace(/ \(site naturel\)$/, ''));
  return d ? { kind: 'listing', id: d.id } : null;
};
const articles = B.SEO_PAGES.map((pg: any) => {
  const ex = B.SEO_EXTRA[pg.id] ?? {}, ed = B.SEO_EDITORIAL[pg.id], angle = B.SEO_ANGLE[pg.id];
  if (ex.hero) addImage('article', pg.id, 'hero', ex.hero, creditFor(ex.hero));
  const angleNotes = angle ? Object.entries(angle[1]).flatMap(([name, text]) => {
    const ref = idByName(name);
    if (!ref) { errors.push(`article ${pg.id}: angle note for unknown "${name}"`); return []; }
    return [{ ...ref, text: text as string }];
  }) : [];
  return {
    id: pg.id, status: 'published' as const, label: pg.label, h1: pg.h1, eyebrow: ex.eyebrow ?? 'Guadeloupe', intro: pg.intro, answer: B.SEO_ANSWER[pg.id],
    author_ids: ['pascal', 'quentin'], featured_offer_id: ex.featured ?? null,
    takeaways: (ex.points ?? []).map((p: any) => ({ title: p.t, text: p.d })),
    editorial: ed ? { eyebrow: ed.eyebrow, h2: ed.h2, sections: ed.blocks.map(([title, text]: string[]) => ({ title, text })),
      tips: ed.tips.map(([label, value]: string[]) => ({ label, value })) } : null,
    offer_selection: SELECTIONS[pg.id].offer,
    listing_selection: SELECTIONS[pg.id].listing || pg.sites?.length ? sel({ ...SELECTIONS[pg.id].listing, include: (pg.sites ?? []).map(slugOf) }) : null,
    angle_label: angle ? angle[0] : null, angle_notes: angleNotes, faq: [],
    why_intro: B.SEO_WHY[pg.id], safety_note: pg.safety, published_on: '2026-10-02', updated_on: '2026-10-02',
    seo: { title: null, description: null },
  };
});
for (const [name, url] of B.SEO_SOURCES as string[][]) addSource('site', 'site', name, url, 'articles');

// Check: the selections pick exactly what the design's JavaScript rules picked.
const listingOf = (o: SiteOffer) => destinations.find((d) => d.id === o.listing_id)!;
for (const pg of B.SEO_PAGES) {
  const jsRule = new Function(`return ${pg.tours_rule}`)() as (x: any) => boolean;
  const before = O.DATA.filter(jsRule).map((t: any) => t.id).sort().join(',');
  const a = articles.find((x: any) => x.id === pg.id)!;
  const after = select(offers, a.offer_selection!, RULES, listingOf).map((o) => o.id).sort().join(',');
  if (before !== after) errors.push(`article ${pg.id}: offer selection picks [${after}] but the design picked [${before}]`);
  const jsSites = pg.sites_rule ? (new Function(`return ${pg.sites_rule}`)() as (x: any) => boolean) : () => false;
  const b = [...new Set([...D.destinations.filter((s: any) => !(D.ACCESS_RESTRICTED as string[]).includes(s.id) && jsSites(s)).map((s: any) => slugOf(s.id)),
    ...(pg.sites ?? []).map(slugOf)])].sort().join(',');
  const af = a.listing_selection ? select(destinations, a.listing_selection, RULES).filter((d) => !d.access_restricted || a.listing_selection!.include.includes(d.id)).map((d) => d.id).sort().join(',') : '';
  if (b !== af) errors.push(`article ${pg.id}: listing selection picks [${af}] but the design picked [${b}]`);
}

// Decision 2026-10-07 (Jordan): Yalodé's outing now sits on the canyon page, so it takes the canyon's name.
offers.find((o) => o.id === 'acomat')!.name = "Canyon d'Acomat";
notes.push('Yalodé\'s outing `acomat` is renamed "Canyon d\'Acomat" (decision 2026-10-07; confirm with Yalodé).');

// ---------- site copy (page blocks and lists; interface labels are keyed in phase 4) ----------
const copy: Content['copy'] = [
  { key: 'privacy_policy', page: 'Confidentialité', section: 'Texte', format: 'text', text: '[PRIVACY_POLICY_TEXT]', items: [], status: 'placeholder', updated_on: null },
  { key: 'why_guide_points', page: 'Articles', section: 'Pourquoi un guide', format: 'list', text: null,
    items: B.SEO_WHY_POINTS.map(([icon, label, value]: string[]) => ({ icon, label, value })), status: 'final', updated_on: '2026-10-02' },
];
for (const url of D.STOCK_POOL as string[]) addImage('site', 'site', 'illustration', url, creditFor(url));

// ---------- write fixtures and the migration notes (the content checks run next: scripts/check-content.ts) ----------
criteria.sort((a, b) => (a.applies_to === b.applies_to ? a.order - b.order : a.applies_to === 'listing' ? -1 : 1));
const content: Content = { destinations, types, localities, criteria, operators, guides, offers, reviews, social_posts, articles, images, sources, copy } as Content;
mkdirSync(outDir, { recursive: true });
for (const [k, v] of Object.entries(content)) writeFileSync(resolve(outDir, `${k}.json`), JSON.stringify(v, null, 2) + '\n');

writeFileSync(resolve(root, 'docs/DESIGN_MIGRATION.md'), `# Design migration notes

Generated by \`pnpm content:check\` (\`scripts/map-fixtures.ts\`): how the Claude Design export (\`data/*.json\`) became the content. One-off: once the Airtable base is filled, \`pnpm content:pull\` replaces this step.
${errors.length ? `\n## Errors\n${errors.map((e) => `- ${e}`).join('\n')}\n` : ''}
## Removed by a rule
Directions are never published for \`guide_only\` and \`closed\` places (decision Q2, 2026-10-07); mock content is never published.
${dropped.map((d) => `- ${d}`).join('\n')}

## Mapping decisions
${notes.map((n) => `- ${n}`).join('\n')}
- Generic fields (every directory) and site facts (\`facts\`, declared in \`site.config.ts\`) are separate. Place facts: ${PLACE_FACTS.map((f) => `\`${f.key}\``).join(', ')}.
- Photos are their own records with a rights status, read from where they come from: Wikimedia = \`free\`, Yalodé and Wild Canyon sites = \`partner\`, anything else (here: Parc national / Rando Guadeloupe photos, shown as "tous droits réservés") = \`permission_needed\`.
- Sources are typed records: each place's main source and the source of its access status; the article sources are site-wide.
- Durations and approaches are minute ranges (\`{min, max, note}\`): "2 à 3 h" → 120–180, "20 à 25 min aller (descente raide)" → 20–25 + note.
- Article selections (decision D3): types, communes and criteria (with / without) picked in Airtable, plus include / exclude; comparisons on measured facts are named rules in \`site.config.ts\` (\`ARTICLE_RULES\`). The check confirms each article picks exactly the same outings and places as the design's JavaScript.
- Yes/no attributes are criteria (decision D1): \`has_waterfall\` → "Avec cascade"; \`has_rappel\` → "Rappel"; \`pets_allowed\` → "Animaux acceptés"; the ${criteria.filter((c) => c.badge).length} offer tags → criteria shown as badges. Near-duplicate tags are kept as written (see \`docs/OPEN_LOOPS.md\`).
- Types and communes are records with landing-page text (decision D2); places link to communes by key.
- Press ("Ils en parlent") is a featured source (title, publisher, note).
- Guide stories ("Pourquoi je vous emmène ici") are drafts until the guide approves them (old base: "Histoire validée" unticked).
- Page blocks (privacy text, "why a guide" points) are site texts (\`copy\`); interface labels are keyed in phase 4, when the templates exist.
- Safety claims ("en sécurité", "en toute sécurité") are allowed only in guided-outing content (outings, guides); the check fails anywhere else (decision 2026-10-07). Template copy (\`data/ui-copy.json\`) is checked when it is placed in phase 4.
- Canyon doré keeps its FAQ sentence about the meeting place (decision 2026-10-07).
`);
console.log(`migration: places ${destinations.length} · outings ${offers.length} · articles ${articles.length} · images ${images.length} · sources ${sources.length} · criteria ${criteria.length}`);
for (const e of errors) console.error('ERROR', e);
if (errors.length) process.exit(1);
