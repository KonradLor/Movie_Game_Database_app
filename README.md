# Media Databank

A personal, self-hosted web portal to catalogue the movies, series, anime,
documentaries and games you have watched and played — when, how many times,
and what you thought of them. Built as a modern, dark **bento / glassmorphism**
gallery with poster tiles, categories, search, statistics and privacy controls.

> ⚠️ **Proprietary software.** This project is **not** open source. Usage,
> copying, deployment or modification requires the prior written consent of the
> author. See [LICENSE](./LICENSE).

---

## Features

- 🎬 **Catalogue** movies, series, anime, documentaries and games as poster tiles.
- 🔎 **Auto metadata** from **TMDB** (films/series) and **IGDB** (games, optional),
  with a **local write-through cache** — once fetched, data is stored in your own
  database and the portal works autonomously, independent of those APIs.
- ✍️ **Full editing** through the portal: title, year, duration, description,
  rating, personal opinion, dates, watch count, tags — or fully manual entries.
- 👤 **People & companies**: open an actor / director / studio, click
  *"More information"* to fetch and cache their full filmography.
- 🔒 **Three privacy levels** (public / unlisted / private). Public visitors see
  only public items; the admin (via SSO) sees everything and can edit.
- 🔑 **Authentication** via **Authentik OIDC** (single sign-on; Google login flows
  through Authentik). Admin determined by e-mail allowlist.
- 📊 **Statistics**: totals, hours watched, distribution by category and rating.
- 📝 **Watchlist** ("want to watch") with one-click "mark as watched".
- 🎲 **Random picker**, **"On this day"**, and **JSON / CSV export** of your data.
- 🌐 **i18n ready**: Lithuanian now, structured to add German / English later.
- 🖥️ **Desktop-first**: phones show a polite "open on a computer" notice.

## Tech stack

- **Next.js 15** (App Router, React 19, TypeScript)
- **Tailwind CSS v4**
- **Prisma 6** + **PostgreSQL**
- **Auth.js (NextAuth v5)** with the Authentik provider
- **next-intl** for internationalisation
- **Docker** (multi-stage, ARM64) + **Caddy** reverse proxy for deployment

## Getting started (local development)

> Requires Node.js and a local PostgreSQL instance.

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#    Fill in: TMDB token, DATABASE_URL, AUTH/Authentik values, etc.

# 3. Apply the database schema
npx prisma migrate deploy   # or: npx prisma migrate dev

# 4. (optional) seed example data
npm run db:seed

# 5. Run the dev server
npm run dev                 # http://localhost:3000
```

For local development without SSO, set `DEV_ADMIN=true` in `.env`. This admin
bypass works **only** outside production (`NODE_ENV !== "production"`).

## Environment variables

See [`.env.example`](./.env.example). Secrets (`.env`) are never committed.

| Variable | Purpose |
| --- | --- |
| `TMDB_READ_TOKEN` / `TMDB_API_KEY` | TMDB metadata |
| `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` | IGDB (games) via Twitch |
| `AUTHENTIK_ISSUER` / `AUTHENTIK_CLIENT_ID` / `AUTHENTIK_CLIENT_SECRET` | OIDC login |
| `AUTH_SECRET` | Auth.js session secret |
| `ADMIN_EMAIL` | E-mail granted admin rights |
| `DATABASE_URL` / `POSTGRES_PASSWORD` | PostgreSQL connection |

## Deployment

Designed to run as a Docker service behind an existing Caddy reverse proxy
(automatic HTTPS) on a subdomain, with its own isolated PostgreSQL container.
See `docker-compose.yml` and `Dockerfile`.

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB.

## License

Proprietary — All Rights Reserved. Use only with the author's written consent.
See [LICENSE](./LICENSE).

---

## Lietuviškai (santrauka)

**Media Databank** — asmeninis, savame serveryje talpinamas portalas filmams,
serialams, anime, dokumentikai ir žaidimams, kuriuos žiūrėjai ar žaidei,
katalogizuoti: kada, kiek kartų ir kaip patiko. Modernus tamsus **bento /
glass** dizainas su plytelėmis, kategorijomis, paieška, statistika ir privatumo
valdymu.

> ⚠️ **Nuosavybinė programinė įranga.** Tai **ne** atviro kodo projektas.
> Naudoti, kopijuoti, diegti ar modifikuoti galima tik gavus išankstinį
> rašytinį autoriaus sutikimą. Žr. [LICENSE](./LICENSE).

**Pagrindinės funkcijos:**
- Filmų/serialų/anime/dokumentikos/žaidimų katalogas plytelėmis.
- Automatiniai metaduomenys iš **TMDB** (ir **IGDB** žaidimams) su **lokaliu
  kešavimu** — po pirmo parsiuntimo viskas saugoma tavo duomenų bazėje ir
  portalas veikia autonomiškai.
- Pilnas redagavimas per portalą arba rankinis įvedimas (įvertinimas, nuomonė,
  datos, kiek kartų žiūrėta, žymos).
- **Asmenys ir kompanijos**: aktoriaus/režisieriaus/studijos puslapiai su
  „Daugiau informacijos" (filmografija, kešuojama).
- **Trijų lygių privatumas** (viešas / tik su nuoroda / privatus).
- **Prisijungimas** per **Authentik OIDC** (SSO; Google login eina per Authentik).
- **Statistika**, **watchlist**, **atsitiktinis parinkėjas**, **„Šią dieną"**,
  **JSON/CSV eksportas**.
- Paruošta kalboms (dabar LT, vėliau DE/EN).
- Skirta kompiuteriui; telefone rodomas mandagus pranešimas.

**Technologijos:** Next.js 15, React 19, TypeScript, Tailwind v4, Prisma 6 +
PostgreSQL, Auth.js (Authentik), next-intl, Docker + Caddy.

**Licencija:** nuosavybinė, visos teisės saugomos — naudojimas tik su autoriaus
rašytiniu sutikimu.
