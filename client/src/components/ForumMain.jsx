import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { fetchSections } from '../store/sectionsSlice.js';

class ForumMain extends Component {
  componentDidMount() {
    this.props.fetchSections();
  }

  render() {
    const { sections, status, error } = this.props;

    return (
      <Box>
        <Typography variant="h3" gutterBottom>
				   Welcome
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 520 }}>
          Browse every section and topic without signing in. Sign in from the header to start or join a debate.
        </Typography>

        {error && <Alert severity="error">{error}</Alert>}

        <List disablePadding sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          {sections.map((section, index) => (
            <React.Fragment key={section.id}>
              {index > 0 && <Divider />}
              <ListItemButton
                component={RouterLink}
                to={`/section/${section.id}`}
                sx={{ py: 2, alignItems: 'flex-start' }}
              >
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Typography variant="h6">{section.title}</Typography>
                      {section.adminOnlyTopics && (
                        <Chip size="small" label="Admin topics" variant="outlined" />
                      )}
                    </Stack>
                  }
                  secondary={
                    <>
                      {section.description}
                      <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                        {section.topicCount} topic{section.topicCount === 1 ? '' : 's'}
                      </Box>
                    </>
                  }
                  slotProps={{
                    secondary: { component: 'div' },
                  }}
                />
              </ListItemButton>
            </React.Fragment>
          ))}
          {status === 'succeeded' && sections.length === 0 && (
            <Box sx={{ p: 3 }}>
              <Typography color="text.secondary">
                No sections yet. An admin can create them under Admin.
              </Typography>
            </Box>
          )}
        </List>
      </Box>
    );
  }
}

const mapStateToProps = (state) => ({
  sections: state.sections.items,
  status: state.sections.status,
  error: state.sections.error,
});

const mapDispatchToProps = { fetchSections };

export default connect(mapStateToProps, mapDispatchToProps)(ForumMain);
