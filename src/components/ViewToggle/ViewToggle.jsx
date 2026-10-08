export default function ViewToggle({ viewMode = 'grid', onChange, className = '' }) {
  return (
    <div
      className={`relative inline-flex items-center bg-[rgba(142,142,147,0.12)] p-[3px] rounded-[var(--radius-md)] border border-[var(--border-subtle)] select-none isolate h-[44px] md:h-[38px] ${className}`}
      role="group"
      aria-label="View layout switch"
    >
      <div 
        className={`absolute top-[3px] bottom-[3px] left-[3px] w-[calc(50%-3px)] bg-[var(--toggle-active-bg)] rounded-[calc(var(--radius-md)-3px)] shadow-[var(--toggle-active-shadow)] transition-transform duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none z-10 ${viewMode === 'row' ? 'translate-x-full' : 'translate-x-0'}`} 
        aria-hidden="true" 
      />
      <button
        type="button"
        className={`relative z-20 flex-1 inline-flex h-full items-center justify-center gap-1.5 px-2.5 sm:px-3.5 border-none bg-transparent font-sans text-[0.8125rem] rounded-[calc(var(--radius-md)-3px)] cursor-pointer transition-colors duration-[180ms] leading-none whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--text-primary)] ${viewMode === 'grid' ? 'text-[var(--toggle-active-color)] font-semibold' : 'text-[var(--text-secondary)] font-medium hover:text-[var(--text-primary)]'}`}
        onClick={() => onChange('grid')}
        aria-pressed={viewMode === 'grid'}
        aria-label="Grid view"
      >
        <svg
          className="w-3.5 h-3.5 block shrink-0"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="2" y="2" width="5" height="5" rx="1.5" />
          <rect x="9" y="2" width="5" height="5" rx="1.5" />
          <rect x="2" y="9" width="5" height="5" rx="1.5" />
          <rect x="9" y="9" width="5" height="5" rx="1.5" />
        </svg>
        <span>Grid</span>
      </button>

      <button
        type="button"
        className={`relative z-20 flex-1 inline-flex h-full items-center justify-center gap-1.5 px-2.5 sm:px-3.5 border-none bg-transparent font-sans text-[0.8125rem] rounded-[calc(var(--radius-md)-3px)] cursor-pointer transition-colors duration-[180ms] leading-none whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--text-primary)] ${viewMode === 'row' ? 'text-[var(--toggle-active-color)] font-semibold' : 'text-[var(--text-secondary)] font-medium hover:text-[var(--text-primary)]'}`}
        onClick={() => onChange('row')}
        aria-pressed={viewMode === 'row'}
        aria-label="Rows view"
      >
        <svg
          className="w-3.5 h-3.5 block shrink-0"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="2" y1="4" x2="14" y2="4" />
          <line x1="2" y1="8" x2="14" y2="8" />
          <line x1="2" y1="12" x2="14" y2="12" />
        </svg>
        <span>Rows</span>
      </button>
    </div>
  );
}
