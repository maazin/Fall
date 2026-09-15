/* Shared scoreboard for Fall.
 *
 * Storage, all under the season prefix (see BOARD_SEASON below):
 *   <ns>best   sorted set, member = player name, score = their best ever
 *   <ns>meta   hash, player name -> JSON of how they got it
 *   <ns>b:<buddy>  one sorted set per character
 *
 * One row per player, so the board answers "who is best" rather than filling
 * up with one person's twenty good runs.
 *
 * Accepts either env var naming the Vercel marketplace hands out.
 */

const URL_ =
  process.env.KV_REST_API_URL ||
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.REDIS_REST_URL;

const TOKEN =
  process.env.KV_REST_API_TOKEN ||
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.REDIS_REST_TOKEN;

/* Seasons. Everything the board reads and writes sits under one prefix, and
   BOARD_SEASON picks it. Bumping that env var in Vercel starts a completely
   empty board without deleting anything: set it back to the old number and the
   old rankings are exactly where they were. Season 1 uses the original key
   names so nothing already on the board moves. */
const SEASON = String(process.env.BOARD_SEASON || '1').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) || '1';
const NS = SEASON === '1' ? 'fall:' : 'fall:s' + SEASON + ':';

const ZKEY = NS + 'best';
const HKEY = NS + 'meta';
const TOP = 20;

/* Per-buddy boards live in their own sorted sets, so picking a weaker buddy is a
   separate contest rather than a guaranteed loss on the overall board. */
function buddyKey(name) {
  const slug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return slug ? NS + 'b:' + slug : null;
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

      const out = await redis([
        ['ZRANGE', ZKEY, '0', String(TOP - 1), 'REV', 'WITHSCORES'],
        ['HGETALL', HKEY]
      ]);

      const flat = (out[0] && out[0].result) || [];
      const metaFlat = (out[1] && out[1].result) || [];
      const meta = {};
      for (let i = 0; i < metaFlat.length; i += 2) {
        try { meta[metaFlat[i]] = JSON.parse(metaFlat[i + 1]); } catch (e) { /* ignore */ }
      }

      const rows = [];
      for (let i = 0; i < flat.length; i += 2) {
        const name = flat[i];
        const m = meta[name] || {};
        rows.push({
          name: name,
          score: Number(flat[i + 1]),
          buddy: m.buddy || null,
          mode: m.mode || null,
          diff: m.diff || null,
          at: m.at || null
        });
      }
      return res.status(200).json({ season: SEASON, rows: rows });
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
      const bk = buddy ? buddyKey(buddy) : null;

      // read the overall best and the per-buddy best together
      const prev = await redis(
        bk ? [['ZSCORE', ZKEY, name], ['ZSCORE', bk, name]]
           : [['ZSCORE', ZKEY, name]]
      );
      const num = (i) => {
        const raw = prev[i] && prev[i].result;
        return (raw === null || raw === undefined) ? -1 : Number(raw);
      };
      const best = num(0);
      const buddyBest = bk ? num(1) : -1;

      const writes = [];
      if (score > best) {
        writes.push(['ZADD', ZKEY, String(score), name]);
        writes.push(['HSET', HKEY, name, JSON.stringify({
          buddy: buddy,
          mode: body.mode === 'endless' ? 'endless' : 'round',
          diff: ['chill', 'normal', 'storm'].indexOf(body.diff) > -1 ? body.diff : 'normal',
          at: new Date().toISOString().slice(0, 10)
        })]);
      }
      if (bk && score > buddyBest) writes.push(['ZADD', bk, String(score), name]);
      if (writes.length) await redis(writes);

      return res.status(200).json({
        ok: true,
        improved: score > best,
        best: Math.max(best, score > best ? score : best),
        buddyImproved: bk ? score > buddyBest : false,
        buddyBest: bk ? Math.max(buddyBest, score) : null
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
