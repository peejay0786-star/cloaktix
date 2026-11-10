/** Register the shell SW; clear legacy blanket unregister behavior carefully. */

const OUR_SW_URL = '/sw.js';
const OUR_CACHE_PREFIX = 'cloaktix-';

export async function registerCloakServiceWorker(): Promise<'registered' | 'unsupported' | 'skipped'> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return 'unsupported';
  // Local vite without HTTPS still allows localhost SW.
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const r of regs) {
      const script = r.active?.scriptURL || r.waiting?.scriptURL || r.installing?.scriptURL || '';
      if (!script.endsWith(OUR_SW_URL)) {
        await r.unregister();
      }
    }
    if (typeof caches !== 'undefined') {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.startsWith(OUR_CACHE_PREFIX) && (k.includes('workbox') || k.includes('cloaktix') || k.includes('precache')))
          .map((k) => caches.delete(k)),
      );
    }
    await navigator.serviceWorker.register(OUR_SW_URL, { scope: '/' });
    return 'registered';
  } catch {
    return 'skipped';
  }
}
