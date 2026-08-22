import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FaEye, FaEyeSlash, FaEnvelope, FaLock, FaUser, FaCheckCircle,
  FaTimesCircle, FaShieldAlt,
} from 'react-icons/fa';
import { GiIsland } from 'react-icons/gi';
import { Turnstile } from '@marsidev/react-turnstile';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import PrivacyPolicyModal from '../components/PrivacyPolicyModal';

// ─── Spring config for the panel slide ───────────────────────────────────────
const spring = { type: 'spring', stiffness: 300, damping: 28 };

// ─── Panel animation variants ─────────────────────────────────────────────────
const panelVariants = {
  enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir < 0 ? 60 : -60, opacity: 0 }),
};

// ─── Password strength checker ────────────────────────────────────────────────
const getStrength = (pw) => ({
  minLen: pw.length >= 8,
  hasUpper: /[A-Z]/.test(pw),
  hasNumber: /[0-9]/.test(pw),
  hasSpec: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw),
});

const StrengthBar = ({ password }) => {
  const r = getStrength(password);
  const score = Object.values(r).filter(Boolean).length; // 0-4
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
      {/* Strength bar */}
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
      {/* Condition checklist */}
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

// ─── Password field with animated eye icon ────────────────────────────────────
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

// ─── Forgot Password form ─────────────────────────────────────────────────────
const ForgotPasswordForm = ({ onBack }) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) {
      toast.error(error);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-6 space-y-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          className="w-20 h-20 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-teal-500/30"
        >
          <FaEnvelope className="text-white text-3xl" />
        </motion.div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Check your inbox!</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
          We've sent a password reset link to{' '}
          <strong className="text-teal-600 dark:text-teal-400">{email}</strong>.
          <br />Click the link in the email to set a new password.
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Didn't receive it? Check your spam folder or try again.
        </p>
        <button
          onClick={onBack}
          className="text-teal-600 dark:text-teal-400 font-semibold hover:underline text-sm"
        >
          ← Back to Sign In
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" id="forgot-form">
      <div className="text-center pb-1">
        <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/30">
          <FaShieldAlt className="text-white text-xl" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Forgot your password?</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          Enter the email linked to your account and we'll send you a secure reset link.
        </p>
      </div>

      {/* Email */}
      <div className="relative">
        <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
        <input
          id="forgot-email"
          type="email"
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full pl-11 pr-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-600
            bg-white/60 dark:bg-gray-800/60 text-gray-900 dark:text-white placeholder:text-gray-400
            focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all duration-300"
        />
      </div>

      <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white 
          font-bold text-base shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40
          disabled:opacity-60 disabled:cursor-not-allowed transition-shadow duration-300"
        id="forgot-submit-btn"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Sending reset link...
          </span>
        ) : (
          'Send Reset Link'
        )}
      </motion.button>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        <button
          type="button"
          onClick={onBack}
          className="text-teal-600 dark:text-teal-400 font-semibold hover:underline"
          id="back-to-login-btn"
        >
          ← Back to Sign In
        </button>
      </p>
    </form>
  );
};

// ─── Google SVG Icon ─────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

const GoogleButton = ({ text = 'Continue with Google', onSuccess }) => {
  const { signInWithGoogle, signInWithGoogleIdToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleIdTokenSuccess = async (idToken) => {
    setLoading(true);
    const { error } = await signInWithGoogleIdToken(idToken);
    setLoading(false);
    if (error) {
      toast.error('Google Sign-In failed: ' + error);
    } else {
      toast.success('🙏 Welcome to Nicoman Tourism!');
      if (onSuccess) onSuccess();
      else navigate('/');
    }
  };

  const handleStandardRedirect = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error('Google Sign-In error: ' + error);
      setLoading(false);
    }
  };

  // If Client ID is present, render Google's native popup with zero supabase.co redirects!
  if (googleClientId) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[44px]">
        <div className="w-full flex justify-center [&>div]:!w-full [&>div>div]:!w-full [&_iframe]:!w-full">
          <GoogleLogin
            onSuccess={(credentialResponse) => {
              if (credentialResponse?.credential) {
                handleIdTokenSuccess(credentialResponse.credential);
              }
            }}
            onError={() => {
              console.warn('Google native login closed or failed, falling back to redirect');
              handleStandardRedirect();
            }}
            theme="filled_blue"
            size="large"
            text={text.toLowerCase().includes('sign in') ? 'signin_with' : 'continue_with'}
            shape="rectangular"
            width="100%"
          />
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleStandardRedirect}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold text-sm shadow-sm hover:bg-gray-50 dark:hover:bg-gray-750 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 active:scale-[0.99] disabled:opacity-60"
      id="google-auth-btn"
    >
      <GoogleIcon />
      <span>{loading ? 'Connecting...' : text}</span>
    </button>
  );
};

const AuthDivider = () => (
  <div className="flex items-center my-3">
    <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
    <span className="px-3 text-[11px] text-gray-400 font-bold uppercase tracking-wider">
      or
    </span>
    <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
  </div>
);

