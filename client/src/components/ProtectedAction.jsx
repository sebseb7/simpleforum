import React, { Component } from 'react';
import Typography from '@mui/material/Typography';

class ProtectedAction extends Component {
  render() {
    const { user, children, message } = this.props;
    if (user) return children;
    return (
      <Typography color="text.secondary" sx={{ my: 2 }}>
        {message || 'Sign in to participate.'}
      </Typography>
    );
  }
}

export default ProtectedAction;
