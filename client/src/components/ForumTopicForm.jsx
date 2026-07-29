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

class ForumTopicForm extends Component {
  state = {
    title: '',
    bodyHtml: '',
    error: null,
    submitting: false,
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { t } = this.props;
    const { title, bodyHtml } = this.state;
    if (!title.trim()) {
      this.setState({ error: t('topicForm.titleRequired') });
      return;
    }
    this.setState({ submitting: true, error: null });
    try {
      await this.props.createTopic({
        sectionId: this.props.sectionId,
        title: title.trim(),
        bodyHtml,
      }).unwrap();
      this.setState({ title: '', bodyHtml: '', submitting: false });
    } catch (err) {
      this.setState({
        error: err.message || t('topicForm.createFailed'),
        submitting: false,
      });
    }
  };

  render() {
    const { t, i18n } = this.props;
    const { title, bodyHtml, error, submitting } = this.state;
    return (
      <Box component="form" onSubmit={this.handleSubmit} sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          {t('topicForm.start')}
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          fullWidth
          label={t('topicForm.title')}
          value={title}
          onChange={(e) => this.setState({ title: e.target.value })}
          sx={{ mb: 2 }}
        />
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
          {submitting ? t('topicForm.posting') : t('topicForm.create')}
        </Button>
      </Box>
    );
  }
}

const mapDispatchToProps = { createTopic };

export default withTranslation()(connect(null, mapDispatchToProps)(ForumTopicForm));
