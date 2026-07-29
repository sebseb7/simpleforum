import React, { Component } from 'react';
import { connect } from 'react-redux';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import { fetchSections, createSection, updateSection } from '../store/sectionsSlice.js';

class AdminSections extends Component {
  state = {
    title: '',
    description: '',
    adminOnlyTopics: false,
    sortOrder: 0,
    editingId: null,
    error: null,
  };

  componentDidMount() {
    this.props.fetchSections();
  }

  resetForm = () => {
    this.setState({
      title: '',
      description: '',
      adminOnlyTopics: false,
      sortOrder: 0,
      editingId: null,
      error: null,
    });
  };

  startEdit = (section) => {
    this.setState({
      editingId: section.id,
      title: section.title,
      description: section.description || '',
      adminOnlyTopics: !!section.adminOnlyTopics,
      sortOrder: section.sortOrder || 0,
      error: null,
    });
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { title, description, adminOnlyTopics, sortOrder, editingId } = this.state;
    if (!title.trim()) {
      this.setState({ error: 'Title required' });
      return;
    }
    try {
      if (editingId) {
        await this.props.updateSection({
          id: editingId,
          title: title.trim(),
          description,
          adminOnlyTopics,
          sortOrder: Number(sortOrder) || 0,
        }).unwrap();
      } else {
        await this.props.createSection({
          title: title.trim(),
          description,
          adminOnlyTopics,
          sortOrder: Number(sortOrder) || 0,
        }).unwrap();
      }
      this.resetForm();
    } catch (err) {
      this.setState({ error: err.message || 'Save failed' });
    }
  };

  render() {
    const { user, sections } = this.props;
    const { title, description, adminOnlyTopics, sortOrder, editingId, error } = this.state;

    if (!user) {
      return <Alert severity="info">Sign in to manage sections.</Alert>;
    }
    if (!user.isAdmin) {
      return <Alert severity="warning">Admin access required.</Alert>;
    }

    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Manage sections
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Create forum sections. Mark a section admin-only if only admins may open new topics (everyone can still reply).
        </Typography>

        <Box component="form" onSubmit={this.handleSubmit} sx={{ mb: 4 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Stack spacing={2}>
            <TextField
              label="Title"
              value={title}
              onChange={(e) => this.setState({ title: e.target.value })}
              fullWidth
            />
            <TextField
              label="Description"
              value={description}
              onChange={(e) => this.setState({ description: e.target.value })}
              fullWidth
              multiline
              minRows={2}
            />
            <TextField
              label="Sort order"
              type="number"
              value={sortOrder}
              onChange={(e) => this.setState({ sortOrder: e.target.value })}
              sx={{ maxWidth: 160 }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={adminOnlyTopics}
                  onChange={(e) => this.setState({ adminOnlyTopics: e.target.checked })}
                />
              }
              label="Only admins can create topics"
            />
            <Stack direction="row" spacing={1}>
              <Button type="submit" variant="contained">
                {editingId ? 'Update section' : 'Create section'}
              </Button>
              {editingId && (
                <Button type="button" onClick={this.resetForm}>
                  Cancel
                </Button>
              )}
            </Stack>
          </Stack>
        </Box>

        <List sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          {sections.map((section, index) => (
            <React.Fragment key={section.id}>
              {index > 0 && <Divider />}
              <ListItem
                secondaryAction={
                  <Button size="small" onClick={() => this.startEdit(section)}>
                    Edit
                  </Button>
                }
              >
                <ListItemText
                  primary={`${section.title}${section.adminOnlyTopics ? ' (admin topics)' : ''}`}
                  secondary={section.description || '—'}
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      </Box>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.auth.user,
  sections: state.sections.items,
});

const mapDispatchToProps = { fetchSections, createSection, updateSection };

export default connect(mapStateToProps, mapDispatchToProps)(AdminSections);
