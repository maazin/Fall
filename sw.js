/* Offline support for Fall.
 *
 * The manifest, the icons and the standalone display mode were already here,
 * so "Add to Home Screen" gave you an app icon that white-screened without a
 * signal. This is the missing half: the whole game is 19 webp files, one CSS
 * and one JS, so all of it fits in a cache and none of it needs a network.
 *
 * Strategy, in order of how much freshness matters:
 *
 *   /api/*, /_vercel/*   never touched. The scoreboard has to be live, and a
 *                        cached score post would be a bug, not a feature.
 *   navigations          network first, cache as the fallback. A deploy shows
 *                        up on the next load rather than the one after.
 *   everything else      stale-while-revalidate: served from cache instantly,
 *                        refreshed in the background for next time.
 *   fonts.googleapis /   cached opportunistically, so offline gets Baloo
 *   fonts.gstatic        rather than falling back to Trebuchet.
 *
 * BUMP `VERSION` ON EVERY DEPLOY. Precached files are keyed by it, so a new
 * version re-fetches the lot and drops the old cache on activate. Without a
 * bump, a returning player keeps the previous CSS and JS until the background
 * revalidate catches up on their second visit.
 */

const VERSION = 'fall-v1';
const CORE = VERSION + '-core';
const RUNTIME = VERSION + '-runtime';

const BUDDIES = [
  'mooni', 'omar', 'mamu', 'pineapple', 'blueberry-cow', 'bessie', 'mel',
  'cheryl', 'ronnie', 'connor', 'lazy-harp-seal', 'me', 'devin',
  'grandpa-herbie', 'sophie', 'carrie', 'butt-nugget', 'pip', 'pep'
].map(function (n) { return 'assets/buddies/' + n + '.webp'; });

const PRECACHE = [
  '.',
  'index.html',
  'src/styles.css',
  'src/game.js',
  'manifest.webmanifest',
  'assets/icons/icon-180.png',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png'
].concat(BUDDIES);

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

  // a navigation should show the newest build when there is a network
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (res) {
        const copy = res.clone();
        caches.open(CORE).then(function (c) { c.put('index.html', copy); });
        return res;
      }).catch(function () {
        return caches.match('index.html').then(function (hit) {
          return hit || caches.match('.');
        });
      })
    );
    return;
  }

  e.respondWith(staleWhileRevalidate(req, CORE));
});
