import { memo } from 'react';
import StatusBadge from '../StatusBadge';
import { getLogoUrl } from '../../assets/logos';

function ServiceRow({
  provider,
  statusData,
  loading = false,
  onSelect,
}) {
  const logoSrc = getLogoUrl(provider.logo);
  const status = loading ? 'loading' : (statusData?.status || 'unknown');
  const description = loading ? 'Checking status...' : (statusData?.statusDescription || provider.description);

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
      className="flex items-center justify-between gap-2.5 md:gap-4 px-3.5 md:px-5 py-3 md:py-3.5 bg-[var(--bg-card)] border border-[var(--border-card)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] transition-all duration-150 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform no-underline text-inherit cursor-pointer select-none hover:bg-[var(--bg-card-hover)] hover:shadow-[var(--shadow-card-hover)] hover:border-[var(--card-hover-border)] active:scale-[0.99] active:duration-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text-primary)] group flex-nowrap"
      onClick={onSelect ? handleClick : undefined}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-label={onSelect ? `View status details for ${provider.name}` : undefined}
      onKeyDown={onSelect ? handleKeyDown : undefined}
    >
      <div className="flex items-center gap-2.5 md:gap-3 min-w-0 md:min-w-[180px] max-w-none md:max-w-[260px] flex-1">
        <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-white flex items-center justify-center shrink-0 shadow-[var(--logo-wrapper-shadow)] border border-[var(--logo-wrapper-border)] overflow-hidden p-1">
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
        <h3 className="text-[0.875rem] md:text-[0.9375rem] font-semibold m-0 text-[var(--text-primary)] whitespace-nowrap overflow-hidden text-ellipsis">{provider.name}</h3>
      </div>

      <p className="flex-[2] text-[0.8125rem] text-[var(--text-secondary)] whitespace-nowrap overflow-hidden text-ellipsis m-0 hidden md:block">{description}</p>

      <div className="flex items-center gap-2 md:gap-3.5 shrink-0">
        <StatusBadge status={status} size="sm" />

        <a
          href={provider.pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] text-[var(--text-secondary)] bg-[rgba(142,142,147,0.08)] border border-[var(--border-subtle)] no-underline shrink-0 transition-all duration-[180ms] ease-out group-hover:border-[var(--card-hover-border)] group-hover:text-[var(--text-primary)] hover:!bg-[rgba(142,142,147,0.22)] hover:!border-[var(--text-secondary)] hover:!text-[var(--text-primary)] hover:-translate-y-px active:scale-[0.92] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text-primary)]"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Open official status page for ${provider.name}`}
          title={`Open official status page for ${provider.name}`}
        >
          <svg
            className="w-[15px] h-[15px] transition-transform duration-[180ms] ease-out block hover:translate-x-px hover:-translate-y-px"
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
    </div>
  );
}

export default memo(ServiceRow);
