'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAppContext } from '@/context/AppContext';
import { CollageCanvas } from './CollageCanvas';
import { CollagePanel } from './CollagePanel';
import { CellPopover } from './CellPopover';
import { useCollageExport } from '@/hooks/useCollageExport';
import {
  defaultState,
  splitNode,
  mergeNode,
  canMerge,
  updateRatio,
  setImage,
  updateImageTransform,
  makeLeaf,
  collectLeafIds,
} from '@/lib/collageTree';
import type { CollageState, CollageStyle, CollageNode, LeafNode } from '@/lib/collageTree';

// Suppress unused import warnings for makeLeaf and collectLeafIds
void makeLeaf;
void collectLeafIds;

export function CollagePage() {
  const t = useTranslations('collage');
  const { images } = useAppContext();
  const canvasRef = useRef<HTMLDivElement>(null!);
  const { isExporting, handleExport } = useCollageExport(canvasRef);

  const [state, setState] = useState<CollageState>(() => defaultState());
  const [popoverRect, setPopoverRect] = useState<DOMRect | null>(null);
  const [showImageTabModal, setShowImageTabModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleSelectCell = useCallback((id: string) => {
    setState((prev) => ({ ...prev, selectedId: prev.selectedId === id ? null : id }));
    setTimeout(() => {
      const el = document.querySelector(`[data-cell-id="${id}"]`);
      if (el) setPopoverRect(el.getBoundingClientRect());
    }, 0);
  }, []);

  const handleClosePopover = useCallback(() => {
    setState((prev) => ({ ...prev, selectedId: null }));
    setPopoverRect(null);
  }, []);

  const handleSplitH = useCallback(() => {
    setState((prev) => {
      if (!prev.selectedId) return prev;
      return { ...prev, tree: splitNode(prev.tree, prev.selectedId, 'h'), selectedId: null };
    });
    setPopoverRect(null);
  }, []);

  const handleSplitV = useCallback(() => {
    setState((prev) => {
      if (!prev.selectedId) return prev;
      return { ...prev, tree: splitNode(prev.tree, prev.selectedId, 'v'), selectedId: null };
    });
    setPopoverRect(null);
  }, []);

  const handleMerge = useCallback(() => {
    setState((prev) => {
      if (!prev.selectedId) return prev;
      return { ...prev, tree: mergeNode(prev.tree, prev.selectedId), selectedId: null };
    });
    setPopoverRect(null);
  }, []);

  const handleReplacePhoto = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const src = URL.createObjectURL(file);
      setState((prev) => {
        if (!prev.selectedId) return prev;
        return { ...prev, tree: setImage(prev.tree, prev.selectedId, { src, x: 0, y: 0, scale: 1 }) };
      });
    };
    input.click();
    setPopoverRect(null);
  }, []);

  const handleRemovePhoto = useCallback(() => {
    setState((prev) => {
      if (!prev.selectedId) return prev;
      return { ...prev, tree: setImage(prev.tree, prev.selectedId, undefined) };
    });
    setPopoverRect(null);
  }, []);

  const handleRatioChange = useCallback(
    (firstChildId: string, ratio: number, _isDone: boolean) => {
      setState((prev) => ({ ...prev, tree: updateRatio(prev.tree, firstChildId, ratio) }));
    },
    [],
  );

  const handleImageDrag = useCallback((id: string, dx: number, dy: number) => {
    setState((prev) => {
      const leaf = findLeaf(prev.tree, id);
      if (!leaf?.image) return prev;
      return {
        ...prev,
        tree: updateImageTransform(prev.tree, id, {
          x: leaf.image.x + dx,
          y: leaf.image.y + dy,
        }),
      };
    });
  }, []);

  const handleDropImage = useCallback((id: string, src: string) => {
    setState((prev) => ({
      ...prev,
      tree: setImage(prev.tree, id, { src, x: 0, y: 0, scale: 1 }),
    }));
  }, []);

  const handleUploadPhoto = useCallback((files: File[]) => {
    files.forEach((file) => {
      const src = URL.createObjectURL(file);
      setState((prev) => {
        const targetId = prev.selectedId ?? findFirstEmptyLeaf(prev.tree);
        if (!targetId) return prev;
        return { ...prev, tree: setImage(prev.tree, targetId, { src, x: 0, y: 0, scale: 1 }) };
      });
    });
  }, []);

  const handleSelectFromImageTab = useCallback(() => {
    setShowImageTabModal(true);
    setPopoverRect(null);
  }, []);

  const handleImageTabSelect = useCallback(
    (src: string) => {
      setState((prev) => {
        const targetId = prev.selectedId ?? findFirstEmptyLeaf(prev.tree);
        if (!targetId) return prev;
        return { ...prev, tree: setImage(prev.tree, targetId, { src, x: 0, y: 0, scale: 1 }) };
      });
      setShowImageTabModal(false);
    },
    [],
  );

  const handleStyleChange = useCallback((patch: Partial<CollageStyle>) => {
    setState((prev) => ({ ...prev, style: { ...prev.style, ...patch } }));
  }, []);

  const selectedLeaf = state.selectedId ? findLeaf(state.tree, state.selectedId) : null;
  const selectedCanMerge = state.selectedId ? canMerge(state.tree, state.selectedId) : false;

  return (
    <div className="relative flex h-full overflow-hidden">
      {/* PC 좌측 패널 */}
      <CollagePanel
        style={state.style}
        onStyleChange={handleStyleChange}
        onUploadPhoto={handleUploadPhoto}
        onSelectFromImageTab={handleSelectFromImageTab}
        onExport={handleExport}
        isExporting={isExporting}
        isMobile={false}
      />

      {/* 캔버스 + 모바일 하단 패널 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <CollageCanvas
          tree={state.tree}
          style={state.style}
          selectedId={state.selectedId}
          onSelectCell={handleSelectCell}
          onRatioChange={handleRatioChange}
          onImageDrag={handleImageDrag}
          onDropImage={handleDropImage}
          canvasRef={canvasRef}
        />

        <div className="sm:hidden">
          <CollagePanel
            style={state.style}
            onStyleChange={handleStyleChange}
            onUploadPhoto={handleUploadPhoto}
            onSelectFromImageTab={handleSelectFromImageTab}
            onExport={handleExport}
            isExporting={isExporting}
            isMobile={true}
          />
        </div>
      </div>

      {/* 팝오버 */}
      {state.selectedId && popoverRect && (
        <CellPopover
          anchorRect={popoverRect}
          canMerge={selectedCanMerge}
          hasImage={!!selectedLeaf?.image}
          isMobile={isMobile}
          onSplitH={handleSplitH}
          onSplitV={handleSplitV}
          onMerge={handleMerge}
          onReplacePhoto={handleReplacePhoto}
          onRemovePhoto={handleRemovePhoto}
          onClose={handleClosePopover}
        />
      )}

      {/* 이미지탭 사진 선택 모달 */}
      {showImageTabModal && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={() => setShowImageTabModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-border bg-card p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-1 text-sm font-semibold">{t('selectFromImageTab')}</h3>
            <p className="mb-3 text-xs text-muted-foreground">{t('selectFromImageTabHint')}</p>
            {images.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t('noImages')}</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                {images.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => handleImageTabSelect(img.previewUrl)}
                    className="aspect-square overflow-hidden rounded-md border-2 border-transparent hover:border-primary transition-colors"
                  >
                    <img
                      src={img.previewUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowImageTabModal(false)}
              className="mt-3 w-full rounded-md bg-muted py-2 text-xs text-muted-foreground hover:bg-muted/80"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 헬퍼 ─────────────────────────────────────────────────────────────────────

function findLeaf(node: CollageNode, id: string): LeafNode | null {
  if (node.type === 'leaf') return node.id === id ? node : null;
  return findLeaf(node.children[0], id) ?? findLeaf(node.children[1], id);
}

function findFirstEmptyLeaf(node: CollageNode): string | null {
  if (node.type === 'leaf') return node.image ? null : node.id;
  return findFirstEmptyLeaf(node.children[0]) ?? findFirstEmptyLeaf(node.children[1]);
}
