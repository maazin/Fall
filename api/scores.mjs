/* Shared scoreboard for Fall.
 *
 * Storage, all under the season prefix (see BOARD_SEASON below):
 *   <ns>b:<buddy>  one sorted set per character, member = player name,
 *                  score = that player's best ever with that character
 *   <ns>meta       hash, player name -> JSON of when they last posted
 *
 * The per-buddy sets are the only source of truth. The main board is not
 * stored at all: it is the average of a player's best with each of the
 * characters on the roster, divided by the whole roster rather than by however
 * many they happen to have tried, so it answers "who is good with the whole
 * squad" rather than "who had one lucky run".
 *
 *   average = (sum of their best with each buddy) / ROSTER.length
 *
 * Characters they have never played count as zero, which is the point: the
 * only way up the board is to go and get good with somebody new.
 *
 * Deriving it on read rather than keeping a second sorted set in step means
 * the board can never disagree with the per-buddy boards, and it needed no
 * migration when it stopped being a max and started being a mean.
 *
 * One row per player, so the board answers "who is best" rather than filling
 * up with one person's twenty good runs.
 *
 * Accepts either env var naming the Vercel marketplace hands out.
 */

import { SEASON_TTL, seasonEnds, currentSeason, namespace } from './_board.mjs';

const URL_ =
  process.env.KV_REST_API_URL ||
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.REDIS_REST_URL;

const TOKEN =
  process.env.KV_REST_API_TOKEN ||
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.REDIS_REST_TOKEN;

/* Seasons, the reset generation and the key prefix all live in _board.mjs,
   shared with reset.mjs so the two can never disagree about where the board
   is. See that file for how the fortnight works. */
const SEASON_N = currentSeason(process.env);
const SEASON = String(SEASON_N);
const NS = namespace(SEASON_N);

/* How the top player is decided, rotated one per season.
 *
 * Add any of 'best', 'buddies' or 'top5' to this list and the board will start
 * alternating between them a fortnight at a time; with a single entry it is
 * simply that one every season. Every ranking here is computed from the
 * per-buddy bests that are already stored, so none of them needs the client to
 * send anything extra. */
const SEASON_CRITERIA = ['average'];

const CRITERIA = {
  average: {
    label: 'Squad average',
    blurb: 'Your best with each character, averaged over the whole roster. Ones you have never played count as zero.',
    // floored: a leaderboard reads better in whole numbers
    score: (p, roster) => Math.floor(p.sum / roster)
  },
  best: {
    label: 'Best single run',
    blurb: 'Your highest score with anybody. One brilliant run is all that counts.',
    score: (p) => p.best
  },
  buddies: {
    label: 'Buddies played',
    blurb: 'How many different characters you have scored with. Ties go to the better squad average.',
    score: (p) => p.buddies,
    tie: (p, roster) => p.sum / roster
  },
  top5: {
    label: 'Top five average',
    blurb: 'The mean of your five best characters, so the ones you have not played cannot drag you down.',
    score: (p) => {
      const top = p.scores.slice().sort((a, b) => b - a).slice(0, 5);
      return top.length ? Math.floor(top.reduce((a, b) => a + b, 0) / top.length) : 0;
    }
  }
};

function criterionFor(n) {
  const key = SEASON_CRITERIA[(n - 1) % SEASON_CRITERIA.length] || 'average';
  return { key: key, def: CRITERIA[key] || CRITERIA.average };
}

const ZKEY = NS + 'best';    // legacy: the old max-score board, no longer read
const HKEY = NS + 'meta';
const TOP = 20;

/* The roster, and the divisor for every average on the main board.
 *
 * It has to live here rather than be counted from the keys that happen to
 * exist, because a divisor that grows as new characters get posted would
 * quietly restate everybody's score. It also has to live here rather than
 * come from the client, because a client that could pick its own divisor
 * could send 1 and top the board.
 *
 * KEEP IN STEP WITH `CHARS` IN src/game.js. A character missing from this
 * list still gets its own per-buddy board, but contributes nothing to the
 * main one. */
