import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import { fetchMyStars } from '../store/starsSlice.js';
import { formatForumDate } from '../i18n/formatDate.js';
import ProtectedAction from './ProtectedAction.jsx';

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
          <Typography variant="h4" gutterBottom>
            {t('starred.title')}
          </Typography>
          <ProtectedAction user={null} message={t('starred.signIn')} />
        </Box>
      );
    }

    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          {t('starred.title')}
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}

        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
          {t('starred.topics')}
        </Typography>
        <List sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', mb: 3 }}>
          {topics.map((topic, index) => (
            <React.Fragment key={topic.id}>
              {index > 0 && <Divider />}
              <ListItemButton component={RouterLink} to={`/topic/${topic.id}`}>
                <ListItemText
                  primary={topic.title}
                  secondary={t('starred.topicMeta', {
                    name: topic.authorName,
                    count: topic.starCount,
                  })}
                />
              </ListItemButton>
            </React.Fragment>
          ))}
          {status === 'succeeded' && topics.length === 0 && (
            <Box sx={{ p: 2 }}>
              <Typography color="text.secondary">{t('starred.noTopics')}</Typography>
            </Box>
          )}
        </List>

        <Typography variant="h6" sx={{ mb: 1 }}>
          {t('starred.posts')}
        </Typography>
        <List sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          {posts.map((post, index) => (
            <React.Fragment key={post.id}>
              {index > 0 && <Divider />}
              <ListItemButton component={RouterLink} to={`/topic/${post.topicId}`}>
                <ListItemText
                  primary={t('starred.postBy', { name: post.authorName })}
                  secondary={t('starred.postMeta', {
                    count: post.starCount,
                    date: formatForumDate(post.createdAt),
                  })}
                />
              </ListItemButton>
            </React.Fragment>
          ))}
          {status === 'succeeded' && posts.length === 0 && (
            <Box sx={{ p: 2 }}>
              <Typography color="text.secondary">{t('starred.noPosts')}</Typography>
            </Box>
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
