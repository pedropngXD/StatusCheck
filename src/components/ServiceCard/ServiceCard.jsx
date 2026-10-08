import { memo } from 'react';
import StatusBadge from '../StatusBadge';
import { getLogoUrl } from '../../assets/logos';

function ServiceCard({
  provider,
  statusData,
  loading = false,
  onSelect,
}) {
  const logoSrc = getLogoUrl(provider.logo);
  const status = loading ? 'loading' : (statusData?.status || 'unknown');
  const description = loading ? 'Checking status...' : (statusData?.statusDescription || provider.description);
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
      className="relative flex flex-col justify-between bg-[var(--bg-card)] border border-[var(--border-card)] rounded-[var(--radius-md)] md:rounded-[var(--radius-lg)] p-3.5 md:p-5 shadow-[var(--shadow-card)] transition-all duration-[180ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform no-underline text-inherit overflow-hidden cursor-pointer select-none hover:-translate-y-[2px] hover:bg-[var(--bg-card-hover)] hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--card-hover-border)] active:scale-[0.985] active:shadow-[var(--shadow-card)] active:duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text-primary)] group"
      onClick={onSelect ? handleClick : undefined}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-label={onSelect ? `View status details for ${provider.name}` : undefined}
      onKeyDown={onSelect ? handleKeyDown : undefined}
    >
      <div className="flex items-start justify-between flex-col md:flex-row gap-2 md:gap-3 mb-2 md:mb-3.5">
        <div className="flex items-center gap-2 md:gap-3 min-w-0 w-full md:w-auto">
          <div className="w-7 h-7 md:w-[38px] md:h-[38px] p-1 md:p-1.5 rounded-[var(--radius-sm)] md:rounded-[var(--radius-md)] bg-white flex items-center justify-center shrink-0 shadow-[var(--logo-wrapper-shadow)] border border-[var(--logo-wrapper-border)] overflow-hidden">
            {logoSrc ? (
              <img
                src={logoSrc}
                alt={`${provider.name} logo`}
                className="w-full h-full object-contain block"
                loading="lazy"
              />
            ) : (
              <span className="text-[0.6875rem] font-bold text-[#1d1d1f] uppercase">{provider.name.charAt(0)}</span>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-[0.875rem] md:text-base font-semibold m-0 text-[var(--text-primary)] tracking-[-0.015em] whitespace-nowrap overflow-hidden text-ellipsis">{provider.name}</h3>
            <p className="hidden md:block text-[0.775rem] text-[var(--text-secondary)] m-0 mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{provider.description}</p>
          </div>
        </div>

        <StatusBadge status={status} size="sm" />
      </div>

      <div className="mt-1 mb-2 md:mt-2 md:mb-4">
        <p className="text-[0.775rem] leading-[1.35] md:text-[0.85rem] md:leading-[1.4] text-[var(--text-primary)] font-medium m-0 line-clamp-2">{description}</p>
      </div>

      <div className="flex items-center justify-between pt-2 md:pt-3 border-t border-[var(--border-subtle)] text-[0.72rem] md:text-xs text-[var(--text-secondary)]">
        <span className="inline-flex items-center gap-1 whitespace-nowrap overflow-hidden text-ellipsis min-w-0 md:whitespace-normal md:overflow-visible">
          {activeIncidents > 0 ? (
            <span className="text-[var(--status-degraded)] font-semibold">
              {activeIncidents} active {activeIncidents === 1 ? 'incident' : 'incidents'}
            </span>
          ) : componentCount > 0 ? (
            `${componentCount} components`
          ) : (
            'Official status'
          )}
        </span>

        <a
          href={provider.pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-[26px] h-[26px] md:w-8 md:h-8 rounded-[var(--radius-sm)] text-[var(--text-secondary)] bg-[rgba(142,142,147,0.08)] border border-[var(--border-subtle)] no-underline shrink-0 transition-all duration-[180ms] ease-out group-hover:border-[var(--card-hover-border)] group-hover:text-[var(--text-primary)] hover:!bg-[rgba(142,142,147,0.22)] hover:!border-[var(--text-secondary)] hover:!text-[var(--text-primary)] hover:-translate-y-px active:scale-[0.92] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text-primary)]"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Open official status page for ${provider.name}`}
          title={`Open official status page for ${provider.name}`}
        >
          <svg
            className="w-[13px] h-[13px] md:w-[15px] md:h-[15px] transition-transform duration-[180ms] ease-out hover:translate-x-px hover:-translate-y-px"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 9v3.5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 2 12.5v-7A1.5 1.5 0 0 1 3.5 4H7" />
            <path d="M10 2h4v4" />
            <path d="M7 9L14 2" />
          </svg>
        </a>
      </div>
    </article>
  );
}

export default memo(ServiceCard);
