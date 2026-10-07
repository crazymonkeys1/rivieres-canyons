// Phase 1 · Maps the Claude Design export (data/*.json) to the site schema, validates it,
// writes normalized fixtures to content/fixtures/ and the review report to docs/CONTENT_REPORT.md.
//   pnpm content:check              development: schema + integrity errors fail
//   pnpm content:check:prod         also fails on placeholders, draft signatures, missing social accounts
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findPlaceholders, completeness, type Image } from '@orbit/core/content';
import { matchesRule, type Rule } from '@orbit/directory/content';
import { ITINERARY_FIELDS } from '@orbit/places/content';
import { contentSchema, type Destination, type SiteOffer } from '../src/content/schema';
import { CONTENT_CONFIG, RISKS } from '../src/content/vocabularies';

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
const VERIF: Record<string, string> = { 'élevé': 'eleve', 'élevé_pour_le_nom': 'eleve_nom', moyen: 'moyen', faible: 'faible' };
const ACCESS: Record<string, 'open' | 'partial' | 'closed'> = { ouvert: 'open', partiel: 'partial', ferme: 'closed' };
const GUIDE_OF: Record<string, string> = { yalode: 'pascal', wildcanyon: 'quentin' };
const EST_FIELD: Record<string, string> = { desc: 'summary', access: 'itinerary', minAge: 'min_age' };

function swimming(text: string | null | undefined): ['yes' | 'conditional' | 'no' | null, string | null] {
  if (!text) return [null, null];
  if (/^non\b/i.test(text)) return ['no', text];
  if (/sous conditions/i.test(text)) return ['conditional', text];
  return ['yes', text];
}

function photo(src: string, credit: string, operatorSite?: string): Image {
  const wiki = /wikimedia\.org\/wiki\/Special:FilePath\//.test(src);
  return {
    src,
    credit,
    source_url: wiki ? src.replace('Special:FilePath/', 'File:') : operatorSite ?? null,
    source_name: wiki ? 'commons.wikimedia.org' : operatorSite ? new URL(operatorSite).hostname.replace(/^www\./, '') : null,
  };
}
const YALODE_SITE = O.OPERATORS.yalode.website as string;

// ---------- destinations ----------
function mapDestination(x: any): Destination {
  const [swim, swimNote] = swimming(x.swimming);
  const operatorSite = /kayak-guadeloupe\.fr/.test(x.img ?? '') ? YALODE_SITE : undefined;
  const risks = (x.risks ?? []).map((r: string) => RISK[r] ?? r);
  for (const r of risks) if (!(r in RISKS)) errors.push(`${x.id}: unknown risk "${r}"`);
  return {
    id: slugOf(x.id),
    name: x.name,
    type: x.type === 'rivière' ? 'riviere' : x.type,
    island: x.island,
    communes: x.communes === 'inconnu' ? [] : x.communes.split(' / '),
    signature: blank(x.signature),
    signature_status: x.signature ? (x.signature_status === 'validated' ? 'validated' : 'draft') : null,
    has_waterfall: x.has_waterfall ?? null,
    location_policy: blank(x.location_policy),
    alt_names: x.alt_names ?? [],
    access_status: x.access_status
      ? { status: ACCESS[x.access_status.status], note: x.access_status.note, source_name: blank(x.access_status.sourceName),
          source_url: blank(x.access_status.sourceUrl), checked_on: blank(x.access_status.checked) }
      : null,
    summary: x.desc,
    overview_h2: blank(x.h2), lead: blank(x.lead), intro: blank(x.intro),
    more_title: blank(x.moreTitle), more_text: blank(x.expect), season: blank(x.season),
    difficulty: x.difficulty ? (DIFFICULTY[x.difficulty] as any) : null,
    duration: parseMinutes(x.duration, `${x.id}.duration`),
    approach: parseMinutes(x.approach, `${x.id}.approach`),
    min_age: x.minAge ?? null,
    swimming: swim, swimming_note: swimNote,
    access_h2: blank(x.accessH2), itinerary: blank(x.access), itinerary_text: blank(x.accessText),
    access_tiles: (x.accessShort ?? []).map(([icon, label, value, tip]: string[]) => ({ icon, label, value, tip: tip ?? null })),
    parking: blank(x.parking), drive: blank(x.drive), latitude: null, longitude: null,
    guided_access_text: blank(x.accessGuided),
    risks: risks as any,
    safety_alert: x.alert ? { short_label: x.alert.short ?? x.alert.title, title: x.alert.title, text: x.alert.text, items: x.alert.items ?? [] } : null,
    to_bring: x.bring ?? [],
    key_facts: (x.keyInfo ?? []).map(([label, value]: string[]) => ({ label, value })),
    insider_tip: x.insider ? { guide_id: x.insider.op ? GUIDE_OF[x.insider.op] : null, text: x.insider.text } : null,
    offer_h2: blank(x.guideH2), offer_why: blank(x.guideWhy),
    faq_h2: blank(x.faqH2),
    faq: (x.faq ?? []).map(([question, answer]: string[]) => ({ question, answer })),
    press: (x.press ?? []).map((p: any) => ({ site: p.site, by: blank(p.by), title: p.title, note: blank(p.note), url: p.url })),
    hero_image: x.img ? photo(x.img, x.credit, operatorSite) : null,
    gallery: (x.gallery ?? []).map((g: any) => ({ src: g.src, credit: g.credit, source_url: g.url ?? null, source_name: g.sourceName ?? null })),
    site_photos: (x.sitePhotos ?? []).map((src: string) => photo(src, x.sitePhotosCredit, YALODE_SITE)),
    guided_photos: [],
    photo_caption_site: x.photoCaptions?.site ?? null,
    photo_caption_guided: x.photoCaptions?.guided ?? null,
    verification: x.verif ? (VERIF[x.verif] as any) : null,
    source_publisher: x.sourcePublisher,
    source_url: x.sourceUrl,
    estimated_fields: (x.est ?? []).map((f: string) => EST_FIELD[f] ?? f),
  };
}

