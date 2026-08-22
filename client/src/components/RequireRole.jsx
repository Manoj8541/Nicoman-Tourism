// client/src/components/RequireRole.jsx
// Role-gated route guard.
// - If not logged in → redirects to /auth (delegates to RequireAuth behavior)
// - If logged in but wrong role → shows an animated 401 access-denied screen (does NOT redirect)
//
// Security note: This component only controls *what is rendered*. The actual
// permission boundary is enforced independently by Postgres RLS policies in
// Supabase — no amount of client-side tampering can bypass the database rules.

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaLock } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ─── Animated 401 screen ──────────────────────────────────────────────────────
const AccessDenied = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-32">
      <div className="text-center max-w-md">
        {/* Animated lock icon with spring pop + radar pulse */}
        <div className="relative inline-flex items-center justify-center mb-8">
          {/* Radar rings */}
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border-2 border-teal-500/30"
              animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.5,
                ease: 'easeOut',
              }}
              style={{ width: 80, height: 80 }}
            />
          ))}

          {/* Lock icon with spring pop */}
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
            className="relative z-10 w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 
              rounded-2xl flex items-center justify-center shadow-xl shadow-amber-500/30"
            id="access-denied-lock-icon"
          >
            <motion.div
              animate={{
                // Unlock → relock spring pop cycle every 4 seconds
                rotate: [0, -25, 0],
                y: [0, -5, 0],
              }}
              transition={{
                duration: 0.8,
                delay: 1,
                repeat: Infinity,
                repeatDelay: 4,
                type: 'spring',
                stiffness: 300,
                damping: 15,
              }}
            >
              <FaLock className="text-white text-3xl" />
            </motion.div>
          </motion.div>
        </div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="text-5xl font-black text-gray-900 dark:text-white mb-2">401</h1>
          <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-4">
            Access Restricted
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
            You need administrator privileges to view this page.
            If you believe this is an error, contact the site administrator.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold 
                rounded-xl shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 
                transition-all duration-300 hover:-translate-y-0.5"
              id="go-home-from-401-btn"
            >
              Go Home
            </Link>
            <Link
              to="/auth"
              className="px-6 py-3 bg-white dark:bg-gray-800 text-teal-600 dark:text-teal-400 
                font-bold rounded-xl border-2 border-teal-500 hover:bg-teal-50 dark:hover:bg-gray-700
                transition-all duration-300 hover:-translate-y-0.5"
              id="sign-in-from-401-btn"
            >
              Sign in with different account
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// ─── RequireRole wrapper ──────────────────────────────────────────────────────
const RequireRole = ({ children, role = 'admin' }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // role can be a string ('admin') or array (['admin','superadmin'])
  const allowedRoles = Array.isArray(role) ? role : [role];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in at all → send to auth
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Logged in but wrong role → show 401 screen (not a redirect)
  if (!allowedRoles.includes(profile?.role)) {
    return <AccessDenied />;
  }

  return children;
};

export default RequireRole;
