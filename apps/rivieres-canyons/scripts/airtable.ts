// Airtable base for Rivières & Canyons.
//   pnpm airtable:export   writes airtable/SPEC.md + airtable/csv/*.csv from the content, and checks the round trip
//                          (content → CSV → content must be identical, so nothing is lost on import)
//   pnpm airtable:build    creates a NEW base in a workspace (AIRTABLE_WORKSPACE_ID), fills it with the content,
//                          reads it back and compares; writes airtable/map.json and airtable/BUILD_REPORT.md
//                          (refuses if map.json already names a base, unless --force)
//   pnpm airtable:link     once the base exists: matches its tables and fields to the spec, saves their IDs
//                          in airtable/map.json (needs AIRTABLE_TOKEN and AIRTABLE_BASE_ID)
//   pnpm content:pull      reads the base through the API into content/fixtures/, then run the content checks
import { readFileSync, writeFileSync, appendFileSync, mkdirSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Codec, writeCsv, readCsv, checkImportable, fetchBase, linkBase, createBase, pushRows, addMissingFields, clearTables, type Row, type Table, type Field, type BaseMap } from '@orbit/core/airtable';
import { TABLES, NAMES, toTables, fromTables } from '../src/content/airtable';
import { contentSchema, type Content } from '../src/content/schema';
import { checkContent } from '../src/content/check';

const here = dirname(fileURLToPath(import.meta.url));
const app = resolve(here, '..');
const fixtures = resolve(app, 'content/fixtures');
const outDir = resolve(app, 'airtable');
const cmd = process.argv[2];

const readFixtures = () => Object.fromEntries(readdirSync(fixtures).filter((f) => f.endsWith('.json'))
  .map((f) => [f.replace(/\.json$/, ''), JSON.parse(readFileSync(resolve(fixtures, f), 'utf8'))])) as Content;

/** Airtable-shaped rows (labels, primary values) → logical rows (keys). */
function toLogical(shaped: Record<string, Row[]>, errors: string[]): Record<string, Row[]> {
  const codec = new Codec(TABLES, shaped, errors);
  return Object.fromEntries(TABLES.map((t) => [t.id, (shaped[t.id] ?? []).map((row, i) => {
    const where = `${t.name} « ${row[t.primary] ?? `ligne ${i + 2}`} »`;
    return Object.fromEntries(t.fields.map((fd) => [fd.name, codec.in(fd, row[fd.name] ?? null, where)]));
  })]));
}

/** Logical rows → content, catching format errors with the row they come from. */
function build(logical: Record<string, Row[]>, errors: string[]): Content | null {
  const before = errors.length;
  const content = fromTables(logical, errors);
  return errors.length > before ? null : content;
}

/** Order-insensitive JSON, to compare two contents. */
const canon = (v: unknown): unknown => Array.isArray(v) ? v.map(canon)
  : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canon((v as any)[k])])) : v;
/** Airtable does not keep row order: compare each collection sorted by its key (order inside a record is kept). */
const byIdentity = (c: Content) => Object.fromEntries(Object.entries(c).map(([k, list]) => [k,
  [...(list as any[])].sort((x, y) => String(x.id ?? x.key).localeCompare(String(y.id ?? y.key)))]));
function firstDiff(a: unknown, b: unknown, path = ''): string | null {
  if (JSON.stringify(canon(a)) === JSON.stringify(canon(b))) return null;
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      const d = firstDiff((a as any)[k], (b as any)[k], `${path}.${k}`);
      if (d) return d;
    }
  }
  return `${path}: ${JSON.stringify(a)?.slice(0, 120)} ≠ ${JSON.stringify(b)?.slice(0, 120)}`;
}

