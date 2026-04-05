/**
 * Canvas API를 사용해 이미지를 실제로 회전시키고 Blob으로 반환
 */
export async function rotateImageBlob(
  originalUrl: string,
  rotation: number,
  mimeType: string = 'image/jpeg'
): Promise<Blob> {
  const degrees = ((rotation % 360) + 360) % 360; // 0~359 범위 정규화

  // 회전 없으면 원본 그대로 반환
  if (degrees === 0) {
    const res = await fetch(originalUrl);
    return res.blob();
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context unavailable'));

      const rad = (degrees * Math.PI) / 180;

      // 90/270도 회전이면 가로·세로 교환
      if (degrees === 90 || degrees === 270) {
        canvas.width = img.naturalHeight;
        canvas.height = img.naturalWidth;
      } else {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
      }

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rad);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob failed'));
        },
        mimeType,
        0.92
      );
    };
    img.onerror = reject;
    img.src = originalUrl;
  });
}
