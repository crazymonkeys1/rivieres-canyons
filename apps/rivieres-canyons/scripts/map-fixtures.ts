// Maps the Claude Design export (data/*.json) to the site schema, validates it,
// writes normalized fixtures to content/fixtures/ and the review report to docs/CONTENT_REPORT.md.
// One-off migration from the prototype: once Airtable is the source (phase 2), the Airtable adapter
// produces the same fixtures and this script is retired.
//   pnpm content:check              development: schema + integrity errors fail
//   pnpm content:check:prod         also fails on placeholders, draft signatures, images needing permission…
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findPlaceholders, completeness, type Image } from '@orbit/core/content';
import { matchesRule, landingPages, type Rule } from '@orbit/directory/content';
import { DIRECTION_FIELDS } from '@orbit/places/content';
import { contentSchema, type Destination, type SiteOffer, type Content } from '../src/content/schema';
import { RISKS, COMPLETENESS, LANDING, SAFETY_CLAIMS, PLACE_FACTS, LISTING_TYPES, LOCATION_LABELS } from '../src/content/site.config';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../../..');
const outDir = resolve(here, '../content/fixtures');
const production = process.argv.includes('--production');
const read = (f: string) => JSON.parse(readFileSync(resolve(root, 'data', f), 'utf8'));

const D = read('destinations.json');
const O = read('operators-and-tours.json');
const B = read('blog-articles.json');

const notes: string[] = [];   // mapping decisions worth reviewing
const dropped: string[] = []; // data removed by a rule
const errors: string[] = [];

// ---------- helpers ----------
/** Every string in a value, with its path. */
function findText(value: unknown, path = ''): { path: string; text: string }[] {
  if (typeof value === 'string') return [{ path, text: value }];
  if (Array.isArray(value)) return value.flatMap((v, i) => findText(v, `${path}[${i}]`));
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => findText(v, path ? `${path}.${k}` : k));
  return [];
}
const kebab = (id: string) => id.replace(/_/g, '-');
const slugOf = (id: string) => (id === 'saut_d_acomat_site' ? 'saut-d-acomat' : kebab(id));
const blank = (v: unknown) => (v === undefined || v === '' ? null : (v as any));

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
function addSource(owner_kind: 'listing' | 'site', owner_id: string, label: string, url: string, used_for: string | null) {
  if (sources.some((s) => s.owner_id === owner_id && s.url === url)) return;
  const n = sources.filter((s) => s.owner_id === owner_id).length + 1;
  sources.push({ id: `${owner_id}-source-${n}`, owner_kind, owner_id, label, url, type: sourceType(label, url), used_for });
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
  return {
    id, name: x.name, type: x.type === 'rivière' ? 'riviere' : x.type, alt_names: x.alt_names ?? [],
    status: 'published', confidence: x.verif ? (CONFIDENCE_OF[x.verif] as any) : null, last_reviewed_on: null,
    location: { area: x.island, zone: null, localities: x.communes === 'inconnu' ? [] : x.communes.split(' / '), geo: null },
    summary: x.desc,
    signature: blank(x.signature), signature_status: x.signature ? (x.signature_status === 'validated' ? 'validated' : 'draft') : null,
    lead: blank(x.lead), intro: blank(x.intro), more_title: blank(x.moreTitle), more_text: blank(x.expect),
    tip: x.insider ? { guide_id: x.insider.op ? GUIDE_OF[x.insider.op] : null, text: x.insider.text } : null,
    faq: (x.faq ?? []).map(([question, answer]: string[]) => ({ question, answer })),
    key_facts: (x.keyInfo ?? []).map(([label, value]: string[]) => ({ label, value })),
    press: (x.press ?? []).map((p: any) => ({ site: p.site, by: blank(p.by), title: p.title, note: blank(p.note), url: p.url })),
    facts: {
      difficulty: x.difficulty ? DIFFICULTY[x.difficulty] : null,
      duration: parseMinutes(x.duration, `${x.id}.duration`),
      approach: parseMinutes(x.approach, `${x.id}.approach`),
      min_age: x.minAge ?? null,
      swimming: swimming(x.swimming),
      has_waterfall: x.has_waterfall ?? null,
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
    facts: { difficulty: f.difficulty, duration: f.duration, approach: f.approach, min_age: f.min_age, swimming: null, has_waterfall: null, season: f.season },
    fact_notes: {}, safety_alert: null, to_bring: [], key_facts: [], press: [],
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
    source: r.source, status: /brouillon/i.test(r.source ?? '') ? 'draft' : 'published' })));

