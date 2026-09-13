
import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';
/**
 * BudgetSave — Capacitor configuration.
 *
 * The web build in dist/ is copied into the native shells unchanged, so there
 * is one codebase and one set of bugs. What differs is only the container.
 */
const config: CapacitorConfig = {
  // Reverse-DNS, must match what you register with Apple and Google. Changing
  // it later means a new app listing, not an update, so get it right now.
  appId: 'com.budgetsave.app',
  appName: 'BudgetSave',
  webDir: 'dist',

  // A named hostname rather than file:// — Supabase auth, localStorage and the
  // fetch API all behave normally on an https origin, and misbehave on file://.
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: 'app.budgetsave',
  },

  android: {
    // Stops the WebView being debuggable in a shipped build.
    webContentsDebuggingEnabled: false,
    allowMixedContent: false,
  },

  ios: {
    contentInset: 'always',
    limitsNavigationsToAppBoundDomains: false,
  },

  plugins: {
    SplashScreen: {
      // Hidden from JS once the app has actually rendered, rather than on a
      // timer — a timer either flashes the shell or holds a static image after
      // the app is ready.
      launchAutoHide: false,
      backgroundColor: '#0B3D2C',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',           // light text, for the dark brand header
      backgroundColor: '#0B3D2C',
      overlaysWebView: false,
    },
       Keyboard: {
      resize: KeyboardResize.Native,
      resizeOnFullScreen: true,
    },
  },
};

export default config;