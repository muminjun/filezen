'use client';

import { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { generateFileId } from '../lib/utils';
import type { PresetConfig } from '../lib/types';

export function usePresets() {
  const { presets, addPreset, removePreset, settings, updateSettings } = useAppContext();

  const createPresetFromCurrent = useCallback(
    (name: string) => {
      const newPreset: PresetConfig = {
        id: generateFileId(),
        name,
        width: settings.width,
        height: settings.height,
        resizeMode: settings.resizeMode,
        format: settings.format,
      };
      addPreset(newPreset);
      return newPreset;
    },
    [settings, addPreset]
  );

  const applyPreset = useCallback(
    (preset: PresetConfig) => {
      updateSettings({
        width: preset.width,
        height: preset.height,
        resizeMode: preset.resizeMode,
        format: preset.format,
      });
    },
    [updateSettings]
  );

  return {
    presets,
    createPresetFromCurrent,
    applyPreset,
    removePreset,
  };
}