let destinations: Destination[] = D.destinations.map(mapDestination);

// ---------- Acomat split (decision 2026-10-07): the waterfall site is closed; guided trips run in the canyon ----------
{
  const src = D.destinations.find((x: any) => x.id === 'saut_d_acomat_site');
  const saut = destinations.find((d) => d.id === 'saut-d-acomat')!;
  const CANYON_FAQ = /canyoning|guide|coûte|enfants|prévoir/i;
  const canyonFaq = saut.faq.filter((f) => CANYON_FAQ.test(f.question));
  const canyon: Destination = {
    ...saut,
    id: 'canyon-d-acomat', name: "Canyon d'Acomat", type: 'canyon',
    signature: null, signature_status: null, has_waterfall: null, location_policy: 'guide_only', alt_names: [],
    access_status: null,
    summary: saut.more_text!, overview_h2: null, lead: null, intro: null, more_title: null, more_text: null, season: saut.season,
    difficulty: saut.difficulty, duration: saut.duration, approach: saut.approach, min_age: saut.min_age,
    swimming: null, swimming_note: null,
    safety_alert: null, to_bring: [], key_facts: [],
    insider_tip: saut.insider_tip, offer_h2: null, offer_why: saut.offer_why, faq_h2: null, faq: canyonFaq, press: [],
    hero_image: saut.hero_image, gallery: [], site_photos: [],
    guided_photos: (src.guidePhotos as string[]).map((s) => photo(s, 'Photo : Yalodé', YALODE_SITE)),
    photo_caption_site: null, photo_caption_guided: saut.photo_caption_guided,
    verification: null, source_publisher: 'Yalodé (kayak-guadeloupe.fr)', source_url: YALODE_SITE,
    estimated_fields: ['difficulty', 'duration'],
  };
  Object.assign(saut, {
    name: "Saut d'Acomat",
    difficulty: null, duration: null, approach: null, min_age: null, more_title: null, more_text: null,
    insider_tip: null, offer_h2: null, offer_why: null,
    faq: saut.faq.filter((f) => !CANYON_FAQ.test(f.question)),
    hero_image: saut.site_photos[0] ?? null, photo_caption_guided: null,
    estimated_fields: saut.estimated_fields.filter((f) => !['difficulty', 'duration'].includes(f)),
  });
  destinations.splice(destinations.indexOf(saut) + 1, 0, canyon);
  notes.push(
    "**Acomat split.** `saut-d-acomat` (closed waterfall site) keeps the site facts: description, history, height, pool, closure, season, risks, site photos and 6 FAQ answers about the site. Its hero photo is now the first site photo; the old hero showed a guided outing.",
    "`canyon-d-acomat` (new, `guide_only`) receives the guided experience: the guided text as summary, difficulty, duration, approach, minimum age, Pascal's tip, \"why with a guide\", the 8 guided-outing photos, and 6 FAQ answers about canyoning, price, children and gear. Both Acomat outings (`acomat`, `wc-acomat`) now link to it. Its season and risks are copied from the saut (same river). Everything else on this place is empty, to fill in Airtable.",
    "The draft signature of `saut-d-acomat` ends with \"que l'on découvre de l'intérieur avec un guide\": no longer true for the closed site. Rewrite it when validating.",
    "Yalodé's outing is named \"Saut d'Acomat\", but it now sits on the Canyon d'Acomat page. Rename it in Airtable if Yalodé agrees.",
  );
}

