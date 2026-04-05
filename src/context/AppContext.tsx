'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { DEFAULT_SETTINGS, DEFAULT_PRESETS } from '../lib/constants';
import { StorageManager } from '../lib/storage';
import { generateFileId } from '../lib/utils';
import type {
  ProcessingFile,
  ConversionSettings,
  ProcessingRecord,
  PresetConfig,
  FavoriteSettings,
  AppContextType,
  RotationDegrees,
} from '../lib/types';

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [files, setFiles] = useState<ProcessingFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [settings, setSettingsState] = useState<ConversionSettings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<ProcessingRecord[]>([]);
  const [presets, setPresets] = useState<PresetConfig[]>(DEFAULT_PRESETS);
  const [favorites, setFavorites] = useState<FavoriteSettings[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage after hydration
  useEffect(() => {
    setSettingsState(StorageManager.getSettings(DEFAULT_SETTINGS));
    setHistory(StorageManager.getHistory());
    const saved = StorageManager.getPresets();
    setPresets(saved.length > 0 ? saved : DEFAULT_PRESETS);
    setFavorites(StorageManager.getFavorites());
    setIsHydrated(true);
  }, []);

  const addFiles = useCallback(async (newFiles: File[]) => {
    const processingFiles: ProcessingFile[] = newFiles.map((file) => {
      const id = generateFileId();
      const originalUrl = URL.createObjectURL(file);
      return {
        id,
        file,
        originalUrl,
        processedUrl: '',
        status: 'pending' as const,
        progress: 0,
        rotation: 0,
      };
    });

    setFiles((prev) => [...prev, ...processingFiles]);
    if (processingFiles.length > 0) {
      setSelectedFileId(processingFiles[0].id);
      setSelectedFileIds([processingFiles[0].id]);
    }
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => {
      const updated = prev.filter((f) => f.id !== fileId);
      if (selectedFileId === fileId) {
        setSelectedFileId(updated.length > 0 ? updated[0].id : null);
      }
      return updated;
    });
    setSelectedFileIds((prev) => prev.filter((id) => id !== fileId));
  }, [selectedFileId]);

  const selectFile = useCallback((fileId: string) => {
    setSelectedFileId(fileId);
    setSelectedFileIds([fileId]);
  }, []);

  const toggleFileSelection = useCallback((fileId: string) => {
    setSelectedFileIds((prev) => {
      if (prev.includes(fileId)) {
        return prev.filter((id) => id !== fileId);
      }
      return [...prev, fileId];
    });
    setSelectedFileId(fileId);
  }, []);

  const selectAllFiles = useCallback(() => {
    const allIds = files.map((f) => f.id);
    setSelectedFileIds(allIds);
    if (allIds.length > 0) setSelectedFileId(allIds[0]);
  }, [files]);

  const clearSelection = useCallback(() => {
    setSelectedFileIds([]);
  }, []);

  const rotateSelectedFiles = useCallback((degrees: 90 | 180 | 270 | 360) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (!selectedFileIds.includes(f.id)) return f;
        if (degrees === 360) return { ...f, rotation: 0 }; // 리셋: 0으로 초기화
        return { ...f, rotation: f.rotation + degrees }; // 누적: 항상 앞방향 회전
      })
    );
  }, [selectedFileIds]);

  const updateSettings = useCallback((newSettings: Partial<ConversionSettings>) => {
    setSettingsState((prev) => {
      const updated = { ...prev, ...newSettings };
      StorageManager.saveSettings(updated);
      return updated;
    });
  }, []);

  const processFiles = useCallback(async () => {
    setIsProcessing(true);
    // This will be implemented in useImageProcessor hook
  }, []);

  const addToHistory = useCallback((record: ProcessingRecord) => {
    StorageManager.saveHistory(record);
    setHistory((prev) => [record, ...prev].slice(0, 5));
  }, []);

  const clearHistory = useCallback(() => {
    StorageManager.clearHistory();
    setHistory([]);
  }, []);

  const addPreset = useCallback((preset: PresetConfig) => {
    StorageManager.savePreset(preset);
    setPresets((prev) => {
      const index = prev.findIndex((p) => p.id === preset.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = preset;
        return updated;
      }
      return [...prev, preset];
    });
  }, []);

  const removePreset = useCallback((presetId: string) => {
    StorageManager.deletePreset(presetId);
    setPresets((prev) => prev.filter((p) => p.id !== presetId));
  }, []);

  const addFavorite = useCallback((favorite: FavoriteSettings) => {
    StorageManager.saveFavorite(favorite);
    setFavorites((prev) => [...prev, favorite]);
  }, []);

  const removeFavorite = useCallback((favoriteId: string) => {
    StorageManager.deleteFavorite(favoriteId);
    setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
  }, []);

  const downloadFile = useCallback((fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file?.processedFile) return;

    const url = URL.createObjectURL(file.processedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted_${file.file.name}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [files]);

  const downloadAllAsZip = useCallback(async () => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    files.forEach((file) => {
      if (file.processedFile) {
        zip.file(`converted_${file.file.name}`, file.processedFile);
      }
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'filezen_converted.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [files]);

  const value: AppContextType = {
    files,
    selectedFileId,
    selectedFileIds,
    settings,
    history,
    presets,
    favorites,
    isProcessing,
    addFiles,
    removeFile,
    selectFile,
    toggleFileSelection,
    selectAllFiles,
    clearSelection,
    rotateSelectedFiles,
    updateSettings,
    processFiles,
    addToHistory,
    clearHistory,
    addPreset,
    removePreset,
    addFavorite,
    removeFavorite,
    downloadFile,
    downloadAllAsZip,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
