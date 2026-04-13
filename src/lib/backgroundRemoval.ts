// @imgly/background-removal은 WebAssembly 기반이므로 동적 import 필수
// 최초 호출 시 ~40MB 모델 다운로드

export type BgRemovalProgress = {
  loaded: number;  // 0–100
  total:  number;
};

export async function removeBackground(
  imageFile: File,
  onProgress?: (p: BgRemovalProgress) => void,
): Promise<Blob> {
  const { removeBackground: removeBg } = await import('@imgly/background-removal');

  const blob = await removeBg(imageFile, {
    model: 'isnet_quint8',
    output: {
      format: 'image/png',
      quality: 1,
    },
    progress: (key: string, current: number, total: number) => {
      if (onProgress && total > 0) {
        onProgress({ loaded: Math.round((current / total) * 100), total: 100 });
      }
    },
  });

  return blob;
}
