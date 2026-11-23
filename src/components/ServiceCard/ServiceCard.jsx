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
  isPinned = false,
  onTogglePin,
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
        <div className="flex items-center gap-1 shrink-0">
          {onTogglePin && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(provider.id);
              }}
              aria-label={isPinned ? `Unpin ${provider.name}` : `Pin ${provider.name} to top`}
              aria-pressed={isPinned}
              title={isPinned ? `Unpin ${provider.name}` : `Pin ${provider.name} to top`}
              className={`w-7 h-7 rounded-[var(--radius-sm)] inline-flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                isPinned
                  ? 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                  : 'text-[var(--text-secondary)] opacity-55 hover:opacity-100 hover:bg-[rgba(142,142,147,0.12)] hover:text-[var(--text-primary)]'
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={isPinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
          )}
          <ExternalLinkButton href={provider.pageUrl} name={provider.name} />
        </div>
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
