import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBars, FaTimes, FaSun, FaMoon, FaDesktop, FaUser, FaSignOutAlt, FaCog, FaTicketAlt } from 'react-icons/fa';
import { GiIsland } from 'react-icons/gi';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, profile, isAdmin, signOut, loading } = useAuth();
  const location = useLocation();
  const userMenuRef = useRef(null);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/tourist-places', label: 'Places' },
    { to: '/hotels', label: 'Hotels' },
    { to: '/ferries', label: 'Ferries' },
    { to: '/feedback', label: 'Feedback' },
    { to: '/contact', label: 'Contact' },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setUserMenuOpen(false);
  }, [location]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const cycleTheme = () => {
    const themes = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    setTheme(themes[(currentIndex + 1) % themes.length]);
  };

  const getThemeIcon = () => {
    if (theme === 'dark') return <FaMoon className="text-blue-400" />;
    if (theme === 'light') return <FaSun className="text-yellow-500" />;
    return <FaDesktop className="text-gray-500" />;
  };

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    await signOut();
    toast.success('Signed out successfully');
  };

  // Get initials for avatar
  const getInitials = () => {
    const name = profile?.full_name || user?.email || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[700] transition-all duration-300 ${scrolled
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl'
          : 'bg-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <motion.div
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl text-teal-500"
            >
              <GiIsland />
            </motion.div>
            <div>
              <span className="text-xl md:text-2xl font-black bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-400 dark:to-cyan-400 bg-clip-text text-transparent">
                Nicoman
              </span>
              <span className="block text-xs text-gray-500 dark:text-gray-400 tracking-[0.2em] font-medium">
                TOURISM
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${location.pathname === link.to
                    ? 'text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400'
                  }`}
              >
                {location.pathname === link.to && (
                  <motion.span
                    layoutId="navbar-indicator"
                    className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side: theme toggle + auth */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              onClick={cycleTheme}
              className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title={`Theme: ${theme}`}
              id="theme-toggle-btn"
            >
              {getThemeIcon()}
            </motion.button>

            {/* Auth button / User avatar */}
            {!loading && (
              <>
                {user ? (
                  /* User avatar dropdown */
                  <div className="relative hidden lg:block" ref={userMenuRef}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold text-sm shadow-md hover:shadow-lg hover:shadow-teal-500/30 transition-shadow"
                      id="user-avatar-btn"
                    >
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="Avatar"
                          className="w-7 h-7 rounded-full object-cover ring-2 ring-white/40 flex-shrink-0 bg-teal-600"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <span className="w-7 h-7 bg-white/25 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {getInitials()}
                        </span>
                      )}
                      <span className="max-w-[100px] truncate">
                        {profile?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
                      </span>
                    </motion.button>

                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden z-50"
                          id="user-dropdown-menu"
                        >
                          <div className="p-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
                            {profile?.avatar_url ? (
                              <img
                                src={profile.avatar_url}
                                alt="Avatar"
                                className="w-10 h-10 rounded-xl object-cover ring-2 ring-teal-500/30 flex-shrink-0 bg-teal-600"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {getInitials()}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                {profile?.full_name || 'Traveller'}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                            </div>
                          </div>
                          <div className="p-2 space-y-1">
                            <Link to="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-600 dark:hover:text-teal-400 transition-colors" id="profile-link">
                              <FaUser className="text-xs" /> My Profile
                            </Link>
                            <Link to="/bookings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-600 dark:hover:text-teal-400 transition-colors" id="bookings-dropdown-link">
                              <FaTicketAlt className="text-xs text-teal-500" /> My Bookings
                            </Link>
                            {isAdmin && (
                              <Link to="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors" id="admin-link">
                                <FaCog className="text-xs" /> Admin Dashboard
                              </Link>
                            )}
                            <hr className="border-gray-100 dark:border-gray-800 my-1" />
                            <button
                              onClick={handleSignOut}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              id="sign-out-btn"
                            >
                              <FaSignOutAlt className="text-xs" /> Sign Out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  /* Login button */
                  <Link
                    to="/auth"
                    className="hidden lg:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold text-sm shadow-md hover:shadow-lg hover:shadow-teal-500/30 transition-all duration-300 hover:-translate-y-0.5"
                    id="login-nav-btn"
                  >
                    Sign In
                  </Link>
                )}
              </>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              id="mobile-menu-toggle"
            >
              {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:hidden bg-white dark:bg-gray-900 border-t dark:border-gray-800 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-2 max-h-[70vh] overflow-y-auto">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={link.to}
                    className={`block px-4 py-3 rounded-xl text-base font-semibold transition-all ${location.pathname === link.to
                        ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              {/* Mobile auth section */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                {user ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 px-4 py-2">
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt="Avatar"
                          className="w-10 h-10 rounded-xl object-cover ring-2 ring-teal-500/30 flex-shrink-0 bg-teal-600"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {getInitials()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                          {profile?.full_name || 'Traveller'}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                    </div>
                    <Link to="/profile" className="block px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                      My Profile
                    </Link>
                    <Link to="/bookings" className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20">
                      <FaTicketAlt size={13} /> My Bookings &amp; Tickets
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" className="block px-4 py-3 rounded-xl text-sm font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20">
                        Admin Dashboard
                      </Link>
                    )}
                    <button onClick={handleSignOut} className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/auth"
                    className="block px-4 py-3 rounded-xl text-base font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-center shadow-lg"
                  >
                    Sign In / Create Account
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default NavBar;

