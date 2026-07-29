import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import ForumStarButton from './ForumStarButton.jsx';
import { updatePost, deletePost } from '../store/postsSlice.js';
import { formatForumDate } from '../i18n/formatDate.js';
import {
  ReactQuill,
  getQuillModules,
  getQuillPlaceholder,
  quillFormats,
} from '../quillSetup.js';

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
    const { t } = this.props;
    const { editBodyHtml } = this.state;
    if (!editBodyHtml.replace(/<(.|\n)*?>/g, '').trim()) {
      this.setState({ error: t('post.messageRequired') });
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
        error: err.message || t('post.updateFailed'),
        saving: false,
      });
    }
  };

  handleDelete = () => {
    if (!window.confirm(this.props.t('post.deleteConfirm'))) return;
    this.props.deletePost(this.props.post.id);
  };

  render() {
    const { post, user, t, i18n } = this.props;
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
                  {formatForumDate(post.createdAt)}
                </Typography>
                {isAuthor && !editing && (
                  <>
                    <Button size="small" onClick={this.startEdit}>
                      {t('post.edit')}
                    </Button>
                    <Button size="small" color="error" onClick={this.handleDelete}>
                      {t('post.delete')}
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
                    key={i18n.language}
                    theme="snow"
                    value={editBodyHtml}
                    onChange={(value) => this.setState({ editBodyHtml: value })}
                    modules={getQuillModules()}
                    formats={quillFormats}
                    placeholder={getQuillPlaceholder()}
                  />
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button size="small" variant="contained" onClick={this.saveEdit} disabled={saving}>
                    {saving ? t('post.saving') : t('post.save')}
                  </Button>
                  <Button size="small" onClick={this.cancelEdit} disabled={saving}>
                    {t('post.cancel')}
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

export default withTranslation()(
  connect(mapStateToProps, mapDispatchToProps)(ForumTopicMessage),
);
