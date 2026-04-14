import type { Worker as TesseractWorker } from 'tesseract.js';

let workerInstance: TesseractWorker | null = null;
let currentLang = '';

export type OcrLang = 'kor' | 'eng' | 'kor+eng';

/**
 * Tesseract.js worker 싱글턴.
 * 언어가 변경될 때만 worker를 재생성한다.
 * onProgress: 0.0 ~ 1.0 (인식 중에만 발화)
 */
export async function getTesseractWorker(
  lang: OcrLang,
  onProgress?: (ratio: number) => void,
): Promise<TesseractWorker> {
  if (workerInstance && currentLang === lang) {
    return workerInstance;
  }

  if (workerInstance) {
    await workerInstance.terminate();
    workerInstance = null;
  }

  const { createWorker } = await import('tesseract.js');

  workerInstance = await createWorker(lang, 1, {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(m.progress);
      }
    },
  });

  currentLang = lang;
  return workerInstance;
}

/** 현재 worker 언어 반환 */
export function getCurrentOcrLang(): string {
  return currentLang;
}
