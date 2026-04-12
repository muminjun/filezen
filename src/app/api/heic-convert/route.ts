import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';
export const maxDuration = 30;

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  const id = randomUUID();
  const inPath  = join(tmpdir(), `${id}.heic`);
  const outPath = join(tmpdir(), `${id}.jpg`);

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(inPath, buffer);

    // macOS 내장 sips — HEVC 포함 모든 HEIC 지원
    await execAsync(`sips -s format jpeg -s formatOptions 92 "${inPath}" --out "${outPath}"`);

    const jpeg = await readFile(outPath);
    return new NextResponse(jpeg, {
      headers: { 'Content-Type': 'image/jpeg' },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    await Promise.allSettled([unlink(inPath), unlink(outPath)]);
  }
}
