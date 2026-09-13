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
 * True when launched from the home screen rather than a browser tab.
 *
 * Three checks because no single one covers both platforms: Android Chrome can
 * report minimal-ui or fullscreen depending on the manifest and launcher, iOS
 * Safari exposes a non-standard `navigator.standalone` instead of a media
 * query, and some Android launchers set neither but arrive with the referrer
 * Chrome uses for installed apps.
 */
export function isStandalone() {
  if (typeof window === 'undefined') return false;

  const byDisplayMode = ['standalone', 'minimal-ui', 'fullscreen', 'window-controls-overlay']
    .some((mode) => window.matchMedia(`(display-mode: ${mode})`).matches);

  return (
    byDisplayMode ||
    window.navigator.standalone === true ||
    document.referrer.startsWith('android-app://')
  );
}
