// Tests of the edge functions (/go/ redirects, /api/lead) with a fake site and a fake database: `pnpm edge:test`.
import { handleGo, handleLead, resetTargetsCache, type GoTargets, type EdgeEnv } from '../src/edge/index.ts';

const targets: GoTargets = {
  site: 'demo', home: '/',
  book: { trip: { url: 'https://op.test/book', fallback: 'https://op.test/', campaign: 'trip' }, draft: { url: '[BOOKING_URL_X]', fallback: 'https://op.test/', campaign: 'draft' } },
  whatsapp: {
    ana: { number: '590690000000', fallback: 'https://op.test/contact', message: 'Bonjour Ana, au sujet {subject}.', subjects: { '/places/falls/': 'de « Falls »' }, subject_default: "d'une sortie" },
    bob: { number: '[WHATSAPP_BOB]', fallback: 'https://op.test/contact', message: 'x {subject}', subjects: {}, subject_default: 'y' },
  },
  lead: { magnets: ['top5'], sources: ['listing'], consent_versions: ['v1'] },
};
const rows: { sql: string; values: unknown[] }[] = [];
let stored: Record<string, unknown> | null = null;
const DB = { prepare: (sql: string) => ({ bind: (...values: unknown[]) => ({
  run: async () => { rows.push({ sql, values }); if (sql.startsWith('INSERT INTO leads')) stored = { id: values[0], update_token: values[10] }; if (sql.startsWith('UPDATE leads') && stored) stored.update_token = null; },
  first: async <T>() => (stored && values[0] === stored.id ? stored as T : null),
}) }) };
const outbound: string[] = [];
globalThis.fetch = (async (u: string) => { outbound.push(String(u)); return new Response(JSON.stringify({ success: false })); }) as typeof fetch;

async function call(handler: typeof handleGo, url: string, env: EdgeEnv = {}, init?: RequestInit) {
  resetTargetsCache();
  const waits: Promise<unknown>[] = [];
  const res = await handler({ request: new Request(url, init), env: { ASSETS: { fetch: async () => new Response(JSON.stringify(targets)) }, DB, ...env }, waitUntil: (p) => { waits.push(p); } });
  await Promise.all(waits);
  return res;
}
let failed = 0;
const expect = (name: string, ok: boolean, detail = '') => { if (!ok) failed++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : ` · ${detail}`}`); };
const loc = (r: Response) => r.headers.get('Location') ?? '';
const post = (body: unknown) => ({ method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) });

// /go/book
let r = await call(handleGo, 'https://s.test/go/book/trip/?utm_source=fb', {}, { headers: { Referer: 'https://s.test/places/falls/' } });
expect('book: 302 to the booking URL with UTM', r.status === 302 && loc(r).startsWith('https://op.test/book?utm_source=demo&utm_medium=referral&utm_campaign=trip&utm_content=%2Fplaces%2Ffalls%2F'), loc(r));
expect('book: click logged with source page and visitor UTM, no IP', JSON.stringify(rows.at(-1)?.values).includes('/places/falls/') && JSON.stringify(rows.at(-1)?.values).includes('fb') && !/\d+\.\d+\.\d+\.\d+/.test(JSON.stringify(rows.at(-1))));
r = await call(handleGo, 'https://s.test/go/book/draft/');
expect('book: placeholder URL falls back to the company site', loc(r).startsWith('https://op.test/?'), loc(r));
r = await call(handleGo, 'https://s.test/go/book/evil/');
expect('book: unknown id goes home', loc(r) === 'https://s.test/', loc(r));
r = await call(handleGo, 'https://s.test/go/book/trip/', {}, { headers: { Referer: 'https://other.test/x' } });
expect('book: a foreign Referer is ignored', !loc(r).includes('utm_content'), loc(r));
// /go/whatsapp
r = await call(handleGo, 'https://s.test/go/whatsapp/ana/?ref=/places/falls/');
expect('whatsapp: wa.me with the place in the message', decodeURIComponent(loc(r)).includes('wa.me/590690000000?text=Bonjour Ana, au sujet de « Falls ».'), loc(r));
r = await call(handleGo, 'https://s.test/go/whatsapp/ana/?ref=//evil.test/');
expect('whatsapp: generic subject when the page is unknown', decodeURIComponent(loc(r)).includes("au sujet d'une sortie"), loc(r));
r = await call(handleGo, 'https://s.test/go/whatsapp/bob/');
expect('whatsapp: placeholder number falls back to the contact page', loc(r) === 'https://op.test/contact', loc(r));
// /api/lead
const lead = { site: 'demo', source: 'listing', magnet: 'top5', page: '/', email: 'Ana@Test.fr', consent: true, consent_text: 'J’accepte…', consent_text_version: 'v1', utm: { utm_source: 'fb', other: 'x' } };
r = await call(handleLead, 'https://s.test/api/lead', {}, post(lead));
const j = await r.json() as { ok: boolean; id: string; token: string };
expect('lead: step 1 stored', r.status === 200 && j.ok && !!j.id && !!j.token, JSON.stringify(j));
const ins = rows.find((x) => x.sql.startsWith('INSERT INTO leads'))!;
expect('lead: e-mail lowercased, only utm_* kept, consent and version stored', ins.values.includes('ana@test.fr') && ins.values.includes('{"utm_source":"fb"}') && ins.values.includes('v1'), JSON.stringify(ins.values));
r = await call(handleLead, 'https://s.test/api/lead', {}, post({ id: j.id, token: j.token, phone: '+590 690 00 00 00' }));
expect('lead: step 2 adds the phone', r.status === 200);
r = await call(handleLead, 'https://s.test/api/lead', {}, post({ id: j.id, token: j.token, phone: '0690000000' }));
expect('lead: the phone token works once', r.status === 404);
for (const [name, body] of [['no consent', { ...lead, consent: false }], ['bad e-mail', { ...lead, email: 'x' }], ['other site', { ...lead, site: 'x' }], ['unknown consent version', { ...lead, consent_text_version: 'v0' }], ['not JSON', 'hello']] as const) {
  r = await call(handleLead, 'https://s.test/api/lead', {}, post(body));
  expect(`lead: refused when ${name}`, r.status === 400, String(r.status));
}
r = await call(handleLead, 'https://s.test/api/lead', { TURNSTILE_SECRET: 's' }, post(lead));
expect('lead: refused without a bot-check token when Turnstile is on', r.status === 403);
r = await call(handleLead, 'https://s.test/api/lead', { TURNSTILE_SECRET: 's' }, post({ ...lead, turnstile: 'tok' }));
expect('lead: refused when Cloudflare rejects the token', r.status === 403 && outbound.some((u) => u.includes('siteverify')));
r = await call(handleLead, 'https://s.test/api/lead', { LEAD_ENDPOINT: 'https://crm.test/in' }, post(lead));
expect('lead: forwarded when LEAD_ENDPOINT is set', r.status === 200 && outbound.includes('https://crm.test/in'));
r = await call(handleLead, 'https://s.test/api/lead', { DB: undefined }, post(lead));
expect('lead: 503 without a database (never pretends to store)', r.status === 503);

console.log(failed ? `edge:test · ${failed} failed` : 'edge:test · pass');
process.exit(failed ? 1 : 0);
