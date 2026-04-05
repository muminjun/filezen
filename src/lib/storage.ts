import { STORAGE_KEYS, MAX_HISTORY_ITEMS, MAX_FAVORITES } from './constants';
import type { ProcessingRecord, PresetConfig, FavoriteSettings, ConversionSettings } from './types';

/**
 * LocalStorage management for FileZen
 */
export class StorageManager {
  /**
   * Save history record
   */
  static saveHistory(record: ProcessingRecord): void {
    try {
      const history = this.getHistory();
      // Keep only MAX_HISTORY_ITEMS
      history.unshift(record);
      if (history.length > MAX_HISTORY_ITEMS) {
        history.pop();
      }
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save history:', error);
    }
  }

  /**
   * Get all history records
   */
  static getHistory(): ProcessingRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load history:', error);
      return [];
    }
  }

  /**
   * Clear all history
   */
  static clearHistory(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  }

  /**
   * Save preset
   */
  static savePreset(preset: PresetConfig): void {
    try {
      const presets = this.getPresets();
      const index = presets.findIndex((p) => p.id === preset.id);
      if (index >= 0) {
        presets[index] = preset;
      } else {
        presets.push(preset);
      }
      localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(presets));
    } catch (error) {
      console.error('Failed to save preset:', error);
    }
  }

  /**
   * Get all presets
   */
  static getPresets(): PresetConfig[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRESETS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load presets:', error);
      return [];
    }
  }

  /**
   * Delete preset
   */
  static deletePreset(presetId: string): void {
    try {
      const presets = this.getPresets();
      const filtered = presets.filter((p) => p.id !== presetId);
      localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete preset:', error);
    }
  }

  /**
   * Save favorite settings
   */
  static saveFavorite(favorite: FavoriteSettings): void {
    try {
      const favorites = this.getFavorites();
      if (favorites.length >= MAX_FAVORITES) {
        favorites.shift(); // Remove oldest
      }
      favorites.push(favorite);
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    } catch (error) {
      console.error('Failed to save favorite:', error);
    }
  }

  /**
   * Get all favorites
   */
  static getFavorites(): FavoriteSettings[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load favorites:', error);
      return [];
    }
  }

  /**
   * Delete favorite
   */
  static deleteFavorite(favoriteId: string): void {
    try {
      const favorites = this.getFavorites();
      const filtered = favorites.filter((f) => f.id !== favoriteId);
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete favorite:', error);
    }
  }

  /**
   * Save current settings
   */
  static saveSettings(settings: ConversionSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  /**
   * Load saved settings or return default
   */
  static getSettings(defaultSettings: ConversionSettings): ConversionSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : defaultSettings;
    } catch (error) {
      console.error('Failed to load settings:', error);
      return defaultSettings;
    }
  }

  /**
   * Clear all data (for reset)
   */
  static clearAll(): void {
    try {
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Failed to clear all storage:', error);
    }
  }
}
