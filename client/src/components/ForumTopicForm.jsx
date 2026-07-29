import React, { Component } from 'react';
import { connect } from 'react-redux';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { createTopic } from '../store/topicsSlice.js';
import { ReactQuill, quillModules, quillFormats } from '../quillSetup.js';

class ForumTopicForm extends Component {
  state = {
    title: '',
    bodyHtml: '',
    error: null,
    submitting: false,
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { title, bodyHtml } = this.state;
    if (!title.trim()) {
      this.setState({ error: 'Title is required' });
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
      this.setState({ error: err.message || 'Failed to create topic', submitting: false });
    }
  };

  render() {
    const { title, bodyHtml, error, submitting } = this.state;
    return (
      <Box component="form" onSubmit={this.handleSubmit} sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Start a topic
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          fullWidth
          label="Title"
          value={title}
          onChange={(e) => this.setState({ title: e.target.value })}
          sx={{ mb: 2 }}
        />
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
          {submitting ? 'Posting…' : 'Create topic'}
        </Button>
      </Box>
    );
  }
}

const mapDispatchToProps = { createTopic };

export default connect(null, mapDispatchToProps)(ForumTopicForm);
