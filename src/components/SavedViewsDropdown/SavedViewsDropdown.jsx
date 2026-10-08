import { useState, useRef, useEffect } from 'react';

export default function SavedViewsDropdown({ presets, activePresetId, onSelect }) {
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

  const activePreset = activePresetId ? presets.find(p => p.id === activePresetId) : null;

  return (
    <div className="relative w-full md:w-auto" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center justify-between md:justify-start gap-2 px-3 h-[44px] md:h-[38px] rounded-[var(--radius-md)] border text-[0.875rem] font-medium transition-colors w-full md:w-auto ${
          isOpen || activePresetId !== 'all'
            ? 'bg-[var(--bg-card)] border-[var(--text-secondary)] text-[var(--text-primary)]'
            : 'bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        }`}
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
        {activePreset ? activePreset.name : 'Saved views'}
        <svg className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[240px] bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] shadow-xl z-50 overflow-hidden">
          <div className="p-2 flex flex-col gap-1">
            <button
              type="button"
              onClick={() => { onSelect('all'); setIsOpen(false); }}
              className={`w-full flex items-center px-3 py-2 text-[0.875rem] font-medium rounded-[var(--radius-md)] transition-colors text-left ${activePresetId === 'all' ? 'bg-[var(--bg-card-hover)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'}`}
            >
              All Services
            </button>
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => { onSelect(preset.id); setIsOpen(false); }}
                className={`w-full flex items-center px-3 py-2 text-[0.875rem] font-medium rounded-[var(--radius-md)] transition-colors text-left ${activePresetId === preset.id ? 'bg-[var(--bg-card-hover)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'}`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

