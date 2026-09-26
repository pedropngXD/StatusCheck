import { useEffect, useRef, useState, useMemo } from 'react';
import StatusBadge from '../StatusBadge';
import { getLogoUrl } from '../../assets/logos';
import './IncidentList.css';

/**
 * Renders an incident message cleanly with optional clamping for long updates.
 */
function IncidentMessage({ message }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = message.length > 260;

  return (
    <div className="incident-item__message-wrapper">
      <p className={`incident-item__message ${!expanded && isLong ? 'incident-item__message--clamped' : ''}`}>
        {message}
      </p>
      {isLong && (
        <button
          type="button"
          className="incident-item__expand-btn"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show less' : 'Read full update'}
        </button>
      )}
    </div>
  );
}

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
  const backdropRef = useRef(null);

  useEffect(() => {
    if (!service) return;

    // Lock background scroll on body, compensating for scrollbar width
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const prevBodyOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.paddingRight = prevPaddingRight;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [service, onClose]);

  const [componentSearch, setComponentSearch] = useState('');
  const [showAllComponents, setShowAllComponents] = useState(false);

  const logoSrc = service ? getLogoUrl(service.logo) : null;
  const incidents = statusData?.incidents;
  const rawComponents = statusData?.components;
  const status = statusData?.status || 'unknown';

  // Sort components by priority: outage first, degraded second, then alphabetical
  const sortedComponents = useMemo(() => {
    if (!rawComponents || !Array.isArray(rawComponents)) return [];
    const priority = { outage: 0, degraded: 1, unknown: 2, operational: 3 };
    return [...rawComponents].sort((a, b) => {
      const pA = priority[a.status] ?? 4;
      const pB = priority[b.status] ?? 4;
      if (pA !== pB) return pA - pB;
      return a.name.localeCompare(b.name);
    });
  }, [rawComponents]);

  // Filter components by search query
  const filteredComponents = useMemo(() => {
    if (!componentSearch.trim()) return sortedComponents;
    const q = componentSearch.toLowerCase().trim();
    return sortedComponents.filter(
      (c) => c.name.toLowerCase().includes(q) || c.status.toLowerCase().includes(q)
    );
  }, [sortedComponents, componentSearch]);

  const visibleComponents = useMemo(() => {
    if (showAllComponents || componentSearch.trim() || filteredComponents.length <= 24) {
      return filteredComponents;
    }
    return filteredComponents.slice(0, 24);
  }, [filteredComponents, showAllComponents, componentSearch]);

  if (!service) return null;

  return (
    <div
      ref={backdropRef}
      className="incident-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="incident-modal" onClick={(e) => e.stopPropagation()}>
        <div className="incident-modal__drag-handle" aria-hidden="true">
          <div className="incident-modal__drag-bar" />
        </div>

        <div className="incident-modal__header">
          <div className="incident-modal__identity">
            <div className="incident-modal__logo-wrapper">
              {logoSrc ? (
                <img src={logoSrc} alt={`${service.name} logo`} className="incident-modal__logo" />
              ) : (
                <span>{service.name.charAt(0)}</span>
              )}
            </div>
            <div className="incident-modal__titles">
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
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
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
                    <IncidentMessage message={incident.message} />
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
          {sortedComponents.length > 0 && (
            <div>
              <div className="incident-modal__section-header">
                <h3 className="incident-modal__section-title">
                  Components ({sortedComponents.length})
                </h3>
              </div>

              {sortedComponents.length > 16 && (
                <div className="incident-modal__search-wrapper">
                  <svg
                    className="incident-modal__search-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="search"
                    className="incident-modal__search-input"
                    placeholder={`Filter ${sortedComponents.length} components...`}
                    value={componentSearch}
                    onChange={(e) => setComponentSearch(e.target.value)}
                  />
                </div>
              )}

              {visibleComponents.length > 0 ? (
                <div className="components-list">
                  {visibleComponents.map((comp) => (
                    <div key={comp.id} className="component-chip">
                      <span>{comp.name}</span>
                      <StatusBadge status={comp.status} size="sm" showDot />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="components-empty-msg">No components match &quot;{componentSearch}&quot;</p>
              )}

              {!componentSearch && !showAllComponents && filteredComponents.length > 24 && (
                <button
                  type="button"
                  className="components-show-all-btn"
                  onClick={() => setShowAllComponents(true)}
                >
                  Show all {filteredComponents.length} components
                </button>
              )}
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
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 9v3.5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 2 12.5v-7A1.5 1.5 0 0 1 3.5 4H7" />
              <path d="M10 2h4v4" />
              <path d="M7 9L14 2" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}
