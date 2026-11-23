import { memo } from 'react';
import ServiceLogo from '../ServiceLogo';
import UptimeBar from '../UptimeBar';
import ExternalLinkButton from '../ExternalLinkButton';
import { getStatusMeta } from '../../lib/statusMeta';
import { useLanguage } from '../../lib/translations';

function ServiceRow({
  provider,
  statusData,
  bars = [],
  loading = false,
  onSelect,
  isPinned = false,
  onTogglePin,
}) {
  const { t, statusLabel, providerDescription } = useLanguage();
  const status = loading && !statusData ? 'loading' : (statusData?.status || 'unknown');
  const meta = getStatusMeta(status);

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
    <div
      className="flex items-center gap-3 px-3.5 md:px-4 py-3 border-b border-[var(--border-subtle)] last:border-b-0 transition-colors duration-150 cursor-pointer select-none hover:bg-[var(--bg-card-hover)] active:bg-[rgba(142,142,147,0.08)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--text-primary)]"
      onClick={onSelect ? handleClick : undefined}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-label={onSelect ? `View status details for ${provider.name}` : undefined}
      onKeyDown={onSelect ? handleKeyDown : undefined}
    >
      <ServiceLogo provider={provider} className="w-9 h-9" />

      <div className="min-w-0 flex-1">
        <h3 className="text-[0.9375rem] font-semibold m-0 text-[var(--text-primary)] truncate">{provider.name}</h3>
        <p className="text-[0.75rem] text-[var(--text-secondary)] m-0 mt-0.5 truncate">{providerDescription(provider)}</p>
      </div>

      <div className="hidden md:block w-[200px] shrink-0">
        <UptimeBar bars={bars} className="h-3" />
      </div>

      <div className={`inline-flex items-center gap-1.5 text-[0.8125rem] font-medium shrink-0 md:w-[110px] ${meta.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
        <span className="hidden md:inline">{statusLabel(status)}</span>
        <span className="sr-only md:hidden">{statusLabel(status)}</span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {onTogglePin && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(provider.id);
            }}
            aria-label={isPinned ? t('unpin', { name: provider.name }) : t('pinToTop', { name: provider.name })}
            aria-pressed={isPinned}
            title={isPinned ? t('unpin', { name: provider.name }) : t('pinToTop', { name: provider.name })}
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
  );
}

export default memo(ServiceRow);
