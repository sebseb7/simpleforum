import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import withRouter from '../withRouter.jsx';
import {
  fetchTopic,
  closeTopic,
  updateTopic,
  deleteTopic,
  clearDeletedNavigate,
} from '../store/topicsSlice.js';
import { formatForumDate } from '../i18n/formatDate.js';
import ForumTopicMessage from './ForumTopicMessage.jsx';
import ForumPostForm from './ForumPostForm.jsx';
import ForumStarButton from './ForumStarButton.jsx';
import ProtectedAction from './ProtectedAction.jsx';
import {
  ReactQuill,
  getQuillModules,
  getQuillPlaceholder,
  quillFormats,
} from '../quillSetup.js';

class ForumTopic extends Component {
  state = {
    editing: false,
    editTitle: '',
    editBodyHtml: '',
    editError: null,
    saving: false,
  };

  componentDidMount() {
    this.load();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.params.topicId !== this.props.params.topicId) {
      this.setState({ editing: false, editError: null });
      this.load();
    }
    if (this.props.deletedNavigate) {
      const { sectionId } = this.props.deletedNavigate;
      this.props.clearDeletedNavigate();
      this.props.navigate(`/section/${sectionId}`);
    }
  }

  load = () => {
    const topicId = Number(this.props.params.topicId);
    if (topicId) this.props.fetchTopic(topicId);
  };

  handleClose = () => {
    if (window.confirm(this.props.t('topic.closeConfirm'))) {
      this.props.closeTopic(Number(this.props.params.topicId));
    }
  };

  handleDelete = () => {
    if (window.confirm(this.props.t('topic.deleteConfirm'))) {
      this.props.deleteTopic(Number(this.props.params.topicId));
    }
  };

  startEdit = () => {
    const { topic } = this.props;
    this.setState({
      editing: true,
      editTitle: topic.title,
      editBodyHtml: topic.bodyHtml || '',
      editError: null,
    });
  };

  cancelEdit = () => {
    this.setState({ editing: false, editError: null });
  };

  saveEdit = async () => {
    const { t } = this.props;
    const { editTitle, editBodyHtml } = this.state;
    if (!editTitle.trim()) {
      this.setState({ editError: t('topic.titleRequired') });
      return;
    }
    this.setState({ saving: true, editError: null });
    try {
      await this.props
        .updateTopic({
          topicId: this.props.topic.id,
          title: editTitle.trim(),
          bodyHtml: editBodyHtml,
        })
        .unwrap();
      this.setState({ editing: false, saving: false });
    } catch (err) {
      this.setState({
        editError: err.message || t('topic.updateFailed'),
        saving: false,
      });
    }
  };

  render() {
    const { topic, posts, error, user, params, t, i18n } = this.props;
    const { editing, editTitle, editBodyHtml, editError, saving } = this.state;
    const topicId = Number(params.topicId);
    const ready = topic?.id === topicId;
    const isAuthor = user && ready && user.id === topic.authorId;
    const canClose = isAuthor || user?.isAdmin;

    return (
      <Box>
        {ready && (
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link component={RouterLink} to="/" underline="hover" color="inherit">
              {t('nav.forums')}
            </Link>
            <Link
              component={RouterLink}
              to={`/section/${topic.sectionId}`}
              underline="hover"
              color="inherit"
            >
              {topic.sectionTitle}
            </Link>
            <Typography color="text.primary">{topic.title}</Typography>
          </Breadcrumbs>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {ready && (
          <>
            <Stack
              direction="row"
              sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}
            >
              <Box sx={{ flex: 1, minWidth: 0, pr: 2 }}>
                {editing ? (
                  <TextField
                    fullWidth
                    label={t('topic.title')}
                    value={editTitle}
                    onChange={(e) => this.setState({ editTitle: e.target.value })}
                    sx={{ mb: 1 }}
                  />
                ) : (
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                    <Typography variant="h4">{topic.title}</Typography>
                    {topic.isClosed && <Chip label={t('topic.closed')} size="small" />}
                  </Stack>
                )}
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Avatar src={topic.authorPicture || undefined} sx={{ width: 28, height: 28 }}>
                    {topic.authorName?.[0]}
                  </Avatar>
                  <Typography variant="body2" color="text.secondary">
                    {t('topic.authorMeta', {
                      name: topic.authorName,
                      date: formatForumDate(topic.createdAt),
                    })}
                  </Typography>
                </Stack>
              </Box>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexShrink: 0 }}>
                <ForumStarButton
                  targetType="topic"
                  targetId={topic.id}
                  starredByMe={topic.starredByMe}
                  starCount={topic.starCount}
                />
                {isAuthor && !editing && (
                  <Button size="small" variant="outlined" onClick={this.startEdit}>
                    {t('topic.edit')}
                  </Button>
                )}
                {canClose && !topic.isClosed && !editing && (
                  <Button size="small" variant="outlined" onClick={this.handleClose}>
                    {t('topic.closeTopic')}
                  </Button>
                )}
                {isAuthor && !editing && (
                  <Button size="small" color="error" variant="outlined" onClick={this.handleDelete}>
                    {t('topic.delete')}
                  </Button>
                )}
              </Stack>
            </Stack>

            {editError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {editError}
              </Alert>
            )}

            {editing ? (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ mb: 2, bgcolor: 'background.paper' }}>
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
                  <Button variant="contained" onClick={this.saveEdit} disabled={saving}>
                    {saving ? t('topic.saving') : t('topic.save')}
                  </Button>
                  <Button onClick={this.cancelEdit} disabled={saving}>
                    {t('topic.cancel')}
                  </Button>
                </Stack>
              </Box>
            ) : (
              topic.bodyHtml && (
                <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
                  <Box
                    sx={{ '& p': { m: 0, mb: 1 }, '& img': { maxWidth: '100%' } }}
                    dangerouslySetInnerHTML={{ __html: topic.bodyHtml }}
                  />
                </Paper>
              )
            )}

            {posts.map((post) => (
              <ForumTopicMessage key={post.id} post={post} />
            ))}

            {topic.isClosed ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                {t('topic.isClosed')}
              </Alert>
            ) : (
              <ProtectedAction user={user} message={t('topic.signInToParticipate')}>
                <ForumPostForm topicId={topic.id} />
              </ProtectedAction>
            )}
          </>
        )}
      </Box>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const topicId = Number(ownProps.params.topicId);
  const topic =
    state.topics.current?.id === topicId ? state.topics.current : null;
  const sectionTitle =
    topic?.sectionTitle ||
    state.sections.items.find((s) => s.id === topic?.sectionId)?.title ||
    null;
  return {
    topic: topic
      ? { ...topic, sectionTitle: sectionTitle || topic.sectionTitle }
      : null,
    posts: topic ? state.posts.byTopicId[topicId] || [] : [],
    error: state.topics.error,
    user: state.auth.user,
    deletedNavigate: state.topics.deletedNavigate,
  };
};

const mapDispatchToProps = {
  fetchTopic,
  closeTopic,
  updateTopic,
  deleteTopic,
  clearDeletedNavigate,
};

export default withRouter(
  withTranslation()(connect(mapStateToProps, mapDispatchToProps)(ForumTopic)),
);
