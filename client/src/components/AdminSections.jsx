import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
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
import Chip from '@mui/material/Chip';
import { fetchSections, createSection, updateSection } from '../store/sectionsSlice.js';

function uiLang(i18n) {
  return (i18n.language || 'en').startsWith('de') ? 'de' : 'en';
}

class AdminSections extends Component {
  state = {
    title: '',
    description: '',
    lang: 'en',
    adminOnlyTopics: false,
    sortOrder: 0,
    editingId: null,
    error: null,
  };

  componentDidMount() {
    this.setState({ lang: uiLang(this.props.i18n) });
    this.props.fetchSections({ all: true });
  }

  resetForm = () => {
    this.setState({
      title: '',
      description: '',
      lang: uiLang(this.props.i18n),
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
      lang: section.lang || 'en',
      adminOnlyTopics: !!section.adminOnlyTopics,
      sortOrder: section.sortOrder || 0,
      error: null,
    });
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { t } = this.props;
    const { title, description, lang, adminOnlyTopics, sortOrder, editingId } = this.state;
    if (!title.trim()) {
      this.setState({ error: t('admin.titleRequired') });
      return;
    }
    try {
      if (editingId) {
        await this.props.updateSection({
          id: editingId,
          title: title.trim(),
          description,
          lang,
          adminOnlyTopics,
          sortOrder: Number(sortOrder) || 0,
        }).unwrap();
      } else {
        await this.props.createSection({
          title: title.trim(),
          description,
          lang,
          adminOnlyTopics,
          sortOrder: Number(sortOrder) || 0,
        }).unwrap();
      }
      this.resetForm();
    } catch (err) {
      this.setState({ error: err.message || t('admin.saveFailed') });
    }
  };

  render() {
    const { user, sections, t } = this.props;
    const { title, description, lang, adminOnlyTopics, sortOrder, editingId, error } = this.state;

    if (!user) {
      return <Alert severity="info">{t('admin.signIn')}</Alert>;
    }
    if (!user.isAdmin) {
      return <Alert severity="warning">{t('admin.accessRequired')}</Alert>;
    }

    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          {t('admin.title')}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {t('admin.blurb')}
        </Typography>

        <Box component="form" onSubmit={this.handleSubmit} sx={{ mb: 4 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Stack spacing={2}>
            <TextField
              label={t('admin.fieldTitle')}
              value={title}
              onChange={(e) => this.setState({ title: e.target.value })}
              fullWidth
            />
            <TextField
              label={t('admin.fieldDescription')}
              value={description}
              onChange={(e) => this.setState({ description: e.target.value })}
              fullWidth
              multiline
              minRows={2}
            />
            <TextField
              select
              label={t('admin.fieldLanguage')}
              value={lang}
              onChange={(e) => this.setState({ lang: e.target.value })}
              sx={{ maxWidth: 200 }}
            >
              <MenuItem value="en">{t('admin.langEn')}</MenuItem>
              <MenuItem value="de">{t('admin.langDe')}</MenuItem>
            </TextField>
            <TextField
              label={t('admin.fieldSortOrder')}
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
              label={t('admin.adminOnlyTopics')}
            />
            <Stack direction="row" spacing={1}>
              <Button type="submit" variant="contained">
                {editingId ? t('admin.update') : t('admin.create')}
              </Button>
              {editingId && (
                <Button type="button" onClick={this.resetForm}>
                  {t('admin.cancel')}
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
                    {t('admin.edit')}
                  </Button>
                }
              >
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <span>
                        {section.title}
                        {section.adminOnlyTopics ? t('admin.adminTopicsSuffix') : ''}
                      </span>
                      <Chip
                        size="small"
                        label={(section.lang || 'en').toUpperCase()}
                        variant="outlined"
                      />
                    </Stack>
                  }
                  secondary={section.description || '—'}
                  slotProps={{
                    primary: { component: 'div' },
                  }}
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

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(AdminSections));