// ─── Login form ───────────────────────────────────────────────────────────────
const LoginForm = ({ onSwitch, onForgot, onSuccess }) => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error(typeof error === 'string' ? error : error?.message || 'Authentication failed');
    } else {
      toast.success('🙏 Welcome back!');
      onSuccess();
    }
  };

  return (
    <div className="space-y-4">
      {/* Google Sign In Button */}
      <GoogleButton text="Sign in with Google" />
      <AuthDivider />

      <form onSubmit={handleSubmit} className="space-y-4" id="login-form">
        {/* Email */}
        <div className="relative">
          <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            id="login-email"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full pl-11 pr-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-600
              bg-white/60 dark:bg-gray-800/60 text-gray-900 dark:text-white placeholder:text-gray-400
              focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all duration-300"
          />
        </div>

      {/* Password */}
      <PasswordInput
        id="login-password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {/* Forgot password link */}
      <div className="flex justify-end -mt-1">
        <button
          type="button"
          onClick={onForgot}
          className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium"
          id="forgot-password-link"
        >
          Forgot password?
        </button>
      </div>

      {/* Submit */}
      <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white 
          font-bold text-base shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40
          disabled:opacity-60 disabled:cursor-not-allowed transition-shadow duration-300"
        id="login-submit-btn"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Signing in...
          </span>
        ) : (
          'Sign In'
        )}
      </motion.button>

      {/* Switch to signup */}
      <p className="text-center text-sm text-gray-500 dark:text-gray-400 pt-2">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={onSwitch}
          className="text-teal-600 dark:text-teal-400 font-semibold hover:underline"
          id="switch-to-signup-btn"
        >
          Create one
        </button>
      </p>
    </form>
  </div>
);
};