// ---------- offers ----------
const LISTING_OF = (tourId: string) => (tourId === 'acomat' || tourId === 'wc-acomat' ? 'canyon-d-acomat' : slugOf(O.TOUR_META[tourId].siteId));
const offers: SiteOffer[] = O.DATA.map((t: any) => {
  const meta = O.TOUR_META[t.id];
  if (t.img) addImage('offer', t.id, 'hero', t.img, `Photo : ${O.OPERATORS[t.op].name}`);
  return {
    id: t.id, operator_id: t.op, listing_id: LISTING_OF(t.id), is_main: !!meta.main,
    name: t.name, subtitle: t.subtitle,
    duration_min: Math.round(t.hours * 60),
    price_eur: t.price, price_child_eur: t.priceChild ?? null, child_price_under_age: t.priceChild ? 12 : null, price_checked_on: null,
    facts: { level: DIFFICULTY[t.level], spirit: t.esprit, min_age: t.minAge, approach_min: t.approachMin ?? null, has_rappel: !!t.rappel, pets_allowed: !!t.pets },
    tags: t.tags, highlights: t.imagine, included: t.included, to_bring: t.bring,
    meeting_note: t.meeting ?? null, guide_tip: t.tip ?? null,
    guide_story: meta.story && meta.story !== t.tip ? meta.story : null,
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
const RULES: Record<string, { offer: Rule | null; listing: Rule | null }> = {
  'canyoning-enfants': { offer: { match: 'all', conditions: [{ field: 'facts.min_age', op: 'lte', value: 10 }] }, listing: null },
  'cascades-faciles-acces': { offer: { match: 'all', conditions: [{ field: 'facts.level', op: 'eq', value: 'facile' }, { field: 'facts.approach_min', op: 'lte', value: 25 }] }, listing: null },
  'baignade-riviere': { offer: { match: 'all', conditions: [{ field: 'facts.level', op: 'eq', value: 'facile' }] }, listing: { match: 'all', conditions: [{ field: 'facts.swimming', op: 'filled' }] } },
  'canyoning-debutant': { offer: { match: 'any', conditions: [{ field: 'facts.level', op: 'eq', value: 'facile' }, { field: 'tags', op: 'includes', value: 'Initiation technique' }] }, listing: null },
  'randonnee-aquatique': { offer: { match: 'all', conditions: [{ field: 'facts.has_rappel', op: 'eq', value: false }] }, listing: null },
  'canyoning-sensations': { offer: { match: 'any', conditions: [{ field: 'facts.spirit', op: 'eq', value: 'sensations' }, { field: 'facts.level', op: 'eq', value: 'engage' }] }, listing: null },
  'canyoning-demi-journee': { offer: { match: 'all', conditions: [{ field: 'duration_min', op: 'lte', value: 270 }] }, listing: null },
};
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
    id: pg.id, label: pg.label, h1: pg.h1, eyebrow: ex.eyebrow ?? 'Guadeloupe', intro: pg.intro, answer: B.SEO_ANSWER[pg.id],
    author_ids: ['pascal', 'quentin'], featured_offer_id: ex.featured ?? null,
    takeaways: (ex.points ?? []).map((p: any) => ({ title: p.t, text: p.d })),
    editorial: ed ? { eyebrow: ed.eyebrow, h2: ed.h2, sections: ed.blocks.map(([title, text]: string[]) => ({ title, text })),
      tips: ed.tips.map(([label, value]: string[]) => ({ label, value })) } : null,
    offer_rule: RULES[pg.id].offer, listing_ids: (pg.sites ?? []).map(slugOf), listing_rule: RULES[pg.id].listing,
    angle_label: angle ? angle[0] : null, angle_notes: angleNotes,
    why_intro: B.SEO_WHY[pg.id], safety_note: pg.safety, published_on: '2026-10-02', updated_on: '2026-10-02',
    seo: { title: null, description: null },
  };
});
for (const [name, url] of B.SEO_SOURCES as string[][]) addSource('site', 'site', name, url, 'articles');

