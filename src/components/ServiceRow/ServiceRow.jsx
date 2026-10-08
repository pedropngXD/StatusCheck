import { memo } from 'react';
import ServiceLogo from '../ServiceLogo';
import UptimeBar from '../UptimeBar';
import ExternalLinkButton from '../ExternalLinkButton';
import { getStatusMeta } from '../../lib/statusMeta';

function ServiceRow({
  provider,
  statusData,
  bars = [],
  loading = false,
  onSelect,
}) {
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
        <p className="text-[0.75rem] text-[var(--text-secondary)] m-0 mt-0.5 truncate">{provider.description}</p>
      </div>

      <div className="hidden md:block w-[200px] shrink-0">
        <UptimeBar bars={bars} className="h-3" />
      </div>

      <div className={`inline-flex items-center gap-1.5 text-[0.8125rem] font-medium shrink-0 md:w-[110px] ${meta.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
        <span className="hidden md:inline">{meta.label}</span>
        <span className="sr-only md:hidden">{meta.label}</span>
      </div>

      <ExternalLinkButton href={provider.pageUrl} name={provider.name} />
    </div>
  );
}

export default memo(ServiceRow);