// ---------- Location policy rule (decision Q2 A): no directions for guide_only / closed ----------
for (const d of destinations) {
  if (d.location_policy !== 'guide_only' && d.location_policy !== 'closed') continue;
  const removed: string[] = [];
  for (const f of ITINERARY_FIELDS) {
    const v = (d as any)[f];
    if (Array.isArray(v) ? v.length : v !== null) { removed.push(f); (d as any)[f] = Array.isArray(v) ? [] : null; }
  }
  if (d.access_h2) { removed.push('access_h2'); d.access_h2 = null; }
  if (d.guided_access_text) { removed.push('guided_access_text'); d.guided_access_text = null; }
  d.estimated_fields = d.estimated_fields.filter((f) => !removed.includes(f));
  if (removed.length) dropped.push(`\`${d.id}\` (${d.location_policy}): ${removed.map((f) => `\`${f}\``).join(', ')}`);
}

// ---------- operators, guides, reviews ----------
const operators = Object.entries(O.OPERATORS).map(([id, o]: [string, any]) => ({
  id, name: o.name, brand_color: o.color, logo_url: o.logoUrl ?? null, website_url: o.website,
  contact_url: o.contactUrl ?? null, booking_url: o.bookUrl,
  rating: o.rating ? Number(String(o.rating).replace(',', '.')) : null, rating_source: null,
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
  const site = O.OPERATORS[t.op].website;
  return {
    id: t.id, operator_id: t.op, listing_id: LISTING_OF(t.id), is_main: !!meta.main,
    name: t.name, subtitle: t.subtitle, commune: t.commune,
    duration_min: Math.round(t.hours * 60), approach_min: t.approachMin ?? null, min_age: t.minAge,
    level: DIFFICULTY[t.level] as any, spirit: t.esprit, has_rappel: !!t.rappel, pets_allowed: !!t.pets,
    price_eur: t.price, price_child_eur: t.priceChild ?? null, child_price_under_age: t.priceChild ? 12 : null,
    image: t.img ? photo(t.img, `Photo : ${O.OPERATORS[t.op].name}`, site) : null,
    tags: t.tags, highlights: t.imagine, included: t.included, to_bring: t.bring,
    meeting_note: t.meeting ?? null, guide_tip: t.tip ?? null,
    guide_story: meta.story && meta.story !== t.tip ? meta.story : null,
    on_site_since: meta.yearsHere ? Number(String(meta.yearsHere).match(/\d{4}/)?.[0]) : null,
  };
});
// Meeting points belong to the guide when the place is guide_only or closed (DESIGN_SYSTEM › Accès).
for (const o of offers) {
  const d = destinations.find((x) => x.id === o.listing_id);
  if (d && (d.location_policy === 'guide_only' || d.location_policy === 'closed') && o.meeting_note) {
    dropped.push(`offer \`${o.id}\`: \`meeting_note\` ("${o.meeting_note}")`);
    o.meeting_note = null;
  }
}
notes.push('Offer durations come from the design\'s `hours` (3.5 h → 210 min). The child price rule "-12 ans" from the template is stored as `child_price_under_age: 12`.');

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
  'canyoning-enfants': { offer: { match: 'all', conditions: [{ field: 'min_age', op: 'lte', value: 10 }] }, listing: null },
  'cascades-faciles-acces': { offer: { match: 'all', conditions: [{ field: 'level', op: 'eq', value: 'facile' }, { field: 'approach_min', op: 'lte', value: 25 }] }, listing: null },
  'baignade-riviere': { offer: { match: 'all', conditions: [{ field: 'level', op: 'eq', value: 'facile' }] }, listing: { match: 'all', conditions: [{ field: 'swimming', op: 'filled' }] } },
  'canyoning-debutant': { offer: { match: 'any', conditions: [{ field: 'level', op: 'eq', value: 'facile' }, { field: 'tags', op: 'includes', value: 'Initiation technique' }] }, listing: null },
  'randonnee-aquatique': { offer: { match: 'all', conditions: [{ field: 'has_rappel', op: 'eq', value: false }] }, listing: null },
  'canyoning-sensations': { offer: { match: 'any', conditions: [{ field: 'spirit', op: 'eq', value: 'sensations' }, { field: 'level', op: 'eq', value: 'engage' }] }, listing: null },
  'canyoning-demi-journee': { offer: { match: 'all', conditions: [{ field: 'duration_min', op: 'lte', value: 270 }] }, listing: null },
};
const heroImage = (url: string | undefined): Image | null => {
  if (!url) return null;
  if (/kayak-guadeloupe\.fr/.test(url)) return photo(url, 'Photo : Yalodé', YALODE_SITE);
  const owner = D.destinations.find((x: any) => x.img === url);
  return photo(url, owner?.credit ?? 'Photo : Wikimedia Commons');
};
const idByName = (name: string): { kind: 'offer' | 'listing'; id: string } | null => {
  const o = offers.find((x) => x.name === name);
  if (o) return { kind: 'offer', id: o.id };
  const d = destinations.find((x) => x.name === name || x.name === name.replace(/ \(site naturel\)$/, ''));
  return d ? { kind: 'listing', id: d.id } : null;
};
const articles = B.SEO_PAGES.map((pg: any) => {
  const ex = B.SEO_EXTRA[pg.id] ?? {}, ed = B.SEO_EDITORIAL[pg.id], angle = B.SEO_ANGLE[pg.id];
  const angleNotes = angle ? Object.entries(angle[1]).flatMap(([name, text]) => {
    const ref = idByName(name);
    if (!ref) { errors.push(`article ${pg.id}: angle note for unknown "${name}"`); return []; }
    return [{ ...ref, text: text as string }];
  }) : [];
  return {
    id: pg.id, label: pg.label, h1: pg.h1, eyebrow: ex.eyebrow ?? 'Guadeloupe', intro: pg.intro, answer: B.SEO_ANSWER[pg.id],
    hero_image: heroImage(ex.hero), featured_offer_id: ex.featured ?? null,
    takeaways: (ex.points ?? []).map((p: any) => ({ title: p.t, text: p.d })),
    editorial: ed ? { eyebrow: ed.eyebrow, h2: ed.h2, sections: ed.blocks.map(([title, text]: string[]) => ({ title, text })),
      tips: ed.tips.map(([label, value]: string[]) => ({ label, value })) } : null,
    offer_rule: RULES[pg.id].offer, listing_ids: (pg.sites ?? []).map(slugOf), listing_rule: RULES[pg.id].listing,
    angle_label: angle ? angle[0] : null, angle_notes: angleNotes,
    why_intro: B.SEO_WHY[pg.id], safety_note: pg.safety, published_on: '2026-10-02', updated_on: '2026-10-02',
  };
});

