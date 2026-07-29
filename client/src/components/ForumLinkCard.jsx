import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';
import api from '../api.js';
import { loadLinkPreview } from '../content/linkPreviewCache.js';

/**
 * Open Graph / favicon link card for a single URL.
 */
export default function ForumLinkCard({ url }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    setPreview(null);
    loadLinkPreview(url, () => api.getLinkPreview(url))
      .then((data) => {
        if (cancelled) return;
        setPreview(data.preview);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setFailed(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (failed) return null;

  if (loading || !preview) {
    return (
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          p: 1.25,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.default',
          maxWidth: 480,
        }}
      >
        <Skeleton variant="rectangular" width={72} height={72} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Skeleton width="60%" />
          <Skeleton width="90%" />
          <Skeleton width="40%" />
        </Box>
      </Box>
    );
  }

  const host = (() => {
    try {
      return new URL(preview.url || url).hostname;
    } catch {
      return preview.siteName || '';
    }
  })();

  const hasOgImage = Boolean(preview.image);
  const title = preview.title || host || url;

  return (
    <Link
      href={preview.url || url}
      target="_blank"
      rel="noopener noreferrer"
      underline="none"
      color="inherit"
      sx={{
        display: 'flex',
        gap: 1.5,
        p: 1.25,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.default',
        maxWidth: 480,
        textAlign: 'left',
        transition: 'border-color 0.15s ease, background-color 0.15s ease',
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: 'background.paper',
        },
      }}
    >
      {hasOgImage ? (
        <Box
          component="img"
          src={preview.image}
          alt=""
          sx={{
            width: 88,
            height: 88,
            objectFit: 'cover',
            flexShrink: 0,
            bgcolor: 'action.hover',
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : preview.favicon ? (
        <Box
          sx={{
            width: 48,
            height: 48,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'action.hover',
          }}
        >
          <Box
            component="img"
            src={preview.favicon}
            alt=""
            sx={{ width: 24, height: 24, objectFit: 'contain' }}
            onError={(e) => {
              e.currentTarget.style.visibility = 'hidden';
            }}
          />
        </Box>
      ) : null}

      <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {title}
        </Typography>
        {preview.description ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {preview.description}
          </Typography>
        ) : null}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            mt: 0.25,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {hasOgImage && preview.favicon ? (
            <Box
              component="img"
              src={preview.favicon}
              alt=""
              sx={{ width: 14, height: 14, objectFit: 'contain', flexShrink: 0 }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : null}
          {preview.siteName || host}
        </Typography>
      </Stack>
    </Link>
  );
}
