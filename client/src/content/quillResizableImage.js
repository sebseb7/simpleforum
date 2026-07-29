import { Quill } from 'react-quill-new';

const BaseImage = Quill.import('formats/image');

/** Attributes set by quill-resize-image (drag handles + float/width toolbar). */
const ATTRIBUTES = ['alt', 'height', 'width', 'style'];

/**
 * Image blot that persists width/height/style through Quill HTML ↔ Delta round-trips.
 * Default Image only keeps alt/height/width, so resize toolbar styles were dropped.
 */
class ResizableImage extends BaseImage {
  static formats(domNode) {
    return ATTRIBUTES.reduce((formats, attribute) => {
      if (domNode.hasAttribute(attribute)) {
        formats[attribute] = domNode.getAttribute(attribute);
      }
      return formats;
    }, {});
  }

  format(name, value) {
    if (ATTRIBUTES.includes(name)) {
      if (value) {
        this.domNode.setAttribute(name, value);
      } else {
        this.domNode.removeAttribute(name);
      }
    } else {
      super.format(name, value);
    }
  }
}

Quill.register(ResizableImage, true);

export { ResizableImage };
