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

function normalizeMime(mime) {
  const m = String(mime || '').toLowerCase();
  return m === 'image/jpg' ? 'image/jpeg' : m;
}

/**
 * Custom Quill image handler: MIME + size checks before inserting a data URL.
 * @param {(code: string) => void} [onReject]
 */
export function createImageHandler(onReject) {
  return function imageHandler() {
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
      if (file.size > CONTENT_LIMITS.maxImageBytes) {
        onReject?.('image_too_large');
        return;
      }
      try {
        const dataUrl = await readFileAsDataUrl(file);
        const quill = this.quill;
        const range = quill.getSelection(true);
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
    defaultValue: i18n.t('contentFilter.warnings.image_removed'),
  });
}
