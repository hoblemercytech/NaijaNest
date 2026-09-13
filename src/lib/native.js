/**
 * Native shell integration.
 *
 * Plugins are read from `window.Capacitor.Plugins` rather than imported.
 *
 * The reason is build independence. A static or dynamic `import('@capacitor/…')`
 * is a hard dependency as far as the bundler is concerned: Vercel builds the
 * same source for the website, and if those packages are missing from its
 * node_modules — a lockfile a commit behind is enough — the whole deploy fails
 * on a module the web app never even runs.
 *
 * Capacitor registers every plugin on that global inside the native shell, so
 * reading from it gives identical behaviour there and a clean no-op in a
 * browser, with nothing for the bundler to resolve either way.
 */

/** True inside the iOS or Android shell. */
export function isNative() {
  return !!(typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.());
}

export function nativePlatform() {
  return (typeof window !== 'undefined' && window.Capacitor?.getPlatform?.()) || 'web';
}

const plugin = (name) => (isNative() ? window.Capacitor?.Plugins?.[name] : null);

/**
 * Called once after the app has rendered. A no-op in a browser.
 *
 * The splash screen is dismissed here rather than on a timer. A timer either
 * cuts to a half-built screen or holds a static image after the app is ready;
 * hiding it once React has actually painted is the only version that is right
 * on both a fast phone and a slow one.
 */
export async function initNative({ onDeepLink } = {}) {
  if (!isNative()) return;

  const StatusBar = plugin('StatusBar');
  const SplashScreen = plugin('SplashScreen');
  const App = plugin('App');

  try {
    // 'DARK' here means dark *content* — light text, for the brand header.
    await StatusBar?.setStyle({ style: 'DARK' });
    if (nativePlatform() === 'android') {
      await StatusBar?.setBackgroundColor({ color: '#0B3D2C' });
    }
  } catch {
    // Styling the status bar is cosmetic; never let it stop startup.
  }

  try {
    /**
     * Password reset and email confirmation links open the app rather than a
     * browser. Without this the link lands in Safari, the session is created
     * there, and the app never sees it — the customer taps the email, sees a
     * web page, and is still signed out in the app.
     */
    App?.addListener('appUrlOpen', ({ url }) => {
      try {
        const parsed = new URL(url);
        onDeepLink?.((parsed.pathname + parsed.search + parsed.hash) || '/');
      } catch {
        // A malformed link should not crash the app.
      }
    });

    // Android's hardware back button. With no handler it closes the app from
    // any screen, which mid-form is data loss.
    App?.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) window.history.back();
      else App?.exitApp();
    });
  } catch {
    // Listener registration failing is not worth a blank screen.
  }

  try {
    await SplashScreen?.hide({ fadeOutDuration: 220 });
  } catch {
    // If hiding fails the splash stays up, which is bad — but crashing is worse.
  }
}

/** Haptic tap for the actions that move money. */
export async function tapFeedback(style = 'MEDIUM') {
  try {
    await plugin('Haptics')?.impact({ style });
  } catch {
    // Haptics are a nicety, never a requirement.
  }
}
