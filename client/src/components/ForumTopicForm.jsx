import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { createTopic } from '../store/topicsSlice.js';
import {
  ReactQuill,
  getQuillModules,
  getQuillPlaceholder,
  quillFormats,
} from '../quillSetup.js';
import ContentFilterAlert from './ContentFilterAlert.jsx';
import {
  CONTENT_LIMITS,
  contentErrorMessage,
  isOverBodyLimit,
  isOverTitleLimit,
} from '../content/contentErrors.js';
import { imageRejectMessage } from '../content/quillImageHandler.js';

class ForumTopicForm extends Component {
  state = {
    title: '',
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
    const { title, bodyHtml } = this.state;
    if (!title.trim()) {
      this.setState({ error: t('topicForm.titleRequired'), contentFilter: null });
      return;
    }
    if (isOverTitleLimit(title)) {
      this.setState({
        error: contentErrorMessage({ data: { error: 'title_too_long', max: CONTENT_LIMITS.titleMax } }, t),
        contentFilter: null,
      });
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
        .createTopic({
          sectionId: this.props.sectionId,
          title: title.trim(),
          bodyHtml,
        })
        .unwrap();
      this.setState({
        title: '',
        bodyHtml: '',
        submitting: false,
        contentFilter: contentFilter?.changed ? contentFilter : null,
      });
    } catch (err) {
      this.setState({
        error: contentErrorMessage(err, t) || t('topicForm.createFailed'),
        submitting: false,
      });
    }
  };

  render() {
    const { t, i18n } = this.props;
    const { title, bodyHtml, error, submitting, contentFilter, imageError } = this.state;
    return (
      <Box component="form" onSubmit={this.handleSubmit} sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          {t('topicForm.start')}
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
        <TextField
          fullWidth
          label={t('topicForm.title')}
          value={title}
          onChange={(e) => this.setState({ title: e.target.value })}
          slotProps={{ htmlInput: { maxLength: CONTENT_LIMITS.titleMax } }}
          helperText={`${title.trim().length}/${CONTENT_LIMITS.titleMax}`}
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
          {submitting ? t('topicForm.posting') : t('topicForm.create')}
        </Button>
      </Box>
    );
  }
}

const mapDispatchToProps = { createTopic };

export default withTranslation()(connect(null, mapDispatchToProps)(ForumTopicForm));
