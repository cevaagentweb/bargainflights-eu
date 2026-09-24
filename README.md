# BargainFlights.eu

Public bargain-flight board for unusually cheap fares from Vienna, Budapest and Prague.

The site also includes a persistent active-and-expired deal archive at `/history`, journey-detail
pages that pair opposite one-way legs from the same market or selected nearby hubs, a long-form
guide at `/documentation`, an expansion-interest form, FAQ structured data, canonical metadata,
`robots.txt`, and an XML sitemap. Pair totals include only the displayed flight fares and are capped
at €440; positioning travel and transfers are intentionally excluded.

The homepage also has a separate flight-alert interest form. It collects consented addresses only;
it does not send emails. A small site-wide footer shows an approximate count of unique visitors
from the day the counter was introduced.

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

The live feed, both email interest lists and visitor counter share an Upstash Redis database.
Each list stores one deduplicated record per email address. Configure the following variables in Vercel:

- `INGEST_TOKEN`: a long random secret shared only with the local scanner.
- `WAITLIST_ADMIN_TOKEN`: a separate long random secret used to export the waitlist.
- `WAITLIST_CONTROLLER_NAME`: the person or organization responsible for the email lists and visitor counter.
- `WAITLIST_PRIVACY_EMAIL`: a working address for access and deletion requests.
- `VISITOR_HASH_SECRET`: an optional long, stable secret for pseudonymous visitor counting; if omitted, the ingest token or Redis token is used.
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

## Flight-alert interest list

The homepage form uses `POST /api/alerts`. It has its own consent wording and Redis key, so
airport-expansion subscribers are never silently added to it. It stores addresses for future
cheap-flight emails but sends nothing. It stays disabled until the same controller and privacy
contact fields are configured. `GET /api/alerts/status` reports whether signup is open.

Export this list with `GET /api/alerts` using `WAITLIST_ADMIN_TOKEN` (or `INGEST_TOKEN` if no
separate admin token is set). An authorized `DELETE /api/alerts` with JSON body
`{"email":"person@example.com"}` removes an address after a withdrawal request.

## Approximate visitor counter

The site loads `POST /api/visitors` once per page load and displays its returned count in the
footer. The server hashes the visitor's network address and browser user agent with a private
secret, then sends only the hash to a Redis HyperLogLog. No cookie, browser ID, raw address or
user agent is stored by this counter. `GET /api/visitors` reads the aggregate count. It starts
from zero when deployed, cannot reconstruct past traffic, and is an estimate rather than a
literal count of people. Keep `VISITOR_HASH_SECRET` stable if you set one.
