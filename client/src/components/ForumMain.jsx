import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
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
import DocumentMeta from './DocumentMeta.jsx';

function uiLang(i18n) {
  return (i18n.language || 'en').startsWith('de') ? 'de' : 'en';
}

class ForumMain extends Component {
  componentDidMount() {
    this.load();
  }

  componentDidUpdate(prevProps) {
    if (uiLang(prevProps.i18n) !== uiLang(this.props.i18n)) {
      this.load();
    }
  }

  load = () => {
    this.props.fetchSections({ lang: uiLang(this.props.i18n) });
  };

  render() {
    const { sections, status, error, t } = this.props;

    return (
      <Box>
        <DocumentMeta title={t('home.welcome')} description={t('home.blurb')} />
        <Typography variant="h3" gutterBottom>
          {t('home.welcome')}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 520 }}>
          {t('home.blurb')}
        </Typography>

        {error && <Alert severity="error">{error}</Alert>}

        <List disablePadding sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          {sections.map((section, index) => (
            <React.Fragment key={section.id}>
              {index > 0 && <Divider />}
              <ListItemButton
                component={RouterLink}
                to={`/section/${section.slug}`}
                sx={{ py: 2, alignItems: 'flex-start' }}
              >
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Typography variant="h6">{section.title}</Typography>
                      {section.adminOnlyTopics && (
                        <Chip size="small" label={t('home.adminTopics')} variant="outlined" />
                      )}
                    </Stack>
                  }
                  secondary={
                    <>
                      {section.description}
                      <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                        {t('home.topicCount', { count: section.topicCount })}
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
              <Typography color="text.secondary">{t('home.noSections')}</Typography>
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

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(ForumMain));
