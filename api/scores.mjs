/* Shared scoreboard for Fall.
 *
 * Storage is two Redis keys:
 *   fall:best  sorted set, member = player name, score = their best ever
 *   fall:meta  hash, player name -> JSON of how they got it
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

const ZKEY = 'fall:best';
const HKEY = 'fall:meta';
const TOP = 20;

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
      return res.status(200).json({ rows: rows });
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

      const prev = await redis([['ZSCORE', ZKEY, name]]);
      const raw = prev[0] && prev[0].result;
      const best = (raw === null || raw === undefined) ? -1 : Number(raw);

      if (score > best) {
        const meta = JSON.stringify({
          buddy: typeof body.buddy === 'string' ? body.buddy.slice(0, 24) : null,
          mode: body.mode === 'endless' ? 'endless' : 'round',
          diff: ['chill', 'normal', 'storm'].indexOf(body.diff) > -1 ? body.diff : 'normal',
          at: new Date().toISOString().slice(0, 10)
        });
        await redis([
          ['ZADD', ZKEY, String(score), name],
          ['HSET', HKEY, name, meta]
        ]);
        return res.status(200).json({ ok: true, improved: true, best: score });
      }

      return res.status(200).json({ ok: true, improved: false, best: best });
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
