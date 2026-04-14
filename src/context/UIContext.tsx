'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextType {
  activeTab: 'image' | 'file';
  setActiveTab: (tab: 'image' | 'file') => void;
  pendingPdfFiles: File[] | null;
  setPendingPdfFiles: (files: File[] | null) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function useUIContext(): UIContextType {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUIContext must be used inside UIProvider');
  return ctx;
}

export function UIProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<'image' | 'file'>('image');
  const [pendingPdfFiles, setPendingPdfFiles] = useState<File[] | null>(null);

  return (
    <UIContext.Provider value={{ activeTab, setActiveTab, pendingPdfFiles, setPendingPdfFiles }}>
      {children}
    </UIContext.Provider>
  );
}
