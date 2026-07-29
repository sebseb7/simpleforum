import React from 'react';
import { useTranslation } from 'react-i18next';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import { CONTENT_LIMITS } from '@shared/contentLimits.js';

/**
 * Shows warnings returned by the server contentFilter after save.
 */
export default function ContentFilterAlert({ contentFilter, onClose, sx }) {
  const { t } = useTranslation();
  if (!contentFilter?.changed || !contentFilter.warnings?.length) return null;

  const items = contentFilter.warnings.map((w, i) => {
    const text = t(`contentFilter.warnings.${w.code}`, {
      maxKb: Math.round(CONTENT_LIMITS.maxImageBytes / 1000),
      defaultValue: t('contentFilter.warnings.html_sanitized'),
    });
    return (
      <Box component="li" key={`${w.code}-${i}`}>
        {text}
      </Box>
    );
  });

  return (
    <Alert severity="warning" onClose={onClose} sx={sx}>
      <AlertTitle>{t('contentFilter.title')}</AlertTitle>
      <Box component="ul" sx={{ m: 0, pl: 2 }}>
        {items}
      </Box>
    </Alert>
  );
}
