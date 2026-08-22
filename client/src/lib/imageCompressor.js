// client/src/lib/imageCompressor.js
import { supabase } from './supabase';

const MAX_DIMENSION = 1600;
const MAX_FILE_SIZE_BYTES = 512000; // 500 KB hard limit
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Validates whether the given file has an accepted MIME type.
 * @param {File} file
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateImageFileType(file) {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: 'Please select a JPG, PNG, or WebP image',
    };
  }
  return { valid: true };
}

/**
 * Calculates proportionally downscaled dimensions without ever upscaling.
 * @param {number} width - Source image width
 * @param {number} height - Source image height
 * @param {number} maxDim - Maximum allowed longest side (default 1600)
 * @returns {{ width: number, height: number }}
 */
export function calculateTargetDimensions(width, height, maxDim = MAX_DIMENSION) {
  const longest = Math.max(width, height);
  if (longest <= maxDim) {
    // Keep original dimensions (never upscale)
    return { width, height };
  }

  const ratio = maxDim / longest;
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

/**
 * Converts an image element to a WebP Blob at a given quality and dimension.
 * @param {HTMLImageElement} img
 * @param {number} width
 * @param {number} height
 * @param {number} quality (0 to 1)
 * @returns {Promise<Blob>}
 */
function canvasToWebpBlob(img, width, height, quality) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) {
      return reject(new Error("Your browser doesn't support canvas image processing"));
    }

    // High quality bicubic image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    if (!canvas.toBlob) {
      return reject(
        new Error("Your browser doesn't support image export — please try a different browser")
      );
    }

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          return reject(new Error('Failed to generate WebP image blob'));
        }
        resolve(blob);
      },
      'image/webp',
      quality
    );
  });
}

/**
 * Compresses and converts any JPEG/PNG/WebP image to WebP under the specified size and dimension limits.
 * @param {File} file - Input image file from input[type=file]
 * @param {Object} [options]
 * @param {number} [options.maxDimension=1600] - Longest side dimension cap
 * @param {number} [options.maxSizeBytes=512000] - Hard file size cap in bytes (default 500KB)
 * @returns {Promise<{ blob: Blob, width: number, height: number, sizeBytes: number, originalSizeBytes: number }>}
 */
export async function compressAndConvertToWebp(file, options = {}) {
  const maxDim = options.maxDimension || MAX_DIMENSION;
  const maxSizeBytes = options.maxSizeBytes || MAX_FILE_SIZE_BYTES;

  // Step 1: Validate file format
  const validation = validateImageFileType(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Check browser Canvas support
  if (typeof window === 'undefined' || !window.HTMLCanvasElement) {
    throw new Error(
      "Your browser doesn't support image processing — please try a different browser or device"
    );
  }

  // Step 2: Load file into an HTML Image object
  const objectUrl = URL.createObjectURL(file);
  let img;
  try {
    img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Could not decode the selected image file'));
      image.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  // Step 3: Calculate target dimensions (downscale if > maxDim, never upscale)
  let { width, height } = calculateTargetDimensions(img.naturalWidth, img.naturalHeight, maxDim);

  // Step 4 & 5: Iterative compression loop to ensure <= maxSizeBytes
  const qualitySteps = [0.85, 0.75, 0.65, 0.50, 0.40];
  let finalBlob = null;
  let finalWidth = width;
  let finalHeight = height;

  // Primary loop: reduce quality
  for (const quality of qualitySteps) {
    const blob = await canvasToWebpBlob(img, width, height, quality);
    if (blob.size <= maxSizeBytes) {
      finalBlob = blob;
      finalWidth = width;
      finalHeight = height;
      break;
    }
  }

  // Fallback loop: if still over size, reduce dimension further and re-compress
  if (!finalBlob) {
    const fallbackFactors = [0.75, 0.60, 0.45];
    for (const factor of fallbackFactors) {
      const targetDim = Math.max(100, Math.round(maxDim * factor));
      const scaled = calculateTargetDimensions(img.naturalWidth, img.naturalHeight, targetDim);
      for (const quality of [0.75, 0.60, 0.45]) {
        const blob = await canvasToWebpBlob(img, scaled.width, scaled.height, quality);
        if (blob.size <= maxSizeBytes) {
          finalBlob = blob;
          finalWidth = scaled.width;
          finalHeight = scaled.height;
          break;
        }
      }
      if (finalBlob) break;
    }
  }

  // Exhausted all retry attempts
  if (!finalBlob || finalBlob.size > maxSizeBytes) {
    throw new Error(
      `Image couldn't be compressed under ${formatBytes(maxSizeBytes)} — try a different photo`
    );
  }

  return {
    blob: finalBlob,
    width: finalWidth,
    height: finalHeight,
    sizeBytes: finalBlob.size,
    originalSizeBytes: file.size,
  };
}

/**
 * Avatar-specific compression helper: max 500px dimension and max 200KB (204,800 bytes) WebP.
 * @param {File} file
 * @returns {Promise<{ blob: Blob, width: number, height: number, sizeBytes: number, originalSizeBytes: number }>}
 */
export async function compressAvatar(file) {
  return compressAndConvertToWebp(file, {
    maxDimension: 500,
    maxSizeBytes: 204800, // 200 KB
  });
}

/**
 * Format bytes to readable string (e.g. 312 KB).
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${Math.round(kb)} KB`;
  }
  return `${(kb / 1024).toFixed(1)} MB`;
}

/**
 * Uploads a WebP blob to Supabase storage.
 * @param {Blob} blob
 * @param {string} [bucketName='place-images']
 * @returns {Promise<{ publicUrl: string, path: string }>}
 */
export async function uploadBlobToStorage(blob, bucketName = 'place-images') {
  if (!blob) throw new Error('No image blob provided for upload');
  const filename = `${Date.now()}-${crypto.randomUUID()}.webp`;
  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(filename, blob, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message || 'Supabase Storage upload failed');
  }

  const { data } = supabase.storage.from(bucketName).getPublicUrl(filename);
  if (!data?.publicUrl) {
    throw new Error('Failed to retrieve public image URL');
  }

  return { publicUrl: data.publicUrl, path: filename };
}

/**
 * Safely removes a file from Supabase storage (non-blocking).
 * @param {string} filePathOrUrl
 * @param {string} [bucketName='place-images']
 */
export async function deleteStorageFile(filePathOrUrl, bucketName = 'place-images') {
  if (!filePathOrUrl) return;
  let path = filePathOrUrl;
  if (filePathOrUrl.includes(`/storage/v1/object/public/${bucketName}/`)) {
    path = filePathOrUrl.split(`/storage/v1/object/public/${bucketName}/`)[1]?.split('?')[0];
  } else if (filePathOrUrl.includes(`/${bucketName}/`)) {
    path = filePathOrUrl.split(`/${bucketName}/`)[1]?.split('?')[0];
  }
  if (!path) return;
  try {
    await supabase.storage.from(bucketName).remove([path]);
  } catch (err) {
    console.warn(`[storage] Non-fatal deletion warning for ${path}:`, err.message);
  }
}
