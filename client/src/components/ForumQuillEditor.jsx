import React, { Suspense, lazy } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import ForumLinkPreviews from './ForumLinkPreviews.jsx';

const QuillEditorInner = lazy(async () => {
  const m = await import('../quillSetup.js');

  function QuillEditorLoaded({ value, onChange, onImageReject, ...rest }) {
    return (
      <m.ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={m.getQuillModules({ onImageReject })}
        formats={m.quillFormats}
        placeholder={m.getQuillPlaceholder()}
        {...rest}
      />
    );
  }

  return { default: QuillEditorLoaded };
});

/**
 * Rich-text editor that code-splits Quill (and CSS) until first mount.
 */
export default function ForumQuillEditor({ value, onChange, onImageReject, ...rest }) {
  return (
    <Box>
      <Suspense
        fallback={
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 160,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <CircularProgress size={28} />
          </Box>
        }
      >
        <QuillEditorInner
          value={value}
          onChange={onChange}
          onImageReject={onImageReject}
          {...rest}
        />
      </Suspense>
      <ForumLinkPreviews html={value} />
    </Box>
  );
}
