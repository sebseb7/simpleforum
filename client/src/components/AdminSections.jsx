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
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import {
  fetchSections,
  createSection,
  updateSection,
  fetchSettings,
  updateSettings,
} from '../store/sectionsSlice.js';
import DocumentMeta from './DocumentMeta.jsx';
import ForumQuillEditor from './ForumQuillEditor.jsx';
import ContentFilterAlert from './ContentFilterAlert.jsx';
import { CONTENT_LIMITS } from '../content/contentErrors.js';
import { imageRejectMessage } from '../content/quillImageHandler.js';

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
    rootDeTitle: '',
    rootDeBody: '',
    rootEnTitle: '',
    rootEnBody: '',
    siteName: '',
    settingsError: null,
    settingsSaved: false,
    settingsSaving: false,
    contentFilter: null,
    imageError: null,
  };

  componentDidMount() {
    this.setState({ lang: uiLang(this.props.i18n) });
    this.props.fetchSections({ all: true });
    this.props.fetchSettings().then((action) => {
      if (action.payload) this.applyRootPayload(action.payload);
    });
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.rootDe !== this.props.rootDe ||
      prevProps.rootEn !== this.props.rootEn ||
      prevProps.siteName !== this.props.siteName
    ) {
      this.applyRootPayload({
        siteName: this.props.siteName,
        rootDe: this.props.rootDe,
        rootEn: this.props.rootEn,
      });
    }
  }

  applyRootPayload = (payload) => {
    this.setState({
      siteName: payload.siteName || '',
      rootDeTitle: payload.rootDe?.title || '',
      rootDeBody: payload.rootDe?.bodyHtml || '',
      rootEnTitle: payload.rootEn?.title || '',
      rootEnBody: payload.rootEn?.bodyHtml || '',
    });
  };

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

  handleSettingsSave = async (e) => {
    e.preventDefault();
    const { t } = this.props;
    this.setState({
      settingsSaving: true,
      settingsError: null,
      settingsSaved: false,
      contentFilter: null,
    });
    try {
      const result = await this.props
        .updateSettings({
          siteName: this.state.siteName,
          rootDe: {
            title: this.state.rootDeTitle,
            bodyHtml: this.state.rootDeBody,
          },
          rootEn: {
            title: this.state.rootEnTitle,
            bodyHtml: this.state.rootEnBody,
          },
        })
        .unwrap();
      this.setState({
        settingsSaving: false,
        settingsSaved: true,
        contentFilter: result.contentFilter?.changed ? result.contentFilter : null,
      });
      this.applyRootPayload(result);
    } catch (err) {
      this.setState({
        settingsSaving: false,
        settingsError: err.message || t('admin.settingsSaveFailed'),
      });
    }
  };

  handleImageReject = (code) => {
    this.setState({ imageError: imageRejectMessage(code) });
  };

  render() {
    const { user, sections, t, i18n } = this.props;
    const {
      title,
      description,
      lang,
      adminOnlyTopics,
      sortOrder,
      editingId,
      error,
      rootDeTitle,
      rootDeBody,
      rootEnTitle,
      rootEnBody,
      siteName,
      settingsError,
      settingsSaved,
      settingsSaving,
      contentFilter,
      imageError,
    } = this.state;

    if (!user) {
      return <Alert severity="info">{t('admin.signIn')}</Alert>;
    }
    if (!user.isAdmin) {
      return <Alert severity="warning">{t('admin.accessRequired')}</Alert>;
    }

    return (
      <Box>
        <DocumentMeta title={t('admin.title')} description={t('admin.blurb')} />
        <Typography component="h1" variant="h4" gutterBottom>
          {t('admin.title')}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {t('admin.blurb')}
        </Typography>

        <Typography component="h2" variant="h6" gutterBottom>
          {t('admin.welcomeTitle')}
        </Typography>
        <Box component="form" onSubmit={this.handleSettingsSave} sx={{ mb: 4 }}>
          {settingsError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {settingsError}
            </Alert>
          )}
          {settingsSaved && (
            <Alert
              severity="success"
              sx={{ mb: 2 }}
              onClose={() => this.setState({ settingsSaved: false })}
            >
              {t('admin.settingsSaved')}
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
          <Stack spacing={3}>
            <TextField
              label={t('admin.siteName')}
              value={siteName}
              onChange={(e) =>
                this.setState({ siteName: e.target.value, settingsSaved: false })
              }
              fullWidth
              slotProps={{ htmlInput: { maxLength: CONTENT_LIMITS.titleMax } }}
            />
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                {t('admin.rootDe')}
              </Typography>
              <TextField
                label={t('admin.fieldTitle')}
                value={rootDeTitle}
                onChange={(e) =>
                  this.setState({ rootDeTitle: e.target.value, settingsSaved: false })
                }
                fullWidth
                sx={{ mb: 1 }}
                slotProps={{ htmlInput: { maxLength: CONTENT_LIMITS.titleMax } }}
              />
              <Box sx={{ bgcolor: 'background.paper' }}>
                <ForumQuillEditor
                  key={`de-${i18n.language}`}
                  value={rootDeBody}
                  onChange={(value) =>
                    this.setState({ rootDeBody: value, settingsSaved: false })
                  }
                  onImageReject={this.handleImageReject}
                />
              </Box>
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                {t('admin.rootEn')}
              </Typography>
              <TextField
                label={t('admin.fieldTitle')}
                value={rootEnTitle}
                onChange={(e) =>
                  this.setState({ rootEnTitle: e.target.value, settingsSaved: false })
                }
                fullWidth
                sx={{ mb: 1 }}
                slotProps={{ htmlInput: { maxLength: CONTENT_LIMITS.titleMax } }}
              />
              <Box sx={{ bgcolor: 'background.paper' }}>
                <ForumQuillEditor
                  key={`en-${i18n.language}`}
                  value={rootEnBody}
                  onChange={(value) =>
                    this.setState({ rootEnBody: value, settingsSaved: false })
                  }
                  onImageReject={this.handleImageReject}
                />
              </Box>
            </Box>
            <Box>
              <Button type="submit" variant="contained" disabled={settingsSaving}>
                {settingsSaving ? t('admin.settingsSaving') : t('admin.saveSettings')}
              </Button>
            </Box>
          </Stack>
        </Box>

        <Divider sx={{ mb: 4 }} />

        <Typography component="h2" variant="h6" gutterBottom>
          {t('admin.sectionsTitle')}
        </Typography>

        <Box component="form" onSubmit={this.handleSubmit} sx={{ mb: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
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

        <List
          disablePadding
          sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}
        >
          {sections.map((section, index) => (
            <ListItem
              key={section.id}
              divider={index < sections.length - 1}
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
          ))}
        </List>
      </Box>
    );
  }
}

const mapStateToProps = (state) => ({
  user: state.auth.user,
  sections: state.sections.items,
  siteName: state.sections.siteName,
  rootDe: state.sections.rootDe,
  rootEn: state.sections.rootEn,
});

const mapDispatchToProps = {
  fetchSections,
  createSection,
  updateSection,
  fetchSettings,
  updateSettings,
};

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(AdminSections));
