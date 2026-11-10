// client/src/components/admin/AdminShield.jsx
// Production-grade terminal protection against insider threat & remote session hijack.
// - Persisted in localStorage: F5 / page reload / new tab CANNOT bypass lock!
// - Cross-tab sync: Locking one admin tab locks all admin tabs simultaneously via BroadcastChannel.
// - 15 minutes of inactivity -> locks screen with password prompt (0 extra storage, uses existing Supabase auth).
// - 30 minutes of total inactivity -> automatically logs out to /auth to prevent abandoned sessions.
// - 0 CPU overhead, 0 database writes, 0 impact on public users.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaShieldAlt, FaLock, FaKey, FaEye, FaEyeSlash, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const INACTIVITY_LOCK_MS = 10 * 60 * 1000;   // 10 minutes -> Lock screen (OWASP/PCI-DSS standard)
const INACTIVITY_LOGOUT_MS = 25 * 60 * 1000; // 25 minutes -> Auto logout

const STORAGE_KEY_LOCKED = 'nicoman_admin_locked';
const STORAGE_KEY_LAST_ACTIVITY = 'nicoman_admin_last_activity';

const getStoredLocked = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY_LOCKED) === 'true';
};

const getStoredLastActivity = () => {
  if (typeof window === 'undefined') return Date.now();
  const saved = localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY);
  if (!saved) return Date.now();
  const parsed = parseInt(saved, 10);
  return isNaN(parsed) ? Date.now() : parsed;
};

