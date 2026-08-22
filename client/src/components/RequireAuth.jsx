// client/src/components/RequireAuth.jsx
// Route guard — redirects to /auth if the user is not signed in.
// Pass `redirectMessage` to show a toast after redirect (e.g. "Sign in to book").

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RequireAuth = ({ children, redirectMessage }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show nothing while the session is still being loaded
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    // Pass current location as state so Auth page can redirect back after login
    return (
      <Navigate
        to="/auth"
        state={{ from: location, message: redirectMessage }}
        replace
      />
    );
  }

  return children;
};

export default RequireAuth;
