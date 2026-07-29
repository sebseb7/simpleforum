import React, { Component } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Breadcrumbs from '@mui/material/Breadcrumbs';

class PrivacyPolicy extends Component {
  render() {
    return (
      <Box>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link component={RouterLink} to="/" underline="hover" color="inherit">
            Forums
          </Link>
          <Typography color="text.primary">Privacy Policy</Typography>
        </Breadcrumbs>

        <Typography variant="h3" gutterBottom>
          Privacy Policy
        </Typography>

        <Typography paragraph>
          QuixPOS public discussion board. This page explains what information we handle when you
          browse or sign in.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
          Public content
        </Typography>
        <Typography paragraph>
          Sections, topics, and posts are public. Anyone can read them without an account,
          including via direct links. Do not post personal data, secrets, or anything you are
          not comfortable sharing publicly. Starred items are tied to your account and are only
          shown to you when signed in, but the underlying topics and posts remain public.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
          Google Sign-In
        </Typography>
        <Typography paragraph>
          The only way to sign in is Google Sign-In (Google Identity / OAuth). We do not offer
          passwords, email magic links, or other login methods. When you sign in, Google shares
          with us a verified identity token for your Google account. We use that token solely to
          authenticate you and create or update your forum profile.
        </Typography>
        <Typography paragraph>
          From Google we receive limited profile information typically including your Google
          account ID, email address, display name, and profile picture URL. We do not receive
          your Google password. Google’s own practices are described in the{' '}
          <Link
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Privacy Policy
          </Link>
          .
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
          What we store
        </Typography>
        <Typography component="div" paragraph>
          On our servers we store:
          <Box component="ul" sx={{ mt: 1, pl: 3 }}>
            <li>Your Google account subject ID, email, name, and picture URL</li>
            <li>Topics and posts you create (current title and body only; edits replace the
              previous text)</li>
            <li>Which topics and posts you have starred</li>
            <li>
              A session token issued after Google Sign-In, kept on your device so you stay signed
              in
            </li>
          </Box>
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
          Cookies
        </Typography>
        <Typography paragraph>
          After Google Sign-In we store a token on your device.
          That token identifies your session to our API. Clearing site data or using Log out
          removes it. We do not use third-party advertising cookies.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
          Data retention and your choices
        </Typography>
        <Typography paragraph>
          Public posts remain until you delete them (or until a topic author deletes the whole
          topic). You can edit or delete your own topics and posts while signed in. You can log
          out at any time. You can permanently delete your account from the menu next to your
          name; that removes your profile along with your topics, posts, and stars.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
          Contact
        </Typography>
        <Typography paragraph>
          Questions about this policy or your data:{' '}
          <Link href="mailto:quixpos@gmail.com">quixpos@gmail.com</Link>
        </Typography>
      </Box>
    );
  }
}

export default PrivacyPolicy;
