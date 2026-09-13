/**
 * Native shell integration.
 *
 * Everything here is optional at runtime: the imports are dynamic so the web
 * build never pulls Capacitor in, and each call is a no-op in a browser. One
 * codebase, three containers.
 */

let cached = null;

/** True inside the iOS or Android shell. */
export function isNative() {
  if (cached !== null) return cached;
  cached = !!(window.Capacitor?.isNativePlatform?.());
  return cached;
}

export function nativePlatform() {
  return window.Capacitor?.getPlatform?.() ?? 'web';
}

/**
 * Called once after the app has rendered.
 *
 * The splash screen is dismissed here rather than on a timer. A timer either
 * cuts to a half-built screen or holds a static image after the app is ready;
 * hiding it when React has actually painted is the only version that is right
 * on both a fast phone and a slow one.
 */
export async function initNative({ onDeepLink } = {}) {
  if (!isNative()) return;

  try {
    const [{ SplashScreen }, { StatusBar, Style }, { App }] = await Promise.all([
      import('@capacitor/splash-screen'),
      import('@capacitor/status-bar'),
      import('@capacitor/app'),
    ]);

    await StatusBar.setStyle({ style: Style.Dark });
    if (nativePlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#0B3D2C' });
    }

    /**
     * Password reset and email confirmation links open the app rather than a
     * browser. Without this the link lands in Safari, the session is created
     * there, and the app never sees it — the user taps the email, sees a web
     * page, and is still signed out in the app.
     */
    App.addListener('appUrlOpen', ({ url }) => {
      try {
        const parsed = new URL(url);
        const path = parsed.pathname + parsed.search + parsed.hash;
        onDeepLink?.(path || '/');
      } catch {
        // A malformed link should not crash the app.
      }
    });

    // Android's hardware back button. Without a handler it closes the app from
    // any screen, which on a form mid-entry is data loss.
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) window.history.back();
      else App.exitApp();
    });

    await SplashScreen.hide({ fadeOutDuration: 220 });
  } catch {
    // A missing plugin must never stop the app from starting.
  }
}

/** Haptic tap for the actions that move money. */
export async function tapFeedback(style = 'medium') {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({
      style: { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy }[style],
    });
  } catch {
    // Haptics are a nicety, never a requirement.
  }
}