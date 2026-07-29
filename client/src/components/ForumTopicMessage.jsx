import React, { Component } from 'react';
import { connect } from 'react-redux';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import ForumStarButton from './ForumStarButton.jsx';
import { updatePost, deletePost } from '../store/postsSlice.js';
import { ReactQuill, quillModules, quillFormats } from '../quillSetup.js';

class ForumTopicMessage extends Component {
  state = {
    editing: false,
    editBodyHtml: '',
    error: null,
    saving: false,
  };

  startEdit = () => {
    this.setState({
      editing: true,
      editBodyHtml: this.props.post.bodyHtml || '',
      error: null,
    });
  };

  cancelEdit = () => {
    this.setState({ editing: false, error: null });
  };

  saveEdit = async () => {
    const { editBodyHtml } = this.state;
    if (!editBodyHtml.replace(/<(.|\n)*?>/g, '').trim()) {
      this.setState({ error: 'Message is required' });
      return;
    }
    this.setState({ saving: true, error: null });
    try {
      await this.props
        .updatePost({
          postId: this.props.post.id,
          bodyHtml: editBodyHtml,
        })
        .unwrap();
      this.setState({ editing: false, saving: false });
    } catch (err) {
      this.setState({
        error: err.message || 'Failed to update post',
        saving: false,
      });
    }
  };

  handleDelete = () => {
    if (!window.confirm('Delete this post?')) return;
    this.props.deletePost(this.props.post.id);
  };

  render() {
    const { post, user } = this.props;
    const { editing, editBodyHtml, error, saving } = this.state;
    const isAuthor = user && user.id === post.authorId;

    return (
      <Paper variant="outlined" sx={{ p: 2, mb: 1.5, bgcolor: 'background.paper' }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
          <Avatar src={post.authorPicture || undefined} sx={{ width: 36, height: 36 }}>
            {post.authorName?.[0]}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack
              direction="row"
              sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}
            >
              <Typography variant="subtitle2">{post.authorName}</Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  {post.createdAt}
                </Typography>
                {isAuthor && !editing && (
                  <>
                    <Button size="small" onClick={this.startEdit}>
                      Edit
                    </Button>
                    <Button size="small" color="error" onClick={this.handleDelete}>
                      Delete
                    </Button>
                  </>
                )}
                <ForumStarButton
                  targetType="post"
                  targetId={post.id}
                  starredByMe={post.starredByMe}
                  starCount={post.starCount}
                />
              </Stack>
            </Stack>

            {error && (
              <Alert severity="error" sx={{ mb: 1 }}>
                {error}
              </Alert>
            )}

            {editing ? (
              <Box>
                <Box sx={{ mb: 1, bgcolor: 'background.paper' }}>
                  <ReactQuill
                    theme="snow"
                    value={editBodyHtml}
                    onChange={(value) => this.setState({ editBodyHtml: value })}
                    modules={quillModules}
                    formats={quillFormats}
                  />
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button size="small" variant="contained" onClick={this.saveEdit} disabled={saving}>
                    {saving ? 'Saving…' : 'Save'}
                  </Button>
                  <Button size="small" onClick={this.cancelEdit} disabled={saving}>
                    Cancel
                  </Button>
                </Stack>
              </Box>
            ) : (
              <Box
                className="ql-editor-readonly"
                sx={{
                  '& p': { m: 0, mb: 1 },
                  '& img': { maxWidth: '100%' },
                }}
                dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
              />
            )}
          </Box>
        </Stack>
      </Paper>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.auth.user,
});

const mapDispatchToProps = { updatePost, deletePost };

export default connect(mapStateToProps, mapDispatchToProps)(ForumTopicMessage);
