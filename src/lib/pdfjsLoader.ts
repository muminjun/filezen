// src/lib/pdfjsLoader.ts
// Shared pdfjs-dist loader — sets up the CDN worker URL once and exports helpers.

let initialized = false;

export async function getPdfjsLib() {
  const pdfjsLib = await import('pdfjs-dist');
  if (!initialized) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    initialized = true;
  }
  return pdfjsLib;
}

export function isPasswordError(err: unknown): boolean {
  return (
    err !== null &&
    typeof err === 'object' &&
    'name' in err &&
    (err as { name: string }).name === 'PasswordException'
  );
}
