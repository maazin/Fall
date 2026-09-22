# Fall — Squish Squad Catch

A 60-second arcade game: slide your squishmallow buddy around and catch the squad
falling out of the sky. Plain HTML, CSS and JavaScript — no build step — plus two
small Vercel serverless functions for the shared scoreboard.

## Layout

```
index.html              page markup only; loads the stylesheet and script below
manifest.webmanifest    PWA manifest (home-screen install)
src/
  styles.css            all styles
  game.js               the whole game: roster, perks, modes, audio, boards, loop
assets/
  buddies/*.webp        one image per character, referenced from CHARS in game.js
  icons/                favicon / apple-touch-icon / manifest icons
  og.png                link preview image
api/
  scores.mjs            GET/POST shared scoreboard (one best row per player, per-buddy boards)
  reset.mjs             POST admin wipe of the current season's board
```

## Running locally

Everything is relative-path, so opening `index.html` straight from disk works for
the game itself. The shared board needs the API, which means running under Vercel:

```bash
npx vercel dev
```

Any static server (`python3 -m http.server`, etc.) also works if you don't need
the global board — the page just shows the local best-runs list.

## Adding a buddy

1. Drop a `.webp` into `assets/buddies/`.
2. Add a `{ name, src }` entry to `CHARS` at the top of `src/game.js`.
3. Optionally give it a perk in `PERKS` (keyed by the same name).

## Deploying

Push to GitHub with the repo connected to Vercel. Environment variables:

| Variable | Purpose |
| --- | --- |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Redis REST credentials for the scoreboard (the Upstash / `REDIS_REST_*` names are accepted too). Without them the board is disabled. |
| `BOARD_SEASON` | Optional. Bump to start a fresh, empty board without deleting the old one; set it back to restore. |
| `ADMIN_TOKEN` | Optional. Enables `POST /api/reset` with an `x-admin-token` header. Unset means the route refuses everything. |