// ─── Signup form ──────────────────────────────────────────────────────────────
const SignupForm = ({ onSwitch, onSuccess }) => {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  const strength = getStrength(password);
  const allConditionsMet = Object.values(strength).every(Boolean);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!allConditionsMet) {
      toast.error('Password does not meet all requirements.');
      return;
    }
    if (!passwordsMatch) {
      toast.error('Passwords do not match.');
      return;
    }
    if (!privacyAccepted) {
      toast.error('You must read and accept the Privacy Policy to continue.');
      setShowPrivacyModal(true);
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, fullName, turnstileToken);
    setLoading(false);
    if (error) {
      toast.error(typeof error === 'string' ? error : error?.message || 'Signup failed');
    } else {
      setDone(true);
    }
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-6 space-y-4"
        id="signup-success-panel"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          className="w-20 h-20 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-teal-500/30"
        >
          <FaCheckCircle className="text-white text-3xl" />
        </motion.div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Check your inbox!</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
          We've sent a confirmation link to <strong className="text-teal-600 dark:text-teal-400">{email}</strong>.
          Click it to activate your account, then sign in.
        </p>
        <button
          onClick={onSwitch}
          className="text-teal-600 dark:text-teal-400 font-semibold hover:underline text-sm"
          id="go-to-login-btn"
        >
          Back to Sign In →
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Google Sign Up Button */}
      <GoogleButton text="Sign up with Google" />
      <AuthDivider />

      <form onSubmit={handleSubmit} className="space-y-4" id="signup-form">
        {/* Full name */}
        <div className="relative">
          <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            id="signup-name"
            type="text"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full pl-11 pr-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-600
              bg-white/60 dark:bg-gray-800/60 text-gray-900 dark:text-white placeholder:text-gray-400
              focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all duration-300"
          />
        </div>

        {/* Email */}
        <div className="relative">
          <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            id="signup-email"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full pl-11 pr-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-600
              bg-white/60 dark:bg-gray-800/60 text-gray-900 dark:text-white placeholder:text-gray-400
              focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all duration-300"
          />
        </div>

        {/* Password + strength indicator */}
        <div className="space-y-2">
          <PasswordInput
            id="signup-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <StrengthBar password={password} />
        </div>

        {/* Confirm Password */}
        <div className="relative">
          <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            id="signup-confirm-password"
            type="password"
            placeholder="Confirm password"
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
          {/* Match indicator icon */}
          {confirmPassword && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2">
              {passwordsMatch
                ? <FaCheckCircle className="text-teal-500" />
                : <FaTimesCircle className="text-red-400" />}
            </span>
          )}
          {/* Match message */}
          {confirmPassword && !passwordsMatch && (
            <p className="text-xs text-red-500 mt-1 ml-1">Passwords do not match</p>
          )}
        </div>

        {/* Privacy Policy checkbox */}
        <div className="flex items-start gap-3 py-1">
          <button
            type="button"
            onClick={() => {
              if (!privacyAccepted) {
                // Open modal to force read
                setShowPrivacyModal(true);
              } else {
                setPrivacyAccepted(false);
              }
            }}
            className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all duration-200 ${privacyAccepted
              ? 'bg-teal-500 border-teal-500'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-teal-400'
              }`}
            id="privacy-checkbox"
            aria-label="Accept Privacy Policy"
          >
            {privacyAccepted && <FaCheckCircle className="text-white text-[10px]" />}
          </button>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-snug">
            I have read and agree to the{' '}
            <button
              type="button"
              onClick={() => setShowPrivacyModal(true)}
              className="text-teal-600 dark:text-teal-400 font-semibold hover:underline"
              id="open-privacy-modal-btn"
            >
              Privacy Policy
            </button>
          </p>
        </div>

        {/* Cloudflare Turnstile CAPTCHA */}
        {turnstileSiteKey && (
          <div className="flex justify-center">
            <Turnstile
              siteKey={turnstileSiteKey}
              onSuccess={setTurnstileToken}
              onError={() => setTurnstileToken('')}
              onExpire={() => setTurnstileToken('')}
              options={{ theme: 'auto', size: 'normal' }}
            />
          </div>
        )}

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={loading || (turnstileSiteKey && !turnstileToken)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white 
            font-bold text-base shadow-lg shadow-teal-500/30 hover:shadow-xl hover:shadow-teal-500/40
            disabled:opacity-60 disabled:cursor-not-allowed transition-shadow duration-300"
          id="signup-submit-btn"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Creating account...
            </span>
          ) : (
            'Create Account'
          )}
        </motion.button>

        {/* Switch to login */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 pt-2">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitch}
            className="text-teal-600 dark:text-teal-400 font-semibold hover:underline"
            id="switch-to-login-btn"
          >
            Sign in
          </button>
        </p>
      </form>

      {/* Privacy Policy Modal — only unlocks accept once user has scrolled to bottom */}
      <PrivacyPolicyModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        onAccept={() => {
          setPrivacyAccepted(true);
          setShowPrivacyModal(false);
        }}
      />
    </div>
  );
};

// ─── Main Auth page ───────────────────────────────────────────────────────────
const Auth = () => {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [dir, setDir] = useState(1); // slide direction
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // If already logged in, bounce to home (or wherever they came from)
  const from = location.state?.from?.pathname || '/';
  if (user) {
    navigate(from, { replace: true });
    return null;
  }

  const switchToSignup = () => { setDir(1); setMode('signup'); };
  const switchToLogin = () => { setDir(-1); setMode('login'); };
  const switchToForgot = () => { setDir(1); setMode('forgot'); };
  const onSuccess = () => navigate(from, { replace: true });

  const tabLabel = mode === 'signup' ? 'Create Account' : mode === 'forgot' ? 'Reset Password' : 'Sign In';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-28 sm:pt-32 pb-32 sm:pb-40 relative">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl 
            border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
        >
          {/* Decorative top bar */}
          <div className="h-1.5 bg-gradient-to-r from-teal-500 via-cyan-400 to-blue-500" />

          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center">
            <Link to="/" className="inline-flex items-center gap-2 mb-5 group">
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

            {/* Mode switcher pills — only shown for login/signup */}
            {mode !== 'forgot' && (
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1">
                <button
                  onClick={switchToLogin}
                  className="relative flex-1 py-2 text-sm font-semibold rounded-lg transition-colors z-10"
                  style={{ color: mode === 'login' ? 'white' : undefined }}
                  id="login-tab-btn"
                >
                  {mode === 'login' && (
                    <motion.span
                      layoutId="auth-tab-indicator"
                      className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg -z-10"
                      transition={spring}
                    />
                  )}
                  Sign In
                </button>
                <button
                  onClick={switchToSignup}
                  className="relative flex-1 py-2 text-sm font-semibold rounded-lg transition-colors z-10"
                  style={{ color: mode === 'signup' ? 'white' : undefined }}
                  id="signup-tab-btn"
                >
                  {mode === 'signup' && (
                    <motion.span
                      layoutId="auth-tab-indicator"
                      className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg -z-10"
                      transition={spring}
                    />
                  )}
                  Create Account
                </button>
              </div>
            )}
          </div>

          {/* Animated form area — slides between Login / Signup / Forgot */}
          <div className="px-8 pb-8 overflow-hidden">
            <AnimatePresence mode="wait" custom={dir}>
              {mode === 'login' ? (
                <motion.div
                  key="login"
                  custom={dir}
                  variants={panelVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={spring}
                >
                  <LoginForm onSwitch={switchToSignup} onForgot={switchToForgot} onSuccess={onSuccess} />
                </motion.div>
              ) : mode === 'signup' ? (
                <motion.div
                  key="signup"
                  custom={dir}
                  variants={panelVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={spring}
                >
                  <SignupForm onSwitch={switchToLogin} onSuccess={onSuccess} />
                </motion.div>
              ) : (
                <motion.div
                  key="forgot"
                  custom={dir}
                  variants={panelVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={spring}
                >
                  <ForgotPasswordForm onBack={switchToLogin} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Back home link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400"
        >
          <Link to="/" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
            ← Back to Nicoman Tourism
          </Link>
        </motion.p>
      </div>
    </div>
  );
};

export default Auth;
