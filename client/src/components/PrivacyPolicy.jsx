import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import DocumentMeta from './DocumentMeta.jsx';

class PrivacyPolicy extends Component {
  render() {
    const { t } = this.props;
    return (
      <Box>
        <DocumentMeta title={t('privacy.title')} description={t('privacy.intro')} />
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link component={RouterLink} to="/" underline="hover" color="inherit">
            {t('nav.forums')}
          </Link>
          <Typography color="text.primary">{t('privacy.title')}</Typography>
        </Breadcrumbs>

        <Typography component="h1" variant="h3" gutterBottom>
          {t('privacy.title')}
        </Typography>

        <Typography paragraph>{t('privacy.intro')}</Typography>

        <Typography component="h2" variant="h5" gutterBottom sx={{ mt: 3 }}>
          {t('privacy.publicTitle')}
        </Typography>
        <Typography paragraph>{t('privacy.publicBody')}</Typography>

        <Typography component="h2" variant="h5" gutterBottom sx={{ mt: 3 }}>
          {t('privacy.googleTitle')}
        </Typography>
        <Typography paragraph>{t('privacy.googleBody1')}</Typography>
        <Typography paragraph>
          {t('privacy.googleBody2Before')}{' '}
          <Link
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('privacy.googlePrivacyLink')}
          </Link>
          {t('privacy.googleBody2After')}
        </Typography>

        <Typography component="h2" variant="h5" gutterBottom sx={{ mt: 3 }}>
          {t('privacy.storeTitle')}
        </Typography>
        <Typography component="div" paragraph>
          {t('privacy.storeIntro')}
          <Box component="ul" sx={{ mt: 1, pl: 3 }}>
            <li>{t('privacy.storeItem1')}</li>
            <li>{t('privacy.storeItem2')}</li>
            <li>{t('privacy.storeItem3')}</li>
            <li>{t('privacy.storeItem4')}</li>
          </Box>
        </Typography>

        <Typography component="h2" variant="h5" gutterBottom sx={{ mt: 3 }}>
          {t('privacy.cookiesTitle')}
        </Typography>
        <Typography paragraph>{t('privacy.cookiesBody')}</Typography>

        <Typography component="h2" variant="h5" gutterBottom sx={{ mt: 3 }}>
          {t('privacy.retentionTitle')}
        </Typography>
        <Typography paragraph>{t('privacy.retentionBody')}</Typography>

        <Typography component="h2" variant="h5" gutterBottom sx={{ mt: 3 }}>
          {t('privacy.contactTitle')}
        </Typography>
        <Typography paragraph>
          {t('privacy.contactBody')}{' '}
          <Link href="mailto:quixpos@gmail.com">quixpos@gmail.com</Link>
        </Typography>
      </Box>
    );
  }
}

export default withTranslation()(PrivacyPolicy);
