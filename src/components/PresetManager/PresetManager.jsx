import { useState, useEffect, useRef, useCallback } from 'react';
import { getLogoUrl } from '../../assets/logos';

export default function PresetManager({
  presets = [],
  activePresetId = 'all',
  onSelectPreset,
  onCreatePreset,
  onUpdatePreset,
  onDeletePreset,
  allServices = [],
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [editingPreset, setEditingPreset] = useState(null);
  const [presetName, setPresetName] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [presetSearchQuery, setPresetSearchQuery] = useState('');
  const [dragY, setDragY] = useState(0);
  const touchStartY = useRef(null);
  const backdropRef = useRef(null);
  const scrollRef = useRef(null);

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (touchStartY.current === null) return;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    if (deltaY > 0) {
      setDragY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (dragY > 100) {
      closeModal();
    } else {
      setDragY(0);
    }
    touchStartY.current = null;
  };

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 8);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;

    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        updateScrollState();
      });
      ro.observe(el);
    }

    window.addEventListener('resize', updateScrollState);
    return () => {
      window.removeEventListener('resize', updateScrollState);
      if (ro) ro.disconnect();
    };
  }, [updateScrollState, presets]);

  const handleScrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -160, behavior: 'smooth' });
  };

  const handleScrollRight = () => {
    scrollRef.current?.scrollBy({ left: 160, behavior: 'smooth' });
  };

  const openCreateModal = () => {
    setEditingPreset(null);
    setPresetName('');
    setSelectedIds([]);
    setPresetSearchQuery('');
    setModalOpen(true);
    setIsClosing(false);
    setDragY(0);
  };

  const openEditModal = (preset) => {
    setEditingPreset(preset);
    setPresetName(preset.name);
    setSelectedIds([...preset.serviceIds]);
    setPresetSearchQuery('');
    setModalOpen(true);
    setIsClosing(false);
    setDragY(0);
  };

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setModalOpen(false);
      setIsClosing(false);
      setEditingPreset(null);
      setPresetName('');
      setSelectedIds([]);
      setPresetSearchQuery('');
      setDragY(0);
    }, 200);
  };

  useEffect(() => {
    if (!modalOpen) return;

    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalOpen]);

  const toggleService = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedIds(allServices.map((s) => s.id));
  const clearAll = () => setSelectedIds([]);
  const selectAiOnly = () => setSelectedIds(allServices.filter((s) => s.category === 'ai').map((s) => s.id));
  const selectDevOnly = () => setSelectedIds(allServices.filter((s) => s.category === 'developer' || s.category === 'cloud').map((s) => s.id));
  const selectWebAppsOnly = () => setSelectedIds(allServices.filter((s) => s.category === 'web-apps').map((s) => s.id));

  const handleSave = (e) => {
    e.preventDefault();
    if (!presetName.trim()) return;

    if (editingPreset) {
      onUpdatePreset(editingPreset.id, {
        name: presetName,
        serviceIds: selectedIds,
      });
    } else {
      onCreatePreset(presetName, selectedIds);
    }
    closeModal();
  };

  const handleDelete = () => {
    if (editingPreset && !editingPreset.isDefault) {
      onDeletePreset(editingPreset.id);
      closeModal();
    }
  };

  const filteredServices = (presetSearchQuery.trim()
    ? allServices.filter((s) => s.name.toLowerCase().includes(presetSearchQuery.toLowerCase().trim()))
    : [...allServices]
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="relative w-full mb-5">
      {canScrollLeft && (
        <div className="absolute top-0 bottom-[6px] w-12 pointer-events-none flex items-center z-10 transition-opacity duration-200 left-0 justify-start bg-gradient-to-l from-transparent to-[var(--bg-primary)] to-75% pl-0.5">
          <button
            type="button"
            className="pointer-events-auto w-7 h-7 rounded-full bg-[var(--bg-card)] border border-[var(--border-card)] shadow-[0_2px_8px_rgba(0,0,0,0.18)] flex items-center justify-center text-[var(--text-primary)] cursor-pointer transition-all duration-[160ms] ease-[cubic-bezier(0.16,1,0.3,1)] p-0 shrink-0 hover:bg-[var(--bg-card-hover)] hover:border-[var(--card-hover-border)] hover:scale-105 active:scale-[0.92]"
            onClick={handleScrollLeft}
            aria-label="Scroll presets left"
          >
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="10 3 5 8 10 13" />
            </svg>
          </button>
        </div>
      )}

      <div
        ref={scrollRef}
        className="flex items-center justify-between gap-3 w-full overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-1.5 scroll-smooth"
        onScroll={updateScrollState}
      >
        <nav className="flex items-center gap-2 shrink-0" aria-label="Service Presets">
          {presets.map((preset) => {
            const isActive = preset.id === activePresetId;
            return (
              <button
                key={preset.id}
                type="button"
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 border rounded-full font-sans text-[0.8125rem] font-medium cursor-pointer whitespace-nowrap transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${isActive ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)] shadow-[0_2px_8px_rgba(0,0,0,0.15)]' : 'bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] hover:border-black/15'}`}
                onClick={() => onSelectPreset(preset.id)}
              >
                <span>{preset.name}</span>
                <span className={`text-xs px-1.5 rounded-full ${isActive ? 'bg-white/25' : 'bg-[rgba(142,142,147,0.2)] opacity-75'}`}>
                  {preset.serviceIds?.length ?? 0}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {presets.find((p) => p.id === activePresetId && !p.isDefault) && (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 h-8 bg-[rgba(142,142,147,0.08)] border border-[var(--border-subtle)] text-[var(--text-secondary)] rounded-full font-sans text-[0.8125rem] font-medium cursor-pointer whitespace-nowrap transition-all duration-[160ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-[var(--card-hover-border)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] hover:-translate-y-px hover:shadow-[var(--shadow-card)] active:scale-95"
              onClick={() => openEditModal(presets.find((p) => p.id === activePresetId))}
              aria-label="Edit active preset"
            >
              <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M11 2a2 2 0 0 1 2.8 2.8L4.6 14 1 15l1-3.6L11 2z" />
              </svg>
              Edit
            </button>
          )}

          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3.5 h-8 bg-[rgba(142,142,147,0.08)] border border-[var(--border-subtle)] text-[var(--text-secondary)] rounded-full font-sans text-[0.8125rem] font-medium cursor-pointer whitespace-nowrap transition-all duration-[160ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-[var(--card-hover-border)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] hover:-translate-y-px hover:shadow-[var(--shadow-card)] active:scale-[0.96]"
            onClick={openCreateModal}
            aria-label="Create new custom preset"
          >
            <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="8" y1="3" x2="8" y2="13" />
              <line x1="3" y1="8" x2="13" y2="8" />
            </svg>
            New Preset
          </button>
        </div>
      </div>

      {canScrollRight && (
        <div className="absolute top-0 bottom-[6px] w-12 pointer-events-none flex items-center z-10 transition-opacity duration-200 right-0 justify-end bg-gradient-to-r from-transparent to-[var(--bg-primary)] to-75% pr-0.5">
          <button
            type="button"
            className="pointer-events-auto w-7 h-7 rounded-full bg-[var(--bg-card)] border border-[var(--border-card)] shadow-[0_2px_8px_rgba(0,0,0,0.18)] flex items-center justify-center text-[var(--text-primary)] cursor-pointer transition-all duration-[160ms] ease-[cubic-bezier(0.16,1,0.3,1)] p-0 shrink-0 hover:bg-[var(--bg-card-hover)] hover:border-[var(--card-hover-border)] hover:scale-105 active:scale-[0.92]"
            onClick={handleScrollRight}
            aria-label="Scroll presets right"
          >
            <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="6 3 11 8 6 13" />
            </svg>
          </button>
        </div>
      )}

      {modalOpen && (
        <div
          ref={backdropRef}
          className={`fixed inset-0 bg-black/45 backdrop-blur-[8px] z-[1000] flex items-center justify-center p-6 overscroll-contain max-md:p-0 max-md:items-end ${
            isClosing ? 'animate-[modal-fade-out_0.2s_ease-out_forwards]' : 'animate-[modal-fade-in_0.18s_ease-out]'
          }`}
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
        >
          <form 
            className={`bg-[var(--bg-card)] border border-[var(--border-card)] rounded-[var(--radius-lg)] shadow-[0_24px_48px_rgba(0,0,0,0.28)] w-full max-w-[580px] max-h-[min(85vh,760px)] flex flex-col overflow-hidden overscroll-contain relative max-md:max-w-full max-md:h-[88dvh] max-md:max-h-[88dvh] max-md:rounded-t-[20px] max-md:rounded-b-none max-md:border-b-0 max-md:border-x-0 max-md:shadow-[0_-8px_32px_rgba(0,0,0,0.25)] ${
              isClosing 
                ? 'max-md:animate-[modal-sheet-slide-down_0.2s_ease-out_forwards] animate-[modal-scale-out_0.2s_ease-out_forwards]' 
                : 'max-md:animate-[modal-sheet-slide-up_0.24s_ease-out] animate-[modal-scale-in_0.24s_ease-out]'
            }`} 
            onClick={(e) => e.stopPropagation()} 
            onSubmit={handleSave}
            style={{ 
              transform: dragY > 0 && !isClosing ? `translateY(${dragY}px)` : '',
              transition: dragY === 0 || isClosing ? 'transform 0.2s ease-out' : 'none'
            }}
          >
            <div 
              className="hidden max-md:flex items-center justify-center pt-2.5 pb-0.5 bg-[var(--bg-card)] shrink-0 touch-none" 
              aria-hidden="true"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="w-9 h-[5px] rounded-[3px] bg-[rgba(142,142,147,0.35)] pointer-events-none" />
            </div>

            <div 
              className="flex items-center justify-between p-5 border-b border-[var(--border-subtle)] shrink-0 bg-[var(--bg-card)] max-md:py-3 max-md:px-5 max-md:sticky max-md:top-0 max-md:z-10 max-md:touch-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <h3 className="m-0 text-[1.125rem] font-semibold text-[var(--text-primary)] pointer-events-none">
                {editingPreset ? `Edit "${editingPreset.name}"` : 'Create Custom Preset'}
              </h3>
              <button
                type="button"
                className="bg-[rgba(142,142,147,0.15)] border-none w-8 h-8 rounded-full hidden md:flex items-center justify-center text-[var(--text-secondary)] cursor-pointer shrink-0 transition-all duration-200 hover:bg-[rgba(142,142,147,0.25)] hover:text-[var(--text-primary)] active:scale-[0.92]"
                onClick={closeModal}
                aria-label="Close preset modal"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="flex-1 min-h-0 p-6 overflow-y-auto overscroll-contain flex flex-col gap-5 [scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:rgba(142,142,147,0.35)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[rgba(142,142,147,0.3)] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[rgba(142,142,147,0.55)] max-md:p-5 max-md:gap-4">
              <div>
                <label htmlFor="preset-name-input" className="block text-[0.8125rem] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.04em] mb-2">Preset Name</label>
                <input
                  id="preset-name-input"
                  type="text"
                  className="w-full p-3 font-sans text-[0.9375rem] rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--input-bg)] text-[var(--text-primary)] outline-none transition-all duration-200 focus:border-[var(--text-primary)] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)]"
                  placeholder="e.g. My Daily Stack"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  required
                />
              </div>

              <div>
                <div className="flex flex-col gap-3 mb-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[0.8125rem] font-semibold text-[var(--text-secondary)]">
                      Monitored Services ({selectedIds.length}/{allServices.length})
                    </label>
                    <div className="flex gap-1.5 flex-wrap justify-end">
                      <button type="button" className="text-xs px-2 py-[3px] bg-[rgba(142,142,147,0.12)] border-none rounded-[var(--radius-sm)] text-[var(--text-secondary)] cursor-pointer hover:bg-[rgba(142,142,147,0.22)] hover:text-[var(--text-primary)]" onClick={selectAll}>All</button>
                      <button type="button" className="text-xs px-2 py-[3px] bg-[rgba(142,142,147,0.12)] border-none rounded-[var(--radius-sm)] text-[var(--text-secondary)] cursor-pointer hover:bg-[rgba(142,142,147,0.22)] hover:text-[var(--text-primary)]" onClick={selectAiOnly}>AI</button>
                      <button type="button" className="text-xs px-2 py-[3px] bg-[rgba(142,142,147,0.12)] border-none rounded-[var(--radius-sm)] text-[var(--text-secondary)] cursor-pointer hover:bg-[rgba(142,142,147,0.22)] hover:text-[var(--text-primary)]" onClick={selectDevOnly}>Dev</button>
                      <button type="button" className="text-xs px-2 py-[3px] bg-[rgba(142,142,147,0.12)] border-none rounded-[var(--radius-sm)] text-[var(--text-secondary)] cursor-pointer hover:bg-[rgba(142,142,147,0.22)] hover:text-[var(--text-primary)]" onClick={selectWebAppsOnly}>Web/Apps</button>
                      <button type="button" className="text-xs px-2 py-[3px] bg-[rgba(142,142,147,0.12)] border-none rounded-[var(--radius-sm)] text-[var(--text-secondary)] cursor-pointer hover:bg-[rgba(142,142,147,0.22)] hover:text-[var(--text-primary)]" onClick={clearAll}>Clear</button>
                    </div>
                  </div>

                  <div className="relative">
                    <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] pointer-events-none"
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
                      className="w-full py-2 pl-9 pr-3 font-sans text-[0.875rem] rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--input-bg)] text-[var(--text-primary)] outline-none transition-all duration-200 focus:border-[var(--text-primary)] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)]"
                      placeholder="Search services by name..."
                      value={presetSearchQuery}
                      onChange={(e) => setPresetSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2 max-h-[280px] overflow-y-auto overscroll-contain p-0.5 [scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:rgba(142,142,147,0.35)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[rgba(142,142,147,0.3)] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[rgba(142,142,147,0.55)] max-md:grid-cols-[repeat(auto-fill,minmax(130px,1fr))] max-md:max-h-none max-md:overflow-visible">
                  {filteredServices.map((service) => {
                    const isChecked = selectedIds.includes(service.id);
                    const logoSrc = getLogoUrl(service.logo);

                    return (
                      <label
                        key={service.id}
                        className={`flex items-center gap-2 px-2.5 py-2 bg-[var(--bg-card)] border rounded-[var(--radius-sm)] cursor-pointer select-none transition-all duration-[160ms] ease-[cubic-bezier(0.16,1,0.3,1)] relative [content-visibility:auto] [contain-intrinsic-size:40px] hover:-translate-y-px hover:shadow-[var(--shadow-card)] active:scale-[0.98] ${isChecked ? 'bg-[var(--status-operational-bg)] border-[rgba(52,199,89,0.38)] hover:border-[var(--status-operational)]' : 'border-[var(--border-subtle)] hover:bg-[var(--bg-card-hover)] hover:border-[var(--card-hover-border)]'} group`}
                      >
                        <input
                          type="checkbox"
                          className="absolute opacity-0 w-0 h-0 m-0 pointer-events-none peer"
                          checked={isChecked}
                          onChange={() => toggleService(service.id)}
                        />
                        <span className={`w-[18px] h-[18px] rounded-[5px] border-[1.5px] inline-flex items-center justify-center shrink-0 text-white transition-all duration-[160ms] ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--status-operational)] group-hover:border-[var(--text-secondary)] ${isChecked ? 'bg-[var(--status-operational)] border-[var(--status-operational)] shadow-[0_2px_6px_rgba(52,199,89,0.35)] scale-105' : 'bg-[rgba(142,142,147,0.08)] border-[var(--border-card)]'}`} aria-hidden="true">
                          <svg
                            viewBox="0 0 16 16"
                            className={`w-[11px] h-[11px] stroke-white transition-all duration-[160ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${isChecked ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
                            fill="none"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3.5 8.5 6.5 11.5 12.5 4.5" />
                          </svg>
                        </span>
                        <div className="w-[22px] h-[22px] rounded-[6px] bg-white flex items-center justify-center shrink-0 border border-[var(--logo-wrapper-border)] shadow-[var(--logo-wrapper-shadow)] p-[2px] overflow-hidden">
                          {logoSrc ? (
                            <img
                              src={logoSrc}
                              alt=""
                              className="w-full h-full object-contain block"
                              aria-hidden="true"
                            />
                          ) : (
                            <span className="text-[0.6875rem] font-bold text-[#1d1d1f] uppercase">{service.name.charAt(0)}</span>
                          )}
                        </div>
                        <span className="text-[0.8125rem] font-medium text-[var(--text-primary)] whitespace-nowrap overflow-hidden text-ellipsis">{service.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="shrink-0 p-4 px-6 border-t border-[var(--border-subtle)] flex items-center justify-between bg-[rgba(0,0,0,0.02)] gap-4 max-md:p-3.5 max-md:px-5 max-md:pb-[calc(0.875rem+env(safe-area-inset-bottom,12px))] max-md:flex-col-reverse max-md:items-stretch max-md:gap-2.5 max-md:sticky max-md:bottom-0 max-md:z-10 max-md:bg-[var(--bg-card)]">
              {editingPreset && !editingPreset.isDefault ? (
                <button
                  type="button"
                  className="bg-[var(--status-outage-bg)] text-[var(--status-outage)] border border-[rgba(255,59,48,0.25)] rounded-[var(--radius-sm)] font-sans text-[0.875rem] font-medium cursor-pointer py-2.5 px-4 inline-flex items-center gap-1.5 transition-all duration-[160ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[var(--status-outage)] hover:text-white hover:border-[var(--status-outage)] hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(255,59,48,0.3)] active:scale-[0.97] max-md:w-full max-md:justify-center max-md:p-2.5 max-md:px-4"
                  onClick={handleDelete}
                  aria-label={`Delete preset ${editingPreset.name}`}
                >
                  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2 4h12" />
                    <path d="M5.333 4V2.667a1.333 1.333 0 0 1 1.334-1.334h2.666a1.333 1.333 0 0 1 1.334 1.334V4" />
                    <path d="M12.667 4v9.333a1.333 1.333 0 0 1-1.334 1.334H4.667a1.333 1.333 0 0 1-1.334-1.334V4" />
                  </svg>
                  Delete Preset
                </button>
              ) : (
                <div />
              )}

              <button
                type="submit"
                className="bg-[var(--text-primary)] text-[var(--bg-primary)] border border-transparent py-2.5 px-5 rounded-[var(--radius-sm)] font-sans font-semibold text-[0.875rem] cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-[160ms] ease-[cubic-bezier(0.16,1,0.3,1)] inline-flex items-center justify-center gap-1.5 hover:not(:disabled):opacity-92 hover:not(:disabled):-translate-y-px hover:not(:disabled):shadow-[0_4px_12px_rgba(0,0,0,0.15)] active:not(:disabled):scale-[0.97] disabled:opacity-35 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none max-md:w-full max-md:justify-center max-md:p-2.5 max-md:px-4"
                disabled={!presetName.trim() || selectedIds.length === 0}
              >
                {editingPreset ? 'Save Changes' : 'Create Preset'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
