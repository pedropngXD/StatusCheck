import { memo } from 'react';

const SEGMENT_CLASSES = {
  operational: 'bg-[var(--status-operational)] opacity-60',
  degraded: 'bg-[var(--status-degraded)]',
  outage: 'bg-[var(--status-outage)]',
};

function UptimeBar({ bars = [], className = 'h-3.5' }) {
  return (
    <div
      className={`flex w-full gap-[2px] ${className}`}
      role="img"
      aria-label="Status history for the last 24 hours"
    >
      {bars.map((status, index) => (
        <span
          key={index}
          className={`flex-1 rounded-[2px] ${SEGMENT_CLASSES[status] || 'bg-[rgba(142,142,147,0.25)]'}`}
        />
      ))}
    </div>
  );
}

export default memo(UptimeBar);