const ROSTER = [
  'mooni', 'omar', 'mamu', 'pineapple', 'blueberry-cow', 'bessie', 'mel',
  'cheryl', 'ronnie', 'connor', 'lazy-harp-seal', 'me', 'devin',
  'grandpa-herbie', 'sophie', 'carrie', 'butt-nugget', 'pip', 'pep',
  'ronnie-s-milk', 'poppy', 'prissy', 'harmony'
];

function slugify(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/* Per-buddy boards live in their own sorted sets, so picking a weaker buddy is a
   separate contest rather than a guaranteed loss on the overall board. */
function buddyKey(name) {
  const slug = slugify(name);
  return slug ? NS + 'b:' + slug : null;
}

/* Rebuilds the main board from the per-buddy sets. One pipeline: every
   character's set, plus the meta hash for the dates. */
async function overallRows() {
  const cmds = ROSTER.map((slug) => ['ZRANGE', NS + 'b:' + slug, '0', '-1', 'WITHSCORES']);
  cmds.push(['HGETALL', HKEY]);
  const out = await redis(cmds);

  const players = new Map();
  ROSTER.forEach((slug, i) => {
    const flat = (out[i] && out[i].result) || [];
    for (let j = 0; j < flat.length; j += 2) {
      const name = flat[j];
      const val = Number(flat[j + 1]);
      if (!Number.isFinite(val) || val <= 0) continue;
      let p = players.get(name);
      if (!p) { p = { name, sum: 0, buddies: 0, best: 0, bestBuddy: null, scores: [] }; players.set(name, p); }
      p.sum += val;
      p.buddies++;
      p.scores.push(val);
      if (val > p.best) { p.best = val; p.bestBuddy = slug; }
    }
  });

  const metaFlat = (out[ROSTER.length] && out[ROSTER.length].result) || [];
  const meta = {};
  for (let i = 0; i < metaFlat.length; i += 2) {
    try { meta[metaFlat[i]] = JSON.parse(metaFlat[i + 1]); } catch (e) { /* ignore */ }
  }

  const c = criterionFor(SEASON_N);
  return [...players.values()]
    .map((p) => {
      const m = meta[p.name] || {};
      return {
        name: p.name,
        score: c.def.score(p, ROSTER.length),
        tie: c.def.tie ? c.def.tie(p, ROSTER.length) : 0,
        buddies: p.buddies,
        roster: ROSTER.length,
        best: p.best,
        buddy: p.bestBuddy,
        mode: m.mode || null,
        diff: m.diff || null,
        at: m.at || null
      };
    })
    .sort((a, b) => b.score - a.score || b.tie - a.tie || b.buddies - a.buddies)
    .slice(0, TOP);
}

const MAX_SCORE = 5000;      // far above any real run, blocks silly numbers
const MAX_NAME = 14;
const POSTS_PER_HOUR = 40;   // per IP

async function redis(commands) {
  const res = await fetch(URL_ + '/pipeline', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(commands)
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 200);
    throw new Error('redis ' + res.status + ' ' + detail);
  }
  return res.json();
}