// Check: the declarative rules select exactly what the design's JavaScript rules selected.
for (const pg of B.SEO_PAGES) {
  const jsRule = new Function(`return ${pg.tours_rule}`)() as (x: any) => boolean;
  const before = O.DATA.filter(jsRule).map((t: any) => t.id).sort().join(',');
  const a = articles.find((x: any) => x.id === pg.id)!;
  const after = offers.filter((o) => matchesRule(o, a.offer_rule!)).map((o) => o.id).sort().join(',');
  if (before !== after) errors.push(`article ${pg.id}: offer rule selects [${after}] but the design selected [${before}]`);
  if (pg.sites_rule) {
    const jsSites = new Function(`return ${pg.sites_rule}`)() as (x: any) => boolean;
    const b = D.destinations.filter((s: any) => !(D.ACCESS_RESTRICTED as string[]).includes(s.id) && jsSites(s)).map((s: any) => slugOf(s.id)).sort().join(',');
    const af = destinations.filter((d) => !d.access_restricted && matchesRule(d, a.listing_rule!)).map((d) => d.id).sort().join(',');
    if (b !== af) errors.push(`article ${pg.id}: listing rule selects [${af}] but the design selected [${b}]`);
  }
}

// Decision 2026-10-07 (Jordan): Yalodé's outing now sits on the canyon page, so it takes the canyon's name.
offers.find((o) => o.id === 'acomat')!.name = "Canyon d'Acomat";
notes.push('Yalodé\'s outing `acomat` is renamed "Canyon d\'Acomat" (decision 2026-10-07; confirm with Yalodé).');

// ---------- blocks, shared media ----------
const blocks = [
  { key: 'privacy_policy', status: 'placeholder' as const, body: '[PRIVACY_POLICY_TEXT]', updated_on: null },
  { key: 'why_guide_points', status: 'final' as const, body: B.SEO_WHY_POINTS.map(([icon, title, text]: string[]) => ({ icon, title, text })), updated_on: '2026-10-02' },
];
for (const url of D.STOCK_POOL as string[]) addImage('site', 'site', 'illustration', url, creditFor(url));

// ---------- validate ----------
const content = { destinations, operators, guides, offers, reviews, social_posts, articles, blocks, images, sources, copy: [], rejected: [] };
const parsed = contentSchema.safeParse(content);
if (!parsed.success) for (const i of parsed.error.issues) errors.push(`schema: ${i.path.join('.')}: ${i.message}`);

// Referential integrity
const ids = (arr: { id: string }[], label: string) => {
  const seen = new Set<string>();
  for (const x of arr) { if (seen.has(x.id)) errors.push(`duplicate ${label} id "${x.id}"`); seen.add(x.id); }
  return seen;
};
const destIds = ids(destinations, 'destination'), opIds = ids(operators, 'operator'), offerIds = ids(offers, 'offer');
const guideIds = ids(guides, 'guide'), articleIds = ids(articles, 'article');
ids(images, 'image'); ids(sources, 'source');
for (const o of offers) {
  if (!destIds.has(o.listing_id)) errors.push(`offer ${o.id}: unknown destination ${o.listing_id}`);
  if (!opIds.has(o.operator_id)) errors.push(`offer ${o.id}: unknown operator ${o.operator_id}`);
}
for (const d of destinations) {
  const mains = offers.filter((o) => o.listing_id === d.id && o.is_main);
  if (offers.some((o) => o.listing_id === d.id) && mains.length !== 1) errors.push(`destination ${d.id}: needs exactly one main offer (has ${mains.length})`);
  if (d.tip?.guide_id && !guideIds.has(d.tip.guide_id)) errors.push(`destination ${d.id}: unknown guide in tip`);
}
for (const a of articles) {
  if (a.featured_offer_id && !offerIds.has(a.featured_offer_id)) errors.push(`article ${a.id}: unknown featured offer`);
  for (const id of a.listing_ids) if (!destIds.has(id)) errors.push(`article ${a.id}: unknown destination ${id}`);
  for (const id of a.author_ids) if (!guideIds.has(id)) errors.push(`article ${a.id}: unknown author ${id}`);
}
const owners: Record<string, Set<string>> = { listing: destIds, offer: offerIds, article: articleIds, site: new Set(['site']) };
for (const i of images) if (!owners[i.owner_kind].has(i.owner_id)) errors.push(`image ${i.id}: unknown ${i.owner_kind} ${i.owner_id}`);
for (const s of sources) if (!owners[s.owner_kind].has(s.owner_id)) errors.push(`source ${s.id}: unknown ${s.owner_kind} ${s.owner_id}`);
for (const p of social_posts) if (!destIds.has(p.listing_id)) errors.push(`social post ${p.id}: unknown destination`);

