import { CONTENT_LIMITS } from '@shared/contentLimits.js';
import i18n from '../i18n/index.js';

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('read failed'));
    reader.readAsDataURL(file);
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('read failed'));
    reader.readAsDataURL(blob);
  });
}

function normalizeMime(mime) {
  const m = String(mime || '').toLowerCase();
  return m === 'image/jpg' ? 'image/jpeg' : m;
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

function loadBitmap(file) {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file).catch(() => loadBitmapViaImage(file));
  }
  return loadBitmapViaImage(file);
}

function loadBitmapViaImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image decode failed'));
    };
    img.src = url;
  });
}

/**
 * Recompress an image file down to CONTENT_LIMITS.maxImageBytes via canvas
 * (scale + quality). Returns a data URL, or null if it cannot fit.
 */
async function recompressImageFile(file, maxBytes) {
  const source = await loadBitmap(file);
  const srcW = source.width;
  const srcH = source.height;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx || !srcW || !srcH) {
    source.close?.();
    return null;
  }

  const mimeCandidates = ['image/webp', 'image/jpeg'];
  let maxEdge = Math.min(1600, Math.max(srcW, srcH));
  const minEdge = 240;

  try {
    while (maxEdge >= minEdge) {
      const scale = Math.min(1, maxEdge / Math.max(srcW, srcH));
      const w = Math.max(1, Math.round(srcW * scale));
      const h = Math.max(1, Math.round(srcH * scale));
      canvas.width = w;
      canvas.height = h;
      ctx.clearRect(0, 0, w, h);
      // Opaque backdrop so JPEG doesn't turn transparency black-noisy.
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(source, 0, 0, w, h);

      for (const mime of mimeCandidates) {
        for (let q = 85; q >= 35; q -= 10) {
          const quality = q / 100;
          const blob = await canvasToBlob(canvas, mime, quality);
          if (!blob || blob.size === 0) continue;
          if (blob.size <= maxBytes) {
            return blobToDataUrl(blob);
          }
        }
      }
      maxEdge = Math.floor(maxEdge * 0.7);
    }
  } finally {
    source.close?.();
  }

  return null;
}

/**
 * Custom Quill image handler: MIME checks, then recompress oversized files
 * before inserting a data URL.
 * @param {(code: string) => void} [onReject]
 */
export function createImageHandler(onReject) {
  return function imageHandler() {
    const quill = this.quill;
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', CONTENT_LIMITS.allowedImageMimes.join(','));
    input.click();
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const mime = normalizeMime(file.type);
      if (!CONTENT_LIMITS.allowedImageMimes.includes(mime)) {
        onReject?.('image_type_not_allowed');
        return;
      }
      if (file.size > CONTENT_LIMITS.maxImageSourceBytes) {
        onReject?.('image_too_large');
        return;
      }
      try {
        let dataUrl;
        if (file.size <= CONTENT_LIMITS.maxImageBytes) {
          dataUrl = await readFileAsDataUrl(file);
        } else {
          dataUrl = await recompressImageFile(file, CONTENT_LIMITS.maxImageBytes);
          if (!dataUrl) {
            onReject?.('image_too_large');
            return;
          }
        }
        const range = quill.getSelection(true) || { index: quill.getLength(), length: 0 };
        quill.insertEmbed(range.index, 'image', dataUrl, 'user');
        quill.setSelection(range.index + 1);
      } catch {
        onReject?.('image_read_failed');
      }
    };
  };
}

/** Localized reject message for image handler failures. */
export function imageRejectMessage(code) {
  return i18n.t(`contentFilter.warnings.${code}`, {
    maxKb: Math.round(CONTENT_LIMITS.maxImageBytes / 1000),
    defaultValue: i18n.t('contentFilter.warnings.image_removed'),
  });
}
