import { memo } from 'react';
import StatusBadge from '../StatusBadge';
import { getLogoUrl } from '../../assets/logos';
import './ServiceCard.css';

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
      className="service-card"
      onClick={onSelect ? handleClick : undefined}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-label={onSelect ? `View status details for ${provider.name}` : undefined}
      onKeyDown={onSelect ? handleKeyDown : undefined}
    >
      <div className="service-card__header">
        <div className="service-card__identity">
          <div className="service-card__logo-wrapper">
            {logoSrc ? (
              <img
                src={logoSrc}
                alt={`${provider.name} logo`}
                className="service-card__logo"
                loading="lazy"
              />
            ) : (
              <span className="service-card__logo-fallback">{provider.name.charAt(0)}</span>
            )}
          </div>
          <div className="service-card__titles">
            <h3 className="service-card__name">{provider.name}</h3>
            <p className="service-card__desc">{provider.description}</p>
          </div>
        </div>

        <StatusBadge status={status} size="sm" />
      </div>

      <div className="service-card__body">
        <p className="service-card__status-msg">{description}</p>
      </div>

      <div className="service-card__footer">
        <span className="service-card__components-count">
          {activeIncidents > 0 ? (
            <span style={{ color: 'var(--status-degraded)', fontWeight: 600 }}>
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
          className="service-card__link"
          onClick={(e) => e.stopPropagation()}
          aria-label={`Open official status page for ${provider.name}`}
          title={`Open official status page for ${provider.name}`}
        >
          <svg
            className="service-card__link-icon"
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
