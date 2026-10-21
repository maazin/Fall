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
  _board.mjs            seasons and the Redis key prefix, shared by both routes
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

## Herbie's bus

Grandpa Herbie fell off a double-decker bus, his heart dropped, and he has not
seen a thing since. That bus now falls out of the sky, roughly once a round.

If it lands on you, you get his blindness for five seconds: the whole screen
goes dark except the patch around you, the same overlay Herbie plays with all
the time. It does not take a heart. The dark is the cost, because rain and
lightning keep falling while you cannot see them. When your sight comes back,
your heart comes back too, falling as a heart bubble right above you, so
catching it is how you recover from whatever the dark cost you.

- a shield blocks it, like any other hazard
- the purse clears it off the screen
- it never comes before fifteen seconds (or Pineapple's grace, if longer), never
  two at once, and never while a bus already has you in the dark
- it gives you the usual moment of grace, so you are not blinded and then
  rained on before you can move
- Herbie is blind before the bus ever comes; when its timer runs out he stays
  blind, though his heart still falls

`BUS_BLIND` in `src/game.js` is the length of the dark.

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
2. **Append** a `{ name, src }` entry to `CHARS` at the top of `src/game.js`.
   Append, never insert: the squad book and the per-buddy bests are keyed by
   position in that array, so slotting one into the middle silently re-labels
   every record after it.
3. Add the slug to `ROSTER` in `api/scores.mjs`, which is the divisor for the
   main board, and to `BUDDIES` in `sw.js` so it is cached offline.
4. Optionally give it a perk in `PERKS` (keyed by the same name).

### Pairs

Two characters can share one tile, swapped by tapping it twice: ME and Devin,
and Ronnie and his milk. Add a `[a, b]` to `SWAP_PAIRS` and the second of the
pair loses its own tile and lives behind the first.

A pair can also fall for each other, and only for each other. `pairOnly` makes
every single friend drop the partner, `pairRate` makes it a share of them, and
`pairPay` is what catching them is worth on top of the streak.

Ronnie and his milk are both in `PRIVATE_IDS`, which keeps them out of
`FALLABLE`, so neither appears in anybody else's sky; `pairOnly` is what puts
them in each other's. Play Ronnie and the only squishmallow that falls is a
carton of milk; play the milk and the only one that falls is Ronnie. Hazards,
stars and bubbles are untouched by any of this, so the sky still has everything
in it except other characters.

Two consequences worth knowing: Ronnie came off the `COWS` list that ME's
mimics wear, because a mimic in his face would have been the one way to see him
in somebody else's sky; and the Full squad badge counts `FALLABLE`, so it no
longer asks for either of the pair.

## Deploying

Push to GitHub with the repo connected to Vercel. Environment variables:

| Variable | Purpose |
| --- | --- |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Redis REST credentials for the scoreboard (the Upstash / `REDIS_REST_*` names are accepted too). Without them the board is disabled. |
| `BOARD_SEASON` | Optional. Pins the board to one season number instead of following the clock; unset to go back to the fortnightly rollover. |
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

Seasons last a fortnight and roll over on their own: the number comes from the
clock, anchored to a Monday midnight UTC so it always turns at the same time of
the same weekday, and every key sits under `fall:s<n>:`. Moving the prefix on is
the whole reset. Old seasons are given a 60-day TTL so they do not pile up.
`BOARD_SEASON` still overrides if you want to pin or replay one.

### Resetting the board

Two ways, and both act on the season that is live right now:

- **Bump `BOARD_RESET` in `api/_board.mjs` and deploy.** It is part of the key
  prefix, so the board is empty from the moment the deploy lands. Nothing is
  deleted: the old keys run out on their TTL, and setting the number back brings
  them straight back. The fortnightly rollover carries on on schedule.
- **`POST /api/reset`** with an `x-admin-token` header matching `ADMIN_TOKEN`.
  This one does delete.

Both routes take the prefix from `_board.mjs`. They used to work it out
separately, and after the move to seasons the reset route was deleting the old
pre-season keys while the live board sat untouched under a prefix it never
looked at, still answering 200.

`SEASON_CRITERIA` in `api/scores.mjs` lists the rankings the board rotates
through, one per season. It currently holds a single entry, so every season is
the squad average; add `'best'`, `'buddies'` or `'top5'` and it starts
alternating a fortnight at a time. All four are already implemented and all are
computed from the per-buddy bests, so none needs a bigger score payload.

The per-buddy sorted sets (`fall:b:<buddy>`, one best per player per character)
are the only thing stored. The main board is derived from them on read:

```
average = floor( (sum of your best with each character) / 20 )
```

Divided by the whole roster, not by however many you have tried, so characters
you have never played count as zero, and floored, because a leaderboard reads
better in whole numbers. One lucky run with one buddy is worth 300/20 = 15;
being decently good with eight of them beats it comfortably at 84. The
only way up is to go and get good with somebody new, and a bad run can never
cost you anything, because only your best with each character counts.

Deriving it rather than keeping a second sorted set in step means the board can
never disagree with the per-buddy boards, and it needed no migration when it
stopped being a max and started being a mean. The old `fall:best` key is left
alone and simply no longer read.

`ROSTER` in `api/scores.mjs` is the divisor and **must be kept in step with
`CHARS` in `src/game.js`** (twenty characters as of Ronnie's Milk). A character missing from it still gets its own
per-buddy board but contributes nothing to the main one.

Picking a single buddy from the dropdown still shows plain best runs for that
character — averaging is only how the overall board ranks.
