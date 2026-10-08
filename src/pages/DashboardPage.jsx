import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { STATUS_PROVIDERS } from '../lib/statusProviders';
import { useServiceStatus } from '../hooks/useServiceStatus';
import { useStatusHistory } from '../hooks/useStatusHistory';
import { useRelativeTime } from '../hooks/useRelativeTime';
import { useViewMode } from '../hooks/useViewMode';
import { usePresets } from '../hooks/usePresets';
import { useTheme } from '../hooks/useTheme';
import { useStatusNotifications } from '../hooks/useStatusNotifications';

import ServiceGrid from '../components/ServiceGrid';
import ViewToggle from '../components/ViewToggle';
import PresetManager from '../components/PresetManager';
import IncidentList from '../components/IncidentList';
import ThemeToggle from '../components/ThemeToggle';
import StatusSummary from '../components/StatusSummary';
import SocialLinks from '../components/SocialLinks';

function getServiceStatus(statuses, id) {
  return statuses[id]?.data?.status || 'unknown';
}

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [statusFilters, setStatusFilters] = useState([]);
  const searchInputRef = useRef(null);

  const { theme, toggleTheme } = useTheme();
  const { viewMode, setViewMode } = useViewMode('grid');
  const { statuses, loading, refreshing, lastCycleAt, refetch } = useServiceStatus(STATUS_PROVIDERS);
  const { getBars } = useStatusHistory(statuses, lastCycleAt);
  const updatedAgo = useRelativeTime(lastCycleAt);

  const {
    presets,
    activePresetId,
    selectedServiceIds,
    selectPreset,
    createPreset,
    updatePreset,
    deletePreset,
  } = usePresets();

  const { isMuted, toggleMute } = useStatusNotifications(statuses, selectedServiceIds);

  useEffect(() => {
    const handleShortcut = (e) => {
      const tag = e.target?.tagName;
      if (e.key !== '/' || tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;
      e.preventDefault();
      searchInputRef.current?.focus();
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const handleStatusFilterToggle = useCallback((filterType) => {
    setStatusFilters((prev) =>
      prev.includes(filterType) ? prev.filter((type) => type !== filterType) : [...prev, filterType]
    );
  }, []);

  const handleClearStatusFilters = useCallback(() => setStatusFilters([]), []);

  const presetSummary = useMemo(() => {
    const summary = { total: 0, operational: 0, degraded: 0, outage: 0, unknown: 0 };

    STATUS_PROVIDERS.filter((provider) => selectedServiceIds.includes(provider.id)).forEach((provider) => {
      const type = getServiceStatus(statuses, provider.id);
      summary.total++;
      summary[type in summary ? type : 'unknown']++;
    });

    return summary;
  }, [selectedServiceIds, statuses]);

  const filteredProviders = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return STATUS_PROVIDERS.filter((provider) => {
      if (!selectedServiceIds.includes(provider.id)) return false;

      if (statusFilters.length > 0 && !statusFilters.includes(getServiceStatus(statuses, provider.id))) {
        return false;
      }

      if (!query) return true;
      return (
        provider.name.toLowerCase().includes(query) ||
        provider.description.toLowerCase().includes(query) ||
        provider.category.toLowerCase().includes(query)
      );
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedServiceIds, statusFilters, statuses, searchQuery]);

  const selectedStatusData = selectedService ? statuses[selectedService.id]?.data : null;

  const handleSelectService = useCallback((service) => {
    setSelectedService(service);
  }, []);

  const handleResetFilter = useCallback(() => {
    setSearchQuery('');
    selectPreset('all');
    setStatusFilters([]);
  }, [selectPreset]);

  const handleCloseModal = useCallback(() => {
    setSelectedService(null);
  }, []);

  const gridProps = {
    statuses,
    viewMode,
    refreshing,
    getHistory: getBars,
    onSelectService: handleSelectService,
  };

  const updatedLabel = updatedAgo && (
    <span className="inline-flex items-center gap-1 text-[0.72rem] md:text-xs text-[var(--text-secondary)] font-mono">
      <span className="text-[var(--status-operational)] font-sans">✓</span>
      Updated {updatedAgo}
    </span>
  );

  return (
    <main className="w-full max-w-[1240px] mx-auto px-4 md:px-6 pt-5 md:pt-10 pb-12 md:pb-16">
      <header className="mb-5 md:mb-6">
        <div className="flex items-start justify-between gap-3 md:gap-6">
          <div className="min-w-0">
            <h1 className="text-[1.75rem] md:text-[2.25rem] font-bold tracking-[-0.03em] m-0 text-[var(--text-primary)] leading-[1.15]">Status Check</h1>
            <p className="hidden md:block text-base text-[var(--text-secondary)] m-0 mt-2 max-w-[460px] leading-snug">
              Real-time telemetry and health monitoring for leading AI services and developer platforms.
            </p>
            <div className="md:hidden mt-1">{updatedLabel}</div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <div className="hidden md:block">{updatedLabel}</div>

            <button
              type="button"
              className="inline-flex items-center justify-center gap-1.5 bg-[var(--bg-card)] border border-[var(--border-card)] w-9 h-9 md:w-auto md:h-auto md:px-3 md:py-1.5 rounded-[var(--radius-md)] text-[var(--text-primary)] font-sans text-[0.8125rem] font-medium cursor-pointer shadow-[var(--shadow-card)] transition-all duration-200 hover:bg-[var(--bg-card-hover)] hover:shadow-[var(--shadow-card-hover)] disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={refetch}
              disabled={refreshing}
              aria-label="Refresh status telemetry"
            >
              <svg
                className={`w-3.5 h-3.5 ${refreshing ? 'animate-[spin_0.8s_linear_infinite]' : ''}`}
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M1.5 8a6.5 6.5 0 0 1 11.23-4.46L14.5 5" />
                <path d="M14.5 1.5v3.5h-3.5" />
                <path d="M14.5 8a6.5 6.5 0 0 1-11.23 4.46L1.5 11" />
                <path d="M1.5 14.5V11h3.5" />
              </svg>
              <span className="hidden md:inline">{refreshing ? 'Checking...' : 'Refresh'}</span>
            </button>

            <button
              type="button"
              className="inline-flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border-card)] w-9 h-9 md:w-auto md:h-auto md:px-3 md:py-1.5 rounded-[var(--radius-md)] text-[var(--text-primary)] font-sans text-[0.8125rem] font-medium cursor-pointer shadow-[var(--shadow-card)] transition-all duration-200 hover:bg-[var(--bg-card-hover)] hover:shadow-[var(--shadow-card-hover)]"
              onClick={toggleMute}
              aria-label={isMuted ? "Enable browser notifications" : "Disable browser notifications"}
              title={isMuted ? "Enable browser notifications" : "Disable browser notifications"}
            >
              {isMuted ? (
                <svg className="w-4 h-4 md:mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  <path d="M18.63 13A17.89 17.89 0 0 1 18 8" />
                  <path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14" />
                  <path d="M18 8a6 6 0 0 0-9.33-5" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg className="w-4 h-4 md:mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              )}
              <span className="hidden md:inline">{isMuted ? 'Muted' : 'Alerts On'}</span>
            </button>

            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </div>
      </header>

      <StatusSummary
        summary={presetSummary}
        selected={statusFilters}
        onToggle={handleStatusFilterToggle}
        onClear={handleClearStatusFilters}
      />

      <div className="mt-5 md:mt-6">
        <PresetManager
          presets={presets}
          activePresetId={activePresetId}
          onSelectPreset={selectPreset}
          onCreatePreset={createPreset}
          onUpdatePreset={updatePreset}
          onDeletePreset={deletePreset}
          allServices={STATUS_PROVIDERS}
        />
      </div>

      <div className="flex items-center justify-between gap-3 md:gap-4 mt-3 mb-5 w-full">
        <div className="relative flex-1 min-w-0 md:max-w-[360px]">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-[15px] md:h-[15px] text-[var(--text-secondary)] pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={searchInputRef}
            type="search"
            className="w-full h-[44px] md:h-[38px] pl-[34px] md:pl-9 pr-9 font-sans text-[0.875rem] rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-primary)] outline-none transition-all duration-200 focus:border-[var(--text-primary)] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]"
            placeholder="Filter services by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Filter services"
          />
          {!searchQuery && (
            <kbd className="hidden md:inline-flex absolute right-2.5 top-1/2 -translate-y-1/2 items-center justify-center w-5 h-5 rounded-[5px] border border-[var(--border-subtle)] bg-[rgba(142,142,147,0.1)] text-[0.6875rem] font-mono text-[var(--text-secondary)] pointer-events-none">
              /
            </kbd>
          )}
        </div>

        <div className="shrink-0 flex items-center">
          <ViewToggle viewMode={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {filteredProviders.length === 0 ? (
        <ServiceGrid providers={[]} onResetFilter={handleResetFilter} />
      ) : (
        <ServiceGrid providers={filteredProviders} loading={loading} {...gridProps} />
      )}

      <IncidentList
        key={selectedService?.id || 'none'}
        service={selectedService}
        statusData={selectedStatusData}
        onClose={handleCloseModal}
      />

      <footer className="mt-10 md:mt-16 pt-6 border-t border-[var(--border-subtle)] flex items-center justify-between flex-col md:flex-row gap-4 text-[0.8125rem] text-[var(--text-secondary)] text-center md:text-left">
        <div className="flex flex-col gap-1">
          <span>Status Check — Real-time telemetry dashboard for AI &amp; cloud services.</span>
          <span>Auto-refreshes every 60 seconds • Direct API telemetry</span>
        </div>
        <SocialLinks />
      </footer>
    </main>
  );
}
