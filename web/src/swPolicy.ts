/** Shared rules for what the service worker may cache. Keep in sync with public/sw.js. */

const DENY_PATH_PREFIXES = [
  '/passport',
  '/meta',
  '/indexer',
  '/zk',
  '/managed',
  '/devwallet',
  '/cdn-cgi',
] as const;

const DENY_HOST_SUBSTR = ['cloudflareaccess.com', 'cloudflareaccess'] as const;

export function shouldCacheUrl(urlString: string): boolean {
  let u: URL;
  try {
    u = new URL(urlString);
  } catch {
    return false;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
  for (const h of DENY_HOST_SUBSTR) {
    if (u.hostname.includes(h)) return false;
  }
  const path = u.pathname;
  for (const p of DENY_PATH_PREFIXES) {
    if (path === p || path.startsWith(p + '/')) return false;
  }
  if (urlString.startsWith('cloaktix:pass:')) return false;
  if (path.includes('cloaktix:pass:')) return false;
  return true;
}

export function isAccessRedirectLocation(locationHeader: string | null): boolean {
  if (!locationHeader) return false;
  try {
    const u = new URL(locationHeader, 'https://app.cloaktix.com');
    return DENY_HOST_SUBSTR.some((h) => u.hostname.includes(h));
  } catch {
    return /cloudflareaccess/i.test(locationHeader);
  }
}

/** Static shell paths only — never HTML documents (Access may return 200 login HTML). */
export function isStaticShellPath(pathname: string): boolean {
  if (pathname === '/manifest.webmanifest') return true;
  if (pathname.startsWith('/icons/')) return true;
  if (pathname.startsWith('/brand/')) return true;
  if (pathname.startsWith('/fonts/')) return true;
  if (pathname.startsWith('/art/')) return true;
  if (/^\/favicon(\.ico|-\d+\.png)$/.test(pathname)) return true;
  if (pathname === '/apple-touch-icon-180.png') return true;
  if (pathname.startsWith('/assets/')) return true;
  return false;
}

/**
 * Decide whether a fetched Response may enter the shell cache.
 * Reject redirects (incl. Access), opaque redirects, non-OK, and any HTML
 * (Access login can be same-origin 200 text/html).
 */
export function isCacheableShellResponse(args: {
  status: number;
  redirected?: boolean;
  type?: string;
  locationHeader?: string | null;
  contentType?: string | null;
}): boolean {
  if (args.status !== 200) return false;
  if (args.redirected) return false;
  if (args.type === 'opaqueredirect' || args.type === 'opaque') return false;
  if (isAccessRedirectLocation(args.locationHeader ?? null)) return false;
  const ct = (args.contentType ?? '').toLowerCase();
  if (ct.includes('text/html') || ct.includes('application/xhtml')) return false;
  // Allow known static types; reject empty/unknown for safety on navigations.
  if (!ct) return false;
  const ok =
    ct.includes('text/css') ||
    ct.includes('javascript') ||
    ct.includes('application/json') ||
    ct.includes('image/') ||
    ct.includes('font/') ||
    ct.includes('application/manifest') ||
    ct.includes('application/octet-stream') ||
    ct.includes('webp') ||
    ct.includes('svg');
  return ok;
}

/** Shell cache name in public/sw.js. */
export const SHELL_CACHE = 'cloaktix-shell-v1';
/** Proving artifacts are sha-keyed (zkFetch), so they survive service-worker updates. */
export const KEEP_CACHE_PREFIXES = ['cloaktix-zk-'] as const;
/** Mirrors public/sw.js activate: delete old cloaktix-* caches except the current shell and the zk cache. */
export function shouldDeleteCacheOnActivate(name: string, current: string = SHELL_CACHE): boolean {
  if (!name.startsWith('cloaktix-') || name === current) return false;
  return !KEEP_CACHE_PREFIXES.some((p) => name.startsWith(p));
}
