/* Offline support for Fall.
 *
 * The manifest, the icons and the standalone display mode were already here,
 * so "Add to Home Screen" gave you an app icon that white-screened without a
 * signal. This is the missing half: the whole game is a handful of small files,
 * so all of it fits in a cache and none of it needs a network.
 *
 * Strategy:
 *
 *   /api/*, /_vercel/*   never touched. The scoreboard has to be live, and a
 *                        cached score post would be a bug, not a feature.
 *   the game's files     network first, cache as the fallback. Online, every
 *                        file comes fresh, so the page, the script and the art
 *                        always match each other; offline, or on a connection
 *                        too slow to answer within NET_WAIT, the cached set is
 *                        used instead.
 *   fonts                stale-while-revalidate: they never change, so serve
 *                        from cache and refresh quietly.
 *
 * It used to be cache first for the game's files, refreshing in the background.
 * That meant every deploy reached a returning phone one visit late: the first
 * visit after an update ran the previous game.js. When a new feature's art
 * lived in one file and its code in another, a phone could run one new and one
 * old, which is how Herbie's bus showed up on phones as a white outline with a
 * face, or not at all. Network first makes that impossible while online.
 *
 * Only the game's own page is cached as the app shell. Every navigation used
 * to be stored under "index.html", so opening any other page on this origin
 * overwrote the shell with it.
 *
 * BUMP `VERSION` WHEN THE FILE LIST CHANGES, so the old cache is dropped. Content
 * changes no longer need a bump to reach players; they come fresh regardless.
 */

const VERSION = 'fall-v7';
const CORE = VERSION + '-core';
const RUNTIME = VERSION + '-runtime';

// how long to wait for the network before falling back to the cached copy
const NET_WAIT = 3500;

const BUDDIES = [
  'mooni', 'omar', 'mamu', 'pineapple', 'blueberry-cow', 'bessie', 'mel',
  'cheryl', 'ronnie', 'connor', 'lazy-harp-seal', 'me', 'devin',
  'grandpa-herbie', 'sophie', 'carrie', 'butt-nugget', 'pip', 'pep',
  'ronnies-milk', 'poppy', 'prissy', 'harmony'
].map(function (n) { return 'assets/buddies/' + n + '.webp'; });

// the weather sprites carry their own colours, so each one is a whole file
const WEATHER = ['rain', 'bolt', 'boss', 'bus']
  .map(function (n) { return 'assets/weather/' + n + '.svg'; });

const PRECACHE = [
  '.',
  'index.html',
  'src/styles.css',
  'src/game.js',
  'manifest.webmanifest',
  'assets/icons/icon-180.png',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png'
].concat(BUDDIES, WEATHER);

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CORE)
      // addAll is all-or-nothing, and one 404 would leave the game with no
      // cache at all, so each file is allowed to fail on its own
      .then(function (c) {
        return Promise.all(PRECACHE.map(function (u) {
          return c.add(new Request(u, { cache: 'reload' })).catch(function () {});
        }));
      })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (k) {
          if (k !== CORE && k !== RUNTIME) return caches.delete(k);
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

/* "Network first" is not enough on its own: the request still passes through
   the browser's HTTP cache, which can decide its copy of yesterday's file is
   fresh and hand it back without asking the server. 'no-cache' makes it ask
   every time; when nothing has changed that is a tiny 304. Wrapping a page
   navigation this way is fine: the spec turns its mode into same-origin and
   keeps its redirect handling. */
function freshFetch(req) {
  return fetch(new Request(req, { cache: 'no-cache' }));
}

/* Fresh from the network if it answers in time, otherwise the cached copy.
   A response that arrives after the timeout still refreshes the cache, so the
   next visit has it. */
function networkFirst(req, key) {
  const cacheKey = key || req;
  return caches.open(CORE).then(function (cache) {
    const net = freshFetch(req).then(function (res) {
      if (res && res.ok) cache.put(cacheKey, res.clone());
      return res;
    }).catch(function () { return null; });
    const slow = new Promise(function (resolve) { setTimeout(resolve, NET_WAIT, null); });
    return Promise.race([net, slow]).then(function (res) {
      if (res) return res;
      return cache.match(cacheKey).then(function (hit) {
        // nothing cached either: wait for the network after all
        return hit || net.then(function (r) {
          return r || new Response('', { status: 504, statusText: 'offline' });
        });
      });
    });
  });
}

function staleWhileRevalidate(req, cacheName) {
  return caches.open(cacheName).then(function (cache) {
    return cache.match(req).then(function (hit) {
      const fresh = fetch(req).then(function (res) {
        // opaque responses (the fonts) have status 0 and are still worth keeping
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      }).catch(function () { return null; });
      return hit || fresh.then(function (r) {
        if (r) return r;
        return new Response('', { status: 504, statusText: 'offline' });
      });
    });
  });
}

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // the scoreboard and the analytics beacon always go to the network
  if (url.origin === location.origin &&
      (url.pathname.indexOf('/api/') === 0 || url.pathname.indexOf('/_vercel/') === 0)) return;

  if (FONT_HOSTS.indexOf(url.hostname) > -1) {
    e.respondWith(staleWhileRevalidate(req, RUNTIME));
    return;
  }

  if (url.origin !== location.origin) return;

  if (req.mode === 'navigate') {
    // only the game's own page is the app shell; any other page on this
    // origin is left to the browser and never written over the shell
    const shell = url.pathname === '/' || url.pathname === '/index.html';
    if (!shell) return;
    e.respondWith(networkFirst(req, 'index.html'));
    return;
  }

  e.respondWith(networkFirst(req));
});
