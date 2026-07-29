import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { fetchSections } from '../store/sectionsSlice.js';
import DocumentMeta from './DocumentMeta.jsx';
import { normalizeLang } from '../i18n/index.js';

function uiLang(i18n) {
  return normalizeLang(i18n.language);
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
        <DocumentMeta description={t('home.blurb')} />
        <Typography component="h1" variant="h3" gutterBottom>
          {t('home.welcome')}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 520 }}>
          {t('home.blurb')}
        </Typography>

        {error && <Alert severity="error">{error}</Alert>}

        <List disablePadding sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
          {sections.map((section, index) => (
            <ListItem
              key={section.id}
              disablePadding
              divider={index < sections.length - 1}
            >
              <ListItemButton
                component={RouterLink}
                to={`/section/${section.slug}`}
                sx={{ py: 2, alignItems: 'flex-start' }}
              >
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Typography component="h2" variant="h6">{section.title}</Typography>
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
            </ListItem>
          ))}
          {status === 'succeeded' && sections.length === 0 && (
            <ListItem sx={{ py: 3 }}>
              <ListItemText
                primary={t('home.noSections')}
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
  sections: state.sections.items,
  status: state.sections.status,
  error: state.sections.error,
});

const mapDispatchToProps = { fetchSections };

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(ForumMain));
