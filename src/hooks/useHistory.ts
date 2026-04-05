'use client';

import { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { generateFileId } from '../lib/utils';
import type { ProcessingRecord } from '../lib/types';

export function useHistory() {
  const { history, addToHistory, clearHistory } = useAppContext();

  const recordConversion = useCallback(
    (data: Omit<ProcessingRecord, 'id' | 'timestamp'>) => {
      const record: ProcessingRecord = {
        id: generateFileId(),
        timestamp: Date.now(),
        ...data,
      };
      addToHistory(record);
    },
    [addToHistory]
  );

  return {
    history,
    recordConversion,
    clearHistory,
  };
}
