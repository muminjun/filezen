'use client';

import { Image as ImageIcon } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-muted-foreground/25 bg-muted/50 px-6 py-4">
      <div className="flex items-center gap-3">
        <ImageIcon className="h-6 w-6" />
        <div>
          <h1 className="text-2xl font-bold">FileZen</h1>
          <p className="text-xs text-muted-foreground">Convert and resize images instantly</p>
        </div>
      </div>
    </header>
  );
}
