import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import Typography from '@mui/material/Typography';

class ProtectedAction extends Component {
  render() {
    const { user, children, message, t } = this.props;
    if (user) return children;
    return (
      <Typography color="text.secondary" sx={{ my: 2 }}>
        {message || t('topic.signInToParticipate')}
      </Typography>
    );
  }
}

export default withTranslation()(ProtectedAction);
