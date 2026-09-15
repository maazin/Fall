/* Wipes the shared scoreboard for Fall.
 *
 * This one deletes data, so it is locked behind a secret you set yourself:
 * add an ADMIN_TOKEN environment variable to the Vercel project, then
 *
 *   curl -X POST https://fall-gamma.vercel.app/api/reset \
 *        -H "x-admin-token: YOUR_TOKEN"
 *
 * With no ADMIN_TOKEN set the route refuses every request, so it cannot be
 * hit by accident or by anybody who finds the URL.
 *
 * If you would rather not delete anything, bump BOARD_SEASON in Vercel
 * instead. That starts a fresh empty board and keeps the old one intact.
 */

const URL_ =
  process.env.KV_REST_API_URL ||
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.REDIS_REST_URL;

const TOKEN =
  process.env.KV_REST_API_TOKEN ||
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.REDIS_REST_TOKEN;

const ADMIN = process.env.ADMIN_TOKEN;

const SEASON = String(process.env.BOARD_SEASON || '1').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) || '1';
const NS = SEASON === '1' ? 'fall:' : 'fall:s' + SEASON + ':';

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

/* constant-time-ish compare, so the token cannot be guessed a character at a time */
function same(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  if (!URL_ || !TOKEN) {
    return res.status(503).json({ error: 'not_configured', message: 'No Redis credentials on this project.' });
  }
  if (!ADMIN) {
    return res.status(503).json({ error: 'no_admin_token', message: 'Set ADMIN_TOKEN in the Vercel project first.' });
  }

  const given = req.headers['x-admin-token'];
  if (!same(typeof given === 'string' ? given : '', ADMIN)) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  try {
    // every per-buddy board, found by scanning rather than guessing names
    const keys = [NS + 'best', NS + 'meta'];
    let cursor = '0';
    let guard = 0;
    do {
      const out = await redis([['SCAN', cursor, 'MATCH', NS + 'b:*', 'COUNT', '200']]);
      const page = (out[0] && out[0].result) || ['0', []];
      cursor = String(page[0]);
      for (const k of (page[1] || [])) keys.push(k);
      guard++;
    } while (cursor !== '0' && guard < 50);

    const del = await redis([['DEL'].concat(keys)]);
    const removed = Number((del[0] && del[0].result) || 0);

    return res.status(200).json({ ok: true, season: SEASON, keysDeleted: removed, keys: keys });
  } catch (err) {
    return res.status(500).json({
      error: 'upstream',
      message: String((err && err.message) || err).slice(0, 300)
    });
  }
}
