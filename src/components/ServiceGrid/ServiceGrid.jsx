import ServiceCard from '../ServiceCard';
import ServiceRow from '../ServiceRow';
import './ServiceGrid.css';

/**
 * ServiceGrid renders the collection of services in either card grid or row list mode.
 *
 * @param {Object} props
 * @param {Array} props.providers - Filtered list of service providers to display
 * @param {Object} props.statuses - Map of providerId -> status object
 * @param {'grid' | 'row'} props.viewMode - Current layout mode
 * @param {boolean} props.loading - Initial global loading state
 * @param {(provider: Object) => void} [props.onSelectService] - Callback when a service is clicked
 * @param {() => void} [props.onResetFilter] - Callback when empty state reset button is clicked
 */
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
      <div className={`service-grid ${isGrid ? 'service-grid--cards' : 'service-grid--rows'}`}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`skeleton-${index}`}
            className={`service-skeleton ${isGrid ? '' : 'service-skeleton--row'}`}
          />
        ))}
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="service-grid__empty">
        <svg
          className="service-grid__empty-icon"
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
        <h3 className="service-grid__empty-title">No services found</h3>
        <p className="service-grid__empty-desc">
          No services match your active filter or preset. Try selecting a different preset.
        </p>
        {onResetFilter && (
          <button
            type="button"
            className="service-grid__empty-btn"
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
    <div className={`service-grid ${isGrid ? 'service-grid--cards' : 'service-grid--rows'} ${refreshing ? 'service-grid--refreshing' : ''}`}>
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