// Safety claims are allowed only where a guide is involved (decision 2026-10-07).
const checked = Object.fromEntries(Object.entries(content).filter(([k]) => !(SAFETY_CLAIMS.allowed_in as readonly string[]).includes(k)));
for (const { path, text } of findText(checked).filter(({ text }) => SAFETY_CLAIMS.pattern.test(text)))
  errors.push(`safety claim outside guided-outing content: \`${path}\`: "${text.length > 140 ? text.slice(0, 137) + '…' : text}"`);

// Production-only checks
const prodIssues: string[] = [];
for (const p of findPlaceholders(content)) prodIssues.push(`placeholder ${p.token} at \`${p.path}\``);
for (const d of destinations) if (d.signature_status === 'draft') prodIssues.push(`draft signature: \`${d.id}\``);
for (const p of social_posts) if (!p.account) prodIssues.push(`social post \`${p.id}\` has no account name`);
for (const g of guides) if (!g.full_name) prodIssues.push(`guide \`${g.id}\` has no full name (H1 and Person JSON-LD)`);
for (const o of operators) if (o.rating !== null && !o.rating_source) prodIssues.push(`operator \`${o.id}\` shows a rating (${o.rating}) without a source`);
const needPermission = images.filter((i) => i.rights === 'permission_needed');
if (needPermission.length) prodIssues.push(`${needPermission.length} image(s) need the owner's permission: ${[...new Set(needPermission.map((i) => `\`${i.owner_id}\` (${i.source_name})`))].join(', ')}`);

// ---------- completeness and landing pages ----------
const heroOf = (id: string) => images.find((i) => i.owner_id === id && i.role === 'hero') ?? null;
const scores = destinations.map((d) => {
  const c = completeness({ ...d, hero: heroOf(d.id) }, COMPLETENESS.keys);
  return { d, ...c, indexable: d.status === 'published' && c.score >= COMPLETENESS.threshold };
});
const landings = landingPages(destinations, LANDING.dimensions, LANDING.min);
const landingLabel = (dim: string, v: string) => (dim === 'type' ? (LISTING_TYPES as any)[v]?.plural ?? v : v);

// Sentences reviewed and kept by Jordan (2026-10-07).
const KEPT_BY_DECISION = ["Le rendez-vous se fait au parking du Saut d'Acomat."];
const textLeaks = destinations
  .filter((d) => d.location_policy === 'guide_only' || d.location_policy === 'closed')
  .flatMap((d) => [...d.faq.map((f) => f.answer), d.summary, d.intro, d.more_text]
    .filter((t): t is string => !!t && /rendez-vous|parking|se garer|on se gare/i.test(t) && !KEPT_BY_DECISION.some((k) => t.includes(k)))
    .map((t) => `\`${d.id}\`: "${t.length > 160 ? t.slice(0, 157) + '…' : t}"`));

// ---------- write ----------
mkdirSync(outDir, { recursive: true });
for (const [k, v] of Object.entries(content)) writeFileSync(resolve(outDir, `${k}.json`), JSON.stringify(v, null, 2) + '\n');

const pct = (n: number) => `${Math.round(n * 100)} %`;
const count = <T,>(arr: T[], f: (x: T) => string) => Object.entries(arr.reduce<Record<string, number>>((m, x) => ({ ...m, [f(x)]: (m[f(x)] ?? 0) + 1 }), {})).map(([k, n]) => `${k} ${n}`).join(' · ');
const report = `# Content report

Generated by \`pnpm content:check\` from \`data/*.json\` on ${new Date().toISOString().slice(0, 10)}. Do not edit by hand: change the data or the mapping, then run it again.

## Summary
- **${destinations.length} destinations** (21 from the design + Canyon d'Acomat), ${operators.length} operators, ${guides.length} guides, ${offers.length} outings, ${reviews.length} published reviews, ${social_posts.length} social posts, ${articles.length} articles.
- Schema and integrity: **${errors.length === 0 ? 'pass' : `${errors.length} error(s)`}**.
- Production readiness: **${prodIssues.length} item(s) to fill** before launch (they are allowed in development).
- Indexable places (published and completeness ≥ ${pct(COMPLETENESS.threshold)}): **${scores.filter((s) => s.indexable).length} / ${scores.length}**. The others get \`noindex\` until filled.
- Images: ${images.length}, every one with a credit. Rights: ${count(images, (i) => i.rights)}.
- Sources: ${sources.length}. Types: ${count(sources, (s) => s.type)}.
${errors.length ? `\n## Errors\n${errors.map((e) => `- ${e}`).join('\n')}\n` : ''}
## Completeness per destination
Key fields (${COMPLETENESS.keys.length}, from \`site.config.ts\`): ${COMPLETENESS.keys.map((k) => `\`${k}\``).join(', ')}.

