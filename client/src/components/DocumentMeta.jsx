import { Component } from 'react';
import { connect } from 'react-redux';

function upsertMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content == null ? '' : String(content));
}

/**
 * Sets document title + basic SEO / Open Graph meta for the current view.
 * Site name comes only from admin settings — no invented product fallbacks.
 * Renders nothing.
 */
class DocumentMeta extends Component {
  componentDidMount() {
    this.apply();
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.title !== this.props.title ||
      prevProps.description !== this.props.description ||
      prevProps.siteName !== this.props.siteName
    ) {
      this.apply();
    }
  }

  apply() {
    if (typeof document === 'undefined') return;
    const { title, description, siteName } = this.props;
    const site = String(siteName || '').trim();
    const page = String(title || '').trim();
    const docTitle =
      page && site && page !== site ? `${page} · ${site}` : page || site;
    const desc = String(description || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 300);
    if (document.title !== docTitle) {
      document.title = docTitle;
    }
    upsertMeta('name', 'description', desc);
    upsertMeta('property', 'og:title', docTitle);
    upsertMeta('property', 'og:description', desc);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:site_name', site);
  }

  render() {
    return null;
  }
}

const mapStateToProps = (state) => ({
  siteName: state.sections.siteName,
});

export default connect(mapStateToProps)(DocumentMeta);
