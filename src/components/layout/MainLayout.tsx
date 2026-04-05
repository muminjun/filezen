'use client';

import { ReactNode, useState } from 'react';
import { Header } from './Header';
import { SettingsSidebar } from '../settings/SettingsSidebar';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [showSidebar, setShowSidebar] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header onToggleSidebar={() => setShowSidebar(!showSidebar)} />

      {/* Desktop Layout: side-by-side, Mobile: stacked */}
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 order-1 lg:order-1">
          {children}
        </main>

        {/* Desktop: always visible, Mobile: overlay */}
        <div className="hidden lg:block order-2">
          <SettingsSidebar />
        </div>

        {/* Mobile: overlay when toggled */}
        {showSidebar && (
          <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setShowSidebar(false)}>
            <div className="absolute right-0 top-0 bottom-0 bg-background shadow-lg" onClick={(e) => e.stopPropagation()}>
              <SettingsSidebar />
              <button
                onClick={() => setShowSidebar(false)}
                className="lg:hidden absolute top-4 left-4 text-foreground text-xl"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
