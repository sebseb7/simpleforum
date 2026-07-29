import ReactQuill, { Quill } from 'react-quill-new';
import QuillResizeImage from 'quill-resize-image';
import 'react-quill-new/dist/quill.snow.css';

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

export const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ align: [] }],
    ['blockquote', 'link', 'image'],
    ['clean'],
  ],
  resize: {
    locale: {},
  },
};

export { ReactQuill, Quill };
