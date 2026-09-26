import { useState, useEffect, useRef } from 'react';
import { getLogoUrl } from '../../assets/logos';
import './PresetManager.css';

/**
 * PresetManager renders the preset selection pill bar and the modal
 * for creating and editing custom service presets.
 */
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

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const backdropEl = backdropRef.current;
    const preventBackdropScroll = (e) => {
      if (e.target === backdropEl) {
        e.preventDefault();
      }
    };

    if (backdropEl) {
      backdropEl.addEventListener('wheel', preventBackdropScroll, { passive: false });
      backdropEl.addEventListener('touchmove', preventBackdropScroll, { passive: false });
    }

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.paddingRight = prevPaddingRight;
      window.removeEventListener('keydown', handleKeyDown);

      if (backdropEl) {
        backdropEl.removeEventListener('wheel', preventBackdropScroll);
        backdropEl.removeEventListener('touchmove', preventBackdropScroll);
      }
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
    <div className="preset-manager">
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
        {/* If current preset is a custom preset, allow editing */}
        {presets.find((p) => p.id === activePresetId && !p.isDefault) && (
          <button
            type="button"
            className="preset-action-btn"
            onClick={() => openEditModal(presets.find((p) => p.id === activePresetId))}
            aria-label="Edit active preset"
          >
            <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
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
          <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="2" x2="8" y2="14" />
            <line x1="2" y1="8" x2="14" y2="8" />
          </svg>
          New Preset
        </button>
      </div>

      {/* Preset Modal */}
      {modalOpen && (
        <div
          ref={backdropRef}
          className="preset-modal-backdrop"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
        >
          <form className="preset-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSave}>
            <div className="preset-modal__header">
              <h3 className="preset-modal__title">
                {editingPreset ? `Edit "${editingPreset.name}"` : 'Create Custom Preset'}
              </h3>
              <button
                type="button"
                className="incident-modal__close-btn"
                onClick={closeModal}
                aria-label="Close preset modal"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
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
                  autoFocus
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
                          checked={isChecked}
                          onChange={() => toggleService(service.id)}
                        />
                        {logoSrc && (
                          <img
                            src={logoSrc}
                            alt=""
                            className="preset-service-logo"
                            aria-hidden="true"
                          />
                        )}
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
                >
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
