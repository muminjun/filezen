'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { FileContextType, FileToolMode } from '../lib/types';

const FileContext = createContext<FileContextType | undefined>(undefined);

export function useFileContext(): FileContextType {
  const ctx = useContext(FileContext);
  if (!ctx) throw new Error('useFileContext must be used inside FileProvider');
  return ctx;
}

export function FileProvider({ children }: { children: ReactNode }) {
  const [activeTool, setActiveTool] = useState<FileToolMode>('page-manager');

  return (
    <FileContext.Provider value={{ activeTool, setActiveTool }}>
      {children}
    </FileContext.Provider>
  );
}
