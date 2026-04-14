'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { ConvertContextType, ConvertToolMode } from '../lib/types';

const ConvertContext = createContext<ConvertContextType | undefined>(undefined);

export function useConvertContext(): ConvertContextType {
  const ctx = useContext(ConvertContext);
  if (!ctx) throw new Error('useConvertContext must be used inside ConvertProvider');
  return ctx;
}

export function ConvertProvider({ children }: { children: ReactNode }) {
  const [activeTool, setActiveTool] = useState<ConvertToolMode>('icon');

  return (
    <ConvertContext.Provider value={{ activeTool, setActiveTool }}>
      {children}
    </ConvertContext.Provider>
  );
}
