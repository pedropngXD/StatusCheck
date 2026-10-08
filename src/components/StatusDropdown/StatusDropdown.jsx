import { useState, useRef, useEffect } from 'react';

const FILTERS = [
  { type: 'operational', label: 'Operational', dot: 'bg-[var(--status-operational)]' },
  { type: 'degraded', label: 'Degraded', dot: 'bg-[var(--status-degraded)]' },
  { type: 'outage', label: 'Outage', dot: 'bg-[var(--status-outage)]' },
  { type: 'unknown', label: 'Unknown', dot: 'bg-[var(--status-unknown)]' },
];

export default function StatusDropdown({ selected, onToggle, summary }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const issuesCount = summary ? (summary.degraded || 0) + (summary.outage || 0) : 0;
  const hasSelected = selected.length > 0;

  return (
    <div className="relative w-full md:w-auto" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center justify-between md:justify-start gap-2 px-3 h-[44px] md:h-[38px] rounded-[var(--radius-md)] border text-[0.875rem] font-medium transition-colors w-full md:w-auto ${
          isOpen || hasSelected
            ? 'bg-[var(--bg-card)] border-[var(--text-secondary)] text-[var(--text-primary)]'
            : 'bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        }`}
      >
        Status {hasSelected && <span className="flex items-center justify-center bg-[var(--text-primary)] text-[var(--bg-primary)] text-[0.7rem] rounded-full w-[18px] h-[18px] font-bold">{selected.length}</span>}
        <svg className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[280px] bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => {
                // If not already selected, select degraded and outage
                if (!selected.includes('degraded')) onToggle('degraded');
                if (!selected.includes('outage')) onToggle('outage');
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-[0.875rem] font-medium text-[var(--status-degraded)] hover:bg-[var(--bg-card-hover)] rounded-[var(--radius-md)] transition-colors"
            >
              Issues only
              <span>{issuesCount}</span>
            </button>
          </div>
          
          <div className="p-2 flex flex-col gap-1">
            {FILTERS.map(({ type, label, dot }) => {
              const isChecked = selected.includes(type);
              const count = summary ? summary[type] || 0 : 0;

              return (
                <label
                  key={type}
                  className="flex items-center justify-between px-3 py-2 hover:bg-[var(--bg-card-hover)] rounded-[var(--radius-md)] cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${isChecked ? 'bg-[var(--text-primary)] border-[var(--text-primary)]' : 'border-[var(--border-subtle)] group-hover:border-[var(--text-secondary)]'}`}>
                      {isChecked && (
                        <svg className="w-3 h-3 text-[var(--bg-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${dot.replace('bg-', 'bg-')}`} style={isChecked ? {} : { backgroundColor: `var(--status-${type})` }} />
                      <span className={`text-[0.875rem] font-medium ${isChecked ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>
                        {label}
                      </span>
                    </div>
                  </div>
                  <span className="text-[0.8125rem] text-[var(--text-secondary)]">{count}</span>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={isChecked}
                    onChange={() => onToggle(type)}
                  />
                </label>
              );
            })}
          </div>
          
          <div className="p-3 border-t border-[var(--border-subtle)] bg-[rgba(142,142,147,0.05)]">
            <span className="text-[0.75rem] text-[var(--text-secondary)]">
              Combines with Category and search.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

