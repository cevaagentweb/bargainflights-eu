# Vercel handoff for BargainFlights.eu

## Current production deployment (11 October 2026)

The original project now belongs to the `cevaagent-1009s-projects` Vercel account:

- Dashboard: https://vercel.com/cevaagent-1009s-projects/bargainflights-eu
- Project ID: `prj_nbNtgkTCAJ1A67frPLVzshMZpddO`
- GitHub: https://github.com/cevaagentweb/bargainflights-eu
- Production branch: `main`; pushes deploy in the new account.
- Live website: https://www.bargainflights.eu; the apex redirects there with HTTP 308.
- Framework: Next.js, with Node.js 24 and the default build settings.

Deployment history, production secrets, the scanner ingest token and visitor hashing key were
preserved by the account migration. The local `.vercel/project.json` also points to the new
account. This is a separate client project from FirmyAI and its showcase.

The existing legacy free Upstash database `upstash-kv-red-school` remains managed through
`johns-projects-81d361de`. Its credentials remain connected to the migrated website, preserving
the live feed, history, email interest lists and aggregate visitor count. Database ownership
needs a separate migration before that old integration or account is retired.

For a manual deployment from this checkout, use its ignored account configuration:

```powershell
npx --yes vercel@62.7.0 --prod --scope cevaagent-1009s-projects --global-config .vercel/account-cevaagent
```

On another computer, authenticate to the destination account and link to the existing project;
keep all credentials outside Git. The instructions below describe setting up a fresh installation.

## 1. Put the package on GitHub

Extract the delivery ZIP, create a new GitHub repository, and upload the extracted files at the
repository root. Do not upload the ZIP as a single file.

## 2. Import it into Vercel

Import the GitHub repository as a new Vercel project. Vercel should detect Next.js automatically.
The build command is `npm run build` and no output-directory override is required.

## 3. Add live-feed storage

Create or connect an Upstash Redis database through the Vercel Marketplace. Add these production
environment variables if the integration does not add them automatically:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

The code also accepts the legacy names `KV_REST_API_URL` and `KV_REST_API_TOKEN`.

Generate a strong random value and save it as the secret environment variable `INGEST_TOKEN`.
Generate another independent secret as `WAITLIST_ADMIN_TOKEN`; it protects both email-list
export endpoints.
Set `WAITLIST_CONTROLLER_NAME` to the person or organization responsible for the lists and
`WAITLIST_PRIVACY_EMAIL` to a working address for privacy requests. The form stays disabled until
Redis and both of these values are present.
Optionally set a long, stable `VISITOR_HASH_SECRET` for the approximate unique visitor counter.
Redeploy after adding or changing environment variables.

The same Redis database stores the expansion-interest list used by `/documentation`, the separate
flight-alert interest list on the homepage, and an aggregate visitor counter. No email service is
required while the goal is only to measure demand; the site does not send flight emails yet.

## 4. Connect the scanner

On the Windows computer containing `central_europe_flight_tracker`, run this from that folder:

```powershell
python -c "from site_publisher import configure; import getpass; configure('https://bargainflights.eu', getpass.getpass('Ingest token: ')); print('Configured')"
```

Enter the exact `INGEST_TOKEN` value when prompted. It is encrypted locally with Windows DPAPI and
is not committed to GitHub. Until the custom domain is active, use the Vercel production URL in the
command instead.

Run one alert scan or republish the latest archived match set to replace the seed feed. Every later
successful scan publishes all current qualifying deals, even when Telegram has no new notification.

## 5. Connect the domain

Add `bargainflights.eu` in the Vercel project Domains settings and follow the DNS records Vercel
shows for the domain provider. Remove conflicting web A/AAAA/CNAME records, but keep unrelated mail
records such as MX and email-verification TXT records.

## Security notes

- Never commit `.env` files or the ingest token.
- Keep `/api/ingest` protected with `INGEST_TOKEN`.
- The public site exposes only deal data and Google Flights links; Telegram credentials remain local.
