import { memo } from 'react';
import ServiceLogo from '../ServiceLogo';
import UptimeBar from '../UptimeBar';
import ExternalLinkButton from '../ExternalLinkButton';
import { getStatusMeta } from '../../lib/statusMeta';

function ServiceCard({
  provider,
  statusData,
  bars = [],
  loading = false,
  onSelect,
}) {
  const status = loading && !statusData ? 'loading' : (statusData?.status || 'unknown');
  const meta = getStatusMeta(status);
  const componentCount = statusData?.components?.length || 0;
  const activeIncidents = statusData?.incidents?.length || 0;

  const handleClick = () => {
    if (onSelect) onSelect(provider);
  };

  const handleKeyDown = (e) => {
    if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onSelect(provider);
    }
  };

  return (
    <article
      className="relative flex flex-col gap-2.5 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-[var(--radius-md)] p-3.5 md:p-4 shadow-[var(--shadow-card)] transition-all duration-[180ms] ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer select-none hover:-translate-y-[2px] hover:bg-[var(--bg-card-hover)] hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--card-hover-border)] active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text-primary)]"
      onClick={onSelect ? handleClick : undefined}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-label={onSelect ? `View status details for ${provider.name}` : undefined}
      onKeyDown={onSelect ? handleKeyDown : undefined}
    >
      <div className="flex items-start gap-3">
        <ServiceLogo provider={provider} className="w-9 h-9" />
        <div className="min-w-0 flex-1">
          <h3 className="text-[0.9375rem] font-semibold m-0 text-[var(--text-primary)] tracking-[-0.015em] truncate">{provider.name}</h3>
          <p className="text-[0.75rem] text-[var(--text-secondary)] m-0 mt-0.5 truncate">{provider.description}</p>
        </div>
        <ExternalLinkButton href={provider.pageUrl} name={provider.name} />
      </div>

      <div className={`inline-flex items-center gap-1.5 text-[0.8125rem] font-medium ${meta.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
        {meta.label}
      </div>

      <UptimeBar bars={bars} />

      <div className="text-xs text-[var(--text-secondary)]">
        {activeIncidents > 0 ? (
          <span className="text-[var(--status-degraded)] font-semibold">
            {activeIncidents} active {activeIncidents === 1 ? 'incident' : 'incidents'}
          </span>
        ) : componentCount > 0 ? (
          `${componentCount} components`
        ) : (
          'Official status'
        )}
      </div>
    </article>
  );
}

export default memo(ServiceCard);
