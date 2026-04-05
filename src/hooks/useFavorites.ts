'use client';

import { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { generateFileId } from '../lib/utils';
import type { FavoriteSettings } from '../lib/types';

export function useFavorites() {
  const { favorites, addFavorite, removeFavorite, settings, updateSettings } = useAppContext();

  const saveCurrentAsFavorite = useCallback(
    (name: string) => {
      const newFavorite: FavoriteSettings = {
        id: generateFileId(),
        name,
        settings: { ...settings },
        createdAt: Date.now(),
      };
      addFavorite(newFavorite);
      return newFavorite;
    },
    [settings, addFavorite]
  );

  const applyFavorite = useCallback(
    (favorite: FavoriteSettings) => {
      updateSettings(favorite.settings);
    },
    [updateSettings]
  );

  return {
    favorites,
    saveCurrentAsFavorite,
    applyFavorite,
    removeFavorite,
  };
}
