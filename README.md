# Fall — Squish Squad Catch

A 60-second arcade game: slide your squishmallow buddy around and catch the squad
falling out of the sky. Plain HTML, CSS and JavaScript — no build step — plus two
small Vercel serverless functions for the shared scoreboard.

## Layout

```
index.html              page markup only; loads the stylesheet and script below
manifest.webmanifest    PWA manifest (home-screen install)
sw.js                   service worker; caches the game so it plays offline
src/
  styles.css            all styles
  game.js               the whole game: roster, perks, modes, audio, boards, loop
assets/
  buddies/*.webp        one image per character, referenced from CHARS in game.js
  icons/                favicon / apple-touch-icon / manifest icons
  og.png                link preview image
api/
  scores.mjs            GET/POST shared scoreboard (per-buddy bests; the main board averages them)
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

## Controls

- **Mouse / trackpad:** the buddy follows the pointer.
- **Touch:** drag anywhere — the buddy moves as far as your thumb does (×1.35), so
  your thumb can sit in a bottom corner instead of on top of the buddy. A tap on
  its own does nothing.
- **Keyboard:** ← → or A / D. `P` or `Esc` pauses.

The rules live on the **How to play** screen, reachable from the title.

## Offline

`sw.js` precaches the page, the stylesheet, the script and all nineteen buddies,
so the game is playable with no signal once it has been opened once. The
scoreboard routes (`/api/*`) are never cached.

**Bump `VERSION` in `sw.js` on every deploy.** Precached files are keyed by it,
so a new version re-fetches everything and drops the old cache; without a bump a
returning player keeps the previous CSS and JS until a background refresh
catches up on their next visit.

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

## Scoring

Catches are worth the multiplier; the rest of the score is paid at the end of a
full round. Hearts you still hold pay `heartPay` each, which runs *against* the
difficulty's heart count so that bravery is worth something:

| | hearts | per heart | survival pot | brave bonus |
| --- | --- | --- | --- | --- |
| Chill | 5 | 7 | 35 | — |
| Normal | 3 | 12 | 36 | +18% of catches |
| Storm | 2 | 20 | 40 | +36% of catches |

A flat rate paid Chill 60 against Storm's 24, which made the gentlest setting
the highest-scoring one at any realistic score. Note the shared board still
mixes all four mode/difficulty combinations into one ranking, and Endless never
earns the survival pot at all — separate boards are the fix, not done yet.

## The shared board

The per-buddy sorted sets (`fall:b:<buddy>`, one best per player per character)
are the only thing stored. The main board is derived from them on read:

```
average = (sum of your best with each character) / 19
```

Divided by the whole roster, not by however many you have tried, so characters
you have never played count as zero. One lucky run with one buddy is worth
300/19 ≈ 15.8; being decently good with eight of them beats it comfortably. The
only way up is to go and get good with somebody new, and a bad run can never
cost you anything, because only your best with each character counts.

Deriving it rather than keeping a second sorted set in step means the board can
never disagree with the per-buddy boards, and it needed no migration when it
stopped being a max and started being a mean. The old `fall:best` key is left
alone and simply no longer read.

`ROSTER` in `api/scores.mjs` is the divisor and **must be kept in step with
`CHARS` in `src/game.js`**. A character missing from it still gets its own
per-buddy board but contributes nothing to the main one.

Picking a single buddy from the dropdown still shows plain best runs for that
character — averaging is only how the overall board ranks.
