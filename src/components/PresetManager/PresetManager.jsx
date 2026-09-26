import { useState, useEffect, useRef, useCallback } from 'react';
import { getLogoUrl } from '../../assets/logos';
import './PresetManager.css';

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
  const [editingPreset, setEditingPreset] = useState(null);
  const [presetName, setPresetName] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const backdropRef = useRef(null);
  const scrollRef = useRef(null);

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
    setModalOpen(true);
  };

  const openEditModal = (preset) => {
    setEditingPreset(preset);
    setPresetName(preset.name);
    setSelectedIds([...preset.serviceIds]);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingPreset(null);
    setPresetName('');
    setSelectedIds([]);
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

  return (
    <div className="preset-manager-container">
      {canScrollLeft && (
        <div className="preset-scroll-fade preset-scroll-fade--left">
          <button
            type="button"
            className="preset-scroll-arrow-btn"
            onClick={handleScrollLeft}
            aria-label="Scroll presets left"
          >
            <svg
              viewBox="0 0 16 16"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="10 3 5 8 10 13" />
            </svg>
          </button>
        </div>
      )}

      <div
        ref={scrollRef}
        className="preset-manager"
        onScroll={updateScrollState}
      >
        <nav className="preset-tabs" aria-label="Service Presets">
          {presets.map((preset) => {
            const isActive = preset.id === activePresetId;
            return (
              <button
                key={preset.id}
                type="button"
                className={`preset-pill ${isActive ? 'preset-pill--active' : ''}`}
                onClick={() => onSelectPreset(preset.id)}
              >
                <span>{preset.name}</span>
                <span className="preset-pill__count">{preset.serviceIds?.length ?? 0}</span>
              </button>
            );
          })}
        </nav>

        <div className="preset-manager__actions">
          {presets.find((p) => p.id === activePresetId && !p.isDefault) && (
            <button
              type="button"
              className="preset-action-btn"
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
            className="preset-action-btn"
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
        <div className="preset-scroll-fade preset-scroll-fade--right">
          <button
            type="button"
            className="preset-scroll-arrow-btn"
            onClick={handleScrollRight}
            aria-label="Scroll presets right"
          >
            <svg
              viewBox="0 0 16 16"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="6 3 11 8 6 13" />
            </svg>
          </button>
        </div>
      )}

      {modalOpen && (
        <div
          ref={backdropRef}
          className="preset-modal-backdrop"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
        >
          <form className="preset-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSave}>
            <div className="preset-modal__drag-handle" aria-hidden="true">
              <div className="preset-modal__drag-bar" />
            </div>

            <div className="preset-modal__header">
              <h3 className="preset-modal__title">
                {editingPreset ? `Edit "${editingPreset.name}"` : 'Create Custom Preset'}
              </h3>
              <button
                type="button"
                className="preset-modal__close-btn"
                onClick={closeModal}
                aria-label="Close preset modal"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="preset-modal__body">
              <div className="preset-input-group">
                <label htmlFor="preset-name-input">Preset Name</label>
                <input
                  id="preset-name-input"
                  type="text"
                  className="preset-input"
                  placeholder="e.g. My Daily Stack"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  required
                />
              </div>

              <div>
                <div className="preset-selector-header">
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Monitored Services ({selectedIds.length}/{allServices.length})
                  </label>
                  <div className="preset-quick-btns">
                    <button type="button" className="preset-quick-btn" onClick={selectAll}>All</button>
                    <button type="button" className="preset-quick-btn" onClick={selectAiOnly}>AI</button>
                    <button type="button" className="preset-quick-btn" onClick={selectDevOnly}>Dev</button>
                    <button type="button" className="preset-quick-btn" onClick={clearAll}>Clear</button>
                  </div>
                </div>

                <div className="preset-services-grid" style={{ marginTop: '0.75rem' }}>
                  {allServices.map((service) => {
                    const isChecked = selectedIds.includes(service.id);
                    const logoSrc = getLogoUrl(service.logo);

                    return (
                      <label
                        key={service.id}
                        className={`preset-service-check ${isChecked ? 'preset-service-check--selected' : ''}`}
                      >
                        <input
                          type="checkbox"
                          className="preset-service-check__input"
                          checked={isChecked}
                          onChange={() => toggleService(service.id)}
                        />
                        <span className="preset-service-check__box" aria-hidden="true">
                          <svg
                            viewBox="0 0 16 16"
                            className="preset-service-check__icon"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3.5 8.5 6.5 11.5 12.5 4.5" />
                          </svg>
                        </span>
                        <div className="preset-service-logo-wrapper">
                          {logoSrc ? (
                            <img
                              src={logoSrc}
                              alt=""
                              className="preset-service-logo"
                              aria-hidden="true"
                            />
                          ) : (
                            <span className="preset-service-logo-fallback">{service.name.charAt(0)}</span>
                          )}
                        </div>
                        <span className="preset-service-name">{service.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="preset-modal__footer">
              {editingPreset && !editingPreset.isDefault ? (
                <button
                  type="button"
                  className="apple-btn-danger"
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
                className="apple-btn-primary"
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
