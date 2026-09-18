# Lead handling

Every lead form on the site posts to `POST /api/lead`, which filters spam and
then fans out to whichever delivery channels are configured. Nothing is
hardcoded per client: a new site works as soon as the env vars are set.

## Per-client setup (about two minutes)

The agency runs **one SendGrid account**. Its verified sender works for every
client immediately, so there is no DNS step to get leads flowing:

```
SENDGRID_API_KEY      the agency key
SENDGRID_FROM_EMAIL   the agency's verified sender, e.g. team@dmrmedia.org
LEAD_NOTIFY_EMAIL     where leads go; comma-separated for several people
```

Set those three in Vercel, redeploy, done. Every form on the site now delivers.

Later, when the client wants mail to come from their own domain, authenticate
it in SendGrid and change `SENDGRID_FROM_EMAIL`. That is the only thing that
needs their DNS, and it is not required to launch.

## Optional channels

```
LEAD_WEBHOOK_URL              Zapier/Make catch hook -> the client's CRM
LEAD_AUTORESPONDER=1          instant acknowledgement to the lead
                              (leave off until the client's domain is authenticated,
                              or it arrives from the agency's address)
TWILIO_ACCOUNT_SID            SMS to the agent (needs A2P 10DLC registration first)
TWILIO_API_KEY_SID            preferred over the account auth token
TWILIO_API_KEY_SECRET
TWILIO_MESSAGING_SERVICE_SID  the registered sender
LEAD_NOTIFY_SMS               the agent's mobile, E.164
```

With none of these set the site still works: leads are accepted, logged
server-side, and the visitor sees a normal thank-you. The log line reads
`[Lead] NOT DELIVERED <formType>` and carries the full payload, so nothing is
lost while setup is pending.

## What ships wired

| Form | Where | formType |
|---|---|---|
| Footer newsletter | every page | `newsletter` |
| Contact form | the `connect` page | `contact` |
| Listing enquiry | every listing detail page | `listing-inquiry` |
| Valuation wizard | the `sell` page | `home-value` |

All four go through `useLeadSubmit`, which is the single submit path: it
attaches click-id attribution, sets the enhanced-conversion identifiers, fires
the analytics event and owns the status machine. Add a new form by calling that
hook, never by writing another `fetch("/api/lead")`.

## Qualification

`lib/leads/qualify.ts` decides `[QUALIFIED]` / `[DQ]` / `[NEW]` for the email
subject, the verdict badge, the SMS gate and the analytics value. Rules are
real-estate generic:

- **Buyers** qualify on financing. Price point is deliberately not a
  disqualifier: a modest budget with cash in hand beats a big number without.
- **Sellers** qualify unless already represented. That one is not only
  commercial — soliciting a seller under contract with another broker is off
  limits, and the footer disclosures say so.
- Forms with no qualifying questions get `[NEW]`, never `[DQ]`. A listing
  enquiry is high intent by definition and marking it "not qualified" trains
  the agent to skip exactly the wrong emails.

Only qualified leads trigger SMS. An alert that fires on every submission is
one the agent learns to ignore.

## Spam

Honeypot decoys plus a heuristic filter (`lib/spam-filter.ts`) plus per-IP rate
limiting in `middleware.ts`. Blocked submissions get the same success-shaped
response as real ones, so a bot gets no signal to retune. No CAPTCHA.

The honeypot's hiding rule lives in `app/globals.css` and must stay global:
the component renders on every page via the footer, and a page-scoped rule
leaves the decoy "Company" and "Website" inputs visible to real visitors.
