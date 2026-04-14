'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useUIContext } from '@/context/UIContext';

type DropFileType = 'image' | 'pdf' | 'mixed' | null;

interface GlobalDropState {
  isDragging: boolean;
  fileType: DropFileType;
}

function classifyItems(items: DataTransferItemList): DropFileType {
  const types = Array.from(items)
    .filter((item) => item.kind === 'file')
    .map((item) => item.type);

  const hasImage = types.some((t) => t.startsWith('image/') || t === '');
  const hasPdf   = types.some((t) => t === 'application/pdf');

  if (hasImage && hasPdf) return 'mixed';
  if (hasPdf) return 'pdf';
  if (hasImage) return 'image';
  return null;
}

function classifyFiles(files: File[]): { images: File[]; pdfs: File[] } {
  return {
    images: files.filter((f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name)),
    pdfs:   files.filter((f) => f.type === 'application/pdf'),
  };
}

export function useGlobalDrop() {
  const [state, setState] = useState<GlobalDropState>({ isDragging: false, fileType: null });
  const { addImages } = useAppContext();
  const { setActiveTab, setPendingPdfFiles } = useUIContext();

  const handleDragEnter = useCallback((e: DragEvent) => {
    if (!e.dataTransfer) return;
    const fileType = classifyItems(e.dataTransfer.items);
    if (!fileType) return;
    e.preventDefault();
    setState({ isDragging: true, fileType });
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    if (!e.dataTransfer) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    if (e.relatedTarget === null) {
      setState({ isDragging: false, fileType: null });
    }
  }, []);

  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault();
    setState({ isDragging: false, fileType: null });

    if (!e.dataTransfer) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const { images, pdfs } = classifyFiles(files);

    if (images.length > 0 && pdfs.length === 0) {
      setActiveTab('image');
      await addImages(images);
    } else if (pdfs.length > 0 && images.length === 0) {
      setActiveTab('file');
      setPendingPdfFiles(pdfs);
    } else if (images.length > 0 && pdfs.length > 0) {
      if (images.length >= pdfs.length) {
        setActiveTab('image');
        await addImages(images);
        setPendingPdfFiles(pdfs);
      } else {
        setActiveTab('file');
        setPendingPdfFiles(pdfs);
        await addImages(images);
      }
    }
  }, [addImages, setActiveTab, setPendingPdfFiles]);

  useEffect(() => {
    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragover',  handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop',      handleDrop);
    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragover',  handleDragOver);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('drop',      handleDrop);
    };
  }, [handleDragEnter, handleDragOver, handleDragLeave, handleDrop]);

  return state;
}
