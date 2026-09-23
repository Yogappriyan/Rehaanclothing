/**
 * Utility to process, optimize, and read images from device
 * Converts user files to optimized Base64 data URLs safe for Firestore storage
 */

export interface ProcessedImageResult {
  dataUrl: string;
  fileName: string;
  sizeBytes: number;
}

/**
 * Optimizes an image file by resizing to maximum dimensions and compressing to JPEG
 * Keeps payload lightweight (< 150KB) to ensure high performance and fit in Firestore.
 */
export async function processImageFile(
  file: File,
  maxWidth = 1000,
  maxHeight = 1200,
  quality = 0.82
): Promise<ProcessedImageResult> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image. Please select a JPG, PNG, or WEBP.'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate scaled dimensions keeping aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback if canvas context fails
          const rawUrl = readerEvent.target?.result as string;
          resolve({
            dataUrl: rawUrl,
            fileName: file.name,
            sizeBytes: file.size,
          });
          return;
        }

        // Fill white background for transparent PNGs converted to JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to high-efficiency JPEG data URL
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const approxSize = Math.round((dataUrl.length * 3) / 4);

        resolve({
          dataUrl,
          fileName: file.name,
          sizeBytes: approxSize,
        });
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for processing. The file may be corrupt.'));
      };

      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Error reading file from your device.'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Process multiple files in parallel
 */
export async function processMultipleImageFiles(
  files: FileList | File[],
  maxWidth = 1000,
  maxHeight = 1200
): Promise<ProcessedImageResult[]> {
  const fileArray = Array.from(files);
  const promises = fileArray
    .filter((f) => f.type.startsWith('image/'))
    .map((f) => processImageFile(f, maxWidth, maxHeight));
  return Promise.all(promises);
}
