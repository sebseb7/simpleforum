import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import withRouter from '../withRouter.jsx';
import { fetchSectionTopics } from '../store/topicsSlice.js';
import ForumTopicForm from './ForumTopicForm.jsx';
import ForumStarButton from './ForumStarButton.jsx';
import ProtectedAction from './ProtectedAction.jsx';

class ForumSection extends Component {
  componentDidMount() {
    this.load();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.params.sectionId !== this.props.params.sectionId) {
      this.load();
    }
  }

  load = () => {
    const sectionId = Number(this.props.params.sectionId);
    if (sectionId) this.props.fetchSectionTopics(sectionId);
  };

  canCreateTopic = () => {
    const { user, section } = this.props;
    if (!user || !section) return false;
    if (section.adminOnlyTopics) return !!user.isAdmin;
    return true;
  };

  render() {
    const { section, topics, listStatus, error, user, params } = this.props;
    const sectionId = Number(params.sectionId);
    const ready = section?.id === sectionId && listStatus === 'succeeded';

    return (
      <Box>
        {ready && (
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link component={RouterLink} to="/" underline="hover" color="inherit">
              Forums
            </Link>
            <Typography color="text.primary">{section.title}</Typography>
          </Breadcrumbs>
        )}

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {ready && (
          <>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
              <Typography variant="h4">{section.title}</Typography>
              {section.adminOnlyTopics && (
                <Chip size="small" label="Admin creates topics" variant="outlined" />
              )}
            </Stack>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {section.description}
            </Typography>

            <List disablePadding sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', mb: 3 }}>
              {topics.map((topic, index) => (
                <React.Fragment key={topic.id}>
                  {index > 0 && <Divider />}
                  <ListItemButton
                    component={RouterLink}
                    to={`/topic/${topic.id}`}
                    sx={{ py: 1.5, alignItems: 'flex-start' }}
                  >
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {topic.title}
                          </Typography>
                          {topic.isClosed && <Chip size="small" label="Closed" color="default" />}
                        </Stack>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary" component="span">
                          by {topic.authorName} · {topic.postCount} replies · updated {topic.updatedAt}
                        </Typography>
                      }
                    />
                    <Box
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <ForumStarButton
                        targetType="topic"
                        targetId={topic.id}
                        starredByMe={topic.starredByMe}
                        starCount={topic.starCount}
                      />
                    </Box>
                  </ListItemButton>
                </React.Fragment>
              ))}
              {topics.length === 0 && (
                <Box sx={{ p: 3 }}>
                  <Typography color="text.secondary">No topics yet.</Typography>
                </Box>
              )}
            </List>

            {this.canCreateTopic() ? (
              <ForumTopicForm sectionId={sectionId} />
            ) : section.adminOnlyTopics ? null : (
              <ProtectedAction
                user={user}
                message="Sign in to start a topic."
              />
            )}
          </>
        )}
      </Box>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const sectionId = Number(ownProps.params.sectionId);
  const section =
    state.topics.section?.id === sectionId ? state.topics.section : null;
  return {
    section,
    topics: section ? state.topics.list : [],
    listStatus: section ? state.topics.listStatus : 'loading',
    error: state.topics.error,
    user: state.auth.user,
  };
};
const mapDispatchToProps = { fetchSectionTopics };

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(ForumSection));
