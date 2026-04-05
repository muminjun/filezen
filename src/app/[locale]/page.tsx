'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { UploadZone } from '@/components/upload/UploadZone';
import { FileList } from '@/components/upload/FileList';
import { PreviewPanel } from '@/components/preview/PreviewPanel';
import { ComparisonView } from '@/components/preview/ComparisonView';
import { DownloadManager } from '@/components/manager/DownloadManager';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Upload Section */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Upload Images</h2>
          <UploadZone />
        </section>

        {/* Files Section */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Files</h2>
          <FileList />
        </section>

        {/* Preview Section */}
        <section>
          <PreviewPanel />
        </section>

        {/* Comparison Section */}
        <section>
          <ComparisonView />
        </section>

        {/* Download Section */}
        <section className="sticky bottom-0 bg-background border-t border-muted-foreground/25 p-4 -m-6 mb-0">
          <h2 className="text-lg font-semibold mb-3">Download</h2>
          <DownloadManager />
        </section>
      </div>
    </MainLayout>
  );
}
