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

/** True when launched from the home screen rather than a browser tab. */
export function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}