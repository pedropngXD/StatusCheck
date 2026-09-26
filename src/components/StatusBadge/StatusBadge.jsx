import { memo } from 'react';
import './StatusBadge.css';

const DEFAULT_LABELS = {
  operational: 'Operational',
  degraded: 'Degraded',
  outage: 'Outage',
  loading: 'Checking...',
  unknown: 'Unknown',
};

/**
 * StatusBadge displays a color-coded status indicator in Apple design style.
 *
 * @param {Object} props
 * @param {'operational' | 'degraded' | 'outage' | 'loading' | 'unknown'} props.status
 * @param {string} [props.label] - Optional custom label
 * @param {'sm' | 'md' | 'lg'} [props.size='md']
 * @param {boolean} [props.showDot=true]
 */
function StatusBadge({
  status = 'unknown',
  label,
  size = 'md',
  showDot = true,
}) {
  const normalizedStatus = status ? status.toLowerCase() : 'unknown';
  const displayLabel = label || DEFAULT_LABELS[normalizedStatus] || 'Unknown';

  return (
    <span className={`status-badge status-badge--${normalizedStatus} status-badge--${size}`}>
      {showDot && <span className="status-badge__dot" aria-hidden="true" />}
      <span className="status-badge__label">{displayLabel}</span>
    </span>
  );
}

export default memo(StatusBadge);