const TYPE_LABEL: Record<string, string> = {
  singleLineText: 'Single line text', multilineText: 'Long text', number: 'Number', checkbox: 'Checkbox', date: 'Date (ISO or European)',
  url: 'URL', email: 'Email', phoneNumber: 'Phone number', singleSelect: 'Single select', multipleSelects: 'Multiple select',
  multipleRecordLinks: 'Link to another record', multipleAttachments: 'Attachment', singleCollaborator: 'User',
  multipleCollaborators: 'User (several)', formula: 'Formula', count: 'Count', multipleLookupValues: 'Lookup',
};
const EDIT_LABEL = { all: '', orbit: 'Orbit', tech: 'Tech' } as const;
const CLIENT_LABEL = { none: 'hidden', read: 'read only', comment: 'read + comment', own: 'edit their own rows', all: 'edit' } as const;
const esc = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
const csvName = (t: Table, i: number) => `${String(i + 1).padStart(2, '0')} ${t.name}.csv`;

function typeCell(fd: Field) {
  const base = TYPE_LABEL[fd.type];
  if (fd.link) return `${base} → **${fd.link}**${fd.single ? ' (one record)' : ''}`;
  if (fd.options) return `${base}: ${fd.options.map((o) => o.label).join(' · ')}`;
  if (fd.type === 'number') return `${base}${fd.decimals ? ` (${fd.decimals} decimals)` : ' (integer)'}`;
  return base;
}

function spec(counts: Record<string, number>) {
  const linkSteps = TABLES.flatMap((t) => t.fields.filter((fd) => fd.link && !fd.helper).map((fd) => `${t.name} · ${fd.name} → ${fd.link}`));
  return `# Airtable base: Rivières & Canyons

Generated by \`pnpm airtable:export\` from the content schema and \`site.config.ts\`. Do not edit by hand: the base and the site are described in one place (\`src/content/airtable.ts\`), so they cannot drift.
Design and reasoning: \`docs/AIRTABLE_BASE_DESIGN.md\`.

## 1. Create the base
**Recommended (2 min):** GitHub → repository → **Actions** → **Airtable** → **Run workflow**, job \`build-new-base\`, with your workspace ID (\`wsp…\`). It needs the repository secret \`AIRTABLE_TOKEN\` (scopes \`data.records:read\`, \`data.records:write\`, \`schema.bases:read\`, \`schema.bases:write\`, access to the workspace). The job creates every table and field, writes the content, reads it back, and saves \`airtable/BUILD_REPORT.md\` and \`airtable/map.json\`. Then add the few helper fields it lists (step 5 below).

**By hand (fallback, about 30 min):**
1. In your Business workspace, create an empty base **Rivières & Canyons — Contenu**.
2. Import each file of \`apps/rivieres-canyons/airtable/csv/\` **in numeric order**: **+ Add or import → CSV file → Create a new table**. Name the table exactly as the file (without the number). Check the row count against §3.
3. For each table, set the field types listed in §3 (field header → **Edit field**). Do every non-link field first, then the links.
4. **Links last.** Converting a text column to **Link to another record** matches each value with the target table's first column. The export checked that every value matches exactly once, so no new record should appear. If a target table's row count grows, undo (Ctrl+Z) and tell Claude.
5. Add the helper fields (§3, "Helper"): the formula is printed in full; reverse links are created by Airtable.
6. Delete the default "Table 1".
7. Create a personal access token (scopes \`data.records:read\`, \`schema.bases:read\`, access to this base only) and give it to Claude with the base ID (the \`app…\` part of the base URL). Claude runs \`pnpm airtable:link\` and \`pnpm content:pull\`.

## 2. Who does what (Business plan)
| Who | Airtable role | What they see |
|---|---|---|
| Orbit technical owner | Creator | Everything; only role that changes tables and fields |
| Orbit team | Editor | Interface "Orbit · Contenu" + grids. Fields marked **Orbit** below: Orbit only |
| Guides and operators (the clients) | Interface-only, Editor | Interface "Mon espace": their outings, their guide profile, their company, their photos; places and articles read-only with comments |

- **Field permissions** (Field → Edit field → Permissions): fields marked **Tech** are editable by Creators only; fields marked **Orbit** by Orbit's people only.
- **Their rows only:** the "Mon espace" pages filter on *Comptes contains current user* (Sorties: lookup "Comptes" through Opérateur; Guides: "Compte Airtable"; Opérateurs: "Comptes"). Interface-only collaborators never see the base itself. Airtable has no hard row-level security: this keeps each guide in their own rows, and the build refuses anything invalid.
- **Nothing reaches the site without a check:** every update runs the content checks; an error stops the update and the current site stays online.

## 3. Tables
${TABLES.map((t, i) => `### ${i + 1}. ${t.name} · ${counts[t.id] ?? 0} rows · file \`${csvName(t, i)}\`
${t.about} Clients: ${CLIENT_LABEL[t.client]}. First column: **${t.primary}**.

| Field | Type | Who edits | Help |
|---|---|---|---|
${t.fields.map((fd) => `| ${fd.helper ? '*Helper:* ' : ''}${esc(fd.name)} | ${esc(typeCell(fd))}${fd.formula ? `<br>\`${esc(fd.formula)}\`` : ''} | ${fd.helper ? '' : EDIT_LABEL[fd.edit ?? 'all']} | ${esc(fd.help ?? '')} |`).join('\n')}
`).join('\n')}
## 4. Link conversions (step 4), in this order
${linkSteps.map((s) => `- ${s}`).join('\n')}

