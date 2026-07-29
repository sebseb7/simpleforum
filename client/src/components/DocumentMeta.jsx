import { Component } from 'react';

export const DEFAULT_DOCUMENT_TITLE = 'QuixPOS - Community Discussions';
export const DEFAULT_DESCRIPTION =
  'QuixPOS community forum for open discussion and debate.';

function upsertMeta(attr, key, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/**
 * Sets document title + basic SEO / Open Graph meta for the current view.
 * Renders nothing.
 */
class DocumentMeta extends Component {
  componentDidMount() {
    this.apply();
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.title !== this.props.title ||
      prevProps.description !== this.props.description
    ) {
      this.apply();
    }
  }

  apply() {
    const { title, description } = this.props;
    // Keep the HTML boot title on the home/brand view (no "Welcome · QuixPOS" flash).
    const docTitle = title ? `${title} · QuixPOS` : DEFAULT_DOCUMENT_TITLE;
    const desc = (description || DEFAULT_DESCRIPTION).replace(/\s+/g, ' ').trim().slice(0, 300);
    if (document.title !== docTitle) {
      document.title = docTitle;
    }
    upsertMeta('name', 'description', desc);
    upsertMeta('property', 'og:title', docTitle);
    upsertMeta('property', 'og:description', desc);
    upsertMeta('property', 'og:type', 'website');
  }

  render() {
    return null;
  }
}

export default DocumentMeta;
