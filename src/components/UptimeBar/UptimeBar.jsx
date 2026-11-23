import { memo } from 'react';
import { useLanguage } from '../../lib/translations';

const SEGMENT_CLASSES = {
  operational: 'bg-[var(--status-operational)] opacity-60',
  degraded: 'bg-[var(--status-degraded)]',
  outage: 'bg-[var(--status-outage)]',
};

function UptimeBar({ bars = [], className = 'h-3.5' }) {
  const { t } = useLanguage();

  return (
    <div
      className={`flex w-full gap-[2px] ${className}`}
      role="img"
      aria-label={t('uptimeHistoryAria')}
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