function cleanName(raw) {
  if (typeof raw !== 'string') return null;
  // drop control characters and invisible formatting, then collapse whitespace
  const n = raw
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028\u2029\u202A-\u202E\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_NAME);
  return n.length >= 1 ? n : null;
}

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim();
  return (req.socket && req.socket.remoteAddress) || 'unknown';
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (!URL_ || !TOKEN) {
    return res.status(503).json({
      error: 'not_configured',
      message: 'Add the Upstash for Redis integration to this Vercel project.'
    });
  }

  try {
    if (req.method === 'GET') {
      // ?buddy=Mel narrows the board to one character
      const asked = (req.query && req.query.buddy) ||
        new URL(req.url, 'http://x').searchParams.get('buddy');
      const bk = asked ? buddyKey(asked) : null;

      if (bk) {
        const one = await redis([['ZRANGE', bk, '0', String(TOP - 1), 'REV', 'WITHSCORES']]);
        const fl = (one[0] && one[0].result) || [];
        const rows = [];
        for (let i = 0; i < fl.length; i += 2) {
          rows.push({ name: fl[i], score: Number(fl[i + 1]), buddy: asked, mode: null, diff: null, at: null });
        }
        return res.status(200).json({ season: SEASON, buddy: asked, rows: rows });
      }

      const rows = await overallRows();
      const c = criterionFor(SEASON_N);
      return res.status(200).json({
        season: SEASON,
        seasonEnds: seasonEnds(SEASON_N),
        scoring: c.key,
        scoringLabel: c.def.label,
        scoringBlurb: c.def.blurb,
        roster: ROSTER.length,
        rows: rows
      });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string'
        ? JSON.parse(req.body || '{}')
        : (req.body || {});

      const name = cleanName(body.name);
      const score = Number(body.score);

      if (!name) return res.status(400).json({ error: 'bad_name' });
      if (!Number.isFinite(score) || score < 0 || score > MAX_SCORE || score !== Math.floor(score)) {
        return res.status(400).json({ error: 'bad_score' });
      }

      // per-IP hourly cap so nobody can hammer the board
      const bucket = 'fall:rl:' + clientIp(req) + ':' + Math.floor(Date.now() / 3600000);
      const rl = await redis([['INCR', bucket], ['EXPIRE', bucket, '3600']]);
      if (Number((rl[0] && rl[0].result) || 0) > POSTS_PER_HOUR) {
        return res.status(429).json({ error: 'slow_down' });
      }

      const buddy = typeof body.buddy === 'string' ? body.buddy.slice(0, 24) : null;
      const slug = buddy ? slugify(buddy) : null;
      const bk = slug ? NS + 'b:' + slug : null;

      /* Every one of their per-buddy bests, so the average can be reported
         back without a second round trip after the write. */
      const prev = await redis(ROSTER.map((s2) => ['ZSCORE', NS + 'b:' + s2, name]));
      let sum = 0;
      let buddyBest = -1;
      ROSTER.forEach((s2, i) => {
        const raw = prev[i] && prev[i].result;
        const val = (raw === null || raw === undefined) ? 0 : Number(raw);
        if (Number.isFinite(val) && val > 0) sum += val;
        if (s2 === slug) buddyBest = (raw === null || raw === undefined) ? -1 : Number(raw);
      });

      // floored, to match how the board shows it
      const avg = (total) => Math.floor(total / ROSTER.length);
      const wasAvg = avg(sum);
      const beatBuddy = !!bk && score > buddyBest;
      // beating your own best with one character lifts the average by the
      // difference, spread over the whole roster
      const nowAvg = beatBuddy ? avg(sum - Math.max(0, buddyBest) + score) : wasAvg;

      const writes = [];
      if (beatBuddy) writes.push(['ZADD', bk, String(score), name]);
      /* Every season leaves its keys behind, so they are given a life. Reset on
         each write rather than only on create, so a season stays for 60 days
         after its last post rather than 60 days after its first. */
      if (bk) writes.push(['EXPIRE', bk, String(SEASON_TTL)]);
      writes.push(['EXPIRE', HKEY, String(SEASON_TTL)]);
      {
        // the date is "last seen", so it is written whether or not they improved
        writes.push(['HSET', HKEY, name, JSON.stringify({
          mode: body.mode === 'endless' ? 'endless' : 'round',
          diff: ['chill', 'normal', 'storm'].indexOf(body.diff) > -1 ? body.diff : 'normal',
          at: new Date().toISOString().slice(0, 10)
        })]);
      }
      if (writes.length) await redis(writes);

      const known = ROSTER.indexOf(slug) > -1;
      const c = criterionFor(SEASON_N);
      return res.status(200).json({
        ok: true,
        season: SEASON,
        seasonEnds: seasonEnds(SEASON_N),
        scoring: c.key,
        scoringLabel: c.def.label,
        roster: ROSTER.length,
        improved: beatBuddy && nowAvg > wasAvg,
        average: nowAvg,
        wasAverage: wasAvg,
        buddyImproved: beatBuddy,
        buddyBest: bk ? Math.max(buddyBest, score) : null,
        counted: known
      });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  } catch (err) {
    return res.status(500).json({
      error: 'upstream',
      message: String((err && err.message) || err).slice(0, 300)
    });
  }
}
