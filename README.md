# BargainFlights.eu

Public bargain-flight board for unusually cheap fares from Vienna, Budapest and Prague.

The site also includes a persistent active-and-expired deal archive at `/history`, journey-detail
pages that pair opposite one-way legs from the same market or selected nearby hubs, a long-form
guide at `/documentation`, an expansion-interest form, FAQ structured data, canonical metadata,
`robots.txt`, and an XML sitemap. Pair totals include only the displayed flight fares and are capped
at €440; positioning travel and transfers are intentionally excluded.

This package is prepared for GitHub and Vercel. The browser reads the current feed from
`GET /api/deals`, while the private Windows scanner replaces that feed through the protected
`POST /api/ingest` endpoint after every successful scan.

## Local development

1. Install Node.js 22.
2. Run `npm ci`.
3. Run `npm run dev`.
4. Open `http://localhost:3000`.

Without Redis credentials the site safely displays the included three-deal Zanzibar seed feed.

## Production services

The live feed uses one Redis string, so the free tier of an Upstash Redis integration is sufficient
for normal personal use. The expansion waitlist shares the same database and stores one deduplicated
record per email address. Configure the following variables in Vercel:

- `INGEST_TOKEN`: a long random secret shared only with the local scanner.
- `WAITLIST_ADMIN_TOKEN`: a separate long random secret used to export the waitlist.
- `WAITLIST_CONTROLLER_NAME`: the legal person or company responsible for the list.
- `WAITLIST_PRIVACY_EMAIL`: a working address for access and deletion requests.
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

The older Vercel KV names `KV_REST_API_URL` and `KV_REST_API_TOKEN` are also accepted.

See `VERCEL_DEPLOYMENT.md` for the complete deployment and scanner handoff.

## Expansion waitlist

`POST /api/waitlist` validates consent and email syntax, rejects a hidden bot field, rate-limits
repeated submissions with a 24-hour pseudonymous key, and deduplicates addresses with Redis
`HSETNX`.

Export the count and records with an authorization header:

```powershell
curl.exe -H "Authorization: Bearer <WAITLIST_ADMIN_TOKEN>" https://bargainflights.eu/api/waitlist
```

The form remains disabled until Redis and both privacy fields are configured. It links to
`/privacy`, which displays the configured controller and contact address. Resend is intentionally
not required for the first phase;
it can be added later when there is enough interest to justify sending expansion announcements.
