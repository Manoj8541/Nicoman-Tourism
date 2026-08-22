import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatBot from './components/ChatBot';
import AlertBanner from './components/AlertBanner';
import Home from './pages/Home';
import TouristPlaces from './pages/TouristPlaces';
import Hotels from './pages/Hotels';
import Ferries from './pages/Ferries';
import Feedback from './pages/Feedback';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import ServerError from './pages/ServerError';
import Auth from './pages/Auth';
import AuthCallback from './pages/AuthCallback';
import ResetPassword from './pages/ResetPassword';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import RequireAuth from './components/RequireAuth';
import RequireRole from './components/RequireRole';
import { GiIsland } from 'react-icons/gi';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';

// ─── Scroll to top on every route change ──────────────────────────────────────
// React Router does NOT reset scroll position between navigations.
// Without this, Auth page's pt-32 offset carries over and appears as a blank gap.
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

// Lazy-loaded pages (only fetched when the route is visited)
const Profile = lazy(() => import('./pages/Profile'));
const Bookings = lazy(() => import('./pages/Bookings'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// ─── Branded splash shown while Supabase resolves the initial session ──────────
// Prevents the blank-body flash that occurs because auth state is async on mount.
const AuthSplash = () => (
  <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-5
    bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
      className="text-6xl text-teal-500"
    >
      <GiIsland />
    </motion.div>
    <div className="flex flex-col items-center gap-1">
      <span className="text-xl font-black bg-gradient-to-r from-teal-600 to-cyan-600
        dark:from-teal-400 dark:to-cyan-400 bg-clip-text text-transparent">
        Nicoman Tourism
      </span>
      <span className="text-xs text-gray-400 dark:text-gray-500 tracking-widest uppercase">
        Loading…
      </span>
    </div>
  </div>
);

// ─── Fallback while lazy-loaded page chunks download ─────────────────────────
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

// ─── Route renderer ───────────────────────────────────────────────────────────
// No AnimatePresence wrapper — third-party components (Turnstile CAPTCHA, nested modals) block exit animations and cause blank-body bugs.
function AppRoutes() {
  const location = useLocation();
  return (
    <Routes location={location}>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/tourist-places" element={<TouristPlaces />} />
      <Route path="/hotels" element={<Hotels />} />
      <Route path="/ferries" element={<Ferries />} />
      {/* Redirect old individual URLs so bookmarks still resolve */}
      <Route path="/ship-schedule" element={<Navigate to="/ferries" replace />} />
      <Route path="/route-map" element={<Navigate to="/ferries" replace />} />
      <Route path="/feedback" element={<Feedback />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/500" element={<ServerError />} />

      {/* Auth-protected routes */}
      <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
      <Route path="/bookings" element={<RequireAuth><Bookings /></RequireAuth>} />

      {/* Admin, Superadmin & Demo Admin route */}
      <Route path="/admin" element={<RequireRole role={['admin', 'superadmin', 'demo_admin']}><AdminDashboard /></RequireRole>} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

// ─── Inner app — has access to AuthContext ────────────────────────────────────
function AppInner() {
  const { loading } = useAuth();
  const location = useLocation();
  const isResetPasswordPage = location.pathname === '/reset-password';

  // While Supabase resolves the stored session, show the branded splash.
  // This blocks the blank-body flash that happens because auth state is async.
  if (loading) return <AuthSplash />;

  if (isResetPasswordPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
        <Suspense fallback={<PageLoader />}>
          <AppRoutes />
        </Suspense>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { borderRadius: '12px', fontWeight: '600' },
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <Navbar />
      <AlertBanner />

      <Suspense fallback={<PageLoader />}>
        <AppRoutes />
      </Suspense>

      <Footer />
      <ChatBot />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { borderRadius: '12px', fontWeight: '600' },
        }}
      />
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <AppInner />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;