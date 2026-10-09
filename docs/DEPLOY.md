# Putting the site online (Cloudflare Pages)

The GitHub workflow **Deploy** builds the site and puts it on Cloudflare. It creates what is missing by itself: the Pages project, the database for leads and clicks, its tables, and the server secrets. You only give it keys, once.

Until step 1 is done, every push still runs the checks, and the workflow says "Cloudflare is not connected yet". It doesn't fail.

## Step 0 · Don't create the app in the Cloudflare dashboard

The site is not created with Cloudflare's **Create application** button (it makes a "Worker" that builds from the top of the repository; its deploy step `npx wrangler deploy` fails here). GitHub creates the right project, a "Pages" project, by itself in step 2.

If you already created one: Cloudflare → **Workers & Pages** → click that app → **Settings** → at the bottom **Delete** → confirm. Otherwise it keeps building on every push and failing.

## Step 1 · Connect Cloudflare to GitHub (5 min, once)

1. Log in to **dash.cloudflare.com** (create a free account if needed).
2. **Account ID:** in the left menu, open **Workers & Pages**. The **Account ID** is in the right column. Copy it.
3. **API token:** click your profile icon (top right) → **My Profile** → **API Tokens** → **Create Token** → **Custom token** → **Get started**.
   - **Token name:** `GitHub deploy rivieres-canyons`.
   - **Permissions:** add these 2 lines.
     - `Account` · `Cloudflare Pages` · `Edit`
     - `Account` · `D1` · `Edit`
   - **Account Resources:** `Include` · your account.
   - **Continue to summary** → **Create Token**. Copy the token: it is shown only once.
4. On **github.com/crazymonkeys1/rivieres-canyons** → **Settings** → **Secrets and variables** → **Actions** → tab **Secrets** → **New repository secret**. Create two secrets:
   - `CLOUDFLARE_API_TOKEN` = the token
   - `CLOUDFLARE_ACCOUNT_ID` = the account ID

## Step 2 · First deployment (3 min)

1. On GitHub → **Actions** → **Deploy** → **Run workflow** → choose **deploy** → **Run workflow**.
2. When it is green, open the run. Its summary gives the site's address, for example `https://rivieres-canyons.pages.dev`, and the result of 8 checks on the live site.

That address works, but Google is told not to index it: only the real domain is indexed (phase 8).

## Step 3 · Bot protection for the form (Turnstile, 3 min)

1. Cloudflare → left menu **Turnstile** → **Add widget**.
   - **Widget name:** `Rivières & Canyons, top 5`.
   - **Hostnames:** the address from step 2 (e.g. `rivieres-canyons.pages.dev`). Add the real domain later.
   - **Widget mode:** `Managed`. Leave "pre-clearance" off.
   - **Create.**
2. Cloudflare then shows two keys. On GitHub → **Settings** → **Secrets and variables** → **Actions**:
   - tab **Variables** → **New repository variable** `PUBLIC_TURNSTILE_SITE_KEY` = the **site key**
   - tab **Secrets** → **New repository secret** `TURNSTILE_SECRET` = the **secret key**
3. Run **Deploy** again (step 2.1).

Without these two keys, the form works but has no bot check. The deployment summary warns about it.

## Step 4 · Visitor statistics (Web Analytics, 2 min, can wait for the domain)

1. Cloudflare → **Analytics & Logs** → **Web Analytics** → **Add a site**. Type the address, choose the **JavaScript snippet**, then **Done**.
2. In the snippet, copy the value after `"token":` (letters and numbers, without the quotes).
3. GitHub → **Variables** → `PUBLIC_CF_BEACON_TOKEN` = that value. Run **Deploy** again.

## Step 5 · Publish from Airtable (10 min)

The site updates itself in three ways:
- **every night** (3:17 in Guadeloupe), if something changed in Airtable;
- **on demand:** GitHub → Actions → Deploy → Run workflow → **publish-content**;
- **automatically** when a place is set to "Publié", with this Airtable automation:

1. **GitHub key for Airtable:** github.com → your photo → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**.
   - **Name:** `Airtable publish`. **Expiration:** 1 year.
   - **Repository access:** `Only select repositories` → `crazymonkeys1/rivieres-canyons`.
   - **Permissions** → **Repository permissions** → **Contents:** `Read and write`.
   - **Generate**, then copy the token.
2. **Airtable** (base `appQss9sjY59pUxtM`) → **Automations** → **Create automation**.
   - **Trigger:** `When a record matches conditions` · table **Lieux** · condition **Statut** `is` **Publié**.
   - **Action:** `Run a script`. Paste the script below, then replace `COLLER_LE_JETON_ICI` with the token.
   - **Test**, then turn the automation **on**.

```js
// Asks GitHub to pull the content and put the site online (workflow "Deploy").
const token = 'COLLER_LE_JETON_ICI';
const r = await fetch('https://api.github.com/repos/crazymonkeys1/rivieres-canyons/dispatches', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  body: JSON.stringify({ event_type: 'airtable-publish' }),
});
if (r.status !== 204) throw new Error(`GitHub a refusé (${r.status}) : ${await r.text()}`);
output.set('résultat', 'Publication demandée : le site est à jour dans 3 à 5 minutes.');
```

Only Orbit edits the base, so the token in the script is acceptable. Anyone who can edit automations can read it.

## What the workflow does, in order

1. If asked: it pulls Airtable. Invalid content is refused, and nothing is deployed.
2. It runs the checks: design, content, edge functions.
3. It prepares Cloudflare: project, database, tables, secrets.
4. It builds the site and runs the SEO check.
5. It uploads the site, then tests the live site.
6. It saves to GitHub the pulled content, the photos and the database ID.

## Later (phase 8)

- **Connect the domain:** Cloudflare → the Pages project → **Custom domains**. Then:
  - set the GitHub variable `SITE_URL` (e.g. `https://www.example.fr`);
  - add the domain to the Turnstile widget.
- **AI crawlers:** on the domain → **Security** → **Bots**, turn off **"Block AI bots"** (CLAUDE.md §10).
- **LEAD_ENDPOINT** (the Orbit CRM): one GitHub secret, then one deployment.