// Check: the declarative rules select exactly what the design's JavaScript rules selected.
for (const pg of B.SEO_PAGES) {
  const jsRule = new Function(`return ${pg.tours_rule}`)() as (x: any) => boolean;
  const before = O.DATA.filter(jsRule).map((t: any) => t.id).sort().join(',');
  const a = articles.find((x: any) => x.id === pg.id)!;
  const after = offers.filter((o) => matchesRule(o as any, a.offer_rule!)).map((o) => o.id).sort().join(',');
  if (before !== after) errors.push(`article ${pg.id}: offer rule selects [${after}] but the design selected [${before}]`);
  if (pg.sites_rule) {
    const jsSites = new Function(`return ${pg.sites_rule}`)() as (x: any) => boolean;
    const restricted = D.ACCESS_RESTRICTED as string[];
    const b = D.destinations.filter((s: any) => !restricted.includes(s.id) && jsSites(s)).map((s: any) => slugOf(s.id)).sort().join(',');
    const af = destinations.filter((d) => !(CONTENT_CONFIG.restrictedAccessIds as readonly string[]).includes(d.id) && matchesRule(d as any, a.listing_rule!)).map((d) => d.id).sort().join(',');
    if (b !== af) errors.push(`article ${pg.id}: listing rule selects [${af}] but the design selected [${b}]`);
  }
}

