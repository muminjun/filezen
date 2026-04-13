'use client';

import { getPdfjsLib } from './pdfjsLoader';
import { PDFDocument } from 'pdf-lib';

export interface ProtectOptions {
  userPassword:  string;
  ownerPassword: string;
  allowPrinting: boolean;
  allowCopying:  boolean;
}

// ─── MD5 (RFC 1321) ────────────────────────────────────────────────────────
const MD5_K = Float64Array.from({ length: 64 }, (_, i) =>
  Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296),
);
const MD5_S = [
  7,12,17,22, 7,12,17,22, 7,12,17,22, 7,12,17,22,
  5, 9,14,20, 5, 9,14,20, 5, 9,14,20, 5, 9,14,20,
  4,11,16,23, 4,11,16,23, 4,11,16,23, 4,11,16,23,
  6,10,15,21, 6,10,15,21, 6,10,15,21, 6,10,15,21,
];

function md5(data: Uint8Array): Uint8Array {
  const len = data.length;
  const extra = 55 - (len % 64);
  const padLen = extra < 0 ? len + 72 + extra : len + 9 + extra;
  const msg  = new Uint8Array(padLen);
  msg.set(data);
  msg[len] = 0x80;
  const view = new DataView(msg.buffer);
  view.setUint32(padLen - 8, (len * 8) >>> 0, true);
  view.setUint32(padLen - 4, Math.floor(len / 0x20000000), true);

  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  for (let off = 0; off < padLen; off += 64) {
    const M = new Uint32Array(16);
    for (let i = 0; i < 16; i++) M[i] = view.getUint32(off + i * 4, true);
    let [a, b, c, d] = [a0, b0, c0, d0];
    for (let i = 0; i < 64; i++) {
      let f: number, g: number;
      if (i < 16)       { f = (b & c) | (~b & d); g = i; }
      else if (i < 32)  { f = (d & b) | (~d & c); g = (5 * i + 1) % 16; }
      else if (i < 48)  { f = b ^ c ^ d;           g = (3 * i + 5) % 16; }
      else              { f = c ^ (b | ~d);         g = (7 * i)     % 16; }
      f = (f + a + MD5_K[i] + M[g]) >>> 0;
      a = d; d = c; c = b;
      b = (b + ((f << MD5_S[i]) | (f >>> (32 - MD5_S[i])))) >>> 0;
    }
    a0 = (a0 + a) >>> 0; b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0; d0 = (d0 + d) >>> 0;
  }
  const r = new Uint8Array(16);
  const rv = new DataView(r.buffer);
  rv.setUint32(0, a0, true); rv.setUint32(4, b0, true);
  rv.setUint32(8, c0, true); rv.setUint32(12, d0, true);
  return r;
}

// ─── RC4 ───────────────────────────────────────────────────────────────────
function rc4(key: Uint8Array, data: Uint8Array): Uint8Array {
  const s = new Uint8Array(256);
  for (let i = 0; i < 256; i++) s[i] = i;
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + s[i] + key[i % key.length]) & 0xff;
    const t = s[i]; s[i] = s[j]; s[j] = t;
  }
  const out = new Uint8Array(data.length);
  let i = 0; j = 0;
  for (let idx = 0; idx < data.length; idx++) {
    i = (i + 1) & 0xff;
    j = (j + s[i]) & 0xff;
    const t = s[i]; s[i] = s[j]; s[j] = t;
    out[idx] = data[idx] ^ s[(s[i] + s[j]) & 0xff];
  }
  return out;
}

// ─── PDF RC4-40 key derivation ─────────────────────────────────────────────
const PDF_PAD = new Uint8Array([
  0x28,0xBF,0x4E,0x5E,0x4E,0x75,0x8A,0x41,
  0x64,0x00,0x4E,0x56,0xFF,0xFA,0x01,0x08,
  0x2E,0x2E,0x00,0xB6,0xD0,0x68,0x3E,0x80,
  0x2F,0x0C,0xA9,0xFE,0x64,0x53,0x69,0x7A,
]);

function padPw(pw: string): Uint8Array {
  const pwBytes = new TextEncoder().encode(pw);
  const padded  = new Uint8Array(32);
  const n = Math.min(pwBytes.length, 32);
  padded.set(pwBytes.slice(0, n));
  if (n < 32) padded.set(PDF_PAD.slice(0, 32 - n), n);
  return padded;
}

// Algorithm 3.3 — O entry
function computeO(userPw: string, ownerPw: string): Uint8Array {
  const ownerPadded = padPw(ownerPw || userPw);
  const key = md5(ownerPadded).slice(0, 5);
  return rc4(key, padPw(userPw));
}

