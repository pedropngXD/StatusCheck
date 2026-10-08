export const STATUS_META = {
  operational: {
    label: 'Operational',
    text: 'text-[var(--status-operational)]',
    dot: 'bg-[var(--status-operational)]',
  },
  degraded: {
    label: 'Degraded',
    text: 'text-[var(--status-degraded)]',
    dot: 'bg-[var(--status-degraded)]',
  },
  outage: {
    label: 'Outage',
    text: 'text-[var(--status-outage)]',
    dot: 'bg-[var(--status-outage)]',
  },
  loading: {
    label: 'Checking...',
    text: 'text-[var(--text-secondary)]',
    dot: 'bg-[var(--status-unknown)] animate-pulse',
  },
  unknown: {
    label: 'Unknown',
    text: 'text-[var(--text-secondary)]',
    dot: 'bg-[var(--status-unknown)]',
  },
};

export function getStatusMeta(status) {
  return STATUS_META[status] || STATUS_META.unknown;
}

