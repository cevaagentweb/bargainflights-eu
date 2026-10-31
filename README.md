# BargainFlights.eu

Public bargain-flight board for unusually cheap fares from Vienna, Budapest and Prague.

The live board groups current fares by destination or return-home city. Each location appears
once with its lowest fare; opening it reveals all fares from cheapest to most expensive, with
departure dates on each card. The sort control can switch both locations and their fares to
earliest departure first. The home-airport
filter covers both outbound departures and flights returning to that airport.

The site also includes a persistent active-and-expired deal archive at `/history`, grouped into
one expandable card per location. Each card summarizes the complete filtered history; opening
it loads that location's fares in price order, with more fares available inside the same card.
The archive keeps its past/active/gone filters and recorded dates. It also has journey-detail
pages that pair opposite one-way legs from the same market or selected nearby hubs, a long-form
guide at `/documentation`, an expansion-interest form, FAQ structured data, canonical metadata,
`robots.txt`, and an XML sitemap. Pair totals include only the displayed flight fares and are capped
at €120 for two budget-area legs, €440 for other nearer areas or €660 when a farther destination is involved; positioning travel and transfers are intentionally excluded.

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

## Monitored destinations

`data/price-policy.json` defines three destination tiers. Budget areas use strict limits below
€60 one way / €120 return; other nearer areas use below €221 / €440; farther mapped areas
use below €330 / €660, following the user's maps of 27 October 2026. Both scanners use these
tiers, including return-home flights, while Condor still requires Google's Low price evidence.
The budget alert region and its 24 airports were added on 31 October 2026, together with
Addis Ababa Bole, Ethiopia (ADD), in the standard tier. Other region selections and schedules
are unchanged. The current-deals API also applies the tiers to older feed entries; the history
archive preserves previous recorded fares. The private scanner keeps an
identical copy of this file as `price_policy.json` beside `price_policy.py`.

Budget airports are Tenerife South (TFS), Tenerife North (TFN), Gran Canaria (LPA),
Fuerteventura (FUE), Lanzarote (ACE), La Palma (SPC); Faro/Algarve (FAO); Tunis (TUN),
Monastir (MIR), Djerba (DJE), Enfidha-Hammamet (NBE); Istanbul (IST/SAW), Antalya (AYT),
İzmir (ADB), Dalaman (DLM), Bodrum (BJV), Ankara (ESB); and Agadir (AGA), Marrakech (RAK),
Casablanca (CMN), Fès (FEZ), Tangier (TNG), Rabat (RBA). Morocco now uses the budget tier.
The Condor timetable parser admits selected Canary and Faro airports without admitting
other Spanish or Portuguese destinations, and refreshes older timetable caches.

Airport names/codes were checked against [Aena](https://www.aena.es/es/aerolineas/aeropuertos-y-destinos/nuestros-aeropuertos.html),
[VINCI/ANA Faro](https://vinci-airports.com/en/our-airports/portugal/faro-airport/),
[ONDA](https://www.onda.ma/Je-suis-Passager/Guide-du-voyageur/R%C3%A9seau-a%C3%A9roportuaire),
[DHMİ](https://dhmi.gov.tr/Sayfalar/slot/Koordinasyon-Parametreleri.aspx), and
[Ethiopian Airlines](https://www.ethiopianairlines.com/services/services-at-the-airport/addis-ababa-airport).

The regional scanner covers Japan through Tokyo Narita (NRT), Tokyo Haneda (HND) and Osaka
Kansai (KIX); Rwanda through Kigali (KGL); Kenya through Mombasa (MBA); and Egypt through Cairo (CAI) and Sharm El Sheikh
(SSH), with a separate ground transfer for Dahab. South American coverage includes Bogotá
(BOG), Cartagena (CTG), Lima (LIM), São Paulo (GRU), Rio de Janeiro Galeão (GIG), Buenos Aires
Ezeiza (EZE), Recife (REC), Fortaleza (FOR) and Salvador (SSA). Central America includes
Panama City Tocumen (PTY) and San José, Costa Rica (SJO). Caribbean coverage includes
Port of Spain, Trinidad (POS), Tobago (TAB), Montego Bay (MBJ), Bridgetown, Barbados (BGI),
St. John's, Antigua (ANU), Punta Cana (PUJ), Santo Domingo (SDQ), Puerto Plata (POP),
Havana (HAV), Willemstad, Curaçao (CUR), Oranjestad, Aruba (AUA), Fort-de-France,
Martinique (FDF), and Pointe-à-Pitre, Guadeloupe (PTP).
Santiago, Chile (SCL) is no longer monitored by the regional scan.
The private scanner configuration and its selected alert regions control actual searches;
the public board shows a destination only after a fare qualifies.

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
