import './ThemeToggle.css';

/**
 * Apple-styled Theme Toggle Button.
 * Toggles between Light and Dark mode with SF-inspired icons and smooth transitions.
 *
 * @param {Object} props
 * @param {'light' | 'dark'} props.theme - Current active theme
 * @param {() => void} props.onToggle - Callback to toggle theme
 */
export default function ThemeToggle({ theme = 'light', onToggle }) {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="theme-toggle-btn"
      onClick={onToggle}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="theme-toggle-btn__icon-wrapper">
        {isDark ? (
          /* Sun icon when currently dark (clicking will switch to light) */
          <svg
            className="theme-toggle-btn__icon theme-toggle-btn__icon--sun"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        ) : (
          /* Moon icon when currently light (clicking will switch to dark) */
          <svg
            className="theme-toggle-btn__icon theme-toggle-btn__icon--moon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </div>
      <span className="theme-toggle-btn__label">{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
}