// Algorithm 3.2 — file encryption key (40-bit = 5 bytes)
function computeFileKey(userPw: string, O: Uint8Array, p: number, fileId: Uint8Array): Uint8Array {
  const buf = new Uint8Array(32 + 32 + 4 + 16);
  buf.set(padPw(userPw), 0);
  buf.set(O, 32);
  buf[64] = p & 0xff;
  buf[65] = (p >>> 8)  & 0xff;
  buf[66] = (p >>> 16) & 0xff;
  buf[67] = (p >>> 24) & 0xff;
  buf.set(fileId.slice(0, 16), 68);
  return md5(buf).slice(0, 5);
}

// Algorithm 3.4 — U entry (R=2)
function computeU(fileKey: Uint8Array): Uint8Array {
  return rc4(fileKey, PDF_PAD);
}

// Object-level key: MD5(fileKey + objNum[3 bytes] + genNum[2 bytes]) first 10 bytes
function objectKey(fileKey: Uint8Array, objNum: number): Uint8Array {
  const buf = new Uint8Array(8);
  buf.set(fileKey, 0);
  buf[5] =  objNum        & 0xff;
  buf[6] = (objNum >>> 8) & 0xff;
  buf[7] = (objNum >>> 16) & 0xff;
  // gen num = 0 → bytes 8,9 = 0 (already 0 in new Uint8Array)
  return md5(buf).slice(0, 10);
}

// Permission bits (PDF 1.4 Table 3.20, standard security handler R=2)
function permBits(print: boolean, copy: boolean): number {
  // Bit 3 = print allowed, Bit 5 = copy allowed
  // Upper bits 7–31 must be 1 (per spec they are "reserved as 1")
  let p = -0x40; // 0xFFFFFFC0 as signed int32
  if (print) p |= 4;
  if (copy)  p |= 16;
  return p;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('');
}

// ─── Find stream objects in PDF bytes ────────────────────────────────────────
function findStreams(bytes: Uint8Array): { objNum: number; start: number; len: number }[] {
  const text = new TextDecoder('latin1').decode(bytes);
  const results: { objNum: number; start: number; len: number }[] = [];
  const objRe = /(\d+)\s+0\s+obj\b/g;
  let m: RegExpExecArray | null;
  while ((m = objRe.exec(text)) !== null) {
    const objNum = parseInt(m[1]);
    const searchFrom = m.index + m[0].length;
    const streamIdx  = text.indexOf('stream', searchFrom);
    if (streamIdx < 0) continue;
    const nextEndobj = text.indexOf('endobj', searchFrom);
    if (nextEndobj >= 0 && streamIdx > nextEndobj) continue;
    // stream must be followed by \n or \r\n
    let contentStart = streamIdx + 6;
    if (bytes[contentStart] === 0x0d && bytes[contentStart + 1] === 0x0a) contentStart += 2;
    else if (bytes[contentStart] === 0x0a) contentStart += 1;
    else continue;
    // Find /Length
    const dictPart = text.slice(m.index, streamIdx);
    const lenMatch = /\/Length\s+(\d+)/.exec(dictPart);
    if (!lenMatch) continue;
    results.push({ objNum, start: contentStart, len: parseInt(lenMatch[1]) });
  }
  return results;
}

