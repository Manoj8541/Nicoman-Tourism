import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaEye, FaEyeSlash, FaLock, FaCheckCircle, FaTimesCircle, FaKey, FaExclamationTriangle
} from 'react-icons/fa';
import { GiIsland } from 'react-icons/gi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

// ─── Spring config ───────────────────────────────────────────────────────────
const spring = { type: 'spring', stiffness: 300, damping: 28 };

// ─── Password strength checker ────────────────────────────────────────────────
const getStrength = (pw) => ({
  minLen: pw.length >= 8,
  hasUpper: /[A-Z]/.test(pw),
  hasNumber: /[0-9]/.test(pw),
  hasSpec: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw),
});

const StrengthBar = ({ password }) => {
  const r = getStrength(password);
  const score = Object.values(r).filter(Boolean).length;
  const levels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colours = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-teal-500'];
  const textCols = ['', 'text-red-500', 'text-orange-400', 'text-yellow-500', 'text-teal-500'];

  if (!password) return null;

  const items = [
    { ok: r.minLen, label: 'At least 8 characters' },
    { ok: r.hasUpper, label: 'One uppercase letter (A-Z)' },
    { ok: r.hasNumber, label: 'One number (0-9)' },
    { ok: r.hasSpec, label: 'One special character (!@#…)' },
  ];

  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center gap-2">
        <div className="flex gap-1 flex-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= score ? colours[score] : 'bg-gray-200 dark:bg-gray-700'
                }`}
            />
          ))}
        </div>
        {score > 0 && (
          <span className={`text-xs font-semibold ${textCols[score]}`}>{levels[score]}</span>
        )}
      </div>
      <ul className="space-y-1">
        {items.map(({ ok, label }) => (
          <li key={label} className="flex items-center gap-2 text-xs">
            {ok
              ? <FaCheckCircle className="text-teal-500 text-[10px] flex-shrink-0" />
              : <FaTimesCircle className="text-gray-300 dark:text-gray-600 text-[10px] flex-shrink-0" />}
            <span className={ok ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-gray-500'}>
              {label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// ─── Password Input Component ────────────────────────────────────────────────
const PasswordInput = ({ id, placeholder, value, onChange, className = '' }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
      <input
        id={id}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
        className={`w-full pl-11 pr-12 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 
          bg-white/60 dark:bg-gray-800/60 text-gray-900 dark:text-white 
          placeholder:text-gray-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 
          outline-none transition-all duration-300 ${className}`}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-500 transition-colors"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        <motion.span
          key={show ? 'eye-open' : 'eye-closed'}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          {show ? <FaEye /> : <FaEyeSlash />}
        </motion.span>
      </button>
    </div>
  );
};

// ─── Main Reset Password Page ────────────────────────────────────────────────
const ResetPassword = () => {
  const navigate = useNavigate();
  const { updatePassword, signOut } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isValidSession, setIsValidSession] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if user arrived with a valid recovery session
    const checkRecovery = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidSession(true);
      } else {
        setIsValidSession(false);
      }
      setCheckingSession(false);
    };

    checkRecovery();

    // Listen to auth events (e.g. PASSWORD_RECOVERY)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setIsValidSession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const strength = getStrength(password);
  const allConditionsMet = Object.values(strength).every(Boolean);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!allConditionsMet) {
      toast.error('Password does not meet all security conditions.');
      return;
    }
    if (!passwordsMatch) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);

    if (error) {
      toast.error(typeof error === 'string' ? error : error?.message || 'Failed to update password');
    } else {
      setSuccess(true);
      toast.success('Password updated successfully! 🔒');
      // Revoke recovery session immediately so link cannot be re-used
      await signOut();
      setIsValidSession(false);
    }
  };

  const handleCancelAndSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-28 relative">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl 
            border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
        >
          {/* Top gradient bar */}
          <div className="h-1.5 bg-gradient-to-r from-teal-500 via-cyan-400 to-blue-500" />

          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="text-3xl text-teal-500"
                >
                  <GiIsland />
                </motion.div>
                <span className="text-xl font-black bg-gradient-to-r from-teal-600 to-cyan-600 
                  dark:from-teal-400 dark:to-cyan-400 bg-clip-text text-transparent">
                  Nicoman Tourism
                </span>
              </Link>
            </div>

            {checkingSession ? (
              <div className="text-center py-10 space-y-3">
                <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  Verifying reset link security...
                </p>
              </div>
            ) : success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4 space-y-4"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-teal-500/30">
                  <FaCheckCircle className="text-white text-3xl" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Password Reset Complete!
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Your password has been updated and your single-use reset link has expired.
                </p>
                <button
                  onClick={() => navigate('/auth')}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white 
                    font-bold text-base shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 transition-all"
                >
                  Proceed to Sign In
                </button>
              </motion.div>
            ) : !isValidSession ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4 space-y-4"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-red-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-red-500/30">
                  <FaExclamationTriangle className="text-white text-3xl" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Link Expired or Invalid
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Password reset links are strictly single-use and automatically expire after being used or timed out.
                </p>
                <button
                  onClick={() => navigate('/auth')}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white 
                    font-bold text-base shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40 transition-all"
                >
                  Request a New Reset Link
                </button>
              </motion.div>
            ) : (
              <div>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-teal-500/30">
                    <FaKey className="text-white text-xl" />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                    Set New Password
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Enter your new secure password below to regain access.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* New Password */}
                  <div className="space-y-2">
                    <PasswordInput
                      id="new-password"
                      placeholder="New password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <StrengthBar password={password} />
                  </div>

                  {/* Confirm New Password */}
                  <div className="relative">
                    <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                      id="confirm-new-password"
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className={`w-full pl-11 pr-12 py-3.5 rounded-xl border-2 transition-all duration-300 outline-none
                        bg-white/60 dark:bg-gray-800/60 text-gray-900 dark:text-white placeholder:text-gray-400
                        focus:ring-2 focus:ring-teal-500/20 ${confirmPassword === ''
                          ? 'border-gray-200 dark:border-gray-600 focus:border-teal-500'
                          : passwordsMatch
                            ? 'border-teal-500 focus:border-teal-500'
                            : 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                        }`}
                    />
                    {confirmPassword && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2">
                        {passwordsMatch
                          ? <FaCheckCircle className="text-teal-500" />
                          : <FaTimesCircle className="text-red-400" />}
                      </span>
                    )}
                    {confirmPassword && !passwordsMatch && (
                      <p className="text-xs text-red-500 mt-1 ml-1">Passwords do not match</p>
                    )}
                  </div>

                  {/* Submit button */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white 
                      font-bold text-base shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40
                      disabled:opacity-60 disabled:cursor-not-allowed transition-shadow duration-300 mt-2"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Updating Password...
                      </span>
                    ) : (
                      'Update Password'
                    )}
                  </motion.button>
                </form>
              </div>
            )}
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400"
        >
          <button
            type="button"
            onClick={handleCancelAndSignOut}
            className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors font-medium"
          >
            ← Cancel & Sign Out
          </button>
        </motion.p>
      </div>
    </div>
  );
};

export default ResetPassword;
