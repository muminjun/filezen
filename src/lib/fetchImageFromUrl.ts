export type FetchImageError = 'FETCH_FAILED' | 'NOT_IMAGE' | 'CORS';

export class FetchImageUrlError extends Error {
  constructor(public readonly code: FetchImageError) {
    super(code);
  }
}

export async function fetchImageFromUrl(url: string): Promise<File> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new FetchImageUrlError('CORS');
  }

  if (!response.ok) {
    throw new FetchImageUrlError('FETCH_FAILED');
  }

  const blob = await response.blob();
  if (!blob.type.startsWith('image/')) {
    throw new FetchImageUrlError('NOT_IMAGE');
  }

  const pathname = new URL(url).pathname;
  const filename = pathname.split('/').pop()?.split('?')[0] || 'image';
  const ext = filename.includes('.') ? '' : `.${blob.type.split('/')[1] || 'jpg'}`;

  return new File([blob], `${filename}${ext}`, { type: blob.type });
}
