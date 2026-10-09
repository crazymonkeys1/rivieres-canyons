// Cloudflare deployment, run by the GitHub workflow "Deploy" (this workspace cannot reach Cloudflare; GitHub can).
//   prepare  checks the keys, creates what is missing (Pages project, D1 database), applies the database migrations,
//            sets the server secrets, and tells the build which address the site has.
//   deploy   uploads dist/ (pages + functions), then checks the live site answers as it should.
// Everything it does is written to the GitHub step summary in plain language.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { resolve } from 'node:path';

const app = resolve(import.meta.dirname, '..');
const PROJECT = 'rivieres-canyons';
const DATABASE = 'rivieres-canyons';
const tomlFile = resolve(app, 'wrangler.toml');
const cmd = process.argv[2];
const lines: string[] = [];
const say = (s: string) => { lines.push(s); console.log(s); };
const summary = (title: string) => {
  const text = `# ${title}\n\n${lines.map((l) => `- ${l}`).join('\n')}\n`;
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
};
const output = (k: string, v: string) => { if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${k}=${v}\n`); };
const wrangler = (args: string[], input?: string) =>
  execFileSync('npx', ['wrangler', ...args], { cwd: app, encoding: 'utf8', input, env: { ...process.env, WRANGLER_SEND_METRICS: 'false' }, stdio: ['pipe', 'pipe', 'pipe'] });
const fail = (title: string, why: string): never => { say(`**Stopped:** ${why}`); summary(title); process.exit(1); };

if (cmd === 'prepare') {
  const title = 'Cloudflare: preparation';
  const missing = ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID'].filter((k) => !process.env[k]?.trim());
  if (missing.length) {
    for (const k of ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID']) say(`GitHub secret \`${k}\`: ${missing.includes(k) ? '**not found**' : 'found'}.`);
    say('Add the missing one under GitHub → Settings → Secrets and variables → **Actions** → tab **Secrets** → **New repository secret**, with exactly this name (docs/DEPLOY.md, step 1). '
      + 'Not under "Environments", "Codespaces" or "Dependabot", and not in the **Variables** tab: the workflow cannot read those.');
    // On a push the checks still matter, so the run stays green with a warning; asked by hand, by Airtable or at night it must fail visibly.
    const asked = process.env.GITHUB_EVENT_NAME && process.env.GITHUB_EVENT_NAME !== 'push';
    console.log(`::${asked ? 'error' : 'warning'} title=Cloudflare not connected::Missing GitHub secret(s): ${missing.join(', ')}. Nothing was deployed.`);
    output('ready', 'false'); summary(title); process.exit(asked ? 1 : 0);
  }
  try {
    // 1. Pages project (its address is <subdomain>.pages.dev; Cloudflare adds a suffix when the name is taken).
    const errText = (e: unknown) => { const x = e as { stderr?: string; stdout?: string; message: string }; return `${x.stderr ?? ''}${x.stdout ?? ''}` || x.message; };
    /** Cloudflare sometimes answers "unknown error" once: try again before giving up. */
    const retry = async <T>(what: string, f: () => T): Promise<T> => {
      for (let i = 1; ; i++) {
        try { return f(); } catch (e) {
          if (i >= 3) throw Object.assign(new Error(`${what}: ${errText(e).slice(0, 1200)}`), { step: what });
          await new Promise((r) => setTimeout(r, 8000 * i));
        }
      }
    };
    const list = () => JSON.parse(wrangler(['pages', 'project', 'list', '--json'])) as Record<string, string>[];
    let project = (await retry('read the list of Pages projects', list)).find((p) => (p['Project Name'] ?? p.name) === PROJECT);
    if (!project) {
      try {
        await retry('create the Pages project', () => wrangler(['pages', 'project', 'create', PROJECT, '--production-branch', 'main']));
      } catch (e) {
        fail(title, `Cloudflare refused to create the Pages project « ${PROJECT} ». Its answer:\n\n\`\`\`\n${(e as Error).message}\n\`\`\`\n`
          + 'Reading the list of projects worked, so the key is right. Usual causes, in this order:\n'
          + `1. A Worker named « ${PROJECT} » still exists (the app created on 2026-10-09 with the dashboard): Workers & Pages → it → Settings → Delete.\n`
          + '2. The Cloudflare account e-mail is not verified: look for the yellow banner in the dashboard, or My Profile → e-mail.\n'
          + '3. Pages has never been opened on this account: Workers & Pages → Create → Pages tab, just look, no need to create anything.\n'
          + 'Then run Deploy again.');
      }
      project = list().find((p) => (p['Project Name'] ?? p.name) === PROJECT);
      say(`Pages project « ${PROJECT} » created.`);
    } else say(`Pages project « ${PROJECT} » found.`);
    const domains = String(project?.['Project Domains'] ?? project?.domains ?? '');
    const pagesHost = domains.split(/[,\s]+/).find((d) => d.endsWith('.pages.dev')) ?? `${PROJECT}.pages.dev`;

    // 2. D1 database, and its id written into wrangler.toml (committed by the workflow).
    let toml = readFileSync(tomlFile, 'utf8');
    const current = toml.match(/database_id = "([^"]+)"/)?.[1] ?? '';
    if (/^0{8}-/.test(current)) {
      const existing = (JSON.parse(wrangler(['d1', 'list', '--json'])) as { name: string; uuid: string }[]).find((d) => d.name === DATABASE);
      let id = existing?.uuid;
      if (!id) {
        const out = wrangler(['d1', 'create', DATABASE]);
        id = out.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)?.[0];
        if (!id) fail(title, `the database was created but its id was not found in Cloudflare's answer:\n\n${out}`);
        say(`Database « ${DATABASE} » created.`);
      } else say(`Database « ${DATABASE} » found.`);
      toml = toml.replace(/database_id = "[^"]+"/, `database_id = "${id}"`);
      writeFileSync(tomlFile, toml);
      say('Database id saved in `apps/rivieres-canyons/wrangler.toml`.');
    } else say(`Database « ${DATABASE} » already linked.`);

    // 3. Migrations (only the new ones run).
    const applied = wrangler(['d1', 'migrations', 'apply', DATABASE, '--remote']);
    say(/No migrations to apply/i.test(applied) ? 'Database tables: up to date.' : 'Database tables: migrations applied.');

    // 4. Server secrets, from GitHub secrets (never written anywhere else).
    for (const name of ['TURNSTILE_SECRET', 'LEAD_ENDPOINT', 'LEAD_ENDPOINT_TOKEN']) {
      const value = process.env[name];
      if (value) { wrangler(['pages', 'secret', 'put', name, '--project-name', PROJECT], value); say(`Secret ${name}: set.`); }
      else if (name === 'TURNSTILE_SECRET') say('**Secret TURNSTILE_SECRET is missing: the form works but its bot check is skipped** (docs/DEPLOY.md, step 3).');
    }
    const siteUrl = process.env.SITE_URL || `https://${pagesHost}`;
    say(`The build uses the address ${siteUrl}${process.env.SITE_URL ? '' : ' (the preview address; set the variable SITE_URL when the domain is connected)'}.`);
    output('ready', 'true'); output('site_url', siteUrl); output('pages_host', pagesHost);
    summary(title);
  } catch (e) {
    const err = e as { stderr?: string; message: string };
    fail(title, `Cloudflare refused a step. Its answer:\n\n\`\`\`\n${(err.stderr || err.message).slice(0, 1500)}\n\`\`\`\nIf the failed step is « read the list of Pages projects »: the key or the account ID is wrong, or the token lacks the permission « Cloudflare Pages · Edit » (docs/DEPLOY.md, step 1).`);
  }
}

