import './ViewToggle.css';

/**
 * ViewToggle allows switching between 'grid' and 'row' layouts.
 * Styled as an Apple-like segmented control.
 *
 * @param {Object} props
 * @param {'grid' | 'row'} props.viewMode
 * @param {(mode: 'grid' | 'row') => void} props.onChange
 */
export default function ViewToggle({ viewMode = 'grid', onChange }) {
  return (
    <div
      className={`view-toggle view-toggle--${viewMode}`}
      role="group"
      aria-label="View layout switch"
    >
      <div className="view-toggle__indicator" aria-hidden="true" />
      <button
        type="button"
        className={`view-toggle__btn ${viewMode === 'grid' ? 'view-toggle__btn--active' : ''}`}
        onClick={() => onChange('grid')}
        aria-pressed={viewMode === 'grid'}
        aria-label="Grid view"
      >
        <svg
          className="view-toggle__icon"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="2" y="2" width="5" height="5" rx="1.5" />
          <rect x="9" y="2" width="5" height="5" rx="1.5" />
          <rect x="2" y="9" width="5" height="5" rx="1.5" />
          <rect x="9" y="9" width="5" height="5" rx="1.5" />
        </svg>
        <span className="view-toggle__label">Grid</span>
      </button>

      <button
        type="button"
        className={`view-toggle__btn ${viewMode === 'row' ? 'view-toggle__btn--active' : ''}`}
        onClick={() => onChange('row')}
        aria-pressed={viewMode === 'row'}
        aria-label="Rows view"
      >
        <svg
          className="view-toggle__icon"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="2" y1="4" x2="14" y2="4" />
          <line x1="2" y1="8" x2="14" y2="8" />
          <line x1="2" y1="12" x2="14" y2="12" />
        </svg>
        <span className="view-toggle__label">Rows</span>
      </button>
    </div>
  );
}