// ─── Incremental PDF encryption update ────────────────────────────────────
function applyEncryption(
  rawBytes: Uint8Array,
  fileKey: Uint8Array,
  O: Uint8Array,
  U: Uint8Array,
  p: number,
  fileId: Uint8Array,
): Uint8Array {
  // 1. Encrypt streams in place (RC4 preserves length → offsets stay valid)
  const result = new Uint8Array(rawBytes);
  for (const { objNum, start, len } of findStreams(rawBytes)) {
    const oKey    = objectKey(fileKey, objNum);
    const content = rawBytes.slice(start, start + len);
    result.set(rc4(oKey, content), start);
  }

  // 2. Parse original trailer for /Size and /Root
  const text = new TextDecoder('latin1').decode(result);
  const startxrefRe = /startxref\s*\r?\n\s*(\d+)\s*\r?\n\s*%%EOF/g;
  let startxrefMatch: RegExpExecArray | null;
  let lastMatch: RegExpExecArray | null = null;
  while ((startxrefMatch = startxrefRe.exec(text)) !== null) lastMatch = startxrefMatch;
  if (!lastMatch) throw new Error('No startxref found');
  const prevStartxref = parseInt(lastMatch[1]);

  const trailerRe = /trailer\s*<<([\s\S]*?)>>/g;
  let trailerMatch: RegExpExecArray | null;
  let lastTrailer: RegExpExecArray | null = null;
  while ((trailerMatch = trailerRe.exec(text)) !== null) lastTrailer = trailerMatch;
  if (!lastTrailer) throw new Error('No trailer found');
  const trailerBody = lastTrailer[1];
  const sizeMatch = /\/Size\s+(\d+)/.exec(trailerBody);
  const rootMatch = /\/Root\s+(\d+)\s+(\d+)\s+R/.exec(trailerBody);
  const infoMatch = /\/Info\s+(\d+)\s+(\d+)\s+R/.exec(trailerBody);
  if (!sizeMatch || !rootMatch) throw new Error('Invalid trailer');

  const oldSize      = parseInt(sizeMatch[1]);
  const encryptObjN  = oldSize; // next available object number

  // 3. Find position of last %%EOF to append after it
  const eofBytes   = new Uint8Array([0x25, 0x25, 0x45, 0x4F, 0x46]); // %%EOF
  let eofEnd = result.length;
  for (let i = result.length - 5; i >= 0; i--) {
    if (result[i] === eofBytes[0] && result[i+1] === eofBytes[1] &&
        result[i+2] === eofBytes[2] && result[i+3] === eofBytes[3] &&
        result[i+4] === eofBytes[4]) {
      eofEnd = i + 5;
      break;
    }
  }

  const enc = new TextEncoder();

  // 4. Encrypt dict object (not itself encrypted per spec)
  const encryptDictStr =
    `\n${encryptObjN} 0 obj\n` +
    `<< /Filter /Standard /V 1 /R 2\n` +
    `/O <${toHex(O)}>\n` +
    `/U <${toHex(U)}>\n` +
    `/P ${p} >>\nendobj\n`;
  const encryptDictBytes = enc.encode(encryptDictStr);

  const encryptObjOffset = eofEnd; // position in final file

  // 5. Incremental xref section for the new Encrypt object
  const xrefStr =
    `xref\n${encryptObjN} 1\n` +
    `${String(encryptObjOffset).padStart(10, '0')} 00000 n \n`;
  const xrefBytes = enc.encode(xrefStr);
  const newXrefOffset = encryptObjOffset + encryptDictBytes.length;

  // 6. New trailer (incremental update)
  const newTrailerStr =
    `trailer\n<<\n/Size ${oldSize + 1}\n` +
    `/Prev ${prevStartxref}\n` +
    `/Root ${rootMatch[1]} ${rootMatch[2]} R\n` +
    (infoMatch ? `/Info ${infoMatch[1]} ${infoMatch[2]} R\n` : '') +
    `/Encrypt ${encryptObjN} 0 R\n` +
    `/ID [<${toHex(fileId)}> <${toHex(fileId)}>]\n` +
    `>>\n` +
    `startxref\n${newXrefOffset + xrefBytes.length}\n%%EOF\n`;
  const newTrailerBytes = enc.encode(newTrailerStr);

  // 7. Assemble
  const total = eofEnd + encryptDictBytes.length + xrefBytes.length + newTrailerBytes.length;
  const final = new Uint8Array(total);
  final.set(result.slice(0, eofEnd), 0);
  let pos = eofEnd;
  final.set(encryptDictBytes, pos); pos += encryptDictBytes.length;
  final.set(xrefBytes,        pos); pos += xrefBytes.length;
  final.set(newTrailerBytes,  pos);
  return final;
}

// ─── Main: rasterize PDF → encrypt ────────────────────────────────────────
export async function protectPdf(file: File, options: ProtectOptions): Promise<Uint8Array> {
  // Rasterize PDF to images for a predictable, simple PDF structure
  const pdfjsLib = await getPdfjsLib();
  const inputBytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data: inputBytes.slice() }).promise;
  const numPages = pdf.numPages;

  const newDoc = await PDFDocument.create();
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const vp1 = page.getViewport({ scale: 1 });
    const widthPt  = vp1.width  * 0.75;
    const heightPt = vp1.height * 0.75;
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas   = document.createElement('canvas');
    canvas.width   = viewport.width;
    canvas.height  = viewport.height;
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvas, canvasContext: ctx, viewport }).promise;
    const blob: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/png'),
    );
    const pngBytes  = new Uint8Array(await blob.arrayBuffer());
    const pngImage  = await newDoc.embedPng(pngBytes);
    const newPage   = newDoc.addPage([widthPt, heightPt]);
    newPage.drawImage(pngImage, { x: 0, y: 0, width: widthPt, height: heightPt });
  }
  await pdf.destroy();

  const rasterized = new Uint8Array(await newDoc.save());
  const fileId = new Uint8Array(16);
  crypto.getRandomValues(fileId);

  const ownerPw = options.ownerPassword.trim() || options.userPassword;
  const p       = permBits(options.allowPrinting, options.allowCopying);
  const O       = computeO(options.userPassword, ownerPw);
  const fileKey = computeFileKey(options.userPassword, O, p, fileId);
  const U       = computeU(fileKey);

  return applyEncryption(rasterized, fileKey, O, U, p, fileId);
}
