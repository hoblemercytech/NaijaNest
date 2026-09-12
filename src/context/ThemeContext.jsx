/* eslint-disable react-refresh/only-export-components -- ThemeProvider and
   useTheme belong together; splitting them scatters one concern. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'budgetsave-theme';

/**
 * Light is the default. A saved choice always wins over the system setting,
 * because someone who deliberately picked light on a dark-mode phone meant it.
 *
 * The initial value is read during the first render rather than in an effect —
 * setting it afterwards would paint the wrong theme for a frame, which on a
 * dark-mode phone is a white flash in the face.
 */
function initialTheme() {
  if (typeof window === 'undefined') return 'light';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem(STORAGE_KEY, theme);

    // Keeps the browser chrome (address bar on Android, notch area on iOS)
    // in step with the page instead of leaving a pale strip above a dark app.
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#081310' : '#0B3D2C');
  }, [theme]);

  // Follow the system only while the user has expressed no preference.
  useEffect(() => {
    if (window.localStorage.getItem(STORAGE_KEY)) return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const toggle = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(() => ({ theme, setTheme, toggle, isDark: theme === 'dark' }), [theme, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}

/**
 * Resolved colour values for anything that cannot read a CSS variable —
 * recharts sets `stroke` as an SVG attribute, where `var()` does not resolve.
 * Re-reads whenever the theme changes so charts follow the toggle.
 */
export function useChartColors() {
  const { theme } = useTheme();

  return useMemo(() => {
    if (typeof window === 'undefined') return {};
    const s = getComputedStyle(document.documentElement);
    const v = (name) => s.getPropertyValue(name).trim();
    return {
      accent: v('--accent-text') || '#12694A',
      money: v('--money') || '#FAB500',
      grid: v('--border') || '#DFE8E2',
      text: v('--text-secondary') || '#4F6159',
      surface: v('--surface-elevated') || '#FFFFFF',
      bar: v('--brand-400') || '#3E9873',
    };
    // `theme` is the trigger, not an input: the CSS variables it swaps are not
    // reactive, so the memo has to be told when to re-read them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);
}
