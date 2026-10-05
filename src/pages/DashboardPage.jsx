import { useState, useMemo, useCallback } from 'react';
import { STATUS_PROVIDERS } from '../lib/statusProviders';
import { useServiceStatus } from '../hooks/useServiceStatus';
import { useViewMode } from '../hooks/useViewMode';
import { usePresets } from '../hooks/usePresets';
import { useTheme } from '../hooks/useTheme';

import ServiceGrid from '../components/ServiceGrid';
import ViewToggle from '../components/ViewToggle';
import PresetManager from '../components/PresetManager';
import IncidentList from '../components/IncidentList';
import ThemeToggle from '../components/ThemeToggle';

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState(null);

  const { theme, toggleTheme } = useTheme();
  const { viewMode, setViewMode } = useViewMode('grid');
  const { statuses, loading, refreshing, lastCycleAt, refetch } = useServiceStatus(STATUS_PROVIDERS);

  const {
    presets,
    activePresetId,
    selectedServiceIds,
    selectPreset,
    createPreset,
    updatePreset,
    deletePreset,
  } = usePresets();

  const [statusFilter, setStatusFilter] = useState('all');

  const handleStatusFilterToggle = useCallback((filterType) => {
    setStatusFilter((prev) => (prev === filterType ? 'all' : filterType));
  }, []);

  const presetSummary = useMemo(() => {
    let operational = 0;
    let degraded = 0;
    let outage = 0;
    let unknown = 0;

    const presetProviders = STATUS_PROVIDERS.filter((provider) =>
      selectedServiceIds.includes(provider.id)
    );

    presetProviders.forEach((provider) => {
      const statusObj = statuses[provider.id];
      const statusType = statusObj?.data?.status;

      if (!statusType || statusObj?.loading) {
        unknown++;
      } else if (statusType === 'operational') {
        operational++;
      } else if (statusType === 'degraded') {
        degraded++;
      } else if (statusType === 'outage') {
        outage++;
      } else {
        unknown++;
      }
    });

    return {
      total: presetProviders.length,
      operational,
      degraded,
      outage,
      unknown,
    };
  }, [selectedServiceIds, statuses]);

  const filteredProviders = useMemo(() => {
    return STATUS_PROVIDERS.filter((provider) => {
      const matchesPreset = selectedServiceIds.includes(provider.id);
      if (!matchesPreset) return false;

      if (statusFilter !== 'all') {
        const serviceStatus = statuses[provider.id]?.data?.status || 'unknown';
        if (serviceStatus !== statusFilter) return false;
      }

      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase().trim();
      return (
        provider.name.toLowerCase().includes(query) ||
        provider.description.toLowerCase().includes(query) ||
        provider.category.toLowerCase().includes(query)
      );
    });
  }, [selectedServiceIds, statusFilter, statuses, searchQuery]);

  const selectedStatusData = selectedService ? statuses[selectedService.id]?.data : null;

  const handleSelectService = useCallback((service) => {
    setSelectedService(service);
  }, []);

  const handleResetFilter = useCallback(() => {
    setSearchQuery('');
    selectPreset('all');
    setStatusFilter('all');
  }, [selectPreset]);

  const handleCloseModal = useCallback(() => {
    setSelectedService(null);
  }, []);

  return (
    <main className="w-full max-w-[1240px] mx-auto px-6 pt-10 pb-16 max-md:px-4 max-md:pt-5 max-md:pb-12">
      <header className="mb-8 max-md:mb-5">
        <div className="flex items-start justify-between gap-6 flex-wrap max-md:gap-3.5">
          <div className="max-w-[580px]">
            <h1 className="text-[2.25rem] font-bold tracking-[-0.03em] m-0 text-[var(--text-primary)] leading-[1.15] max-md:text-[1.75rem] max-md:leading-[1.2]">Status Check</h1>
            <p className="text-base text-[var(--text-secondary)] m-0 mt-2 leading-snug max-md:text-[0.875rem] max-md:leading-[1.4] max-md:mt-1.5">
              Real-time telemetry and health monitoring for leading AI services and developer platforms.
            </p>
          </div>

          <div className="flex items-center gap-3.5 max-md:w-full max-md:gap-2 max-md:flex-wrap">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border tracking-[0.04em] uppercase transition-all duration-200 ${refreshing ? 'text-[var(--status-degraded)] bg-[var(--status-degraded-bg)] border-[rgba(255,149,0,0.3)]' : 'text-[var(--status-operational)] bg-[var(--status-operational-bg)] border-[rgba(52,199,89,0.2)]'}`}>
              <span className={`w-1.5 h-1.5 rounded-full shadow-[0_0_6px_var(--status-operational)] bg-[var(--status-operational)] animate-[pulse_2s_infinite_ease-in-out]`} />
              {refreshing ? 'Checking telemetry...' : 'Live'}
            </span>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 bg-[var(--bg-card)] border border-[var(--border-card)] px-3 py-1.5 rounded-[var(--radius-md)] text-[var(--text-primary)] font-sans text-[0.8125rem] font-medium cursor-pointer shadow-[var(--shadow-card)] transition-all duration-200 hover:bg-[var(--bg-card-hover)] hover:shadow-[var(--shadow-card-hover)] disabled:opacity-60 disabled:cursor-not-allowed"
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
              <span>{refreshing ? 'Checking...' : 'Refresh'}</span>
            </button>

            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6 flex-wrap max-md:grid max-md:grid-cols-2 max-md:gap-2 max-md:mt-4 max-md:w-full" role="group" aria-label="Status filter buttons">
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--bg-card)] border rounded-full font-sans text-[0.8125rem] font-medium shadow-[var(--shadow-card)] cursor-pointer select-none transition-all duration-[180ms] ease-[cubic-bezier(0.16,1,0.3,1)] leading-none max-md:justify-between max-md:px-3.5 max-md:py-2 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text-primary)] ${statusFilter === 'all' ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)] shadow-[0_2px_10px_rgba(0,0,0,0.16)]' : 'border-[var(--border-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:border-[var(--card-hover-border)] hover:text-[var(--text-primary)] hover:-translate-y-px hover:shadow-[var(--shadow-card-hover)]'}`}
            onClick={() => setStatusFilter('all')}
            aria-pressed={statusFilter === 'all'}
            aria-label={`Show all ${presetSummary.total} monitored services`}
          >
            <span>Monitored:</span> <strong className={`font-semibold transition-colors duration-[180ms] ${statusFilter === 'all' ? 'text-[var(--bg-primary)]' : 'text-[var(--text-primary)]'}`}>{presetSummary.total}</strong>
          </button>

          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--bg-card)] border rounded-full font-sans text-[0.8125rem] font-medium shadow-[var(--shadow-card)] cursor-pointer select-none transition-all duration-[180ms] ease-[cubic-bezier(0.16,1,0.3,1)] leading-none max-md:justify-between max-md:px-3.5 max-md:py-2 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text-primary)] ${statusFilter === 'operational' ? 'bg-[var(--status-operational)] text-white border-[var(--status-operational)] shadow-[0_2px_12px_rgba(52,199,89,0.35)]' : 'border-[var(--border-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:border-[var(--card-hover-border)] hover:text-[var(--text-primary)] hover:-translate-y-px hover:shadow-[var(--shadow-card-hover)]'}`}
            onClick={() => handleStatusFilterToggle('operational')}
            aria-pressed={statusFilter === 'operational'}
            aria-label={`Filter by ${presetSummary.operational} operational services`}
          >
            <span>Operational:</span> <strong className={`font-semibold transition-colors duration-[180ms] ${statusFilter === 'operational' ? 'text-white' : 'text-[var(--status-operational)]'}`}>{presetSummary.operational}</strong>
          </button>

          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--bg-card)] border rounded-full font-sans text-[0.8125rem] font-medium shadow-[var(--shadow-card)] cursor-pointer select-none transition-all duration-[180ms] ease-[cubic-bezier(0.16,1,0.3,1)] leading-none max-md:justify-between max-md:px-3.5 max-md:py-2 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text-primary)] ${statusFilter === 'degraded' ? 'bg-[var(--status-degraded)] text-white border-[var(--status-degraded)] shadow-[0_2px_12px_rgba(255,149,0,0.35)]' : 'border-[var(--border-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:border-[var(--card-hover-border)] hover:text-[var(--text-primary)] hover:-translate-y-px hover:shadow-[var(--shadow-card-hover)]'}`}
            onClick={() => handleStatusFilterToggle('degraded')}
            aria-pressed={statusFilter === 'degraded'}
            aria-label={`Filter by ${presetSummary.degraded} degraded services`}
          >
            <span>Degraded:</span> <strong className={`font-semibold transition-colors duration-[180ms] ${statusFilter === 'degraded' ? 'text-white' : 'text-[var(--status-degraded)]'}`}>{presetSummary.degraded}</strong>
          </button>

          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--bg-card)] border rounded-full font-sans text-[0.8125rem] font-medium shadow-[var(--shadow-card)] cursor-pointer select-none transition-all duration-[180ms] ease-[cubic-bezier(0.16,1,0.3,1)] leading-none max-md:justify-between max-md:px-3.5 max-md:py-2 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text-primary)] ${statusFilter === 'outage' ? 'bg-[var(--status-outage)] text-white border-[var(--status-outage)] shadow-[0_2px_12px_rgba(255,59,48,0.35)]' : 'border-[var(--border-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:border-[var(--card-hover-border)] hover:text-[var(--text-primary)] hover:-translate-y-px hover:shadow-[var(--shadow-card-hover)]'}`}
            onClick={() => handleStatusFilterToggle('outage')}
            aria-pressed={statusFilter === 'outage'}
            aria-label={`Filter by ${presetSummary.outage} outage services`}
          >
            <span>Outages:</span> <strong className={`font-semibold transition-colors duration-[180ms] ${statusFilter === 'outage' ? 'text-white' : 'text-[var(--status-outage)]'}`}>{presetSummary.outage}</strong>
          </button>

          {lastCycleAt && (
            <span className="text-xs text-[var(--text-secondary)] ml-auto inline-flex items-center gap-1.5 bg-[var(--bg-card)] px-2.5 py-1 rounded-full border border-[var(--border-subtle)] shadow-[var(--shadow-card)] font-mono max-md:col-[1/-1] max-md:ml-0 max-md:w-full max-md:justify-center max-md:mt-0.5 max-md:text-[0.72rem] max-md:px-2.5 max-md:py-1">
              <span className="text-[var(--status-operational)] font-bold font-sans">✓</span>
              Checked at {lastCycleAt.toLocaleTimeString()}
            </span>
          )}
        </div>
      </header>

      <PresetManager
        presets={presets}
        activePresetId={activePresetId}
        onSelectPreset={selectPreset}
        onCreatePreset={createPreset}
        onUpdatePreset={updatePreset}
        onDeletePreset={deletePreset}
        allServices={STATUS_PROVIDERS}
      />

      <div className="flex items-center justify-between gap-4 mb-5 flex-wrap max-md:flex-row max-md:gap-2 max-md:mb-4">
        <div className="relative flex-1 min-w-[240px] max-w-[360px] max-md:min-w-0 max-md:max-w-none">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-[var(--text-secondary)] pointer-events-none max-md:left-2.5 max-md:w-3.5 max-md:h-3.5"
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
            type="search"
            className="w-full py-2 pr-3 pl-9 font-sans text-[0.875rem] rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-primary)] outline-none transition-all duration-200 focus:border-[var(--text-primary)] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)] max-md:text-[0.8125rem] max-md:py-2 max-md:px-2.5 max-md:pl-8"
            placeholder="Filter services by name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-transparent border-none text-[var(--text-secondary)] cursor-pointer p-0.5 flex items-center"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor">
                <path d="M8 0a8 8 0 1 0 8 8A8 8 0 0 0 8 0zm3.5 10.3l-1.2 1.2L8 9.2l-2.3 2.3-1.2-1.2L6.8 8 4.5 5.7l1.2-1.2L8 6.8l2.3-2.3 1.2 1.2L9.2 8z" />
              </svg>
            </button>
          )}
        </div>

        <ViewToggle viewMode={viewMode} onChange={setViewMode} />
      </div>

      <ServiceGrid
        providers={filteredProviders}
        statuses={statuses}
        viewMode={viewMode}
        loading={loading}
        refreshing={refreshing}
        onSelectService={handleSelectService}
        onResetFilter={handleResetFilter}
      />

      <IncidentList
        key={selectedService?.id || 'none'}
        service={selectedService}
        statusData={selectedStatusData}
        onClose={handleCloseModal}
      />

      <footer className="mt-16 pt-6 border-t border-[var(--border-subtle)] flex items-center justify-between flex-wrap gap-4 text-[0.8125rem] text-[var(--text-secondary)] max-md:flex-col max-md:text-center max-md:mt-10">
        <span>Status Check — Real-time telemetry dashboard for AI & cloud services.</span>
        <span>Auto-refreshes every 60 seconds • Direct API telemetry</span>
      </footer>
    </main>
  );
}
