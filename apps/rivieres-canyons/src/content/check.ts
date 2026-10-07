// Checks run on the content, whatever its source (design migration today, Airtable tomorrow):
// schema, references, copy rules, production readiness, completeness and landing pages.
import { findPlaceholders, completeness } from '@orbit/core/content';
import { landingPages, criteriaDimension } from '@orbit/directory/content';
import { contentSchema, type Content } from './schema';
import { COMPLETENESS, LANDING, SAFETY_CLAIMS, ARTICLE_RULES, ALLOWED_MEETING_MENTIONS } from './site.config';

/** Every string in a value, with its path. */
function findText(value: unknown, path = ''): { path: string; text: string }[] {
  if (typeof value === 'string') return [{ path, text: value }];
  if (Array.isArray(value)) return value.flatMap((v, i) => findText(v, `${path}[${i}]`));
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([k, v]) => findText(v, path ? `${path}.${k}` : k));
  return [];
}
const short = (t: string, n = 140) => (t.length > n ? t.slice(0, n - 3) + '…' : t);

export function checkContent(c: Content) {
  const errors: string[] = [];
  const parsed = contentSchema.safeParse(c);
  if (!parsed.success) for (const i of parsed.error.issues) errors.push(`schema: ${i.path.join('.')}: ${i.message}`);

  // References
  const ids = (arr: { id: string }[], label: string) => {
    const seen = new Set<string>();
    for (const x of arr) { if (seen.has(x.id)) errors.push(`duplicate ${label} id "${x.id}"`); seen.add(x.id); }
    return seen;
  };
  const destIds = ids(c.destinations, 'destination'), opIds = ids(c.operators, 'operator'), offerIds = ids(c.offers, 'offer');
  const guideIds = ids(c.guides, 'guide'), articleIds = ids(c.articles, 'article');
  ids(c.images, 'image'); ids(c.sources, 'source'); ids(c.reviews, 'review'); ids(c.social_posts, 'social post');
  const typeKeys = ids(c.types.map((t) => ({ id: t.key })), 'type'), localityKeys = ids(c.localities.map((l) => ({ id: l.key })), 'locality');
  ids(c.criteria.map((x) => ({ id: x.key })), 'criterion'); ids(c.copy.map((x) => ({ id: x.key })), 'site text');
  const critKeys = (k: 'listing' | 'offer') => new Set(c.criteria.filter((x) => x.applies_to === k).map((x) => x.key));
  for (const d of c.destinations) {
    if (!typeKeys.has(d.type)) errors.push(`destination ${d.id}: unknown type ${d.type}`);
    for (const l of d.location.localities) if (!localityKeys.has(l)) errors.push(`destination ${d.id}: unknown locality ${l}`);
    for (const k of d.criteria) if (!critKeys('listing').has(k)) errors.push(`destination ${d.id}: "${k}" is not a criterion for places`);
    if (d.tip?.guide_id && !guideIds.has(d.tip.guide_id)) errors.push(`destination ${d.id}: unknown guide in tip`);
    const mains = c.offers.filter((o) => o.listing_id === d.id && o.is_main);
    if (c.offers.some((o) => o.listing_id === d.id) && mains.length !== 1) errors.push(`destination ${d.id}: needs exactly one main offer (has ${mains.length})`);
  }
  for (const o of c.offers) {
    if (!destIds.has(o.listing_id)) errors.push(`offer ${o.id}: unknown destination ${o.listing_id}`);
    if (!opIds.has(o.operator_id)) errors.push(`offer ${o.id}: unknown operator ${o.operator_id}`);
    for (const k of o.criteria) if (!critKeys('offer').has(k)) errors.push(`offer ${o.id}: "${k}" is not a criterion for outings`);
    const d = c.destinations.find((x) => x.id === o.listing_id);
    if (o.meeting_note && (d?.location_policy === 'guide_only' || d?.location_policy === 'closed')) errors.push(`offer ${o.id}: meeting point on a ${d.location_policy} place`);
  }
  for (const g of c.guides) if (!opIds.has(g.operator_id)) errors.push(`guide ${g.id}: unknown operator`);
  for (const r of c.reviews) {
    if (!opIds.has(r.operator_id)) errors.push(`review ${r.id}: unknown operator`);
    if (r.offer_id && !offerIds.has(r.offer_id)) errors.push(`review ${r.id}: unknown offer`);
    if (r.guide_id && !guideIds.has(r.guide_id)) errors.push(`review ${r.id}: unknown guide`);
  }
  for (const a of c.articles) {
    if (a.featured_offer_id && !offerIds.has(a.featured_offer_id)) errors.push(`article ${a.id}: unknown featured offer`);
    for (const id of a.author_ids) if (!guideIds.has(id)) errors.push(`article ${a.id}: unknown author ${id}`);
    for (const n of a.angle_notes) if (!(n.kind === 'listing' ? destIds : offerIds).has(n.id)) errors.push(`article ${a.id}: angle note on unknown ${n.kind} ${n.id}`);
    for (const [kind, s] of [['listing', a.listing_selection], ['offer', a.offer_selection]] as const) {
      if (!s) continue;
      const pool = kind === 'listing' ? destIds : offerIds;
      for (const id of [...s.include, ...s.exclude]) if (!pool.has(id)) errors.push(`article ${a.id}: unknown ${kind} ${id}`);
      for (const k of [...s.with, ...s.without]) if (!critKeys(kind).has(k)) errors.push(`article ${a.id}: "${k}" is not a criterion for ${kind}s`);
      for (const t of s.types) if (!typeKeys.has(t)) errors.push(`article ${a.id}: unknown type ${t}`);
      for (const l of s.localities) if (!localityKeys.has(l)) errors.push(`article ${a.id}: unknown locality ${l}`);
      if (s.rule && ARTICLE_RULES[s.rule]?.applies_to !== kind) errors.push(`article ${a.id}: rule ${s.rule} does not apply to ${kind}s`);
    }
  }
  const owners: Record<string, Set<string>> = { listing: destIds, offer: offerIds, article: articleIds, site: new Set(['site']) };
  for (const i of c.images) if (!owners[i.owner_kind].has(i.owner_id)) errors.push(`image ${i.id}: unknown ${i.owner_kind} ${i.owner_id}`);
  for (const s of c.sources) if (!owners[s.owner_kind].has(s.owner_id)) errors.push(`source ${s.id}: unknown ${s.owner_kind} ${s.owner_id}`);
  for (const p of c.social_posts) if (!destIds.has(p.listing_id)) errors.push(`social post ${p.id}: unknown destination`);

  // Copy rule: safety claims only where a guide is involved (decision 2026-10-07).
  const checked = Object.fromEntries(Object.entries(c).filter(([k]) => !(SAFETY_CLAIMS.allowed_in as readonly string[]).includes(k)));
  for (const { path, text } of findText(checked).filter(({ text }) => SAFETY_CLAIMS.pattern.test(text)))
    errors.push(`safety claim outside guided-outing content: \`${path}\`: "${short(text)}"`);

  // Production readiness
  const prod: string[] = [];
  for (const x of c.copy) if (x.status === 'placeholder' && !findPlaceholders(x).length) prod.push(`site text to write: \`${x.key}\``);
  for (const p of findPlaceholders(c)) prod.push(`placeholder ${p.token} at \`${p.path}\``);
  for (const d of c.destinations) if (d.signature_status === 'draft') prod.push(`draft signature: \`${d.id}\``);
  for (const o of c.offers) if (o.guide_story_status === 'draft') prod.push(`guide story to approve: outing \`${o.id}\``);
  for (const p of c.social_posts) if (!p.account) prod.push(`social post \`${p.id}\` has no account name`);
  for (const g of c.guides) if (!g.full_name) prod.push(`guide \`${g.id}\` has no full name (H1 and Person JSON-LD)`);
  for (const o of c.operators) if (o.rating !== null && !o.rating_source) prod.push(`operator \`${o.id}\` shows a rating (${o.rating}) without a source`);
  const needPermission = c.images.filter((i) => i.rights === 'permission_needed');
  if (needPermission.length) prod.push(`${needPermission.length} image(s) need the owner's permission: ${[...new Set(needPermission.map((i) => `\`${i.owner_id}\` (${i.source_name})`))].join(', ')}`);

  // Worth adding (not blocking)
  const worth: string[] = [];
  const pub = c.destinations.filter((d) => d.status === 'published');
  const nb = (n: number, of: number, what: string, why: string) => n && worth.push(`\`${what}\`: empty on ${n} / ${of}. ${why}`);
  nb(pub.filter((d) => !d.last_reviewed_on).length, pub.length, 'last_reviewed_on', 'It feeds "Mis à jour le" and `dateModified` (freshness for Google and AI assistants).');
  nb(pub.filter((d) => d.location_policy === 'public' && !d.location.geo).length, pub.filter((d) => d.location_policy === 'public').length, 'location.geo (public places)', 'Map link, "À proximité", JSON-LD `geo`. Only from a published source.');
  nb(c.offers.filter((o) => !o.price_checked_on).length, c.offers.length, 'price_checked_on', 'Prices should carry the date they were read.');
  nb(c.operators.filter((o) => !o.logo_url).length, c.operators.length, 'operator logo_url', '');
  nb(pub.filter((d) => !d.location.localities.length).length, pub.length, 'locality', 'Shown as "Commune non confirmée", out of commune pages.');
  nb(c.types.filter((t) => !t.intro).length, c.types.length, 'type intro', 'Text at the top of each type page.');

  // Guide-only or closed places that still mention a meeting place or parking in their text.
  const textLeaks = c.destinations
    .filter((d) => d.location_policy === 'guide_only' || d.location_policy === 'closed')
    .flatMap((d) => [...d.faq.map((q) => q.answer), d.summary, d.intro, d.more_text]
      .filter((t): t is string => !!t && /rendez-vous|parking|se garer|on se gare/i.test(t) && !ALLOWED_MEETING_MENTIONS.some((k) => t.includes(k)))
      .map((t) => `\`${d.id}\`: "${short(t, 160)}"`));

  // Completeness and landing pages
  const heroOf = (id: string) => c.images.find((i) => i.owner_id === id && i.role === 'hero') ?? null;
  const scores = c.destinations.map((d) => {
    const s = completeness({ ...d, hero: heroOf(d.id) }, COMPLETENESS.keys);
    return { d, ...s, indexable: d.status === 'published' && s.score >= COMPLETENESS.threshold };
  });
  const dimensions = [...LANDING.dimensions, criteriaDimension(c.criteria)];
  const landings = landingPages(c.destinations, dimensions, LANDING.min).map((l) => ({
    ...l, dimension_label: dimensions.find((d) => d.key === l.dimension)!.label,
    label: l.dimension === 'type' ? c.types.find((t) => t.key === l.value)?.plural ?? l.value
      : l.dimension === 'locality' ? c.localities.find((x) => x.key === l.value)?.name ?? l.value
        : l.dimension === 'criterion' ? c.criteria.find((x) => x.key === l.value)?.label ?? l.value : l.value,
  }));

  return { errors, prod, worth, textLeaks, scores, landings };
}

