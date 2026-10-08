import { useState, useRef, useEffect } from 'react';

export default function CategoryDropdown({ categories, selected, onChange }) {
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

  const hasSelected = selected !== 'all';

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
        Category {hasSelected ? <span className="text-[var(--text-primary)] capitalize">{selected}</span> : 'All'}
        <svg className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[220px] bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] shadow-xl z-50 overflow-hidden">
          <div className="p-2 flex flex-col gap-1">
            <button
              type="button"
              onClick={() => { onChange('all'); setIsOpen(false); }}
              className={`w-full flex items-center justify-between px-3 py-2 text-[0.875rem] font-medium rounded-[var(--radius-md)] transition-colors text-left ${selected === 'all' ? 'bg-[var(--bg-card-hover)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'}`}
            >
              <span>All Categories</span>
              <span className="text-[0.75rem] text-[var(--text-secondary)] opacity-60 font-mono">{categories.reduce((sum, cat) => sum + cat.count, 0)}</span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => { onChange(cat.name); setIsOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 text-[0.875rem] font-medium capitalize rounded-[var(--radius-md)] transition-colors text-left ${selected === cat.name ? 'bg-[var(--bg-card-hover)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'}`}
              >
                <span>{cat.name}</span>
                <span className="text-[0.75rem] text-[var(--text-secondary)] opacity-60 font-mono">{cat.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

