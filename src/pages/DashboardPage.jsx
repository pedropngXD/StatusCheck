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

import './DashboardPage.css';

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState(null);

  const { theme, toggleTheme } = useTheme();
  const { viewMode, setViewMode } = useViewMode('grid');
  const { statuses, summary, loading, refreshing, lastCycleAt, refetch } = useServiceStatus(STATUS_PROVIDERS);

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

  // Filter providers by active preset, status filter, and search query
  const filteredProviders = useMemo(() => {
    return STATUS_PROVIDERS.filter((provider) => {
      // 1. Preset filter
      const matchesPreset = selectedServiceIds.includes(provider.id);
      if (!matchesPreset) return false;

      // 2. Status filter
      if (statusFilter !== 'all') {
        const serviceStatus = statuses[provider.id]?.data?.status || 'unknown';
        if (serviceStatus !== statusFilter) return false;
      }

      // 3. Search query filter
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase().trim();
      return (
        provider.name.toLowerCase().includes(query) ||
        provider.description.toLowerCase().includes(query) ||
        provider.category.toLowerCase().includes(query)
      );
    });
  }, [selectedServiceIds, statusFilter, statuses, searchQuery]);

  // Selected service status data for modal
  const selectedStatusData = selectedService ? statuses[selectedService.id]?.data : null;

  // Memoized handlers to maintain reference stability and prevent re-rendering cards
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
    <main className="dashboard">
      {/* Header */}
      <header className="dashboard__header">
        <div className="dashboard__header-top">
          <div className="dashboard__title-group">
            <h1 className="dashboard__title">Status Check</h1>
            <p className="dashboard__subtitle">
              Real-time telemetry and health monitoring for leading AI services and developer platforms.
            </p>
          </div>

          <div className="dashboard__telemetry">
            <span className={`dashboard__live-tag ${refreshing ? 'dashboard__live-tag--updating' : ''}`}>
              <span className="dashboard__live-dot" />
              {refreshing ? 'Checking telemetry...' : 'Live'}
            </span>

            <button
              type="button"
              className="dashboard__refresh-btn"
              onClick={refetch}
              disabled={refreshing}
              aria-label="Refresh status telemetry"
            >
              <svg
                className={`dashboard__refresh-icon ${refreshing ? 'dashboard__refresh-icon--spinning' : ''}`}
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

        {/* Aggregate Summary Metrics / Filter Buttons */}
        <div className="dashboard__metrics" role="group" aria-label="Status filter buttons">
          <button
            type="button"
            className={`metric-badge ${statusFilter === 'all' ? 'metric-badge--active' : ''}`}
            onClick={() => setStatusFilter('all')}
            aria-pressed={statusFilter === 'all'}
            aria-label={`Show all ${summary.total} monitored services`}
          >
            <span>Monitored:</span> <strong>{summary.total}</strong>
          </button>

          <button
            type="button"
            className={`metric-badge metric-badge--operational ${statusFilter === 'operational' ? 'metric-badge--active' : ''}`}
            onClick={() => handleStatusFilterToggle('operational')}
            aria-pressed={statusFilter === 'operational'}
            aria-label={`Filter by ${summary.operational} operational services`}
          >
            <span>Operational:</span> <strong>{summary.operational}</strong>
          </button>

          <button
            type="button"
            className={`metric-badge metric-badge--degraded ${statusFilter === 'degraded' ? 'metric-badge--active' : ''}`}
            onClick={() => handleStatusFilterToggle('degraded')}
            aria-pressed={statusFilter === 'degraded'}
            aria-label={`Filter by ${summary.degraded} degraded services`}
          >
            <span>Degraded:</span> <strong>{summary.degraded}</strong>
          </button>

          <button
            type="button"
            className={`metric-badge metric-badge--outage ${statusFilter === 'outage' ? 'metric-badge--active' : ''}`}
            onClick={() => handleStatusFilterToggle('outage')}
            aria-pressed={statusFilter === 'outage'}
            aria-label={`Filter by ${summary.outage} outage services`}
          >
            <span>Outages:</span> <strong>{summary.outage}</strong>
          </button>

          {lastCycleAt && (
            <span className="dashboard__last-check">
              <span className="dashboard__last-check-icon">✓</span>
              Checked at {lastCycleAt.toLocaleTimeString()}
            </span>
          )}
        </div>
      </header>

      {/* Preset Filter Tabs */}
      <PresetManager
        presets={presets}
        activePresetId={activePresetId}
        onSelectPreset={selectPreset}
        onCreatePreset={createPreset}
        onUpdatePreset={updatePreset}
        onDeletePreset={deletePreset}
        allServices={STATUS_PROVIDERS}
      />

      {/* Toolbar Controls (Search & View Mode Toggle) */}
      <div className="dashboard__controls">
        <div className="dashboard__search-wrapper">
          <svg
            className="dashboard__search-icon"
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
            className="dashboard__search-input"
            placeholder="Filter services by name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="dashboard__search-clear"
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

      {/* Services List / Grid */}
      <ServiceGrid
        providers={filteredProviders}
        statuses={statuses}
        viewMode={viewMode}
        loading={loading}
        refreshing={refreshing}
        onSelectService={handleSelectService}
        onResetFilter={handleResetFilter}
      />

      {/* Incident Details Modal */}
      <IncidentList
        key={selectedService?.id || 'none'}
        service={selectedService}
        statusData={selectedStatusData}
        onClose={handleCloseModal}
      />

      {/* Footer */}
      <footer className="dashboard__footer">
        <span>Status Check — Real-time telemetry dashboard for AI & cloud services.</span>
        <span>Auto-refreshes every 60 seconds • Direct API telemetry</span>
      </footer>
    </main>
  );
}
