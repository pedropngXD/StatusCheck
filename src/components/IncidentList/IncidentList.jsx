import { useEffect, useRef, useState, useMemo } from 'react';
import StatusBadge from '../StatusBadge';
import { getLogoUrl } from '../../assets/logos';

function IncidentMessage({ message }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = message.length > 260;

  return (
    <div className="mt-1">
      <p className={`text-[0.84rem] leading-normal text-[var(--text-primary)] m-0 whitespace-pre-wrap ${!expanded && isLong ? 'line-clamp-3' : ''}`}>
        {message}
      </p>
      {isLong && (
        <button
          type="button"
          className="bg-transparent border-none text-[var(--text-secondary)] text-[0.775rem] font-medium cursor-pointer pt-1 underline underline-offset-2 hover:text-[var(--text-primary)]"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show less' : 'Read full update'}
        </button>
      )}
    </div>
  );
}

export default function IncidentList({ service, statusData, onClose }) {
  const backdropRef = useRef(null);
  const [dragY, setDragY] = useState(0);
  const touchStartY = useRef(null);

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (touchStartY.current === null) return;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    if (deltaY > 0) {
      setDragY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (dragY > 100) {
      setDragY(0);
      onClose();
    } else {
      setDragY(0);
    }
    touchStartY.current = null;
  };

  useEffect(() => {
    if (!service) return;

    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [service, onClose]);

  const [componentSearch, setComponentSearch] = useState('');
  const [showAllComponents, setShowAllComponents] = useState(false);

  const logoSrc = service ? getLogoUrl(service.logo) : null;
  const incidents = statusData?.incidents;
  const rawComponents = statusData?.components;
  const status = statusData?.status || 'unknown';

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
      className="fixed inset-0 bg-black/50 backdrop-blur-[4px] z-[1000] flex items-center justify-center p-6 animate-[modal-fade-in_0.15s_cubic-bezier(0.16,1,0.3,1)] overscroll-contain will-change-[opacity] max-md:p-0 max-md:items-end"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-[var(--bg-card)] border border-[var(--border-card)] rounded-[var(--radius-lg)] shadow-[0_24px_48px_rgba(0,0,0,0.28)] w-full max-w-[620px] max-h-[min(85vh,780px)] flex flex-col overflow-hidden overscroll-contain animate-[modal-scale-in_0.18s_cubic-bezier(0.16,1,0.3,1)] will-change-[transform,opacity] relative max-md:max-w-full max-md:h-[88dvh] max-md:max-h-[88dvh] max-md:rounded-t-[20px] max-md:rounded-b-none max-md:border-b-0 max-md:border-x-0 max-md:shadow-[0_-8px_32px_rgba(0,0,0,0.25)] max-md:animate-[modal-sheet-slide-up_0.24s_cubic-bezier(0.16,1,0.3,1)]" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          transform: dragY > 0 ? `translateY(${dragY}px)` : '',
          transition: dragY === 0 ? 'transform 0.2s cubic-bezier(0.16,1,0.3,1)' : 'none'
        }}
      >
        <div 
          className="hidden max-md:flex items-center justify-center pt-2.5 pb-0.5 bg-[var(--bg-card)] shrink-0 touch-none" 
          aria-hidden="true"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-9 h-[5px] rounded-[3px] bg-[rgba(142,142,147,0.35)] pointer-events-none" />
        </div>

        <div 
          className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)] shrink-0 bg-[var(--bg-card)] max-md:py-3 max-md:px-5 max-md:sticky max-md:top-0 max-md:z-10 max-md:touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex items-center gap-3.5 min-w-0 pointer-events-none">
            <div className="w-9 h-9 rounded-[var(--radius-sm)] bg-white p-[5px] flex items-center justify-center shadow-[var(--logo-wrapper-shadow)] border border-[var(--logo-wrapper-border)] overflow-hidden shrink-0">
              {logoSrc ? (
                <img src={logoSrc} alt={`${service.name} logo`} className="w-full h-full object-contain" />
              ) : (
                <span>{service.name.charAt(0)}</span>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap min-w-0">
              <h2 className="text-[1.125rem] font-semibold m-0 text-[var(--text-primary)] max-md:text-[1.05rem]">{service.name}</h2>
              <StatusBadge status={status} size="sm" />
            </div>
          </div>

          <button
            type="button"
            className="bg-[rgba(142,142,147,0.15)] border-none w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] cursor-pointer shrink-0 transition-all duration-200 hover:bg-[rgba(142,142,147,0.25)] hover:text-[var(--text-primary)] active:scale-[0.92] max-md:hidden"
            onClick={onClose}
            aria-label="Close details modal"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 min-h-0 p-6 overflow-y-auto overscroll-contain flex flex-col gap-6 max-md:p-5 max-md:gap-5">
          <div>
            <h3 className="text-[0.875rem] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.05em] m-0 mb-3">
              {incidents.length > 0 ? `Active Incidents (${incidents.length})` : 'Incident Status'}
            </h3>
            {incidents.length > 0 ? (
              incidents.map((incident) => (
                <div
                  key={incident.id}
                  className={`bg-[rgba(255,149,0,0.08)] border border-[rgba(255,149,0,0.25)] rounded-[var(--radius-md)] p-4 mb-3 ${incident.impact === 'major' || incident.impact === 'critical' ? 'bg-[rgba(255,59,48,0.08)] border-[rgba(255,59,48,0.25)]' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[0.9375rem] font-semibold m-0 text-[var(--text-primary)]">{incident.name}</h4>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {new Date(incident.updatedAt).toLocaleString()}
                    </span>
                  </div>
                  {incident.message && (
                    <IncidentMessage message={incident.message} />
                  )}
                </div>
              ))
            ) : (
              <p className="text-[var(--text-secondary)] text-[0.9rem] m-0">
                {statusData?.statusDescription || 'No active incidents reported.'}
              </p>
            )}
          </div>

          {sortedComponents.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[0.875rem] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.05em] m-0 mb-3">
                  Components ({sortedComponents.length})
                </h3>
              </div>

              {sortedComponents.length > 16 && (
                <div className="relative mb-3">
                  <svg
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-[13px] h-[13px] text-[var(--text-secondary)] pointer-events-none"
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
                    className="w-full py-1.5 pr-3 pl-[30px] font-sans text-[0.8125rem] rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--input-bg)] text-[var(--text-primary)] outline-none transition-all duration-200 focus:border-[var(--text-primary)] focus:shadow-[0_0_0_2px_rgba(0,0,0,0.05)]"
                    placeholder={`Filter ${sortedComponents.length} components...`}
                    value={componentSearch}
                    onChange={(e) => setComponentSearch(e.target.value)}
                  />
                </div>
              )}

              {visibleComponents.length > 0 ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2 max-md:grid-cols-1">
                  {visibleComponents.map((comp) => (
                    <div key={comp.id} className="flex items-center justify-between px-3 py-2 bg-[rgba(142,142,147,0.08)] rounded-[var(--radius-sm)] text-[0.8125rem] text-[var(--text-primary)]">
                      <span>{comp.name}</span>
                      <StatusBadge status={comp.status} size="sm" showDot />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[var(--text-secondary)] text-[0.84rem] my-2 text-center">No components match &quot;{componentSearch}&quot;</p>
              )}

              {!componentSearch && !showAllComponents && filteredComponents.length > 24 && (
                <button
                  type="button"
                  className="block w-full mt-3 p-2 bg-[rgba(142,142,147,0.1)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-[var(--text-primary)] font-sans text-[0.8125rem] font-medium cursor-pointer transition-colors duration-200 hover:bg-[rgba(142,142,147,0.18)]"
                  onClick={() => setShowAllComponents(true)}
                >
                  Show all {filteredComponents.length} components
                </button>
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 p-4 px-6 border-t border-[var(--border-subtle)] flex items-center justify-between text-[0.8125rem] text-[var(--text-secondary)] bg-[rgba(0,0,0,0.02)] max-md:px-5 max-md:py-3.5 max-md:pb-[calc(0.875rem+env(safe-area-inset-bottom,12px))] max-md:flex-col-reverse max-md:items-stretch max-md:gap-2.5 max-md:text-center max-md:sticky max-md:bottom-0 max-md:z-10 max-md:bg-[var(--bg-card)]">
          <span>
            {statusData?.updatedAt
              ? `Last updated: ${new Date(statusData.updatedAt).toLocaleTimeString()}`
              : 'Direct API telemetry'}
          </span>
          <a
            href={service.pageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--text-primary)] no-underline font-medium inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)] bg-[rgba(142,142,147,0.08)] border border-[var(--border-subtle)] text-[0.8125rem] transition-all duration-[180ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[rgba(142,142,147,0.18)] hover:border-[var(--card-hover-border)] hover:-translate-y-px hover:no-underline active:scale-[0.97] max-md:w-full max-md:justify-center max-md:px-4 max-md:py-2.5"
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
