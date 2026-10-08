import { useState, useEffect, useCallback, useMemo } from 'react';
import { STATUS_PROVIDERS } from '../lib/statusProviders';

const STORAGE_PRESETS_KEY = 'statuscheck_presets';
const STORAGE_ACTIVE_PRESET_KEY = 'statuscheck_active_preset';

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
  {
    id: 'web-apps',
    name: 'Web & Apps',
    isDefault: true,
    serviceIds: STATUS_PROVIDERS.filter((p) => p.category === 'web-apps').map((p) => p.id),
  },
];

function syncPresetsWithProviders(savedPresets) {
  const currentAllIds = STATUS_PROVIDERS.map((p) => p.id);
  const currentAiIds = STATUS_PROVIDERS.filter((p) => p.category === 'ai').map((p) => p.id);
  const currentDevIds = STATUS_PROVIDERS.filter((p) => p.category === 'developer' || p.category === 'cloud').map((p) => p.id);
  const currentWebAppsIds = STATUS_PROVIDERS.filter((p) => p.category === 'web-apps').map((p) => p.id);

  const updatedDefaults = [
    { id: 'all', name: 'All Services', isDefault: true, serviceIds: currentAllIds },
    { id: 'ai-core', name: 'AI Core', isDefault: true, serviceIds: currentAiIds },
    { id: 'dev-infra', name: 'Dev & Cloud', isDefault: true, serviceIds: currentDevIds },
    { id: 'web-apps', name: 'Web & Apps', isDefault: true, serviceIds: currentWebAppsIds },
  ];

  const customPresets = (savedPresets || [])
    .filter((p) => !p.isDefault && p.id !== 'all' && p.id !== 'ai-core' && p.id !== 'dev-infra' && p.id !== 'web-apps')
    .map((p) => ({
      ...p,
      serviceIds: p.serviceIds.map((id) => (id === 'anthropic' ? 'claude' : id)),
    }));

  return [...updatedDefaults, ...customPresets];
}

function loadSavedPresets() {
  try {
    const raw = localStorage.getItem(STORAGE_PRESETS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return syncPresetsWithProviders(parsed);
      }
    }
  } catch {}
  return syncPresetsWithProviders(DEFAULT_PRESETS);
}

function loadSavedActivePresetId(availablePresets) {
  try {
    const saved = localStorage.getItem(STORAGE_ACTIVE_PRESET_KEY);
    if (saved && availablePresets.some((p) => p.id === saved)) {
      return saved;
    }
  } catch {}
  return availablePresets[0]?.id || 'all';
}

export function usePresets() {
  const [presets, setPresets] = useState(loadSavedPresets);
  const [activePresetId, setActivePresetId] = useState(() => loadSavedActivePresetId(presets));

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PRESETS_KEY, JSON.stringify(presets));
    } catch {}
  }, [presets]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ACTIVE_PRESET_KEY, activePresetId);
    } catch {}
  }, [activePresetId]);

  const activePreset = useMemo(() => {
    return presets.find((p) => p.id === activePresetId) || presets[0] || DEFAULT_PRESETS[0];
  }, [presets, activePresetId]);

  const selectedServiceIds = useMemo(() => {
    return activePreset?.serviceIds || [];
  }, [activePreset]);

  const selectPreset = useCallback((presetId) => {
    setActivePresetId(presetId);
  }, []);

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

  const deletePreset = useCallback((presetId) => {
    setPresets((prev) => {
      const target = prev.find((p) => p.id === presetId);
      if (target?.isDefault) {
        return prev;
      }
      return prev.filter((p) => p.id !== presetId);
    });

    setActivePresetId((currentActive) => (currentActive === presetId ? 'all' : currentActive));
  }, []);

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
