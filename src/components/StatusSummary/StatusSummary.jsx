const FILTERS = [
  { type: 'operational', label: 'Operational', dot: 'bg-[var(--status-operational)]', text: 'text-[var(--status-operational)]' },
  { type: 'degraded', label: 'Degraded', dot: 'bg-[var(--status-degraded)]', text: 'text-[var(--status-degraded)]' },
  { type: 'outage', label: 'Outages', dot: 'bg-[var(--status-outage)]', text: 'text-[var(--status-outage)]' },
];

const BASE_BUTTON =
  'flex flex-col items-start gap-0.5 md:flex-row md:items-center md:gap-1.5 px-3 py-2 md:py-1.5 border rounded-[var(--radius-md)] md:rounded-full font-sans text-[0.75rem] md:text-[0.8125rem] font-medium cursor-pointer select-none transition-all duration-[180ms] leading-none active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text-primary)]';
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
    <section aria-label="Status summary">
      <div className="grid grid-cols-3 gap-2 md:flex md:flex-wrap md:items-center" role="group" aria-label="Status filters">
        <button
          type="button"
          className={`${BASE_BUTTON} hidden md:inline-flex ${noneSelected ? ACTIVE_BUTTON : IDLE_BUTTON}`}
          onClick={onClear}
          aria-pressed={noneSelected}
          aria-label={`Show all ${summary.total} monitored services`}
        >
          <span>All</span>
          <strong className="font-semibold opacity-70">{summary.total}</strong>
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
              <span className="inline-flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${dot}`} aria-hidden="true" />
                <strong className={`md:hidden text-[1rem] font-semibold ${active ? '' : text}`}>{count}</strong>
              </span>
              <span>{label}</span>
              <strong className={`hidden md:inline font-semibold ${active ? '' : text}`}>{count}</strong>
            </button>
          );
        })}

        <span className="hidden md:inline text-xs text-[var(--text-secondary)] ml-1">
          Multi-select to combine filters
        </span>
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

