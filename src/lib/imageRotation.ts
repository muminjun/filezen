/**
 * Canvas API를 사용해 이미지를 실제로 회전시키고 Blob으로 반환
 */
export async function rotateImageBlob(
  originalUrl: string,
  rotation: number,
  mimeType: string = 'image/jpeg',
  quality: number = 0.92
): Promise<Blob> {
  const degrees = ((rotation % 360) + 360) % 360; // 0~359 범위 정규화

  // 회전 없으면 원본 그대로 반환 (하지만 mimeType이 다르면 회전 0이어도 변환 수행)
  // AppContext에서 rotation === 0 && outputFormat === 'original' 체크를 이미 함

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // CORS 이슈 방지
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context unavailable'));

      const rad = (degrees * Math.PI) / 180;

      // 회전에 따른 캔버스 크기 계산 (90도 배수가 아닐 수도 있으므로 일반식 사용)
      const absCos = Math.abs(Math.cos(rad));
      const absSin = Math.abs(Math.sin(rad));
      canvas.width = img.naturalWidth * absCos + img.naturalHeight * absSin;
      canvas.height = img.naturalWidth * absSin + img.naturalHeight * absCos;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rad);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob failed'));
        },
        mimeType,
        quality
      );
    };
    img.onerror = reject;
    img.src = originalUrl;
  });
}
