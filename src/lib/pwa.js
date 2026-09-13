/**
 * Service worker registration plus the "a new version is ready" signal.
 *
 * Installed apps have no address bar and no reload button, so a user can sit
 * on a months-old build forever without any way to know. The callback below is
 * what lets the app say so and offer to restart.
 */
export function registerServiceWorker(onUpdateReady) {
  if (!('serviceWorker' in navigator)) return;
  if (import.meta.env.DEV) return; // a cached shell in dev hides your own edits
  // The native shell already ships the assets on device; a second cache layer
  // there only creates a way for the two to disagree.
  if (window.Capacitor?.isNativePlatform?.()) return;

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

      reg.addEventListener('updatefound', () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          // A worker that reaches `installed` while one is already controlling
          // the page is a new build waiting its turn.
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            onUpdateReady?.(() => {
              installing.postMessage('SKIP_WAITING');
            });
          }
        });
      });

      // Check on return to foreground — collectors leave the app open all day.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {});
      });
    } catch {
      // An app that works online without a worker is better than one that
      // refuses to start because registration failed.
    }
  });

  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });
}

/**
 * The public origin, used for anything that has to survive leaving the app.
 *
 * Inside the native shell `window.location.origin` is the WebView's private
 * hostname (https://app.budgetsave) — a name that resolves nowhere. A password
 * reset link built from it opens the mail app, hands the URL to the browser,
 * and the browser reports that the server cannot be found.
 */
export const PUBLIC_URL =
  import.meta.env.VITE_PUBLIC_URL?.replace(/\/$/, '') || 'https://budgetsaveit.com';

/**
 * True when the app is not a browser tab — installed to a home screen, or
 * running inside the iOS/Android shell. What the routing actually cares about
 * is the absence of an address bar, which both cases share.
 *
 * No single check covers every case. Android Chrome reports minimal-ui or
 * fullscreen depending on the manifest and launcher; iOS Safari exposes a
 * non-standard `navigator.standalone` rather than a media query; and the
 * native shell has neither, only the Capacitor bridge.
 *
 * The hostname check is a backstop for that last one: the bridge is injected
 * by native code and on a cold start a first render can beat it, whereas the
 * WebView's hostname is set before any JavaScript runs at all.
 */
export function isStandalone() {
  if (typeof window === 'undefined') return false;

  const native =
    !!window.Capacitor?.isNativePlatform?.() ||
    window.location.hostname === 'app.budgetsave' ||
    window.location.protocol === 'capacitor:';

  const byDisplayMode = ['standalone', 'minimal-ui', 'fullscreen', 'window-controls-overlay']
    .some((mode) => window.matchMedia(`(display-mode: ${mode})`).matches);

  return (
    native ||
    byDisplayMode ||
    window.navigator.standalone === true ||
    document.referrer.startsWith('android-app://')
  );
}
