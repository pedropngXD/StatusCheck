import ServiceCard from '../ServiceCard';
import ServiceRow from '../ServiceRow';

export default function ServiceGrid({
  providers = [],
  statuses = {},
  viewMode = 'grid',
  loading = false,
  refreshing = false,
  onSelectService,
  onResetFilter,
}) {
  const isGrid = viewMode === 'grid';

  if (loading && providers.length === 0) {
    return (
      <div className={`w-full ${isGrid ? 'grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-5 max-md:grid-cols-2 max-md:gap-2.5' : 'flex flex-col gap-2.5'}`}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`skeleton-${index}`}
            className={`bg-[var(--bg-card)] border border-[var(--border-card)] relative overflow-hidden animate-pulse ${isGrid ? 'rounded-[var(--radius-lg)] p-5 min-h-[140px] max-md:p-3.5 max-md:rounded-[var(--radius-md)] max-md:min-h-[130px]' : 'rounded-[var(--radius-md)] min-h-[58px] px-5 py-3.5'}`}
          />
        ))}
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-6 bg-[var(--bg-card)] border border-dashed border-[var(--border-subtle)] rounded-[var(--radius-lg)] text-[var(--text-secondary)]">
        <svg
          className="w-11 h-11 mb-4 opacity-60"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="11" y1="8" x2="11" y2="14" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
        <h3 className="text-[1.125rem] font-semibold text-[var(--text-primary)] m-0 mb-2">No services found</h3>
        <p className="text-[0.875rem] max-w-[380px] m-0 mb-6">
          No services match your active filter or preset. Try selecting a different preset.
        </p>
        {onResetFilter && (
          <button
            type="button"
            className="inline-flex items-center gap-2 px-5 py-2 bg-[var(--text-primary)] text-[var(--bg-primary)] border border-transparent rounded-[var(--radius-full)] font-sans text-[0.875rem] font-medium cursor-pointer select-none shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-all duration-[180ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:opacity-92 hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(0,0,0,0.18)] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text-primary)]"
            onClick={onResetFilter}
          >
            <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M1.5 8a6.5 6.5 0 0 1 11.23-4.46L14.5 5" />
              <path d="M14.5 1.5v3.5h-3.5" />
            </svg>
            <span>Show All Services</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`w-full transition-opacity duration-200 ${refreshing ? 'opacity-85' : ''} ${isGrid ? 'grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-5 max-md:grid-cols-2 max-md:gap-2.5' : 'flex flex-col gap-2.5'}`}>
      {providers.map((provider) => {
        const statusEntry = statuses[provider.id];
        const statusData = statusEntry?.data || null;
        const isServiceLoading = statusEntry?.loading ?? loading;

        return isGrid ? (
          <ServiceCard
            key={provider.id}
            provider={provider}
            statusData={statusData}
            loading={isServiceLoading}
            onSelect={onSelectService}
          />
        ) : (
          <ServiceRow
            key={provider.id}
            provider={provider}
            statusData={statusData}
            loading={isServiceLoading}
            onSelect={onSelectService}
          />
        );
      })}
    </div>
  );
}
