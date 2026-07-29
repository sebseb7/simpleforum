import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import { fetchMyStars } from '../store/starsSlice.js';
import { formatForumDate } from '../i18n/formatDate.js';
import ProtectedAction from './ProtectedAction.jsx';
import DocumentMeta from './DocumentMeta.jsx';

class StarredPage extends Component {
  componentDidMount() {
    if (this.props.user) {
      this.props.fetchMyStars();
    }
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.user && this.props.user) {
      this.props.fetchMyStars();
    }
  }

  render() {
    const { user, topics, posts, status, error, t } = this.props;

    if (!user) {
      return (
        <Box>
          <DocumentMeta title={t('starred.title')} />
          <Typography component="h1" variant="h4" gutterBottom>
            {t('starred.title')}
          </Typography>
          <ProtectedAction user={null} message={t('starred.signIn')} />
        </Box>
      );
    }

    return (
      <Box>
        <DocumentMeta title={t('starred.title')} />
        <Typography component="h1" variant="h4" gutterBottom>
          {t('starred.title')}
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}

        <Typography component="h2" variant="h6" sx={{ mt: 2, mb: 1 }}>
          {t('starred.topics')}
        </Typography>
        <List
          disablePadding
          sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', mb: 3 }}
        >
          {topics.map((topic, index) => (
            <ListItem key={topic.id} disablePadding divider={index < topics.length - 1}>
              <ListItemButton component={RouterLink} to={`/topic/${topic.slug}`}>
                <ListItemText
                  primary={topic.title}
                  secondary={t('starred.topicMeta', {
                    name: topic.authorName,
                    count: topic.starCount,
                  })}
                />
              </ListItemButton>
            </ListItem>
          ))}
          {status === 'succeeded' && topics.length === 0 && (
            <ListItem sx={{ py: 2 }}>
              <ListItemText
                primary={t('starred.noTopics')}
                slotProps={{ primary: { color: 'text.secondary' } }}
              />
            </ListItem>
          )}
        </List>

        <Typography component="h2" variant="h6" sx={{ mb: 1 }}>
          {t('starred.posts')}
        </Typography>
        <List
          disablePadding
          sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}
        >
          {posts.map((post, index) => (
            <ListItem key={post.id} disablePadding divider={index < posts.length - 1}>
              <ListItemButton component={RouterLink} to={`/topic/${post.topicSlug}`}>
                <ListItemText
                  primary={t('starred.postBy', { name: post.authorName })}
                  secondary={t('starred.postMeta', {
                    count: post.starCount,
                    date: formatForumDate(post.createdAt),
                  })}
                />
              </ListItemButton>
            </ListItem>
          ))}
          {status === 'succeeded' && posts.length === 0 && (
            <ListItem sx={{ py: 2 }}>
              <ListItemText
                primary={t('starred.noPosts')}
                slotProps={{ primary: { color: 'text.secondary' } }}
              />
            </ListItem>
          )}
        </List>
      </Box>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.auth.user,
  topics: state.stars.topics,
  posts: state.stars.posts,
  status: state.stars.status,
  error: state.stars.error,
});

const mapDispatchToProps = { fetchMyStars };

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(StarredPage));
