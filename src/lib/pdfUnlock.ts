import { PDFDocument } from 'pdf-lib';
import { getPdfjsLib, isPasswordError } from './pdfjsLoader';

/**
 * Check if a PDF requires a password (without knowing the password).
 * Returns true if the PDF is password-protected.
 */
export async function isPdfPasswordProtected(file: File): Promise<boolean> {
  const pdfjsLib = await getPdfjsLib();
  const bytes = new Uint8Array(await file.arrayBuffer());

  try {
    const task = pdfjsLib.getDocument({ data: bytes.slice() });
    await task.promise;
    return false; // No password needed
  } catch (err: unknown) {
    if (isPasswordError(err)) {
      return true; // Password protected
    }
    throw err; // Other error (corrupt PDF, etc.)
  }
}

/**
 * Verify the password is correct AND unlock the PDF.
 * Returns the unlocked PDF bytes (without password).
 * Throws an error if the password is wrong.
 */
export async function unlockPdf(file: File, password: string): Promise<Uint8Array> {
  const pdfjsLib = await getPdfjsLib();
  const bytes = new Uint8Array(await file.arrayBuffer());

  // Verify password with pdfjs (throws PasswordException if wrong)
  const loadingTask = pdfjsLib.getDocument({ data: bytes.slice(), password });
  await loadingTask.promise;

  // Load with pdf-lib using password, then save without password
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfDoc = await PDFDocument.load(bytes, { password } as any);
  return new Uint8Array(await pdfDoc.save());
}
