# BargainFlights.eu

Public bargain-flight board for unusually cheap fares from Vienna, Budapest and Prague.

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
for normal personal use. Configure the following variables in Vercel:

- `INGEST_TOKEN`: a long random secret shared only with the local scanner.
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

The older Vercel KV names `KV_REST_API_URL` and `KV_REST_API_TOKEN` are also accepted.

See `VERCEL_DEPLOYMENT.md` for the complete deployment and scanner handoff.
