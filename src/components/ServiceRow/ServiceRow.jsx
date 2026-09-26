import StatusBadge from '../StatusBadge';
import { getLogoUrl } from '../../assets/logos';
import './ServiceRow.css';

/**
 * ServiceRow renders a service in compact table row mode.
 *
 * @param {Object} props
 * @param {Object} props.provider - Service provider metadata
 * @param {Object} [props.statusData] - Normalized status data
 * @param {boolean} [props.loading] - Whether this service is currently fetching
 * @param {() => void} [props.onSelect] - Optional selection/details callback
 */
export default function ServiceRow({
  provider,
  statusData,
  loading = false,
  onSelect,
}) {
  const logoSrc = getLogoUrl(provider.logo);
  const status = loading ? 'loading' : (statusData?.status || 'unknown');
  const description = loading ? 'Checking status...' : (statusData?.statusDescription || provider.description);

  return (
    <div
      className="service-row"
      onClick={onSelect}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={(e) => {
        if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="service-row__identity">
        <div className="service-row__logo-wrapper">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={`${provider.name} logo`}
              className="service-row__logo"
              loading="lazy"
            />
          ) : (
            <span className="service-row__logo-fallback">{provider.name.charAt(0)}</span>
          )}
        </div>
        <h3 className="service-row__name">{provider.name}</h3>
      </div>

      <p className="service-row__desc">{description}</p>

      <div className="service-row__actions">
        <StatusBadge status={status} size="sm" />

        <a
          href={provider.pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="service-row__link"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Open official status page for ${provider.name}`}
        >
          <svg
            className="service-row__link-icon"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M6 3h7v7" />
            <path d="M13 3L7 9" />
          </svg>
        </a>
      </div>
    </div>
  );
}