// ---------- blocks and shared media ----------
const blocks = [
  { key: 'privacy_policy', status: 'placeholder' as const, body: '[PRIVACY_POLICY_TEXT]', updated_on: null },
  { key: 'why_guide_points', status: 'final' as const, body: B.SEO_WHY_POINTS.map(([icon, title, text]: string[]) => ({ icon, title, text })), updated_on: '2026-10-02' },
  { key: 'article_sources', status: 'final' as const, body: B.SEO_SOURCES.map(([name, url]: string[]) => ({ name, url })), updated_on: '2026-10-02' },
];
const illustration_images = (D.STOCK_POOL as string[]).map((url) => heroImage(url)!);
notes.push('Static template copy (`data/ui-copy.json`, ~150 strings) is not mapped yet: it is page wording, placed in templates in phase 4. The photos used for places without their own photo ("Photo d\'illustration") are kept as `illustration_images` with their credits.');

// ---------- validate ----------
const content = { destinations, operators, guides, offers, reviews, social_posts, articles, blocks, illustration_images };
const parsed = contentSchema.safeParse(content);
if (!parsed.success) for (const i of parsed.error.issues) errors.push(`schema: ${i.path.join('.')}: ${i.message}`);

// Referential integrity
const ids = (arr: { id: string }[], label: string) => {
  const seen = new Set<string>();
  for (const x of arr) { if (seen.has(x.id)) errors.push(`duplicate ${label} id "${x.id}"`); seen.add(x.id); }
  return seen;
};
const destIds = ids(destinations, 'destination'), opIds = ids(operators, 'operator'), offerIds = ids(offers, 'offer');
const guideIds = ids(guides, 'guide');
for (const o of offers) {
  if (!destIds.has(o.listing_id)) errors.push(`offer ${o.id}: unknown destination ${o.listing_id}`);
  if (!opIds.has(o.operator_id)) errors.push(`offer ${o.id}: unknown operator ${o.operator_id}`);
}
for (const d of destinations) {
  const mains = offers.filter((o) => o.listing_id === d.id && o.is_main);
  if (offers.some((o) => o.listing_id === d.id) && mains.length !== 1) errors.push(`destination ${d.id}: needs exactly one main offer (has ${mains.length})`);
  if (d.insider_tip?.guide_id && !guideIds.has(d.insider_tip.guide_id)) errors.push(`destination ${d.id}: unknown guide in insider tip`);
}
for (const a of articles) {
  if (a.featured_offer_id && !offerIds.has(a.featured_offer_id)) errors.push(`article ${a.id}: unknown featured offer`);
  for (const id of a.listing_ids) if (!destIds.has(id)) errors.push(`article ${a.id}: unknown destination ${id}`);
}
for (const p of social_posts) if (!destIds.has(p.listing_id)) errors.push(`social post ${p.id}: unknown destination`);

// Production-only checks
const prodIssues: string[] = [];
for (const p of findPlaceholders(content)) prodIssues.push(`placeholder ${p.token} at \`${p.path}\``);
for (const d of destinations) if (d.signature_status === 'draft') prodIssues.push(`draft signature: \`${d.id}\``);
for (const p of social_posts) if (!p.account) prodIssues.push(`social post \`${p.id}\` has no account name`);
for (const g of guides) if (!g.full_name) prodIssues.push(`guide \`${g.id}\` has no full name (H1 and Person JSON-LD)`);
for (const o of operators) if (o.rating !== null && !o.rating_source) prodIssues.push(`operator \`${o.id}\` shows a rating (${o.rating}) without a source`);

// ---------- completeness ----------
const KEY_FIELDS = ['summary', 'intro', 'signature', 'difficulty', 'duration', 'approach', 'min_age', 'season',
  'hero_image', 'location_policy', 'communes', 'faq', 'risks', 'verification'] as const;
const scores = destinations.map((d) => {
  const c = completeness(d as any, KEY_FIELDS as any);
  return { d, ...c, indexable: c.score >= CONTENT_CONFIG.indexThreshold };
});

// Text in guide_only / closed places that still mentions a meeting place or parking (for human review).
const textLeaks = destinations
  .filter((d) => d.location_policy === 'guide_only' || d.location_policy === 'closed')
  .flatMap((d) => [...d.faq.map((f) => f.answer), d.summary, d.intro, d.more_text]
    .filter((t): t is string => !!t && /rendez-vous|parking|se garer|on se gare/i.test(t))
    .map((t) => `\`${d.id}\`: "${t.length > 160 ? t.slice(0, 157) + '…' : t}"`));

// ---------- write ----------
mkdirSync(outDir, { recursive: true });
for (const [k, v] of Object.entries(content)) writeFileSync(resolve(outDir, `${k}.json`), JSON.stringify(v, null, 2) + '\n');