When converting a criteria link, set **Limit record selection to a view**: "${NAMES.criterion} · ${NAMES.listing}" for ${NAMES.listing}, "${NAMES.criterion} · ${NAMES.offer}" for ${NAMES.offer} (views filtered on "S'applique à").

## 5. Views and interface pages
- **${NAMES.listing}:** "À compléter" (Ce qui manque is not empty) · "Brouillons" (Statut = Brouillon) · "Rejetés" (check here before adding a place).
- **${NAMES.image}:** "Droits à obtenir" (Droits = Autorisation à obtenir) · gallery view.
- **${NAMES.offer}:** one view per operator.
- **Interface "Orbit · Contenu":** one page per job: Lieux (record page grouped by section: Contenu, Repères, Lieu, Accès, Sécurité, Suivi, Titres, SEO; FAQ and photos inline), Sorties, Photos, Articles (with their sections and FAQ), Critères, Textes du site, "Nouveau lieu" form (Nom, Type, Communes, Statut = Brouillon).
- **Interface "Mon espace" (clients):** Mes sorties (edit; Statut, Lieu, Opérateur, Principale and Slug read-only), Mon profil (Guides), Mon entreprise (Opérateurs), Mes photos, Lieux (read + comment: "Signaler une info").
`;
}

async function main() {
  if (cmd === 'export') {
    const content = readFixtures();
    const parsed = contentSchema.safeParse(content);
    if (!parsed.success) throw new Error(`fixtures invalid: run pnpm content:check first (${parsed.error.issues[0].path.join('.')}: ${parsed.error.issues[0].message})`);
    const errors: string[] = [];
    const logical = toTables(content);
    errors.push(...checkImportable(TABLES, logical));
    const codec = new Codec(TABLES, logical, errors);
    rmSync(resolve(outDir, 'csv'), { recursive: true, force: true });
    mkdirSync(resolve(outDir, 'csv'), { recursive: true });
    const shaped: Record<string, Row[]> = {};
    TABLES.forEach((t, i) => {
      const csv = writeCsv(t, logical[t.id], codec);
      writeFileSync(resolve(outDir, 'csv', csvName(t, i)), csv);
      shaped[t.id] = readCsv(t, csv); // read back exactly as Airtable would import it
    });
    // Round trip: CSV → content must equal the content we started from.
    const back = build(toLogical(shaped, errors), errors);
    if (back) {
      const diff = firstDiff(byIdentity(content), byIdentity(back));
      if (diff) errors.push(`round trip differs at ${diff}`);
    }
    writeFileSync(resolve(outDir, 'SPEC.md'), spec(Object.fromEntries(TABLES.map((t) => [t.id, logical[t.id].length]))));
    console.log(`airtable: ${TABLES.length} tables · ${TABLES.reduce((n, t) => n + t.fields.length, 0)} fields · ${Object.values(logical).reduce((n, r) => n + r.length, 0)} rows · round trip ${errors.length ? 'FAILED' : 'identical'}`);
    for (const e of errors) console.error('ERROR', e);
    if (errors.length) process.exit(1);
    return;
  }
  const token = process.env.AIRTABLE_TOKEN?.trim(), baseId = process.env.AIRTABLE_BASE_ID;
  const mapFile = resolve(outDir, 'map.json');
  if (cmd === 'build' || cmd === 'reset') {
    const reset = cmd === 'reset';
    const errors: string[] = [], log: string[] = [];
    // Accept the bare ID or a pasted Airtable link: keep the wsp… part.
    const workspaceId = process.env.AIRTABLE_WORKSPACE_ID?.match(/wsp[A-Za-z0-9]{14}/)?.[0];
    const name = process.env.AIRTABLE_BASE_NAME?.trim() || 'Rivières & Canyons — Contenu';
    if (!token) errors.push('The GitHub secret AIRTABLE_TOKEN is missing or empty (Settings → Secrets and variables → Actions → New repository secret, name exactly AIRTABLE_TOKEN).');
    else if (!token.startsWith('pat')) errors.push('The secret AIRTABLE_TOKEN does not look like an Airtable personal access token (it should start with "pat").');
    const existing = existsSync(mapFile) ? (JSON.parse(readFileSync(mapFile, 'utf8')) as BaseMap).base_id : null;
    if (reset) {
      if (!existing) errors.push('airtable/map.json is missing: there is no base to reset (use build-new-base).');
      if (process.env.AIRTABLE_CONFIRM?.trim() !== 'RESET') errors.push('Type RESET in the "confirm" field: this job deletes every row of the base and writes the content again.');
    } else if (!workspaceId) errors.push(`No workspace ID found in "${process.env.AIRTABLE_WORKSPACE_ID ?? ''}": paste the ID that starts with "wsp" (or the whole link of the workspace page).`);
    if (!reset && existing && !process.argv.includes('--force'))
      errors.push(`airtable/map.json already names base ${existing}: refusing to create a second base (use the reset job to fix that one).`);
    const content = readFixtures();
    const logical = toTables(content);
    const codec = new Codec(TABLES, logical, errors);
    const report = (status: string, baseId?: string) => writeFileSync(resolve(outDir, 'BUILD_REPORT.md'), `# Airtable build report

