import React, { Component } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { loginWithGoogle } from '../store/authSlice.js';

class LoginButton extends Component {
  handleSuccess = (response) => {
    if (response.credential) {
      this.props.loginWithGoogle(response.credential);
    }
  };

  render() {
    const { t, error } = this.props;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      return (
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', maxWidth: 180 }}>
          {t('login.missingClientId')}
        </Typography>
      );
    }
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {error && (
          <Alert severity="error" sx={{ py: 0 }}>
            {error}
          </Alert>
        )}
        <GoogleLogin
          onSuccess={this.handleSuccess}
          onError={() => {}}
          useOneTap={false}
          theme="filled_blue"
          size="medium"
          text="signin_with"
          shape="rectangular"
          type="standard"
        />
      </Box>
    );
  }
}

const mapStateToProps = (state) => ({
  error: state.auth.error,
});

const mapDispatchToProps = { loginWithGoogle };

export default withTranslation()(connect(mapStateToProps, mapDispatchToProps)(LoginButton));