const pct = (n: number) => `${Math.round(n * 100)} %`;
const imageCount = destinations.reduce((n, d) => n + (d.hero_image ? 1 : 0) + d.gallery.length + d.site_photos.length + d.guided_photos.length, 0)
  + offers.filter((o) => o.image).length + articles.filter((a: any) => a.hero_image).length;
const noSource = [
  ...destinations.flatMap((d) => [d.hero_image, ...d.gallery, ...d.site_photos, ...d.guided_photos].filter((i) => i && !i.source_url).map(() => d.id)),
  ...offers.filter((o) => o.image && !o.image.source_url).map((o) => o.id),
];
const report = `# Content report (phase 1)

Generated by \`pnpm content:check\` from \`data/*.json\` on ${new Date().toISOString().slice(0, 10)}. Do not edit by hand: change the data or the mapping, then run it again.

## Summary
- **${destinations.length} destinations** (21 from the design + Canyon d'Acomat), ${operators.length} operators, ${guides.length} guides, ${offers.length} outings, ${reviews.length} published reviews, ${social_posts.length} social posts, ${articles.length} articles.
- Schema and integrity: **${errors.length === 0 ? 'pass' : `${errors.length} error(s)`}**.
- Production readiness: **${prodIssues.length} item(s) to fill** before launch (they are allowed in development).
- Indexable places (completeness ≥ ${pct(CONTENT_CONFIG.indexThreshold)}): **${scores.filter((s) => s.indexable).length} / ${scores.length}**. The others get \`noindex\` until filled.
- Images: ${imageCount}, every one with a credit; ${noSource.length === 0 ? 'every one with a source page' : `${noSource.length} without a source page`}.
${errors.length ? `\n## Errors\n${errors.map((e) => `- ${e}`).join('\n')}\n` : ''}
## Completeness per destination
Key fields (${KEY_FIELDS.length}): ${KEY_FIELDS.map((k) => `\`${k}\``).join(', ')}.

| Destination | Policy | Score | Indexed | Signature | Missing key fields | Estimates to confirm |
|---|---|---|---|---|---|---|
${scores.map(({ d, score, missing, indexable }) => `| ${d.name} (\`${d.id}\`) | ${d.location_policy ?? '—'} | ${pct(score)} | ${indexable ? 'yes' : 'no'} | ${d.signature_status ?? 'empty'} | ${missing.join(', ') || '—'} | ${d.estimated_fields.join(', ') || '—'} |`).join('\n')}

## To fill before launch (Airtable)
${prodIssues.map((p) => `- ${p}`).join('\n')}
- Yalodé logo: \`logo_url\` is empty.
- Location policies to confirm with the guides: Chutes Moreau = \`public\`, Rivière Bourceau = \`guide_only\`.
- 4 rivers with no commune and no policy (Grande Anse, Pérou, Lostau, Ziotte): they show "Commune non confirmée" and stay out of commune pages.

## Removed by a rule
Directions are never published for \`guide_only\` and \`closed\` places (decision Q2, 2026-10-07); mock content is never published.
${dropped.map((d) => `- ${d}`).join('\n')}

## Text to review (guide-only or closed places that still mention a meeting place or parking)
${textLeaks.length ? textLeaks.map((t) => `- ${t}`).join('\n') : '- none'}

## Mapping decisions
${notes.map((n) => `- ${n}`).join('\n')}
- Durations and approaches are stored as minute ranges (\`{min, max, note}\`): "2 à 3 h" → 120–180, "20 à 25 min aller (descente raide)" → 20–25 + note.
- Field names are snake_case English; vocabularies are enums (\`src/content/vocabularies.ts\`). Colours that lived in the data (access, verification, levels) were dropped: they belong to the tokens.
- The design's JavaScript selection rules for articles are now declarative rules (field, operator, value); the check confirms each selects exactly the same outings and places as before.
- Insider tips point to a guide (\`pascal\`, \`quentin\`) or to nobody (team tip).
- "En sécurité" wording is kept verbatim (decision Q3, 2026-10-07).
`;
writeFileSync(resolve(root, 'docs/CONTENT_REPORT.md'), report);

console.log(`destinations ${destinations.length} · offers ${offers.length} · articles ${articles.length}`);
console.log(`errors ${errors.length} · production items ${prodIssues.length} · indexable ${scores.filter((s) => s.indexable).length}/${scores.length}`);
for (const e of errors) console.error('ERROR', e);
if (production) for (const p of prodIssues) console.error('PRODUCTION', p);
if (errors.length || (production && prodIssues.length)) process.exit(1);
