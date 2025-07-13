"use client";

import { useContext } from 'react';
import { AppContext, AppContextType } from '@/context/app-provider';

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
