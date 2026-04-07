'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SavedAdjustment, ColorAdjustment } from '@/lib/types';

const LS_RECENT = 'filezen_recent_adjustments';
const LS_SAVED  = 'filezen_saved_adjustments';
const COOKIE_KEY = 'filezen_saved_adj_ids';
const MAX_RECENT = 5;
const COOKIE_DAYS = 30;

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
}

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useSavedAdjustments() {
  const [saved, setSaved]   = useState<SavedAdjustment[]>([]);
  const [recent, setRecent] = useState<ColorAdjustment[]>([]);

  useEffect(() => {
    setSaved(loadJson<SavedAdjustment[]>(LS_SAVED, []));
    setRecent(loadJson<ColorAdjustment[]>(LS_RECENT, []));
  }, []);

  const saveAdjustment = useCallback((name: string, adjustment: ColorAdjustment) => {
    const entry: SavedAdjustment = {
      id: `adj-${Date.now()}`,
      name,
      adjustment,
      createdAt: Date.now(),
    };
    setSaved((prev) => {
      const next = [...prev, entry];
      localStorage.setItem(LS_SAVED, JSON.stringify(next));
      setCookie(COOKIE_KEY, next.map((s) => s.id).join(','), COOKIE_DAYS);
      return next;
    });
  }, []);

  const addRecentAdjustment = useCallback((adjustment: ColorAdjustment) => {
    setRecent((prev) => {
      const deduplicated = prev.filter(
        (a) => JSON.stringify(a) !== JSON.stringify(adjustment)
      );
      const next = [adjustment, ...deduplicated].slice(0, MAX_RECENT);
      localStorage.setItem(LS_RECENT, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeSavedAdjustment = useCallback((id: string) => {
    setSaved((prev) => {
      const next = prev.filter((s) => s.id !== id);
      localStorage.setItem(LS_SAVED, JSON.stringify(next));
      setCookie(COOKIE_KEY, next.map((s) => s.id).join(','), COOKIE_DAYS);
      return next;
    });
  }, []);

  return { saved, recent, saveAdjustment, addRecentAdjustment, removeSavedAdjustment };
}
