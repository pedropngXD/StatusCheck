import { memo } from 'react';
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
  * @param {(provider: Object) => void} [props.onSelect] - Optional selection/details callback
  */
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
      className="service-row"
      onClick={onSelect ? handleClick : undefined}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-label={onSelect ? `View status details for ${provider.name}` : undefined}
      onKeyDown={onSelect ? handleKeyDown : undefined}
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
          title={`Open official status page for ${provider.name}`}
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