| Destination | Policy | Score | Indexed | Signature | Missing key fields | Estimates to confirm |
|---|---|---|---|---|---|---|
${scores.map(({ d, score, missing, indexable }) => `| ${d.name} (\`${d.id}\`) | ${d.location_policy ?? '—'} | ${pct(score)} | ${indexable ? 'yes' : 'no'} | ${d.signature_status ?? 'empty'} | ${missing.join(', ') || '—'} | ${d.estimated_fields.join(', ') || '—'} |`).join('\n')}

## Landing pages (computed: ${LANDING.min}+ published places)
${landings.map((l) => `- ${LANDING.dimensions.find((d) => d.key === l.dimension)!.label} › **${landingLabel(l.dimension, l.value)}**: ${l.listing_ids.length} places`).join('\n')}

## To fill before launch (Airtable)
${prodIssues.map((p) => `- ${p}`).join('\n')}
- Yalodé logo: \`logo_url\` is empty.
- Location policies to confirm with the guides: Chutes Moreau = \`public\`, Rivière Bourceau = \`guide_only\`.
- 4 rivers with no ${LOCATION_LABELS.locality.toLowerCase()} and no policy (Grande Anse, Pérou, Lostau, Ziotte): they show "Commune non confirmée" and stay out of commune pages.

## Worth adding (not blocking)
- \`last_reviewed_on\`: empty on all ${destinations.length} places. It feeds "Mis à jour le" and \`dateModified\` (freshness for Google and AI assistants).
- \`location.geo\`: empty on the ${destinations.filter((d) => d.location_policy === 'public').length} public places. Needed for the map link, "À proximité" and JSON-LD \`geo\`. Only from a published source.
- \`price_checked_on\`: empty on all ${offers.length} outings. Prices should carry the date they were read.
- \`rating_count\` and \`rating_source\` for both operators.

## Removed by a rule
Directions are never published for \`guide_only\` and \`closed\` places (decision Q2, 2026-10-07); mock content is never published.
${dropped.map((d) => `- ${d}`).join('\n')}

## Text to review (guide-only or closed places that still mention a meeting place or parking)
${textLeaks.length ? textLeaks.map((t) => `- ${t}`).join('\n') : '- none'}

## Mapping decisions
${notes.map((n) => `- ${n}`).join('\n')}
- Generic fields (every directory) and site facts (\`facts\`, declared in \`site.config.ts\`) are separate. Place facts: ${PLACE_FACTS.map((f) => `\`${f.key}\``).join(', ')}.
- Photos are their own records with a rights status, read from where they come from: Wikimedia = \`free\`, Yalodé and Wild Canyon sites = \`partner\`, anything else (here: Parc national / Rando Guadeloupe photos, shown as "tous droits réservés") = \`permission_needed\`.
- Sources are typed records: each place's main source and the source of its access status; the article sources are site-wide.
- Durations and approaches are minute ranges (\`{min, max, note}\`): "2 à 3 h" → 120–180, "20 à 25 min aller (descente raide)" → 20–25 + note.
- The design's JavaScript selection rules for articles are declarative rules (dotted field, operator, value); the check confirms each selects exactly the same outings and places as before.
- Safety claims ("en sécurité", "en toute sécurité") are allowed only in guided-outing content (outings, guides); the check fails anywhere else (decision 2026-10-07). Template copy (\`data/ui-copy.json\`) is checked when it is placed in phase 4.
- Canyon doré keeps its FAQ sentence about the meeting place (decision 2026-10-07).
`;
writeFileSync(resolve(root, 'docs/CONTENT_REPORT.md'), report);

console.log(`destinations ${destinations.length} · offers ${offers.length} · articles ${articles.length} · images ${images.length} · sources ${sources.length}`);
console.log(`errors ${errors.length} · production items ${prodIssues.length} · indexable ${scores.filter((s) => s.indexable).length}/${scores.length}`);
for (const e of errors) console.error('ERROR', e);
if (production) for (const p of prodIssues) console.error('PRODUCTION', p);
if (errors.length || (production && prodIssues.length)) process.exit(1);