Run on ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC by \`pnpm airtable:${cmd}\`. Status: **${status}**.
${baseId ? `\nBase: **${name}** · ID \`${baseId}\` · https://airtable.com/${baseId}\n` : ''}
${log.map((l) => `- ${l}`).join('\n')}
${errors.length ? `\n## Problems\n${errors.map((e) => `- ${e}`).join('\n')}\n` : ''}`);
    if (errors.length) { report('not started'); finish(); }
    try {
      let baseId: string;
      if (reset) {
        baseId = existing!;
        const { added, problems } = await addMissingFields(TABLES, baseId, token!);
        errors.push(...problems);
        log.push(added.length ? `Fields added: ${added.join(', ')}.` : 'No field was missing.');
      } else {
        const created = await createBase(TABLES, workspaceId!, name, token!);
        baseId = created.baseId; errors.push(...created.problems);
        log.push(`Base created with ${TABLES.length} tables.`);
      }
      const linked = await linkBase(TABLES, baseId, token!);
      writeFileSync(mapFile, JSON.stringify(linked.map, null, 2) + '\n');
      errors.push(...linked.problems);
      if (reset) log.push(`Rows deleted before writing again: ${await clearTables(TABLES, linked.map, token!)}.`);
      const counts = await pushRows(TABLES, linked.map, logical, codec, token!);
      log.push(`Rows written: ${TABLES.map((t) => `${t.name} ${counts[t.id]}`).join(' · ')}.`);
      // Read everything back through the API and compare with the content we sent.
      const back = build(toLogical(await fetchBase(TABLES, linked.map, token!), errors), errors);
      const diff = back && firstDiff(byIdentity(content), byIdentity(back));
      if (diff) errors.push(`read-back differs at ${diff}`);
      else if (back) log.push('Read back through the API: identical to the content sent.');
      const byHand = TABLES.flatMap((t) => t.fields.filter((fd) => fd.helper && ['formula', 'count', 'multipleLookupValues'].includes(fd.type)).map((field) => ({ table: t.name, field })));
      log.push(`To add by hand (Airtable's API cannot create them): ${byHand.map((m) => `${m.table} · ${m.field.name}${m.field.formula ? ' (formula in SPEC.md)' : ''}`).join('; ')}.`);
      report(errors.length ? 'done with problems' : 'done', baseId);
    } catch (e) {
      errors.push((e as Error).message);
      report('failed');
    }
    finish();
    function finish(): never {
      const text = readFileSync(resolve(outDir, 'BUILD_REPORT.md'), 'utf8');
      console.log(text);
      // Shown on the run's page in GitHub.
      if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
      process.exit(errors.length ? 1 : 0);
    }
  }
  if (!token) throw new Error('AIRTABLE_TOKEN is missing');
  if (cmd === 'verify') {
    // Read-only: is the base identical to the content in the repository?
    const map = JSON.parse(readFileSync(mapFile, 'utf8')) as BaseMap;
    const errors: string[] = [];
    const back = build(toLogical(await fetchBase(TABLES, map, token), errors), errors);
    const diff = back && firstDiff(byIdentity(readFixtures()), byIdentity(back));
    if (diff) errors.push(`the base differs from the repository at ${diff}`);
    const text = `# Airtable check\n\nBase \`${map.base_id}\`, read on ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC: **${errors.length ? 'differences found' : 'identical to the repository'}**.\n${errors.map((e) => `\n- ${e}`).join('')}\n`;
    console.log(text);
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
    process.exit(errors.length ? 1 : 0);
  }
  if (cmd === 'link') {
    if (!baseId) throw new Error('AIRTABLE_BASE_ID is missing');
    const { map, problems } = await linkBase(TABLES, baseId, token);
    writeFileSync(mapFile, JSON.stringify(map, null, 2) + '\n');
    console.log(`airtable:link: ${Object.keys(map.tables).length}/${TABLES.length} tables linked`);
    for (const p of problems) console.error('MISSING', p);
    if (problems.length) process.exit(1);
    return;
  }
  if (cmd === 'pull') {
    if (!existsSync(mapFile)) throw new Error('airtable/map.json is missing: run pnpm airtable:link first');
    const map = JSON.parse(readFileSync(mapFile, 'utf8')) as BaseMap;
    const errors: string[] = [];
    const content = build(toLogical(await fetchBase(TABLES, map, token), errors), errors);
    if (content) {
      const r = checkContent(content);
      errors.push(...r.errors);
      if (!errors.length) for (const [k, v] of Object.entries(content)) writeFileSync(resolve(fixtures, `${k}.json`), JSON.stringify(v, null, 2) + '\n');
    }
    console.log(`content:pull: ${errors.length ? 'refused, the fixtures are unchanged' : 'fixtures updated'}`);
    for (const e of errors) console.error('ERROR', e);
    if (errors.length) process.exit(1);
    return;
  }
  throw new Error('usage: airtable.ts export | build | link | pull');
}
main().catch((e) => { console.error(e.message); process.exit(1); });
