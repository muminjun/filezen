import type { FFmpeg } from '@ffmpeg/ffmpeg';

let ffmpegInstance: FFmpeg | null = null;
// progress 핸들러 참조를 캐시해야 off()로 제거 가능
let progressHandler: ((e: { progress: number }) => void) | null = null;

/**
 * ffmpeg.wasm 싱글턴 로더.
 * 최초 호출 시 CDN에서 core (~30MB)를 다운로드한다.
 * onProgress: 0.0 ~ 1.0 (exec 실행 중에만 발화, load 중에는 발화 안 함)
 */
export async function getFFmpeg(
  onProgress?: (ratio: number) => void,
): Promise<FFmpeg> {
  if (ffmpegInstance?.loaded) {
    // 기존 핸들러 제거 후 새 핸들러 등록
    if (progressHandler) {
      ffmpegInstance.off('progress', progressHandler);
    }
    progressHandler = onProgress ? ({ progress }) => onProgress(progress) : null;
    if (progressHandler) {
      ffmpegInstance.on('progress', progressHandler);
    }
    return ffmpegInstance;
  }

  const { FFmpeg }    = await import('@ffmpeg/ffmpeg');
  const { toBlobURL } = await import('@ffmpeg/util');

  ffmpegInstance = new FFmpeg();

  progressHandler = onProgress ? ({ progress }) => onProgress(progress) : null;
  if (progressHandler) {
    ffmpegInstance.on('progress', progressHandler);
  }

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  await ffmpegInstance.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`,   'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  return ffmpegInstance;
}

/** 현재 ffmpeg 인스턴스가 로드되어 있는지 확인 */
export function isFFmpegLoaded(): boolean {
  return ffmpegInstance?.loaded ?? false;
}
