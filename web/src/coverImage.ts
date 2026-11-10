import { MAX_STORED_COVER_LENGTH } from './catalog/model';

export const MAX_COVER_ORIGINAL_BYTES = 12 * 1024 * 1024;
export const COVER_TARGET_LENGTH = Math.min(280000, MAX_STORED_COVER_LENGTH);
export function coverFileError(file: Pick<File, 'type' | 'size'>): string | null {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return 'Choose a PNG, JPEG or WebP image.';
  if (file.size <= 0) return 'That image is empty. Choose another photo or demo artwork.';
  if (file.size > MAX_COVER_ORIGINAL_BYTES) return 'Choose an original photo up to 12 MB. Phone photos are resized automatically.';
  return null;
}

/** Store a bounded JPEG, never the original multi-megabyte phone photo. */
export async function prepareCoverImage(file: File): Promise<string> {
  const problem = coverFileError(file);
  if (problem) throw new Error(problem);
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('That file is not a readable image. Choose another photo or demo artwork.'));
      image.src = url;
    });
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('That image has no usable dimensions. Choose another photo.');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image resizing is unavailable. Choose demo artwork or try another browser.');
    const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
    for (let attempt = 0; attempt < 6; attempt++) {
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale / 2 ** attempt));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale / 2 ** attempt));
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.88, 0.75, 0.6, 0.45, 0.3]) {
        const cover = canvas.toDataURL('image/jpeg', quality);
        if (/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(cover) && cover.length <= COVER_TARGET_LENGTH) return cover;
      }
    }
    throw new Error('That photo could not be resized to fit. Choose another photo or demo artwork.');
  } finally {
    URL.revokeObjectURL(url);
  }
}
