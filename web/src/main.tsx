import { createRoot } from 'react-dom/client';
import { App } from './App';
import { AppBoundary } from './AppBoundary';
import './styles.css';
import { registerCloakServiceWorker } from './swRegister';

function rootElement(): HTMLElement {
  const element = document.getElementById('root');
  if (!element) throw new Error('#root missing');
  return element;
}
const el = rootElement();
const root = createRoot(el);

function paintBootError(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error('[cloaktix] boot failure', err);
  el.innerHTML = `<div class="app"><div class="error boot-error" style="margin:24px;max-width:720px">CloakTix failed to start: ${msg.replace(/[<>&]/g, (c) => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c] as string))}. Try a refresh. If this persists, disable Brave Shields for this site and retry.</div></div>`;
}

try {
  root.render(<AppBoundary><App /></AppBoundary>);
} catch (e) {
  paintBootError(e);
}

window.addEventListener('error', (ev) => {
  console.error('[cloaktix] window error', ev.error ?? ev.message);
});
window.addEventListener('unhandledrejection', (ev) => {
  console.error('[cloaktix] unhandledrejection', ev.reason);
});

// After first paint: register shell SW (replaces older preview SWs; does not scrub ours).
void registerCloakServiceWorker();
