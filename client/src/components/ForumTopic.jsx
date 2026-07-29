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
  POSTS_PAGE_SIZE,
} from '../store/topicsSlice.js';
import { formatForumDate } from '../i18n/formatDate.js';
import ForumTopicMessage from './ForumTopicMessage.jsx';
import ForumPostForm from './ForumPostForm.jsx';
import ForumStarButton from './ForumStarButton.jsx';
import ProtectedAction from './ProtectedAction.jsx';
import ForumPagination from './ForumPagination.jsx';
import ContentFilterAlert from './ContentFilterAlert.jsx';
import ForumHtmlBody from './ForumHtmlBody.jsx';
import {
  ReactQuill,
  getQuillModules,
  getQuillPlaceholder,
  quillFormats,
} from '../quillSetup.js';
import {
  CONTENT_LIMITS,
  contentErrorMessage,
  isOverBodyLimit,
  isOverTitleLimit,
} from '../content/contentErrors.js';
import { imageRejectMessage } from '../content/quillImageHandler.js';
import DocumentMeta from './DocumentMeta.jsx';

function plainTextFromHtml(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

class ForumTopic extends Component {
  state = {
    editing: false,
    editTitle: '',
    editBodyHtml: '',
    editError: null,
    saving: false,
    contentFilter: null,
    imageError: null,
  };

  componentDidMount() {
    this.load(0);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.params.topicSlug !== this.props.params.topicSlug) {
      this.setState({ editing: false, editError: null });
      this.load(0);
    }
    // Anonymous fetches redact media; reload once signed in so links/images appear.
    if (!prevProps.user && this.props.user) {
      this.load(this.props.postsOffset || 0);
    }
    if (this.props.deletedNavigate) {
      const { sectionSlug, sectionId } = this.props.deletedNavigate;
      this.props.clearDeletedNavigate();
      this.props.navigate(`/section/${sectionSlug || sectionId}`);
    }
  }

  load = (offset = this.props.postsOffset || 0) => {
    const topicSlug = this.props.params.topicSlug;
    if (topicSlug) {
      this.props.fetchTopic({
        topicSlug,
        offset,
        limit: this.props.postsLimit || POSTS_PAGE_SIZE,
      });
    }
  };

  handleClose = () => {
    if (window.confirm(this.props.t('topic.closeConfirm'))) {
      this.props.closeTopic(this.props.topic.id);
    }
  };

  handleDelete = () => {
    if (window.confirm(this.props.t('topic.deleteConfirm'))) {
      this.props.deleteTopic(this.props.topic.id);
    }
  };

  startEdit = () => {
    const { topic } = this.props;
    this.setState({
      editing: true,
      editTitle: topic.title,
      editBodyHtml: topic.bodyHtml || '',
      editError: null,
      contentFilter: null,
      imageError: null,
    });
  };

  cancelEdit = () => {
    this.setState({ editing: false, editError: null, imageError: null });
  };

  handleImageReject = (code) => {
    this.setState({ imageError: imageRejectMessage(code) });
  };

  saveEdit = async () => {
    const { t } = this.props;
    const { editTitle, editBodyHtml } = this.state;
    if (!editTitle.trim()) {
      this.setState({ editError: t('topic.titleRequired') });
      return;
    }
    if (isOverTitleLimit(editTitle)) {
      this.setState({
        editError: contentErrorMessage(
          { data: { error: 'title_too_long', max: CONTENT_LIMITS.titleMax } },
          t,
        ),
      });
      return;
    }
    if (isOverBodyLimit(editBodyHtml)) {
      this.setState({
        editError: contentErrorMessage({ data: { error: 'body_too_large' } }, t),
      });
      return;
    }
    this.setState({ saving: true, editError: null, imageError: null });
    try {
      const { contentFilter, topic } = await this.props
        .updateTopic({
          topicId: this.props.topic.id,
          title: editTitle.trim(),
          bodyHtml: editBodyHtml,
        })
        .unwrap();
      this.setState({
        editing: false,
        saving: false,
        contentFilter: contentFilter?.changed ? contentFilter : null,
      });
      if (topic?.slug && topic.slug !== this.props.params.topicSlug) {
        this.props.navigate(`/topic/${topic.slug}`, { replace: true });
      }
    } catch (err) {
      this.setState({
        editError: contentErrorMessage(err, t) || t('topic.updateFailed'),
        saving: false,
      });
    }
  };

  render() {
    const {
      topic,
      posts,
      postsTotal,
      postsOffset,
      postsLimit,
      error,
      user,
      params,
      t,
      i18n,
    } = this.props;
    const { editing, editTitle, editBodyHtml, editError, saving, contentFilter, imageError } =
      this.state;
    const topicSlug = params.topicSlug;
    const ready = topic?.slug === topicSlug;
    const isAuthor = user && ready && user.id === topic.authorId;
    const canClose = isAuthor || user?.isAdmin;

    return (
      <Box>
        {ready && (
          <DocumentMeta
            title={topic.title}
            description={plainTextFromHtml(topic.bodyHtml) || topic.sectionTitle}
          />
        )}
        {ready && (
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link component={RouterLink} to="/" underline="hover" color="inherit">
              {t('nav.forums')}
            </Link>
            <Link
              component={RouterLink}
              to={`/section/${topic.sectionSlug}`}
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
                    slotProps={{ htmlInput: { maxLength: CONTENT_LIMITS.titleMax } }}
                    helperText={`${editTitle.trim().length}/${CONTENT_LIMITS.titleMax}`}
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
            {imageError && (
              <Alert
                severity="warning"
                sx={{ mb: 2 }}
                onClose={() => this.setState({ imageError: null })}
              >
                {imageError}
              </Alert>
            )}
            <ContentFilterAlert
              contentFilter={contentFilter}
              onClose={() => this.setState({ contentFilter: null })}
              sx={{ mb: 2 }}
            />

            {editing ? (
              <Box sx={{ mb: 3 }}>
                <Box sx={{ mb: 2, bgcolor: 'background.paper' }}>
                  <ReactQuill
                    key={i18n.language}
                    theme="snow"
                    value={editBodyHtml}
                    onChange={(value) => this.setState({ editBodyHtml: value })}
                    modules={getQuillModules({ onImageReject: this.handleImageReject })}
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
                  <ForumHtmlBody html={topic.bodyHtml} />
                </Paper>
              )
            )}

            {topic.isClosed ? (
              <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
                {t('topic.isClosed')}
              </Alert>
            ) : (
              <ProtectedAction user={user} message={t('topic.signInToParticipate')}>
                <ForumPostForm topicId={topic.id} />
              </ProtectedAction>
            )}

            <ForumPagination
              total={postsTotal}
              offset={postsOffset}
              limit={postsLimit}
              onPageChange={this.load}
            />

            {posts.map((post) => (
              <ForumTopicMessage key={post.id} post={post} />
            ))}

            <ForumPagination
              total={postsTotal}
              offset={postsOffset}
              limit={postsLimit}
              onPageChange={this.load}
            />
          </>
        )}
      </Box>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const topicSlug = ownProps.params.topicSlug;
  const topic =
    state.topics.current?.slug === topicSlug ? state.topics.current : null;
  const sectionTitle =
    topic?.sectionTitle ||
    state.sections.items.find((s) => s.id === topic?.sectionId)?.title ||
    null;
  const topicId = topic?.id;
  const postsWindow =
    topicId != null && state.posts.window?.topicId === topicId
      ? state.posts.window
      : null;
  return {
    topic: topic
      ? { ...topic, sectionTitle: sectionTitle || topic.sectionTitle }
      : null,
    posts: topicId != null ? state.posts.byTopicId[topicId] || [] : [],
    postsTotal: postsWindow?.total ?? 0,
    postsOffset: postsWindow?.offset ?? 0,
    postsLimit: postsWindow?.limit ?? 50,
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
