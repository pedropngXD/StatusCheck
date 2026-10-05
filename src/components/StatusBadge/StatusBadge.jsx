import { memo } from 'react';

const DEFAULT_LABELS = {
  operational: 'Operational',
  degraded: 'Degraded',
  outage: 'Outage',
  loading: 'Checking...',
  unknown: 'Unknown',
};

const SIZE_CLASSES = {
  sm: 'px-2 py-[3px] text-[0.72rem] tracking-[0.01em]',
  md: 'px-3 py-[5px] text-[0.8125rem] tracking-[-0.01em]',
  lg: 'px-4 py-[7px] text-[0.9375rem]',
};

const DOT_SIZE_CLASSES = {
  sm: 'w-[5px] h-[5px]',
  md: 'w-[7px] h-[7px]',
  lg: 'w-[9px] h-[9px]',
};

const STATUS_CLASSES = {
  operational: 'bg-[var(--status-operational-bg)] text-[var(--status-operational)] border-[rgba(52,199,89,0.25)]',
  degraded: 'bg-[var(--status-degraded-bg)] text-[var(--status-degraded)] border-[rgba(255,149,0,0.25)]',
  outage: 'bg-[var(--status-outage-bg)] text-[var(--status-outage)] border-[rgba(255,59,48,0.25)]',
  loading: 'bg-[rgba(142,142,147,0.08)] text-[var(--text-secondary)] border-[var(--border-subtle)]',
  unknown: 'bg-[var(--status-unknown-bg)] text-[var(--status-unknown)] border-[rgba(142,142,147,0.25)]',
};

const DOT_STATUS_CLASSES = {
  operational: 'bg-[var(--status-operational)] shadow-[0_0_8px_rgba(52,199,89,0.4)]',
  degraded: 'bg-[var(--status-degraded)] shadow-[0_0_8px_rgba(255,149,0,0.4)] animate-pulse',
  outage: 'bg-[var(--status-outage)] shadow-[0_0_8px_rgba(255,59,48,0.4)] animate-pulse',
  loading: 'bg-[var(--text-secondary)] opacity-60 animate-pulse',
  unknown: 'bg-[var(--status-unknown)]',
};

function StatusBadge({
  status = 'unknown',
  label,
  size = 'md',
  showDot = true,
}) {
  const normalizedStatus = status ? status.toLowerCase() : 'unknown';
  const displayLabel = label || DEFAULT_LABELS[normalizedStatus] || 'Unknown';

  const baseClasses = "inline-flex items-center gap-1.5 font-sans font-medium rounded-full leading-none transition-all duration-200 select-none border border-transparent whitespace-nowrap";
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const statusClass = STATUS_CLASSES[normalizedStatus] || STATUS_CLASSES.unknown;
  
  const dotBaseClasses = "rounded-full shrink-0 transition-colors duration-200";
  const dotSizeClass = DOT_SIZE_CLASSES[size] || DOT_SIZE_CLASSES.md;
  const dotStatusClass = DOT_STATUS_CLASSES[normalizedStatus] || DOT_STATUS_CLASSES.unknown;

  return (
    <span className={`${baseClasses} ${sizeClass} ${statusClass}`}>
      {showDot && (
        <span 
          className={`${dotBaseClasses} ${dotSizeClass} ${dotStatusClass}`} 
          aria-hidden="true" 
        />
      )}
      <span>{displayLabel}</span>
    </span>
  );
}

export default memo(StatusBadge);
