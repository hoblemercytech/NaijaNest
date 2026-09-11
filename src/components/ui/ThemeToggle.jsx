import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/**
 * Shows the theme you would switch *to*, which is what people reach for —
 * a moon means "go dark", not "you are dark".
 */
export default function ThemeToggle({ compact = false }) {
  const { isDark, toggle } = useTheme();
  const next = isDark ? 'light' : 'dark';

  return (
    <button
      type="button"
      className={`theme-toggle${compact ? ' is-compact' : ''}`}
      onClick={toggle}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      {isDark ? <Sun size={18} strokeWidth={1.9} /> : <Moon size={18} strokeWidth={1.9} />}
      {!compact && <span>{isDark ? 'Light' : 'Dark'}</span>}
    </button>
  );
}
