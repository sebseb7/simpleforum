import ReactQuill, { Quill } from 'react-quill-new';
import QuillResizeImage from 'quill-resize-image';
import 'react-quill-new/dist/quill.snow.css';
import i18n from './i18n/index.js';
import { createImageHandler } from './content/quillImageHandler.js';

Quill.register('modules/resize', QuillResizeImage);

// Quill 2 formats (no separate "bullet"; image size via resize module)
export const quillFormats = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'blockquote',
  'list',
  'indent',
  'link',
  'image',
  'align',
];

const toolbar = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ align: [] }],
  ['blockquote', 'link', 'image'],
  ['clean'],
];

/**
 * Quill modules with resize labels from the active language file.
 * @param {{ onImageReject?: (code: string) => void }} [options]
 */
export function getQuillModules(options = {}) {
  return {
    toolbar: {
      container: toolbar,
      handlers: {
        image: createImageHandler(options.onImageReject),
      },
    },
    resize: {
      locale: {
        altTip: i18n.t('quill.resize.altTip'),
        floatLeft: i18n.t('quill.resize.floatLeft'),
        floatRight: i18n.t('quill.resize.floatRight'),
        center: i18n.t('quill.resize.center'),
        restore: i18n.t('quill.resize.restore'),
        inputTip: i18n.t('quill.resize.inputTip'),
      },
    },
  };
}

/** @deprecated Prefer getQuillModules() so locale updates apply. */
export const quillModules = getQuillModules();

export function getQuillPlaceholder() {
  return i18n.t('quill.placeholder');
}

export { ReactQuill, Quill };