/** docs/CONTENT_REPORT.md */
export function renderReport(c: Content, r: ReturnType<typeof checkContent>, source: string) {
  const pct = (n: number) => `${Math.round(n * 100)} %`;
  const count = <T,>(arr: T[], f: (x: T) => string) => Object.entries(arr.reduce<Record<string, number>>((m, x) => ({ ...m, [f(x)]: (m[f(x)] ?? 0) + 1 }), {})).map(([k, n]) => `${k} ${n}`).join(' · ');
  const byStatus = count(c.destinations, (d) => d.status);
  return `# Content report

Generated by \`pnpm content:check\` from ${source} on ${new Date().toISOString().slice(0, 10)}. Do not edit by hand.

## Summary
- **${c.destinations.length} places** (${byStatus}), ${c.types.length} types, ${c.localities.length} communes, ${c.criteria.length} criteria, ${c.operators.length} operators, ${c.guides.length} guides, ${c.offers.length} outings, ${c.reviews.filter((x) => x.status === 'published').length} published reviews, ${c.social_posts.length} social posts, ${c.articles.length} articles.
- Schema and integrity: **${r.errors.length === 0 ? 'pass' : `${r.errors.length} error(s)`}**.
- Production readiness: **${r.prod.length} item(s) to fill** before launch (they are allowed in development).
- Indexable places (published and completeness ≥ ${pct(COMPLETENESS.threshold)}): **${r.scores.filter((s) => s.indexable).length} / ${r.scores.length}**. The others get \`noindex\` until filled.
- Images: ${c.images.length}, every one with a credit. Rights: ${count(c.images, (i) => i.rights)}.
- Sources: ${c.sources.length} (${c.sources.filter((s) => s.featured).length} shown as press). Types: ${count(c.sources, (s) => s.type)}.
${r.errors.length ? `\n## Errors\n${r.errors.map((e) => `- ${e}`).join('\n')}\n` : ''}
## Completeness per place
Key fields (${COMPLETENESS.keys.length}, from \`site.config.ts\`): ${COMPLETENESS.keys.map((k) => `\`${k}\``).join(', ')}.

| Place | Policy | Score | Indexed | Signature | Missing key fields | Estimates to confirm |
|---|---|---|---|---|---|---|
${r.scores.map(({ d, score, missing, indexable }) => `| ${d.name} (\`${d.id}\`) | ${d.location_policy ?? '—'} | ${pct(score)} | ${indexable ? 'yes' : 'no'} | ${d.signature_status ?? 'empty'} | ${missing.join(', ') || '—'} | ${d.estimated_fields.join(', ') || '—'} |`).join('\n')}

## Landing pages (computed: ${LANDING.min}+ published places)
${r.landings.map((l) => `- ${l.dimension_label} › **${l.label}**: ${l.listing_ids.length} places`).join('\n')}

## To fill before launch
${r.prod.map((p) => `- ${p}`).join('\n')}

## Worth adding (not blocking)
${r.worth.map((p) => `- ${p}`).join('\n')}

## Text to review (guide-only or closed places that still mention a meeting place or parking)
${r.textLeaks.length ? r.textLeaks.map((t) => `- ${t}`).join('\n') : '- none'}

Open questions and decisions to take are tracked in \`docs/OPEN_LOOPS.md\`; the design migration's choices in \`docs/DESIGN_MIGRATION.md\`.
`;
}
