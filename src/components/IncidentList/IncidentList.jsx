import { useEffect } from 'react';
import StatusBadge from '../StatusBadge';
import { getLogoUrl } from '../../assets/logos';
import './IncidentList.css';

/**
 * IncidentList renders a detailed modal for a selected service,
 * showing active incidents, status messages, and component breakdown.
 *
 * @param {Object} props
 * @param {Object|null} props.service - The selected service provider object
 * @param {Object|null} props.statusData - Normalized status data for this service
 * @param {() => void} props.onClose - Modal close handler
 */
export default function IncidentList({ service, statusData, onClose }) {
  useEffect(() => {
    if (!service) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [service, onClose]);

  if (!service) return null;

  const logoSrc = getLogoUrl(service.logo);
  const incidents = statusData?.incidents || [];
  const components = statusData?.components || [];
  const status = statusData?.status || 'unknown';

  return (
    <div className="incident-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="incident-modal" onClick={(e) => e.stopPropagation()}>
        <div className="incident-modal__header">
          <div className="incident-modal__identity">
            <div className="incident-modal__logo-wrapper">
              {logoSrc ? (
                <img src={logoSrc} alt={`${service.name} logo`} className="incident-modal__logo" />
              ) : (
                <span>{service.name.charAt(0)}</span>
              )}
            </div>
            <div>
              <h2 className="incident-modal__title">{service.name}</h2>
              <StatusBadge status={status} size="sm" />
            </div>
          </div>

          <button
            type="button"
            className="incident-modal__close-btn"
            onClick={onClose}
            aria-label="Close details modal"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="incident-modal__content">
          {/* Active Incidents Section */}
          <div>
            <h3 className="incident-modal__section-title">
              {incidents.length > 0 ? `Active Incidents (${incidents.length})` : 'Incident Status'}
            </h3>
            {incidents.length > 0 ? (
              incidents.map((incident) => (
                <div
                  key={incident.id}
                  className={`incident-item ${incident.impact === 'major' || incident.impact === 'critical' ? 'incident-item--outage' : ''}`}
                >
                  <div className="incident-item__header">
                    <h4 className="incident-item__name">{incident.name}</h4>
                    <span className="incident-item__time">
                      {new Date(incident.updatedAt).toLocaleString()}
                    </span>
                  </div>
                  {incident.message && (
                    <p className="incident-item__message">{incident.message}</p>
                  )}
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                {statusData?.statusDescription || 'No active incidents reported.'}
              </p>
            )}
          </div>

          {/* Components Section */}
          {components.length > 0 && (
            <div>
              <h3 className="incident-modal__section-title">
                Components Breakdown ({components.length})
              </h3>
              <div className="components-list">
                {components.map((comp) => (
                  <div key={comp.id} className="component-chip">
                    <span>{comp.name}</span>
                    <StatusBadge status={comp.status} size="sm" showDot />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="incident-modal__footer">
          <span>
            {statusData?.updatedAt
              ? `Last updated: ${new Date(statusData.updatedAt).toLocaleTimeString()}`
              : 'Direct API telemetry'}
          </span>
          <a
            href={service.pageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="incident-modal__external-link"
          >
            Visit Official Status Page
            <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 3h7v7" />
              <path d="M13 3L7 9" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