if (cmd === 'deploy') {
  const title = 'Cloudflare: deployment';
  const host = process.env.PAGES_HOST!;
  try {
    const out = wrangler(['pages', 'deploy', 'dist', '--project-name', PROJECT, '--branch', 'main',
      '--commit-hash', process.env.GITHUB_SHA ?? '', '--commit-message', (process.env.COMMIT_MESSAGE ?? 'deploy').slice(0, 200)]);
    const url = out.match(/https:\/\/[a-z0-9.-]+\.pages\.dev/)?.[0];
    say(`Uploaded. This deployment: ${url ?? '(address not found in the output)'} · the site: https://${host}`);
  } catch (e) {
    const err = e as { stderr?: string; message: string };
    fail(title, `the upload failed:\n\n\`\`\`\n${(err.stderr || err.message).slice(0, 1500)}\n\`\`\``);
  }
  // Smoke test of the live site (a new deployment can take a few seconds to answer everywhere).
  const base = `https://${host}`;
  const expectations: [string, (r: Response) => boolean, string][] = [
    ['/', (r) => r.status === 200, 'home page answers 200'],
    ['/destinations/canyon-dore/', (r) => r.status === 200, 'a place page answers 200'],
    ['/robots.txt', (r) => r.status === 200, 'robots.txt is served'],
    ['/sitemap.xml', (r) => r.status === 200, 'sitemap.xml is served'],
    ['/page-qui-n-existe-pas/', (r) => r.status === 404, 'an unknown address answers 404'],
    ['/go/book/acomat/', (r) => r.status === 302, '« Réserver » redirects (302)'],
    ['/go/whatsapp/pascal/?ref=/', (r) => r.status === 302, '« Écrire à Pascal » redirects (302)'],
    ['/', (r) => /noindex/i.test(r.headers.get('X-Robots-Tag') ?? ''), 'the .pages.dev address is hidden from Google (X-Robots-Tag: noindex)'],
  ];
  let bad = 0;
  for (const [path, ok, label] of expectations) {
    let pass = false, status = 0;
    for (let i = 0; i < 6 && !pass; i++) {
      try { const r = await fetch(base + path, { redirect: 'manual' }); status = r.status; pass = ok(r); } catch { /* retry */ }
      if (!pass) await new Promise((r) => setTimeout(r, 5000));
    }
    if (!pass) bad++;
    say(`${pass ? '✅' : '❌'} ${label} (${path} → ${status})`);
  }
  summary(title);
  process.exit(bad ? 1 : 0);
}
