import { memo } from 'react';
import StatusBadge from '../StatusBadge';
import ServiceLogo from '../ServiceLogo';
import UptimeBar from '../UptimeBar';
import { getStatusMeta } from '../../lib/statusMeta';

const TONES = {
  outage: 'bg-[var(--status-outage-bg)] border-[rgba(255,69,58,0.4)] hover:border-[rgba(255,69,58,0.7)]',
  degraded: 'bg-[var(--status-degraded-bg)] border-[rgba(255,159,10,0.4)] hover:border-[rgba(255,159,10,0.7)]',
};

function AttentionCard({ provider, statusData, bars, onSelect }) {
  const status = statusData?.status || 'unknown';
  const meta = getStatusMeta(status);
  const description = statusData?.statusDescription || provider.description;
  const activeIncidents = statusData?.incidents?.length || 0;

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(provider);
    }
  };

  return (
    <article
      className={`flex flex-col gap-2.5 md:gap-3 p-3.5 md:p-4 border rounded-[var(--radius-md)] md:rounded-[var(--radius-lg)] cursor-pointer select-none transition-all duration-[180ms] hover:-translate-y-px active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text-primary)] ${TONES[status] || TONES.degraded}`}
      onClick={() => onSelect(provider)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View status details for ${provider.name}`}
    >
      <div className="flex items-start gap-3">
        <ServiceLogo provider={provider} className="w-8 h-8 md:w-9 md:h-9" />
        <div className="min-w-0 flex-1">
          <h3 className="text-[0.9375rem] font-semibold m-0 text-[var(--text-primary)] truncate">{provider.name}</h3>
          <p className={`md:hidden text-[0.75rem] font-medium m-0 mt-0.5 truncate ${meta.text}`}>{description}</p>
          <p className="hidden md:block text-[0.75rem] text-[var(--text-secondary)] m-0 mt-0.5 truncate">{provider.description}</p>
        </div>
        <StatusBadge status={status} size="sm" />
      </div>

      <p className="hidden md:block text-[0.9375rem] font-semibold text-[var(--text-primary)] m-0">{description}</p>

      <UptimeBar bars={bars} className="h-4" />

      <div className="hidden md:flex items-center justify-between text-xs">
        <span className={`font-medium ${activeIncidents > 0 ? meta.text : 'text-[var(--text-secondary)]'}`}>
          {activeIncidents > 0
            ? `${activeIncidents} active ${activeIncidents === 1 ? 'incident' : 'incidents'}`
            : 'No active incidents'}
        </span>
        <span className="text-[var(--text-secondary)]">Last 24h · View details →</span>
      </div>
    </article>
  );
}

export default memo(AttentionCard);

