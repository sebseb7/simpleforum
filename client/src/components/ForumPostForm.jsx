import React, { Component } from 'react';
import { connect } from 'react-redux';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { createPost } from '../store/postsSlice.js';
import { ReactQuill, quillModules, quillFormats } from '../quillSetup.js';

class ForumPostForm extends Component {
  state = {
    bodyHtml: '',
    error: null,
    submitting: false,
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { bodyHtml } = this.state;
    if (!bodyHtml.replace(/<(.|\n)*?>/g, '').trim()) {
      this.setState({ error: 'Message is required' });
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
      this.setState({ error: err.message || 'Failed to post', submitting: false });
    }
  };

  render() {
    const { bodyHtml, error, submitting } = this.state;
    return (
      <Box component="form" onSubmit={this.handleSubmit} sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Reply
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ mb: 2, bgcolor: 'background.paper' }}>
          <ReactQuill
            theme="snow"
            value={bodyHtml}
            onChange={(value) => this.setState({ bodyHtml: value })}
            modules={quillModules}
            formats={quillFormats}
          />
        </Box>
        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? 'Posting…' : 'Post reply'}
        </Button>
      </Box>
    );
  }
}

const mapDispatchToProps = { createPost };

export default connect(null, mapDispatchToProps)(ForumPostForm);
