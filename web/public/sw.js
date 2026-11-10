/* CloakTix shell service worker — cache minimal static shell only.
 * Policy mirrored in web/src/swPolicy.ts (keep in sync).
 * Never caches navigations/HTML (Access may return 200 login HTML),
 * redirects to cloudflareaccess, API, ZK/managed, or pass payloads.
 */
const CACHE = 'cloaktix-shell-v1';
// Proving artifacts (cloaktix-zk-*) are sha-keyed by zkFetch, so they are never stale: keep them across updates.
const KEEP_CACHE_PREFIXES = ['cloaktix-zk-'];
function shouldDeleteCacheOnActivate(name) {
  if (!name.startsWith('cloaktix-') || name === CACHE) return false;
  return !KEEP_CACHE_PREFIXES.some((p) => name.startsWith(p));
}
const DENY_PREFIXES = ['/passport', '/meta', '/indexer', '/zk', '/managed', '/devwallet', '/cdn-cgi'];

function denyUrl(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('cloudflareaccess')) return true;
    const path = u.pathname;
    for (const p of DENY_PREFIXES) {
      if (path === p || path.startsWith(p + '/')) return true;
    }
    if (String(url).startsWith('cloaktix:pass:') || path.includes('cloaktix:pass:')) return true;
    return false;
  } catch {
    return true;
  }
}

function isShellPath(pathname) {
  if (pathname === '/manifest.webmanifest') return true;
  if (pathname.startsWith('/icons/') || pathname.startsWith('/brand/') || pathname.startsWith('/fonts/') || pathname.startsWith('/art/')) return true;
  if (/^\/favicon(\.ico|-\d+\.png)$/.test(pathname)) return true;
  if (pathname === '/apple-touch-icon-180.png') return true;
  if (pathname.startsWith('/assets/')) return true;
  return false;
}

function isCacheableShellResponse(res) {
  if (!res || res.status !== 200) return false;
  if (res.redirected) return false;
  if (res.type === 'opaqueredirect' || res.type === 'opaque') return false;
  const loc = res.headers.get('Location');
  if (loc && /cloudflareaccess/i.test(loc)) return false;
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (!ct || ct.includes('text/html') || ct.includes('application/xhtml')) return false;
  return (
    ct.includes('text/css') ||
    ct.includes('javascript') ||
    ct.includes('application/json') ||
    ct.includes('image/') ||
    ct.includes('font/') ||
    ct.includes('application/manifest') ||
    ct.includes('application/octet-stream') ||
    ct.includes('webp') ||
    ct.includes('svg')
  );
}

self.addEventListener('install', (event) => {
  // Precache only unauthenticated static icons/manifest — never '/' HTML (Access risk).
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll([
        '/manifest.webmanifest',
        '/favicon.ico',
        '/icons/icon-256.png',
        '/icons/icon-512.png',
        '/apple-touch-icon-180.png',
      ]).catch(() => undefined),
    ).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => shouldDeleteCacheOnActivate(k)).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (denyUrl(req.url)) return;

  // Navigations / documents: network-only. Never put HTML (incl. Access 200 login) in cache.
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(fetch(req));
    return;
  }

  if (!isShellPath(url.pathname)) return;

  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (isCacheableShellResponse(res)) {
          const copy = res.clone();
          void caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      });
    }),
  );
});
