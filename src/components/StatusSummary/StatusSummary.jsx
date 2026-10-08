const FILTERS = [
  { type: 'operational', label: 'Operational', dot: 'bg-[var(--status-operational)]', text: 'text-[var(--status-operational)]' },
  { type: 'degraded', label: 'Degraded', dot: 'bg-[var(--status-degraded)]', text: 'text-[var(--status-degraded)]' },
  { type: 'outage', label: 'Outages', dot: 'bg-[var(--status-outage)]', text: 'text-[var(--status-outage)]' },
];

const BASE_BUTTON =
  'flex flex-col items-start justify-center p-2.5 sm:p-3 border rounded-[var(--radius-md)] font-sans cursor-pointer select-none transition-all duration-[180ms] leading-none active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text-primary)] w-full';
const IDLE_BUTTON =
  'bg-[var(--bg-card)] border-[var(--border-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:border-[var(--card-hover-border)] hover:text-[var(--text-primary)]';
const ACTIVE_BUTTON = 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)]';

export default function StatusSummary({ summary, selected = [], onToggle, onClear }) {
  const noneSelected = selected.length === 0;
  const segments = [
    { key: 'operational', count: summary.operational, color: 'bg-[var(--status-operational)]' },
    { key: 'degraded', count: summary.degraded, color: 'bg-[var(--status-degraded)]' },
    { key: 'outage', count: summary.outage, color: 'bg-[var(--status-outage)]' },
    { key: 'unknown', count: summary.unknown, color: 'bg-[var(--status-unknown)]' },
  ].filter((segment) => segment.count > 0);

  return (
    <section aria-label="Status summary" className="mt-2">
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="text-[0.8125rem] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em] m-0">
          Status Filters
        </h3>
        <span className="text-[0.75rem] text-[var(--text-secondary)] hidden sm:inline">
          Selecione para filtrar os serviços
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3" role="group" aria-label="Status filters">
        <button
          type="button"
          className={`${BASE_BUTTON} ${noneSelected ? ACTIVE_BUTTON : IDLE_BUTTON}`}
          onClick={onClear}
          aria-pressed={noneSelected}
          aria-label={`Show all ${summary.total} monitored services`}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${noneSelected ? 'bg-[var(--bg-primary)]' : 'bg-[var(--text-secondary)]'}`} aria-hidden="true" />
            <strong className={`text-[0.95rem] font-bold ${noneSelected ? 'text-[var(--bg-primary)]' : 'text-[var(--text-primary)]'}`}>{summary.total}</strong>
          </div>
          <span className="text-[0.75rem] font-medium">All</span>
        </button>

        {FILTERS.map(({ type, label, dot, text }) => {
          const active = selected.includes(type);
          const count = summary[type];

          return (
            <button
              key={type}
              type="button"
              className={`${BASE_BUTTON} ${active ? ACTIVE_BUTTON : IDLE_BUTTON}`}
              onClick={() => onToggle(type)}
              aria-pressed={active}
              aria-label={`Filter by ${count} ${label.toLowerCase()} services`}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-[var(--bg-primary)]' : dot.replace('bg-', 'bg-')}`} style={active ? {} : { backgroundColor: `var(--status-${type})` }} aria-hidden="true" />
                <strong className={`text-[0.95rem] font-bold ${active ? 'text-[var(--bg-primary)]' : text}`}>{count}</strong>
              </div>
              <span className="text-[0.75rem] font-medium">{label}</span>
            </button>
          );
        })}
      </div>

      <div
        className="flex h-1.5 gap-px mt-3 rounded-full overflow-hidden"
        role="img"
        aria-label={`${summary.operational} operational, ${summary.degraded} degraded, ${summary.outage} outage`}
      >
        {segments.map((segment) => (
          <span key={segment.key} className={segment.color} style={{ flexGrow: segment.count }} />
        ))}
      </div>
    </section>
  );
}

