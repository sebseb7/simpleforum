import React from 'react';
import parse, { domToReact, attributesToProps } from 'html-react-parser';
import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';
import { sanitizeForDisplay } from '../content/sanitizeForDisplay.js';

/** User HTML may contain h1–h3; nest them under the page outline (h1/h2). */
const HEADING_DEMOTE = { h1: 'h3', h2: 'h4', h3: 'h5' };

const bodySx = {
  '& p': { m: 0, mb: 1 },
  '& img': { maxWidth: '100%' },
  '& .forum-anon-placeholder': {
    display: 'inline-block',
    px: 0.75,
    py: 0.25,
    mx: 0.25,
    borderRadius: 1,
    bgcolor: 'action.hover',
    color: 'text.secondary',
    fontSize: '0.85em',
    fontStyle: 'italic',
    verticalAlign: 'baseline',
  },
  '& .forum-anon-placeholder[data-forum-placeholder="image"]': {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    minHeight: 64,
    my: 1,
  },
};

/**
 * Renders sanitized forum HTML as React nodes (no dangerouslySetInnerHTML).
 * Anonymous media policy is applied by the API; placeholders are localized here.
 */
export default function ForumHtmlBody({ html, className, sx }) {
  const { t } = useTranslation();
  const safe = sanitizeForDisplay(html);
  if (!safe) return null;

  const options = {
    replace(domNode) {
      const kind = domNode.attribs?.['data-forum-placeholder'];
      if (kind) {
        const label =
          kind === 'image' ? t('content.anonImage') : t('content.anonLink');
        return (
          <span className="forum-anon-placeholder" data-forum-placeholder={kind}>
            {label}
          </span>
        );
      }

      const demoted = HEADING_DEMOTE[domNode.name];
      if (demoted && Array.isArray(domNode.children)) {
        return React.createElement(
          demoted,
          attributesToProps(domNode.attribs || {}),
          domToReact(domNode.children, options),
        );
      }

      return undefined;
    },
  };

  return (
    <Box className={className} sx={{ ...bodySx, ...sx }}>
      {parse(safe, options)}
    </Box>
  );
}
