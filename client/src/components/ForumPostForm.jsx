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

class ForumPostForm extends Component {
  state = {
    bodyHtml: '',
    error: null,
    submitting: false,
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { t } = this.props;
    const { bodyHtml } = this.state;
    if (!bodyHtml.replace(/<(.|\n)*?>/g, '').trim()) {
      this.setState({ error: t('postForm.messageRequired') });
      return;
    }
    this.setState({ submitting: true, error: null });
    try {
      await this.props.createPost({
        topicId: this.props.topicId,
        bodyHtml,
      }).unwrap();
      this.setState({ bodyHtml: '', submitting: false });
    } catch (err) {
      this.setState({
        error: err.message || t('postForm.postFailed'),
        submitting: false,
      });
    }
  };

  render() {
    const { t, i18n } = this.props;
    const { bodyHtml, error, submitting } = this.state;
    return (
      <Box component="form" onSubmit={this.handleSubmit} sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          {t('postForm.reply')}
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ mb: 2, bgcolor: 'background.paper' }}>
          <ReactQuill
            key={i18n.language}
            theme="snow"
            value={bodyHtml}
            onChange={(value) => this.setState({ bodyHtml: value })}
            modules={getQuillModules()}
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
