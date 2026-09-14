# Vercel handoff for BargainFlights.eu

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
Redeploy after adding or changing environment variables.

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
