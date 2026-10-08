import { useState, useEffect, useRef } from 'react';

const STATUS_FILTERS = [
  { type: 'operational', label: 'Operational', dot: 'bg-[var(--status-operational)]' },
  { type: 'degraded', label: 'Degraded', dot: 'bg-[var(--status-degraded)]' },
  { type: 'outage', label: 'Outage', dot: 'bg-[var(--status-outage)]' },
  { type: 'unknown', label: 'Unknown', dot: 'bg-[var(--status-unknown)]' },
];

export default function MobileFiltersModal({
  isOpen,
  onClose,
  statusFilters,
  onToggleStatus,
  categoryFilter,
  onChangeCategory,
  categories,
  summary,
  filteredCount,
  onClearAll,
  presets = [],
  activePresetId = 'all',
  onSelectPreset,
  onEditPreset,
}) {
  const [isClosing, setIsClosing] = useState(false);
  const backdropRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen && !isClosing) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  const issuesCount = summary ? (summary.degraded || 0) + (summary.outage || 0) : 0;

  return (
    <div
      ref={backdropRef}
      className={`fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[2000] flex items-end sm:items-center justify-center overscroll-contain ${isClosing ? 'animate-[modal-fade-out_0.2s_ease-out_forwards]' : 'animate-[modal-fade-in_0.2s_ease-out]'}`}
      onClick={(e) => {
        if (e.target === backdropRef.current) handleClose();
      }}
    >
      <div 
        className={`bg-[#121212] w-full sm:max-w-[400px] rounded-t-[20px] sm:rounded-[20px] flex flex-col max-h-[90dvh] shadow-2xl relative ${isClosing ? 'animate-[modal-sheet-slide-down_0.2s_ease-out_forwards]' : 'animate-[modal-sheet-slide-up_0.24s_ease-out]'}`}
      >
        <div className="w-full flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-[var(--border-subtle)] rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 pt-2 pb-4">
          <h2 className="text-[1.25rem] font-bold text-[var(--text-primary)] m-0">Filters</h2>
          <button 
            type="button" 
            onClick={onClearAll}
            className="text-[0.875rem] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline underline-offset-2"
          >
            Clear all
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-24 overscroll-contain">
          {/* STATUS */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[0.6875rem] font-bold text-[var(--text-secondary)] uppercase tracking-wider m-0">Status</h3>
              <button
                type="button"
                onClick={() => {
                  if (!statusFilters.includes('degraded')) onToggleStatus('degraded');
                  if (!statusFilters.includes('outage')) onToggleStatus('outage');
                }}
                className="text-[0.75rem] font-semibold text-[#e5c158] border border-[#4d4422] bg-[#221f11] px-2.5 py-1 rounded-full"
              >
                Issues only · {issuesCount}
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {STATUS_FILTERS.map(({ type, label, dot }) => {
                const isChecked = statusFilters.includes(type);
                const count = summary ? summary[type] || 0 : 0;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onToggleStatus(type)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-[var(--radius-md)] border transition-colors ${isChecked ? 'bg-[#1a1a1a] border-[var(--text-secondary)]' : 'bg-transparent border-[var(--border-subtle)]'}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${dot.replace('bg-', 'bg-')}`} style={isChecked ? {} : { backgroundColor: `var(--status-${type})` }} />
                      <span className={`text-[0.875rem] font-medium ${isChecked ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)]'}`}>{label}</span>
                    </div>
                    {isChecked ? (
                      <svg className="w-3.5 h-3.5 text-[var(--text-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    ) : (
                      <span className="text-[0.8125rem] text-[var(--text-secondary)]">{count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CATEGORY */}
          <div className="mb-6">
            <h3 className="text-[0.6875rem] font-bold text-[var(--text-secondary)] uppercase tracking-wider m-0 mb-3">Category</h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onChangeCategory('all')}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full border text-[0.875rem] font-medium transition-colors ${categoryFilter === 'all' ? 'bg-[var(--text-primary)] border-[var(--text-primary)] text-[var(--bg-primary)]' : 'bg-transparent border-[var(--border-subtle)] text-[var(--text-primary)]'}`}
              >
                All <span className={`text-[0.75rem] ${categoryFilter === 'all' ? 'text-[var(--bg-secondary)]' : 'text-[var(--text-secondary)]'}`}>{summary ? summary.total : 0}</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => onChangeCategory(cat.name)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full border text-[0.875rem] font-medium capitalize transition-colors ${categoryFilter === cat.name ? 'bg-[var(--text-primary)] border-[var(--text-primary)] text-[var(--bg-primary)]' : 'bg-transparent border-[var(--border-subtle)] text-[var(--text-primary)]'}`}
                >
                  {cat.name} <span className={`text-[0.75rem] ${categoryFilter === cat.name ? 'text-[var(--bg-secondary)]' : 'text-[var(--text-secondary)]'}`}>{cat.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* SAVED VIEWS */}
          <div>
            <h3 className="text-[0.6875rem] font-bold text-[var(--text-secondary)] uppercase tracking-wider m-0 mb-3">Saved Views</h3>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <div key={preset.id} className={`inline-flex items-center rounded-full border transition-colors ${activePresetId === preset.id ? 'bg-[var(--text-primary)] border-[var(--text-primary)] text-[var(--bg-primary)]' : 'bg-transparent border-[var(--border-subtle)] text-[var(--text-primary)]'}`}>
                  <button
                    type="button"
                    onClick={() => onSelectPreset(preset.id)}
                    className="pl-3 pr-2 py-2 text-[0.875rem] font-medium"
                  >
                    {preset.name}
                  </button>
                  {!preset.isDefault && (
                    <button
                      type="button"
                      onClick={() => onEditPreset(preset)}
                      className={`pr-3 pl-1 py-2 flex items-center justify-center ${activePresetId === preset.id ? 'text-[var(--bg-primary)] opacity-80 hover:opacity-100' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                      aria-label={`Edit ${preset.name}`}
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 2a2 2 0 0 1 2.8 2.8L4.6 14 1 15l1-3.6L11 2z" /></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#121212] via-[#121212] to-transparent">
          <button
            type="button"
            onClick={handleClose}
            className="w-full h-[52px] bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-[var(--radius-lg)] font-bold text-[1rem] shadow-lg active:scale-[0.98] transition-transform"
          >
            Show {filteredCount} services
          </button>
        </div>
      </div>
    </div>
  );
}

