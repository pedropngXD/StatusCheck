import { useState, useEffect, useCallback, useMemo } from 'react';
import { STATUS_PROVIDERS } from '../lib/statusProviders';

const STORAGE_PRESETS_KEY = 'statuscheck_presets';
const STORAGE_ACTIVE_PRESET_KEY = 'statuscheck_active_preset';

/**
 * Built-in default presets provided out of the box.
 */
export const DEFAULT_PRESETS = [
  {
    id: 'all',
    name: 'All Services',
    isDefault: true,
    serviceIds: STATUS_PROVIDERS.map((p) => p.id),
  },
  {
    id: 'ai-core',
    name: 'AI Core',
    isDefault: true,
    serviceIds: STATUS_PROVIDERS.filter((p) => p.category === 'ai').map((p) => p.id),
  },
  {
    id: 'dev-infra',
    name: 'Dev & Cloud',
    isDefault: true,
    serviceIds: STATUS_PROVIDERS.filter((p) => p.category === 'developer' || p.category === 'cloud').map((p) => p.id),
  },
];

function loadSavedPresets() {
  try {
    const raw = localStorage.getItem(STORAGE_PRESETS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore JSON/storage parse errors
  }
  return DEFAULT_PRESETS;
}

function loadSavedActivePresetId(availablePresets) {
  try {
    const saved = localStorage.getItem(STORAGE_ACTIVE_PRESET_KEY);
    if (saved && availablePresets.some((p) => p.id === saved)) {
      return saved;
    }
  } catch {
    // Ignore storage errors
  }
  return availablePresets[0]?.id || 'all';
}

/**
 * Hook to manage CRUD operations for user-defined and default service presets in localStorage.
 */
export function usePresets() {
  const [presets, setPresets] = useState(loadSavedPresets);
  const [activePresetId, setActivePresetId] = useState(() => loadSavedActivePresetId(presets));

  // Persist presets whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PRESETS_KEY, JSON.stringify(presets));
    } catch {
      // Ignore write errors
    }
  }, [presets]);

  // Persist activePresetId whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ACTIVE_PRESET_KEY, activePresetId);
    } catch {
      // Ignore write errors
    }
  }, [activePresetId]);

  // Current active preset object
  const activePreset = useMemo(() => {
    return presets.find((p) => p.id === activePresetId) || presets[0] || DEFAULT_PRESETS[0];
  }, [presets, activePresetId]);

  // List of active service IDs
  const selectedServiceIds = useMemo(() => {
    return activePreset?.serviceIds || [];
  }, [activePreset]);

  // Select a preset
  const selectPreset = useCallback((presetId) => {
    setActivePresetId(presetId);
  }, []);

  // Create a new preset
  const createPreset = useCallback((name, serviceIds = []) => {
    const trimmedName = name.trim();
    if (!trimmedName) return null;

    const newId = `preset_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newPreset = {
      id: newId,
      name: trimmedName,
      isDefault: false,
      serviceIds: Array.from(new Set(serviceIds)),
    };

    setPresets((prev) => [...prev, newPreset]);
    setActivePresetId(newId);
    return newPreset;
  }, []);

  // Update an existing preset
  const updatePreset = useCallback((presetId, updates) => {
    setPresets((prev) =>
      prev.map((preset) => {
        if (preset.id !== presetId) return preset;

        return {
          ...preset,
          name: updates.name ? updates.name.trim() : preset.name,
          serviceIds: Array.isArray(updates.serviceIds)
            ? Array.from(new Set(updates.serviceIds))
            : preset.serviceIds,
        };
      })
    );
  }, []);

  // Delete a custom preset (default presets cannot be deleted)
  const deletePreset = useCallback((presetId) => {
    setPresets((prev) => {
      const target = prev.find((p) => p.id === presetId);
      if (target?.isDefault) {
        return prev; // Protect default presets
      }
      return prev.filter((p) => p.id !== presetId);
    });

    // If currently active preset is deleted, fall back to 'all'
    setActivePresetId((currentActive) => (currentActive === presetId ? 'all' : currentActive));
  }, []);

  // Reset presets to defaults
  const resetToDefaults = useCallback(() => {
    setPresets(DEFAULT_PRESETS);
    setActivePresetId('all');
  }, []);

  return {
    presets,
    activePresetId,
    activePreset,
    selectedServiceIds,
    selectPreset,
    createPreset,
    updatePreset,
    deletePreset,
    resetToDefaults,
  };
}
