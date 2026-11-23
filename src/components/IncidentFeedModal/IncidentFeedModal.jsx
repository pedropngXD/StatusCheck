import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import ServiceLogo from '../ServiceLogo';

const TYPE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'outage', label: 'Critical / Outage' },
  { id: 'degraded', label: 'High / Degraded' },
  { id: 'cve', label: 'CVEs' },
  { id: 'service', label: 'Services' },
];

export default function IncidentFeedModal({
  isOpen,
  onClose,
  providers = [],
  selectedServiceIds = [],
  statuses = {},
  onSelectService,
}) {
  const [scope, setScope] = useState('preset');
  const [typeFilter, setTypeFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [dragY, setDragY] = useState(0);
  const touchStartY = useRef(null);
  const backdropRef = useRef(null);

  const handleClose = useCallback(() => {
    setDragY(0);
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  }, [onClose]);

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
      handleClose();
    } else {
      setDragY(0);
    }
    touchStartY.current = null;
  };

  useEffect(() => {
    if (!isOpen) return;

    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

  const rawFeed = useMemo(() => {
    if (!isOpen) return [];

    const selectedSet = new Set(selectedServiceIds);
    const scopedProviders =
      scope === 'preset' ? providers.filter((p) => selectedSet.has(p.id)) : providers;

    const items = [];
    for (const provider of scopedProviders) {
      const data = statuses[provider.id]?.data;
      const incidents = data?.incidents;
      if (!Array.isArray(incidents) || incidents.length === 0) continue;

      const isCve = provider.category === 'languages' || provider.id === 'cisa-kev';
      for (const inc of incidents) {
        const ts = inc.updatedAt ? new Date(inc.updatedAt).getTime() : 0;
        items.push({
          key: `${provider.id}-${inc.id}`,
          provider,
          incident: inc,
          serviceStatus: data.status,
          isCve,
          timestamp: Number.isFinite(ts) ? ts : 0,
        });
      }
    }

    const impactRank = (impact) => (impact === 'critical' || impact === 'major' ? 0 : 1);

    return items.sort((a, b) => {
      if (b.timestamp !== a.timestamp) return b.timestamp - a.timestamp;
      return impactRank(a.incident.impact) - impactRank(b.incident.impact);
    });
  }, [isOpen, scope, providers, selectedServiceIds, statuses]);

  const filteredFeed = useMemo(() => {
    const q = query.toLowerCase().trim();

    return rawFeed.filter((item) => {
      const isCritical =
        item.incident.impact === 'critical' ||
        item.incident.impact === 'major' ||
        item.serviceStatus === 'outage';

      if (typeFilter === 'outage' && !isCritical) return false;
      if (typeFilter === 'degraded' && isCritical) return false;
      if (typeFilter === 'cve' && !item.isCve) return false;
      if (typeFilter === 'service' && item.isCve) return false;

      if (!q) return true;
      return (
        item.provider.name.toLowerCase().includes(q) ||
        (item.incident.name || '').toLowerCase().includes(q) ||
        (item.incident.message || '').toLowerCase().includes(q)
      );
    });
  }, [rawFeed, typeFilter, query]);

  if (!isOpen && !isClosing) return null;

  return (
    <div
      ref={backdropRef}
      className={`fixed inset-0 bg-black/50 backdrop-blur-[4px] z-[1000] flex items-center justify-center p-6 overscroll-contain max-md:p-0 max-md:items-end ${
        isClosing ? 'animate-[modal-fade-out_0.2s_ease-out_forwards]' : 'animate-[modal-fade-in_0.15s_ease-out]'
      }`}
      onClick={(e) => {
        if (e.target === backdropRef.current) handleClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Incident and CVE Timeline"
    >
      <div
        className={`bg-[var(--bg-card)] border border-[var(--border-card)] rounded-[var(--radius-lg)] shadow-[0_24px_48px_rgba(0,0,0,0.28)] w-full max-w-[740px] max-h-[min(88vh,820px)] flex flex-col overflow-hidden overscroll-contain relative max-md:max-w-full max-md:h-[90dvh] max-md:max-h-[90dvh] max-md:rounded-t-[20px] max-md:rounded-b-none max-md:border-b-0 max-md:border-x-0 ${
          isClosing
            ? 'max-md:animate-[modal-sheet-slide-down_0.2s_ease-out_forwards] md:animate-[modal-scale-out_0.2s_ease-out_forwards]'
            : 'max-md:animate-[modal-sheet-slide-up_0.24s_ease-out] md:animate-[modal-scale-in_0.18s_ease-out]'
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: dragY > 0 && !isClosing ? `translateY(${dragY}px)` : '',
          transition: dragY === 0 || isClosing ? 'transform 0.2s ease-out' : 'none',
        }}
      >
        <div
          className="hidden max-md:flex items-center justify-center pt-2.5 pb-1 shrink-0 touch-none"
          aria-hidden="true"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-9 h-[5px] rounded-[3px] bg-[rgba(142,142,147,0.35)] pointer-events-none" />
        </div>

        <div
          className="flex items-center justify-between gap-3 p-5 border-b border-[var(--border-subtle)] shrink-0 max-md:py-3 max-md:px-4 max-md:touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <h2 className="text-[1.125rem] font-semibold m-0 text-[var(--text-primary)] truncate">
              Incident & CVE Timeline
            </h2>
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-[rgba(142,142,147,0.15)] text-[var(--text-primary)]">
              {filteredFeed.length}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="inline-flex bg-[rgba(142,142,147,0.12)] p-0.5 rounded-[var(--radius-sm)] text-xs font-medium">
              <button
                type="button"
                onClick={() => setScope('preset')}
                className={`px-2.5 py-1 rounded-[calc(var(--radius-sm)-2px)] transition-colors cursor-pointer ${
                  scope === 'preset'
                    ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Current View
              </button>
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`px-2.5 py-1 rounded-[calc(var(--radius-sm)-2px)] transition-colors cursor-pointer ${
                  scope === 'all'
                    ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                All {providers.length}
              </button>
            </div>

            <button
              type="button"
              className="bg-[rgba(142,142,147,0.15)] border-none w-8 h-8 rounded-full hidden md:flex items-center justify-center text-[var(--text-secondary)] cursor-pointer shrink-0 transition-all hover:bg-[rgba(142,142,147,0.25)] hover:text-[var(--text-primary)]"
              onClick={handleClose}
              aria-label="Close timeline feed"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4 px-5 border-b border-[var(--border-subtle)] flex flex-col gap-3 shrink-0 max-md:px-4">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-secondary)] pointer-events-none"
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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search active incidents, CVEs, or services..."
              className="w-full h-[36px] pl-9 pr-3 text-[0.84rem] rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--input-bg)] text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)]"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setTypeFilter(f.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                  typeFilter === f.id
                    ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)]'
                    : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 flex flex-col gap-3 max-md:p-4">
          {filteredFeed.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12 px-4">
              <div className="w-10 h-10 rounded-full bg-[var(--status-operational-bg)] text-[var(--status-operational)] flex items-center justify-center mb-3">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="text-[0.95rem] font-semibold text-[var(--text-primary)] m-0 mb-1">
                All clear
              </h3>
              <p className="text-[0.84rem] text-[var(--text-secondary)] m-0 max-w-[340px]">
                No active incidents or recent CVEs match this filter.
              </p>
            </div>
          ) : (
            filteredFeed.map((item) => {
              const isCritical =
                item.incident.impact === 'critical' ||
                item.incident.impact === 'major' ||
                item.serviceStatus === 'outage';

              return (
                <article
                  key={item.key}
                  className={`rounded-[var(--radius-md)] p-4 border transition-colors ${
                    isCritical
                      ? 'bg-[rgba(255,59,48,0.07)] border-[rgba(255,59,48,0.24)]'
                      : 'bg-[rgba(255,149,0,0.07)] border-[rgba(255,149,0,0.24)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <ServiceLogo provider={item.provider} className="w-7 h-7" />
                      <button
                        type="button"
                        onClick={() => onSelectService(item.provider)}
                        className="bg-transparent border-none p-0 text-[0.875rem] font-semibold text-[var(--text-primary)] hover:underline cursor-pointer truncate"
                      >
                        {item.provider.name}
                      </button>
                      <span
                        className={`text-[0.6875rem] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                          isCritical
                            ? 'bg-[rgba(255,59,48,0.18)] text-[var(--status-outage)]'
                            : 'bg-[rgba(255,149,0,0.18)] text-[var(--status-degraded)]'
                        }`}
                      >
                        {isCritical ? 'Critical' : 'Degraded'}
                      </span>
                    </div>

                    <span className="text-xs text-[var(--text-secondary)] font-mono">
                      {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Recent'}
                    </span>
                  </div>

                  <h4 className="text-[0.9rem] font-semibold text-[var(--text-primary)] m-0">
                    {item.incident.name}
                  </h4>

                  {item.incident.message && (
                    <p className="text-[0.82rem] text-[var(--text-secondary)] m-0 mt-1.5 line-clamp-3 leading-normal whitespace-pre-wrap">
                      {item.incident.message}
                    </p>
                  )}

                  {item.incident.url && (
                    <a
                      href={item.incident.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-[0.775rem] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline underline-offset-2"
                    >
                      Open advisory ↗
                    </a>
                  )}
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
