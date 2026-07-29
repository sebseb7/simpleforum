import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { createPost } from '../store/postsSlice.js';
import {
  ReactQuill,
  getQuillModules,
  getQuillPlaceholder,
  quillFormats,
} from '../quillSetup.js';
import ContentFilterAlert from './ContentFilterAlert.jsx';
import { contentErrorMessage, isOverBodyLimit } from '../content/contentErrors.js';
import { imageRejectMessage } from '../content/quillImageHandler.js';

class ForumPostForm extends Component {
  state = {
    bodyHtml: '',
    error: null,
    submitting: false,
    contentFilter: null,
    imageError: null,
  };

  handleImageReject = (code) => {
    this.setState({ imageError: imageRejectMessage(code) });
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { t } = this.props;
    const { bodyHtml } = this.state;
    if (!bodyHtml.replace(/<(.|\n)*?>/g, '').trim()) {
      this.setState({ error: t('postForm.messageRequired'), contentFilter: null });
      return;
    }
    if (isOverBodyLimit(bodyHtml)) {
      this.setState({
        error: contentErrorMessage({ data: { error: 'body_too_large' } }, t),
        contentFilter: null,
      });
      return;
    }
    this.setState({ submitting: true, error: null, contentFilter: null, imageError: null });
    try {
      const { contentFilter } = await this.props
        .createPost({
          topicId: this.props.topicId,
          bodyHtml,
        })
        .unwrap();
      this.setState({
        bodyHtml: '',
        submitting: false,
        contentFilter: contentFilter?.changed ? contentFilter : null,
      });
    } catch (err) {
      this.setState({
        error: contentErrorMessage(err, t) || t('postForm.postFailed'),
        submitting: false,
      });
    }
  };

  render() {
    const { t, i18n } = this.props;
    const { bodyHtml, error, submitting, contentFilter, imageError } = this.state;
    return (
      <Box component="form" onSubmit={this.handleSubmit} sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          {t('postForm.reply')}
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {imageError && (
          <Alert severity="warning" sx={{ mb: 2 }} onClose={() => this.setState({ imageError: null })}>
            {imageError}
          </Alert>
        )}
        <ContentFilterAlert
          contentFilter={contentFilter}
          onClose={() => this.setState({ contentFilter: null })}
          sx={{ mb: 2 }}
        />
        <Box sx={{ mb: 2, bgcolor: 'background.paper' }}>
          <ReactQuill
            key={i18n.language}
            theme="snow"
            value={bodyHtml}
            onChange={(value) => this.setState({ bodyHtml: value })}
            modules={getQuillModules({ onImageReject: this.handleImageReject })}
            formats={quillFormats}
            placeholder={getQuillPlaceholder()}
          />
        </Box>
        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? t('postForm.posting') : t('postForm.submit')}
        </Button>
      </Box>
    );
  }
}

const mapDispatchToProps = { createPost };

export default withTranslation()(connect(null, mapDispatchToProps)(ForumPostForm));
