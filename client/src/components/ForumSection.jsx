import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import withRouter from '../withRouter.jsx';
import { fetchSectionTopics, TOPICS_PAGE_SIZE } from '../store/topicsSlice.js';
import { formatForumDate } from '../i18n/formatDate.js';
import ForumTopicForm from './ForumTopicForm.jsx';
import ForumStarButton from './ForumStarButton.jsx';
import ProtectedAction from './ProtectedAction.jsx';
import ForumPagination from './ForumPagination.jsx';
import DocumentMeta from './DocumentMeta.jsx';

class ForumSection extends Component {
  componentDidMount() {
    const { section, listStatus, params, listOffset } = this.props;
    if (
      section?.slug === params.sectionSlug &&
      listStatus === 'succeeded' &&
      (listOffset === 0 || listOffset == null)
    ) {
      return;
    }
    this.load(0);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.params.sectionSlug !== this.props.params.sectionSlug) {
      this.load(0);
    }
  }

  load = (offset = this.props.listOffset || 0) => {
    const sectionSlug = this.props.params.sectionSlug;
    if (sectionSlug) {
      this.props.fetchSectionTopics({
        sectionSlug,
        offset,
        limit: this.props.listLimit || TOPICS_PAGE_SIZE,
      });
    }
  };

  canCreateTopic = () => {
    const { user, section } = this.props;
    if (!user || !section) return false;
    if (section.adminOnlyTopics) return !!user.isAdmin;
    return true;
  };

  render() {
    const {
      section,
      topics,
      listStatus,
      listTotal,
      listOffset,
      listLimit,
      error,
      user,
      params,
      t,
    } = this.props;
    const sectionSlug = params.sectionSlug;
    const ready = section?.slug === sectionSlug && listStatus === 'succeeded';

    return (
      <Box>
        {ready && (
          <DocumentMeta title={section.title} description={section.description} />
        )}
        {ready && (
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link component={RouterLink} to="/" underline="hover" color="inherit">
              {t('nav.forums')}
            </Link>
            <Typography color="text.primary">{section.title}</Typography>
          </Breadcrumbs>
        )}

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {ready && (
          <>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
              <Typography component="h1" variant="h4">{section.title}</Typography>
              {section.adminOnlyTopics && (
                <Chip size="small" label={t('section.adminCreatesTopics')} variant="outlined" />
              )}
            </Stack>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {section.description}
            </Typography>

            <ForumPagination
              total={listTotal}
              offset={listOffset}
              limit={listLimit}
              onPageChange={this.load}
            />

            <List disablePadding sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', mb: 1 }}>
              {topics.map((topic, index) => (
                <ListItem
                  key={topic.id}
                  disablePadding
                  divider={index < topics.length - 1}
                  secondaryAction={
                    <ForumStarButton
                      targetType="topic"
                      targetId={topic.id}
                      starredByMe={topic.starredByMe}
                      starCount={topic.starCount}
                    />
                  }
                  sx={{
                    '& .MuiListItemSecondaryAction-root': {
                      right: 8,
                      top: 12,
                      transform: 'none',
                    },
                  }}
                >
                  <ListItemButton
                    component={RouterLink}
                    to={`/topic/${topic.slug}`}
                    sx={{ py: 1.5, alignItems: 'flex-start', pr: 8 }}
                  >
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <Typography component="h2" variant="subtitle1" fontWeight={600}>
                            {topic.title}
                          </Typography>
                          {topic.isClosed && (
                            <Chip size="small" label={t('section.closed')} color="default" />
                          )}
                        </Stack>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary" component="span">
                          {t('section.topicMeta', {
                            name: topic.authorName,
                            count: topic.postCount,
                            date: formatForumDate(topic.updatedAt),
                          })}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
              {topics.length === 0 && (
                <ListItem sx={{ py: 3 }}>
                  <ListItemText
                    primary={t('section.noTopics')}
                    slotProps={{ primary: { color: 'text.secondary' } }}
                  />
                </ListItem>
              )}
            </List>

            <ForumPagination
              total={listTotal}
              offset={listOffset}
              limit={listLimit}
              onPageChange={this.load}
            />

            {this.canCreateTopic() ? (
              <ForumTopicForm sectionId={section.id} />
            ) : section.adminOnlyTopics ? null : (
              <ProtectedAction
                user={user}
                message={t('section.signInToStart')}
              />
            )}
          </>
        )}
      </Box>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const sectionSlug = ownProps.params.sectionSlug;
  const section =
    state.topics.section?.slug === sectionSlug ? state.topics.section : null;
  return {
    section,
    topics: section ? state.topics.list : [],
    listStatus: section ? state.topics.listStatus : 'loading',
    listTotal: state.topics.listTotal,
    listOffset: state.topics.listOffset,
    listLimit: state.topics.listLimit,
    error: state.topics.error,
    user: state.auth.user,
  };
};
const mapDispatchToProps = { fetchSectionTopics };

export default withRouter(
  withTranslation()(connect(mapStateToProps, mapDispatchToProps)(ForumSection)),
);
