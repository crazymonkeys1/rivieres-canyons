// Layer 1 · Core: the only server code of a lead magnet (CLAUDE.md §4, §9), run as Cloudflare Pages Functions.
//   /go/{kind}/{id}  logs an outbound click, then redirects (booking with UTM, WhatsApp with a pre-filled message).
//   /api/lead        stores a lead in the fixed lead format (Turnstile-checked), and forwards it when LEAD_ENDPOINT is set.
// Site data (where each id goes) is a JSON file the site builds (`/go/targets.json`); nothing here knows a site.
// Privacy (docs/PRIVACY_CONTEXT.md §2): click logs keep kind, id, source page, UTM and time: no IP, no user agent.

// ---------- minimal Cloudflare types (no runtime dependency) ----------
export interface D1Like {
  prepare(sql: string): { bind(...values: unknown[]): { run(): Promise<unknown>; first<T = unknown>(): Promise<T | null> } };
}
export interface EdgeEnv {
  DB?: D1Like;
  ASSETS?: { fetch(input: Request | string): Promise<Response> };
  TURNSTILE_SECRET?: string;
  LEAD_ENDPOINT?: string;
  LEAD_ENDPOINT_TOKEN?: string;
}
export interface EdgeContext { request: Request; env: EdgeEnv; waitUntil(p: Promise<unknown>): void; params?: Record<string, string | string[]> }

/** What the site publishes at /go/targets.json. */
export interface GoTargets {
  site: string;                       // lead format "site" and utm_source
  home: string;                       // where an unknown id goes
  book: Record<string, { url: string; fallback: string; campaign: string }>;
  whatsapp: Record<string, { number: string; fallback: string; message: string; subjects: Record<string, string>; subject_default: string }>;
  lead: { magnets: string[]; sources: string[]; consent_versions: string[] };
}

