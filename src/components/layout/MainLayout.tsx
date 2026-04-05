'use client';

import { ReactNode } from 'react';
import { Header } from './Header';
import { SettingsSidebar } from '../settings/SettingsSidebar';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
        <SettingsSidebar />
      </div>
    </div>
  );
}
