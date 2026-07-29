import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

export default function withRouter(WrappedComponent) {
  function WithRouter(props) {
    const params = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    return (
      <WrappedComponent
        {...props}
        params={params}
        navigate={navigate}
        location={location}
      />
    );
  }
  WithRouter.displayName = `withRouter(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  return WithRouter;
}