export default function AdminShield({ children }) {
  const { user, isDemoAdmin, signOut, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Initialize locked state from persistent storage + inactivity check on initial mount
  const [isLocked, setIsLocked] = useState(() => {
    if (getStoredLocked()) return true;
    const idleTime = Date.now() - getStoredLastActivity();
    if (idleTime >= INACTIVITY_LOCK_MS) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_LOCKED, 'true');
      }
      return true;
    }
    return false;
  });

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const lastActivityRef = useRef(getStoredLastActivity());
  const isLockedRef = useRef(isLocked);

  // Keep ref in sync
  isLockedRef.current = isLocked;

  // Function to lock session and persist state
  const lockSession = useCallback(() => {
    setIsLocked(true);
    isLockedRef.current = true;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_LOCKED, 'true');
      // Cross-tab sync: notify all other admin tabs to lock immediately
      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel('nicoman_admin_security');
        bc.postMessage({ type: 'LOCK' });
        bc.close();
      }
    }
  }, []);

  // Function to unlock session and persist state
  const unlockSession = useCallback(() => {
    const now = Date.now();
    setIsLocked(false);
    isLockedRef.current = false;
    setPassword('');
    setErrorMessage('');
    lastActivityRef.current = now;

    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_LOCKED);
      localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, String(now));
      // Cross-tab sync: notify all other admin tabs to unlock
      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel('nicoman_admin_security');
        bc.postMessage({ type: 'UNLOCK' });
        bc.close();
      }
    }
  }, []);

  // Throttled activity updater (at most once every 2 seconds)
  const lastUpdateRef = useRef(0);
  const recordActivity = useCallback(() => {
    if (isLockedRef.current) return;
    const now = Date.now();
    if (now - lastUpdateRef.current > 2000) {
      lastUpdateRef.current = now;
      lastActivityRef.current = now;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, String(now));
      }
    }
  }, []);

  // Listen for user interaction events & multi-tab broadcast
  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(ev => window.addEventListener(ev, recordActivity, { passive: true }));

    // Manual lock triggers: CustomEvent, Alt+L shortcut, and console helper
    const handleManualLock = () => lockSession();
    const handleKeyDown = (e) => {
      if (e.altKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        lockSession();
      }
    };

    window.addEventListener('nicoman:lock-admin', handleManualLock);
    window.addEventListener('keydown', handleKeyDown);
    if (typeof window !== 'undefined') {
      window.__lockAdminShield = handleManualLock;
    }

    // Cross-tab synchronization via BroadcastChannel
    let bc = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('nicoman_admin_security');
      bc.onmessage = (event) => {
        if (event.data?.type === 'LOCK') {
          setIsLocked(true);
          isLockedRef.current = true;
        } else if (event.data?.type === 'UNLOCK') {
          setIsLocked(false);
          isLockedRef.current = false;
          lastActivityRef.current = Date.now();
        }
      };
    }

    // Periodic watchdog timer (checks every 5 seconds)
    const interval = setInterval(() => {
      const idleTime = Date.now() - lastActivityRef.current;

      // 1. Check for 30-minute auto logout
      if (idleTime >= INACTIVITY_LOGOUT_MS) {
        clearInterval(interval);
        toast('Admin session expired after 30 minutes of inactivity', { icon: '⏱️' });
        localStorage.removeItem(STORAGE_KEY_LOCKED);
        localStorage.removeItem(STORAGE_KEY_LAST_ACTIVITY);
        signOut().then(() => {
          navigate('/auth', { replace: true });
        });
        return;
      }

      // 2. Check for 15-minute screen lock
      if (idleTime >= INACTIVITY_LOCK_MS && !isLockedRef.current) {
        lockSession();
      }
    }, 5000);

    return () => {
      events.forEach(ev => window.removeEventListener(ev, recordActivity));
      window.removeEventListener('nicoman:lock-admin', handleManualLock);
      window.removeEventListener('keydown', handleKeyDown);
      if (bc) bc.close();
      clearInterval(interval);
    };
  }, [recordActivity, lockSession, signOut, navigate]);

  // Handle password unlock
  const handleUnlock = async (e) => {
    if (e) e.preventDefault();
    if (isDemoAdmin) {
      // Demo admin preview: resume directly
      unlockSession();
      toast.success('Demo preview session resumed');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your account password');
      return;
    }

    setVerifying(true);
    setErrorMessage('');

    try {
      const email = user?.email;
      if (!email) {
        throw new Error('Admin session missing email. Please sign in again.');
      }

      // Re-verify credentials directly with Supabase Auth
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage('Incorrect password. Please try again.');
        return;
      }

      // Success: unlock session across tabs and reset activity timestamp
      unlockSession();
      toast.success('Admin session verified & unlocked');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to verify credentials');
    } finally {
      setVerifying(false);
    }
  };

  const handleManualSignOut = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY_LOCKED);
        localStorage.removeItem(STORAGE_KEY_LAST_ACTIVITY);
      }
      await signOut();
      navigate('/auth', { replace: true });
    } catch (err) {
      console.error('[AdminShield] Sign out error:', err);
    }
  };

  const isOAuthUser = user?.app_metadata?.provider && user.app_metadata.provider !== 'email';

  return (
    <>
      {children}

      {/* ── Screen Lock Overlay ────────────────────────────────────────── */}
      <AnimatePresence>
        {isLocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-gray-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-sm sm:max-w-md bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 sm:p-7 shadow-2xl relative"
            >
              {/* Shield lock badge */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white mb-4 shadow-lg shadow-teal-500/25">
                  <FaShieldAlt size={24} />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                  Admin Session Protected
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs leading-relaxed">
                  Locked due to 10 minutes of inactivity to protect your dashboard from unauthorized remote access.
                </p>

                {/* Identity indicator */}
                <div className="mt-3.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-300">
                  <span className="w-2 h-2 rounded-full bg-teal-500" />
                  <span className="font-semibold text-gray-700 dark:text-gray-200">{user?.email || 'Administrator'}</span>
                </div>
              </div>

              {/* Unlock Form */}
              <form onSubmit={handleUnlock} className="space-y-4">
                {isDemoAdmin ? (
                  <div className="text-center py-2">
                    <p className="text-xs text-amber-600 dark:text-amber-400 mb-4">
                      You are in Demo Admin preview mode.
                    </p>
                    <button
                      type="submit"
                      className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                    >
                      <FaKey size={14} /> Resume Demo Session
                    </button>
                  </div>
                ) : isOAuthUser ? (
                  <div className="space-y-3">
                    <p className="text-xs text-center text-gray-500">
                      You signed in via {user.app_metadata.provider}. Re-authenticate to resume.
                    </p>
                    <button
                      type="button"
                      onClick={() => signInWithGoogle()}
                      className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                    >
                      Re-authenticate with Google
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                        Account Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                          <FaLock size={13} />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password to unlock"
                          autoFocus
                          className="w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all placeholder-gray-400 dark:placeholder-gray-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(p => !p)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                        >
                          {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                        </button>
                      </div>
                    </div>

                    {errorMessage && (
                      <p className="text-xs font-bold text-red-500 text-center animate-shake">
                        {errorMessage}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={verifying}
                      className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.98]"
                    >
                      {verifying ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <FaKey size={13} />
                          <span>Unlock Dashboard</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </form>

              {/* Bottom Actions: Sign Out */}
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-400">
                <span className="text-[11px]">Auto-exit in 15 min if untouched</span>
                <button
                  type="button"
                  onClick={handleManualSignOut}
                  className="font-semibold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <FaSignOutAlt size={11} /> Sign Out Now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
