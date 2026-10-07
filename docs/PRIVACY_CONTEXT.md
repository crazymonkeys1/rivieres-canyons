# Privacy page: context for the build (text to be generated later)

**Status:** the privacy policy text does not exist yet and will be generated later by Jordan. **Do not write or paraphrase legal text.** Build everything around it so it can be dropped in. This file records the facts of what the site does with data, as designed on 2026-10-06, and what is still unknown.

## 1. Where it appears
- `/confidentialite` (page G in `DESIGN_SYSTEM.md`, DocumentTemplate).
- Linked from the consent checkbox in `LeadCapture` ("Politique de confidentialité") and from the footer.
- Language: French. Guadeloupe is an overseas department of France, so GDPR applies.

## 2. Processing facts (as designed)
| Data / event | Why | Where it goes | Basis | Retention |
|---|---|---|---|---|
| E-mail (LeadCapture step 1) | Send the "top 5" and outing tips from Pascal and Quentin by e-mail | Cloudflare D1 now; forwarded to the Orbit CRM later (`LEAD_ENDPOINT`) | Explicit consent (unticked checkbox) | **TBD** |
| Phone, optional (step 2) | The WhatsApp surprise | Same as above | Explicit consent | **TBD** |
| Consent record: `consent`, `consent_text` (+ `consent_text_version`), `created_at`, `page`, `source`, `magnet`, `utm` | Proof of consent | Same record | Legal obligation | **TBD** |
| Bot check (Cloudflare Turnstile) on the form | Prevent abuse | Cloudflare | Legitimate interest | Cloudflare's |
| Audience statistics (Cloudflare Web Analytics) | Understand usage | Cloudflare; cookieless, no consent banner needed for it | Legitimate interest | Cloudflare's |
| Outbound click logs: `/go/book/{offer}` and `/go/whatsapp/{guide}` | Measure which outings and guides get interest | Our edge function log | Legitimate interest | **TBD**. Default: store offer or guide, source page, UTM, timestamp; **no IP, no user agent** |
| WhatsApp link (`wa.me`) | The visitor chooses to message a guide | Leaves the site for WhatsApp; the number reaches the guide only if the visitor sends the message | n/a (user action) | n/a |
| Booking link | The visitor chooses to book | Leaves the site for the operator's own site; their policy applies | n/a (user action) | n/a |
| Video lightbox (YouTube embeds) | Show videos | Loads third-party resources when played. Build as **click-to-load** (privacy-enhanced domain) so nothing loads before the click | Consent by action | n/a |
| Fonts, images | n/a | **Self-hosted**: no third-party request at page load | n/a | n/a |

Rights and withdrawal: one-click unsubscribe in every e-mail; the consent text already says so.

## 3. Open items (Jordan, before the text is generated)
- Legal entity that is the data controller: name, address, contact e-mail.
- Retention periods (leads, consent records, click logs).
- E-mail sending provider (if any) and its hosting region.
- Whether Pascal and Quentin are joint controllers or recipients of the leads.
- Date and version label of the text, and how a new version triggers a new `consent_text_version`.

## 4. Build rules
1. Content lives in the `blocks` entity under key `privacy_policy`, with `status: placeholder | final`. While `placeholder`, the page shows the single token `[PRIVACY_POLICY_TEXT]`, has `noindex`, and the **production build fails** (it is a `[...]` placeholder).
2. The page uses DocumentTemplate: `text-display` title, `text-read` prose in the 680px column, H2 per section with an `id`, a table of contents when there are 4+ sections, "Dernière mise à jour : {date}" in `text-caption` muted. No new styles: if the generated text needs headings, lists or links, use `text-heading`, `text-subheading`, `text-read`, `TextLink`.
3. The consent link target must exist in every build, even when the text is a placeholder.
4. `consent_text_version` is stored with every lead and changes only when the consent wording changes.
5. Do not add analytics, tracking pixels, third-party scripts or cookies that are not in §2 without asking Jordan: each one changes this page.
6. Ask Jordan before changing any row in §2.
