import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';

class SiteFooter extends Component {
  render() {
    const { t } = this.props;
    return (
      <Box
        component="footer"
        sx={{
          mt: 'auto',
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'rgba(27, 77, 62, 0.06)',
          py: 2.5,
        }}
      >
        <Container maxWidth="md">
          <Stack
            direction="row"
            spacing={1}
            sx={{ justifyContent: 'flex-end', alignItems: 'center' }}
          >
            <Link
              component={RouterLink}
              to="/privacy"
              underline="hover"
              color="text.secondary"
              variant="body2"
            >
              {t('footer.privacy')}
            </Link>
          </Stack>
        </Container>
      </Box>
    );
  }
}

export default withTranslation()(SiteFooter);
