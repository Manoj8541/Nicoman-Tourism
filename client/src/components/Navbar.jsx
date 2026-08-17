import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBars, FaTimes, FaSun, FaMoon, FaDesktop } from 'react-icons/fa';
import { GiIsland } from 'react-icons/gi';
import { useTheme } from '../context/ThemeContext';

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/tourist-places', label: 'Places' },
    { to: '/hotels', label: 'Hotels' },
    { to: '/ship-schedule', label: 'Ships' },
    { to: '/route-map', label: 'Routes' },
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
  }, [location]);

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

  return (
    <nav
      className={`fixed top-8 md:top-10 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
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
                Andaman
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
                className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  location.pathname === link.to
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

          {/* Theme Toggle & Mobile Menu */}
          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              onClick={cycleTheme}
              className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title={`Theme: ${theme}`}
            >
              {getThemeIcon()}
            </motion.button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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
                    className={`block px-4 py-3 rounded-xl text-base font-semibold transition-all ${
                      location.pathname === link.to
                        ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default NavBar;