# Fall — Squish Squad Catch

An endless arcade game: slide your squishmallow buddy around and catch the squad
falling out of the sky for as long as your hearts last. Plain HTML, CSS and JavaScript — no build step — plus two
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

`sw.js` precaches the page, the stylesheet, the script, every buddy and the
weather sprites, so the game is playable with no signal once it has been opened
once. The scoreboard routes (`/api/*`) are never cached.

Online, the game's files are always fetched fresh (network first, and the
browser is told to revalidate rather than trust its own HTTP cache), so a deploy
reaches players on their next visit and the page, the script and the art always
match. The cache is only used offline, or when the network takes longer than
`NET_WAIT` to answer. Bump `VERSION` in `sw.js` when the list of files changes,
so the old cache is dropped; ordinary content changes no longer need a bump.

## Weather art

The rain, lightning, storm and bus sprites are standalone files in
`assets/weather/`, each carrying its own gradients. They used to be inline SVG
in `game.js` pointing at gradients defined once in `index.html`, which meant a
phone running a cached `index.html` with a newer `game.js` drew them with no
fill at all: a white outline with a face on it. To change one, edit its `.svg`
directly.

## Adding a buddy

1. Drop a `.webp` into `assets/buddies/`.
2. **Append** a `{ name, src }` entry to `CHARS` at the top of `src/game.js`.
   Append, never insert: the squad book and the per-buddy bests are keyed by
   position in that array, so slotting one into the middle silently re-labels
   every record after it.
3. Add the slug to `ROSTER` in `api/scores.mjs`, so it counts on the main
   board, and to `BUDDIES` in `sw.js` so it is cached offline.
4. Optionally give it a perk in `PERKS` (keyed by the same name).
5. Put its name in a tier in `TIERS`, in order of power. Left out, it joins
   the last tier at that tier's price.

## Starters, tiers and mallows

A new player chooses one of three starters, and everyone else is locked.
The rest are bought with **mallows**, little marshmallows that are the game's
currency, one tier at a time: a tier only opens once you own two buddies from
the tier below (`TIER_GATE`), so nobody can save up and jump straight to the
top. The picker runs tier by tier, weakest at the top, with the buddies that
bend the game most at the bottom.

| Tier | Price each | Buddies |
| --- | --- | --- |
| 1 Starters | choose 1 free, 15 for the others | Omar, Sophie, Pep |
| 2 Squishlings | 25 | Lazy Harp Seal, Butt Nugget, Grandpa Herbie |
| 3 Sprouts | 35 | Pip, Cheryl, Prissy |
| 4 Snugglers | 50 | Harmony, Connor, Carrie |
| 5 Champions | 65 | Pineapple, Mel, Blueberry Cow |
| 6 Legends | 80 | Bessie, Mamu, Ronnie (his milk comes with him) |
| 7 Mythic | 100 | Mooni, ME (Devin comes with her), Poppy |

Every tier after the starters holds three buddies, the same as the starters.

The only way to earn mallows is to catch them: they float down during a run
(`MALLOW_RATE` of spawns once the first few seconds are over), and catching
one does not touch your score or streak. Nothing is paid out for points or
badges. A decent minute-long run catches three to five.

That puts the second starter about four runs away, so the first unlock comes
early, and then the prices climb: reaching Mythic means owning two buddies in
every tier below it, which is a long-term goal. Every run still drops some
mallows, so the loop always pays, but you have to go and get them.

A locked tile is greyed and priced; a tile in a tier that is not open yet is
darker and just says its tier. Its perk still reads in full either way, and the
play button turns into the unlock button or says what you need first. The
results screen says how far you are from the next buddy you can buy.

Mallows and unlocks live on the phone, like the squad book, under
`squishMallows` and `squishUnlocked`.

### Starting everyone over

`SAVE_VERSION` at the top of `src/game.js` is the local equivalent of
`BOARD_RESET`. Bump it and every phone clears its squad book, badges, bests,
saved runs, mallows and unlocks the first time it loads the new version, and
goes back to choosing a starter. Sound, flash and difficulty settings and the
board name are kept. Version 2 is the relaunch with starters and tiers, which
went out with `BOARD_RESET = 2` so the global board started over at the same
time.

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
| `BOARD_SEASON` | Optional. Pins the board to one season number instead of following the clock; unset to go back to the monthly rollover. |
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
the highest-scoring one at any realistic score.

Endless is now the only mode (nobody played the 60 second one), and an Endless
run ends when the hearts do, so the survival pot above is never paid any more:
the brave bonus is what separates the difficulties. The round-mode code is left
in `game.js` so runs saved under it still read "60s" on the scores screen.

## The shared board

Seasons last a calendar month and roll over on their own at midnight UTC on the
1st: season 1 is January 2026 and the number counts months from there, so it
comes from the clock and nobody has to remember to bump it. Every key sits under
`fall:m<n>r<reset>:` (the `m` keeps monthly numbers clear of the old fortnightly
`fall:s<n>` keys). Moving the prefix on is the whole reset. Old seasons are given
a 75-day TTL so last month is still there to look at but they do not pile up.
`BOARD_SEASON` still overrides if you want to pin or replay one.

### Resetting the board

Two ways, and both act on the season that is live right now:

- **Bump `BOARD_RESET` in `api/_board.mjs` and deploy.** It is part of the key
  prefix, so the board is empty from the moment the deploy lands. Nothing is
  deleted: the old keys run out on their TTL, and setting the number back brings
  them straight back. The monthly rollover carries on on schedule.
- **`POST /api/reset`** with an `x-admin-token` header matching `ADMIN_TOKEN`.
  This one does delete.

Both routes take the prefix from `_board.mjs`. They used to work it out
separately, and after the move to seasons the reset route was deleting the old
pre-season keys while the live board sat untouched under a prefix it never
looked at, still answering 200.

`SEASON_CRITERIA` in `api/scores.mjs` lists the rankings the board rotates
through, one per season. It currently holds a single entry, so every season is
the top ten average; add `'average'`, `'best'`, `'buddies'` or `'top5'` and it starts
alternating a month at a time. All five are already implemented and all are
computed from the per-buddy bests, so none needs a bigger score payload.

The per-buddy sorted sets (`fall:b:<buddy>`, one best per player per character)
are the only thing stored. The main board is derived from them on read:

```
top ten = floor( (sum of your best with your ten strongest characters) / 10 )
```

Always divided by ten, so with fewer than ten played the gaps count as zero,
and floored, because a leaderboard reads better in whole numbers. One lucky run
of 300 with one buddy is worth 30; being decently good with ten of them beats
it. A bad run can never cost you anything, because only your best with each
character counts.

It used to be divided by the whole roster. Once buddies had to be unlocked that
punished new players for the ones they could not play yet, and every new buddy
added lowered everyone's score. Ten is roughly where the tiers take you on the
way to the top, which is the point.

Deriving it rather than keeping a second sorted set in step means the board can
never disagree with the per-buddy boards, and it needed no migration when it
stopped being a max and started being a mean. The old `fall:best` key is left
alone and simply no longer read.

`ROSTER` in `api/scores.mjs` lists the characters that count and **must be
kept in step with `CHARS` in `src/game.js`** (twenty-three characters as of
Poppy, Prissy and Harmony). A character missing from it still gets its own
per-buddy board but contributes nothing to the main one.

Picking a single buddy from the dropdown still shows plain best runs for that
character — averaging is only how the overall board ranks.
