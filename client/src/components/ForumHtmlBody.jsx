import React from 'react';
import parse from 'html-react-parser';
import Box from '@mui/material/Box';
import { sanitizeForDisplay } from '../content/sanitizeForDisplay.js';

const bodySx = {
  '& p': { m: 0, mb: 1 },
  '& img': { maxWidth: '100%' },
};

/**
 * Renders sanitized forum HTML as React nodes (no dangerouslySetInnerHTML).
 */
export default function ForumHtmlBody({ html, className, sx }) {
  const safe = sanitizeForDisplay(html);
  if (!safe) return null;
  return (
    <Box className={className} sx={{ ...bodySx, ...sx }}>
      {parse(safe)}
    </Box>
  );
}