const PLACEHOLDER = /\[[A-Z][A-Z0-9_]*\]/;
const now = () => new Date().toISOString();
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
const redirect = (to: string) => new Response(null, { status: 302, headers: { Location: to, 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });

let cache: GoTargets | null = null;
export async function loadTargets(ctx: EdgeContext): Promise<GoTargets> {
  if (cache) return cache;
  const url = new URL('/go/targets.json', ctx.request.url);
  const res = ctx.env.ASSETS ? await ctx.env.ASSETS.fetch(url.href) : await fetch(url.href);
  if (!res.ok) throw new Error(`targets.json: HTTP ${res.status}`);
  cache = await res.json() as GoTargets;
  return cache;
}
/** For tests. */
export const resetTargetsCache = () => { cache = null; };

/** The page a click came from: ?ref= (a path on this site), else the same-origin Referer, else null. */
export function sourcePage(request: Request): string | null {
  const u = new URL(request.url);
  const ref = u.searchParams.get('ref');
  if (ref && ref.startsWith('/') && !ref.startsWith('//')) return ref.slice(0, 300);
  const referer = request.headers.get('Referer');
  if (referer) { try { const r = new URL(referer); if (r.origin === u.origin) return r.pathname.slice(0, 300); } catch { /* ignore */ } }
  return null;
}
/** UTM parameters the visitor arrived with (kept on the click and the lead). */
export const utmOf = (params: URLSearchParams) => Object.fromEntries([...params].filter(([k]) => /^utm_[a-z]+$/.test(k)).map(([k, v]) => [k, v.slice(0, 100)]));

const isUsableUrl = (s: string) => !PLACEHOLDER.test(s) && /^https?:\/\//.test(s);

function logClick(ctx: EdgeContext, row: { kind: string; target: string; ref: string | null; utm: Record<string, string>; outcome: string }) {
  if (!ctx.env.DB) return;
  ctx.waitUntil(ctx.env.DB.prepare('INSERT INTO clicks (kind, target, ref, utm, outcome, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(row.kind, row.target, row.ref, JSON.stringify(row.utm), row.outcome, now()).run().catch((e) => console.error('click log failed:', (e as Error).message)));
}

/** GET /go/book/{id}/ and /go/whatsapp/{id}/?ref=… */
export async function handleGo(ctx: EdgeContext): Promise<Response> {
  const t = await loadTargets(ctx);
  const [kind, id] = new URL(ctx.request.url).pathname.split('/').filter(Boolean).slice(1);
  const ref = sourcePage(ctx.request);
  const utm = utmOf(new URL(ctx.request.url).searchParams);

  if (kind === 'book' && id && t.book[id]) {
    const b = t.book[id];
    const ok = isUsableUrl(b.url);
    const to = new URL(ok ? b.url : b.fallback);
    to.searchParams.set('utm_source', t.site);
    to.searchParams.set('utm_medium', 'referral');
    to.searchParams.set('utm_campaign', b.campaign);
    if (ref) to.searchParams.set('utm_content', ref);
    logClick(ctx, { kind, target: id, ref, utm, outcome: ok ? 'booking' : 'fallback' });
    return redirect(to.href);
  }
  if (kind === 'whatsapp' && id && t.whatsapp[id]) {
    const w = t.whatsapp[id];
    const ok = /^\d{8,15}$/.test(w.number);
    const subject = (ref && w.subjects[ref]) || w.subject_default;
    const to = ok ? `https://wa.me/${w.number}?text=${encodeURIComponent(w.message.replace('{subject}', subject))}` : w.fallback;
    logClick(ctx, { kind, target: id, ref, utm, outcome: ok ? 'whatsapp' : 'fallback' });
    return redirect(to);
  }
  logClick(ctx, { kind: kind ?? '', target: id ?? '', ref, utm, outcome: 'unknown' });
  return redirect(new URL(t.home, ctx.request.url).href);
}

// ---------- leads ----------
/** The fixed lead format (CLAUDE.md §9), plus the consent text version (PRIVACY_CONTEXT §4). */
export interface Lead {
  site: string; source: string; magnet: string; page: string; email: string; phone?: string | null;
  consent: boolean; consent_text: string; consent_text_version: string; utm: Record<string, string>; created_at: string;
}
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const PHONE = /^\+?[0-9 ().-]{6,22}$/;
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

async function turnstileOk(ctx: EdgeContext, token: string): Promise<'passed' | 'failed' | 'skipped'> {
  if (!ctx.env.TURNSTILE_SECRET) return 'skipped';   // previews without the secret; a production deploy sets it (phase 7)
  if (!token) return 'failed';
  const body = new FormData();
  body.append('secret', ctx.env.TURNSTILE_SECRET);
  body.append('response', token);
  const ip = ctx.request.headers.get('CF-Connecting-IP');   // sent to Cloudflare for the check only, never stored
  if (ip) body.append('remoteip', ip);
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  const j = await r.json() as { success?: boolean };
  return j.success ? 'passed' : 'failed';
}
const randomId = () => [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, '0')).join('');

/**
 * POST /api/lead (JSON).
 *   Step 1: { site, source, magnet, page, email, consent: true, consent_text, consent_text_version, utm, turnstile }
 *           → { ok, id, token }   (token lets the same visitor add a phone number, once)
 *   Step 2: { id, token, phone } → { ok }
 */
export async function handleLead(ctx: EdgeContext): Promise<Response> {
  if (ctx.request.method !== 'POST') return json({ ok: false, error: 'method' }, 405);
  let body: Record<string, unknown>;
  try { body = await ctx.request.json() as Record<string, unknown>; } catch { return json({ ok: false, error: 'format' }, 400); }
  if (!ctx.env.DB) return json({ ok: false, error: 'storage' }, 503);
  const t = await loadTargets(ctx);

  // Step 2: add the optional phone number to the lead created in step 1.
  if (body.id) {
    const id = str(body.id, 40), token = str(body.token, 40), phone = str(body.phone, 30);
    if (!PHONE.test(phone)) return json({ ok: false, error: 'phone' }, 400);
    const row = await ctx.env.DB.prepare('SELECT update_token FROM leads WHERE id = ?').bind(id).first<{ update_token: string | null }>();
    if (!row || !row.update_token || row.update_token !== token) return json({ ok: false, error: 'lead' }, 404);
    await ctx.env.DB.prepare('UPDATE leads SET phone = ?, update_token = NULL, updated_at = ? WHERE id = ?').bind(phone, now(), id).run();
    if (ctx.env.LEAD_ENDPOINT) ctx.waitUntil(forward(ctx, { id, phone, updated_at: now() }));
    return json({ ok: true });
  }

  // Step 1
  const lead: Lead = {
    site: str(body.site, 60), source: str(body.source, 60), magnet: str(body.magnet, 60), page: str(body.page, 300),
    email: str(body.email, 254).toLowerCase(), phone: null, consent: body.consent === true,
    consent_text: str(body.consent_text, 1000), consent_text_version: str(body.consent_text_version, 40),
    utm: typeof body.utm === 'object' && body.utm ? utmOf(new URLSearchParams(body.utm as Record<string, string>)) : {}, created_at: now(),
  };
  const problems = [
    lead.site !== t.site && 'site', !t.lead.magnets.includes(lead.magnet) && 'magnet', !t.lead.sources.includes(lead.source) && 'source',
    !lead.page.startsWith('/') && 'page', !EMAIL.test(lead.email) && 'email', !lead.consent && 'consent',
    (!lead.consent_text || !t.lead.consent_versions.includes(lead.consent_text_version)) && 'consent_text',
  ].filter(Boolean);
  if (problems.length) return json({ ok: false, error: problems[0] }, 400);
  const check = await turnstileOk(ctx, str(body.turnstile, 2048));
  if (check === 'failed') return json({ ok: false, error: 'bot' }, 403);

  const id = randomId(), token = randomId();
  await ctx.env.DB.prepare(`INSERT INTO leads (id, site, source, magnet, page, email, phone, consent, consent_text, consent_text_version, utm, bot_check, update_token, created_at)
    VALUES (?, ?, ?, ?, ?, ?, NULL, 1, ?, ?, ?, ?, ?, ?)`)
    .bind(id, lead.site, lead.source, lead.magnet, lead.page, lead.email, lead.consent_text, lead.consent_text_version, JSON.stringify(lead.utm), check, token, lead.created_at).run();
  if (ctx.env.LEAD_ENDPOINT) ctx.waitUntil(forward(ctx, { id, ...lead }));
  return json({ ok: true, id, token });
}

/** Later: the Orbit CRM (CLAUDE.md §9). A config change only: set LEAD_ENDPOINT (and LEAD_ENDPOINT_TOKEN). */
async function forward(ctx: EdgeContext, payload: Record<string, unknown>) {
  try {
    await fetch(ctx.env.LEAD_ENDPOINT!, {
      method: 'POST', body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json', ...(ctx.env.LEAD_ENDPOINT_TOKEN ? { Authorization: `Bearer ${ctx.env.LEAD_ENDPOINT_TOKEN}` } : {}) },
    });
  } catch { /* the lead is safe in D1; forwarding can be replayed */ }
}

/** D1 schema (also in the site's migrations folder). */
export const SCHEMA_SQL = `CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY, site TEXT NOT NULL, source TEXT NOT NULL, magnet TEXT NOT NULL, page TEXT NOT NULL,
  email TEXT NOT NULL, phone TEXT, consent INTEGER NOT NULL, consent_text TEXT NOT NULL, consent_text_version TEXT NOT NULL,
  utm TEXT NOT NULL DEFAULT '{}', bot_check TEXT NOT NULL, update_token TEXT, created_at TEXT NOT NULL, updated_at TEXT
);
CREATE TABLE IF NOT EXISTS clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, target TEXT NOT NULL, ref TEXT, utm TEXT NOT NULL DEFAULT '{}',
  outcome TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS clicks_target ON clicks (kind, target, created_at);
CREATE INDEX IF NOT EXISTS leads_created ON leads (created_at);`;
