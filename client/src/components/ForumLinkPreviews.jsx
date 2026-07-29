import React, { useMemo } from 'react';
import Stack from '@mui/material/Stack';
import { extractLinkUrls } from '@shared/extractLinkUrls.js';
import ForumLinkCard from './ForumLinkCard.jsx';

/**
 * Renders OG / favicon preview cards for unique links in forum HTML.
 */
export default function ForumLinkPreviews({ html, sx }) {
  const urls = useMemo(() => extractLinkUrls(html), [html]);
  if (!urls.length) return null;

  return (
    <Stack spacing={1} sx={{ mt: 1.5, ...sx }}>
      {urls.map((url) => (
        <ForumLinkCard key={url} url={url} />
      ))}
    </Stack>
  );
}
