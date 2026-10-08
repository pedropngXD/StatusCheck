import ServiceCard from '../ServiceCard';
import ServiceRow from '../ServiceRow';

const GRID_CLASSES = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4';
const LIST_CLASSES = 'flex flex-col bg-[var(--bg-card)] border border-[var(--border-card)] rounded-[var(--radius-md)] shadow-[var(--shadow-card)] overflow-hidden';

export default function ServiceGrid({
  providers = [],
  statuses = {},
  viewMode = 'grid',
  loading = false,
  refreshing = false,
  getHistory,
  onSelectService,
  onResetFilter,
}) {
  const isGrid = viewMode === 'grid';

  if (loading && providers.length === 0) {
    return (
      <div className={`w-full ${isGrid ? GRID_CLASSES : LIST_CLASSES}`}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`skeleton-${index}`}
            className={`animate-pulse ${isGrid ? 'bg-[var(--bg-card)] border border-[var(--border-card)] rounded-[var(--radius-md)] min-h-[130px]' : 'min-h-[58px] border-b border-[var(--border-subtle)] last:border-b-0'}`}
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
            className="inline-flex items-center gap-2 px-5 py-2 bg-[var(--text-primary)] text-[var(--bg-primary)] border border-transparent rounded-[var(--radius-full)] font-sans text-[0.875rem] font-medium cursor-pointer select-none shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-all duration-[180ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:opacity-90 hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(0,0,0,0.18)] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text-primary)]"
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

  const Item = isGrid ? ServiceCard : ServiceRow;

  return (
    <div className={`w-full transition-opacity duration-200 ${refreshing ? 'opacity-85' : ''} ${isGrid ? GRID_CLASSES : LIST_CLASSES}`}>
      {providers.map((provider) => {
        const statusEntry = statuses[provider.id];

        return (
          <Item
            key={provider.id}
            provider={provider}
            statusData={statusEntry?.data || null}
            bars={getHistory ? getHistory(provider.id) : undefined}
            loading={statusEntry?.loading ?? loading}
            onSelect={onSelectService}
          />
        );
      })}
    </div>
  );
}
