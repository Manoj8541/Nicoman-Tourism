import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaShieldAlt, FaTimes, FaCheckCircle, FaChevronDown } from 'react-icons/fa';

// ─── Privacy Policy text sections ─────────────────────────────────────────────
const SECTIONS = [
  {
    title: '1. 🏝️ About This Website & Imagery Disclaimer',
    body: `This is an independent demonstration website for Nicoman (Andaman & Nicobar Islands) Tourism, built as a showcase project. It is NOT an official government portal. Any bookings, feedback, or queries submitted here are for demonstration purposes only and will NOT result in real travel reservations or commercial transactions.\n\n🖼️ All images displayed across hotels, tourist places, and attractions are illustrative representations (similar and representative, not exact identical property photos). The developers and maintainers are not responsible for any real-world decisions, actions, or consequences arising from the use of this demonstration platform.`,
  },
  {
    title: '2. 🔐 Account Creation & Safe Sign-In Options',
    body: `You can browse the platform freely. If you choose to create an account, we recommend:\n• ⚡ Signing in safely via Google OAuth (one-click, secure authentication)\n• 🛡️ Or using a disposable / temporary email address if you prefer maximum anonymity\n\nWhen signing up with email/password, we only store your provided name and email address. We never sell, monetize, or share your data with any third-party marketing services or travel operators.`,
  },
  {
    title: '3. 🗄️ Data Storage & Zero Analytics',
    body: `• 🔒 Authentication & Storage: Managed securely via Supabase (PostgreSQL) with row-level security and bcrypt password hashing. Passwords are never stored in plain text.\n• 🚫 Zero Analytics: We do NOT use third-party analytics trackers.\n• 🍪 Essential Cookies Only: Minimal session cookies are used strictly to keep your session authenticated and store your dark/light theme preference.`,
  },
  {
    title: '4. 🗑️ Account Deletion & Right to Erasure',
    body: `You have the full right and freedom to delete your account permanently on your own at any time without waiting for admin approval:\n1. 👤 Open your Profile page (via the top navigation menu)\n2. ⚠️ Scroll down to the Danger Zone section\n3. 🔴 Click "Delete Account" and complete the confirmation steps\n\n📦 Upon deletion, your profile is immediately archived in a 30-day grace vault and will be permanently purged.`,
  },
  {
    title: '5. 👑 Public Demo Admin Preview',
    body: `To allow visitors and testers to explore the Admin Dashboard UI, a public Demo Admin account is provided:\n\n• 📧 Email: demoadmin@nicoman.com\n• 🔑 Password: DemoPassword123!\n\n✨ This account offers read-only access to dashboard data and allows testing the Deleted Accounts recovery vault.`,
  },
  {
    title: '6. 💬 Support & Inquiries',
    body: `If you have any questions, encounter any issues, or require account assistance, please contact us directly at:\n\n📧 nicomantourism.myth520@silomails.com\n\n📅 Last Updated: August 2026`,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function PrivacyPolicyModal({ isOpen, onClose, onAccept, viewOnly = false }) {
  const scrollRef = useRef(null);
  const [hasReadAll, setHasReadAll] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);

  // Reset state every time the modal opens
  useEffect(() => {
    if (isOpen) {
      setHasReadAll(false);
      setScrollPercent(0);
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
      }, 50);
    }
  }, [isOpen]);

  // Body scroll lock effect
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prev === 'hidden' ? 'unset' : (prev || 'unset');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleScroll = (e) => {
    const el = e.currentTarget;
    const scrollable = el.scrollHeight - el.clientHeight;
    if (scrollable <= 0) { setHasReadAll(true); return; }
    const pct = Math.round((el.scrollTop / scrollable) * 100);
    setScrollPercent(pct);
    if (el.scrollTop >= scrollable - 40) setHasReadAll(true);
  };

  const handleAccept = () => {
    onAccept?.();
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity cursor-pointer"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal card */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col text-left max-h-[88vh]"
          >
            {/* Gradient top bar */}
            <div className="h-1.5 bg-gradient-to-r from-teal-500 via-cyan-400 to-blue-500 flex-shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0 bg-white dark:bg-gray-900">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30 flex-shrink-0">
                  <FaShieldAlt className="text-white text-sm sm:text-base" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-tight">Privacy Policy</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Nicoman Tourism</p>
                </div>
              </div>
              <button
                onClick={onClose}
                type="button"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex-shrink-0 ml-2 cursor-pointer"
                aria-label="Close"
              >
                <FaTimes size={15} />
              </button>
            </div>

            {/* Mandatory-read progress banner */}
            {!viewOnly && (
              <div className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 border-b flex-shrink-0 transition-colors duration-300 ${hasReadAll
                ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800'
                : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                }`}>
                {hasReadAll
                  ? <FaCheckCircle className="text-teal-500 text-xs flex-shrink-0" />
                  : <FaChevronDown className="text-amber-500 text-xs animate-bounce flex-shrink-0" />}
                <p className={`text-xs font-semibold ${hasReadAll
                  ? 'text-teal-700 dark:text-teal-400'
                  : 'text-amber-700 dark:text-amber-400'
                  }`}>
                  {hasReadAll
                    ? "You've read the full policy — you can now accept."
                    : `Scroll to the bottom to enable the Accept button (${scrollPercent}% read)`}
                </p>
              </div>
            )}

            {/* Scrollable content with min-h-0 */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="overflow-y-auto flex-1 min-h-0 overscroll-contain px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5"
            >
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                By creating an account on this demonstration website, you agree to the following terms regarding how we handle your personal information. Please read this policy carefully before proceeding.
              </p>

              {SECTIONS.map((s, i) => (
                <div key={i}>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white mb-1.5">{s.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">{s.body}</p>
                </div>
              ))}

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
                <p className="text-xs text-gray-400 dark:text-gray-500 italic">End of Privacy Policy</p>
              </div>
            </div>

            {/* Footer action buttons */}
            <div
              className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 px-4 sm:px-6 py-3.5 sm:py-4 border-t border-gray-100 dark:border-gray-800 flex-shrink-0 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm"
              style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
            >
              {/* Decline / Close */}
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs sm:text-sm font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer"
              >
                {viewOnly ? 'Close' : 'Decline'}
              </button>

              {/* Accept */}
              {!viewOnly && (
                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={!hasReadAll}
                  className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 ${hasReadAll
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md hover:shadow-lg active:scale-95 cursor-pointer'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    }`}
                >
                  {hasReadAll && <FaCheckCircle className="text-sm" />}
                  {hasReadAll ? 'I Accept the Privacy Policy' : `Read policy to accept (${scrollPercent}%)`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
