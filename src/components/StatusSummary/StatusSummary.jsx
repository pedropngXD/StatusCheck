const FILTERS = [
  { type: 'operational', label: 'operational', dot: 'bg-[var(--status-operational)]', text: 'text-[var(--status-operational)]' },
  { type: 'degraded', label: 'degraded', dot: 'bg-[var(--status-degraded)]', text: 'text-[var(--status-degraded)]' },
  { type: 'outage', label: 'outage', dot: 'bg-[var(--status-outage)]', text: 'text-[var(--status-outage)]' },
  { type: 'unknown', label: 'unknown', dot: 'bg-[var(--status-unknown)]', text: 'text-[var(--status-unknown)]' },
];

export default function StatusSummary({ summary }) {
  const segments = FILTERS.map(f => ({
    key: f.type,
    count: summary[f.type] || 0,
    color: f.dot,
    label: f.label,
    textClass: f.text
  })).filter(segment => segment.count > 0);

  return (
    <section aria-label="Status summary" className="mt-6 mb-6">
      {/* Progress Bar */}
      <div
        className="flex h-2.5 gap-[2px] rounded-full overflow-hidden w-full bg-[var(--border-subtle)]"
        role="img"
        aria-label={`${summary.operational} operational, ${summary.degraded} degraded, ${summary.outage} outage`}
      >
        {segments.map((segment) => (
          <span key={segment.key} className={segment.color.replace('bg-', 'bg-')} style={{ flexGrow: segment.count || 0.01, minWidth: segment.count > 0 ? '4px' : '0' }} />
        ))}
      </div>

      {/* Text Summary */}
      <div className="flex flex-wrap items-center gap-4 mt-4 text-[0.875rem] font-medium text-[var(--text-secondary)]">
        <span className="text-[var(--text-primary)] font-bold">{summary.total} services</span>
        
        {segments.map((segment) => (
          <div key={segment.key} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${segment.color.replace('bg-', 'bg-')}`} aria-hidden="true" />
            <strong className={`font-bold ${segment.textClass}`}>{segment.count}</strong>
            <span className="text-[var(--text-secondary)]">{segment.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
