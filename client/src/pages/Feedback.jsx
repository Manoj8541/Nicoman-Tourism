// client/src/pages/Feedback.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStar, FaPaperPlane, FaQuoteLeft, FaLock, FaTrash, FaUser, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { loadSentimentPipeline, classifySentiment } from '../lib/aiModels';

// SVG spinner — no emoji
const Spinner = ({ className = 'w-4 h-4 text-white' }) => (
  <svg className={`animate-spin flex-shrink-0 ${className}`} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);

// Fallback avatar with initial or user icon
const Avatar = ({ src, name }) => {
  const [imgError, setImgError] = useState(false);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name || 'User'}
        onError={() => setImgError(true)}
        className="w-12 h-12 rounded-full object-cover border-2 border-teal-500/20 shadow-sm flex-shrink-0"
      />
    );
  }

  const initial = (name || '').trim().charAt(0).toUpperCase();

  return (
    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 text-white font-black text-lg flex items-center justify-center shadow-sm flex-shrink-0 select-none">
      {initial || <FaUser size={16} />}
    </div>
  );
};

const Feedback = () => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const modelPreloaded = useRef(false);
  const { user, session, profile } = useAuth();

  // ── Fetch dynamic feedback from Supabase ────────────────────────────────────
  const fetchFeedbacks = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/feedback');
      if (Array.isArray(data)) {
        setFeedbacks(data);
      }
    } catch (err) {
      console.error('[Feedback] fetch error:', err);
    } finally {
      setLoadingFeedbacks(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  // Pre-fill name/email when user logs in
  useEffect(() => {
    if (user && profile) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || profile.full_name || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [user, profile]);

  // Pre-warm the sentiment model silently when user is logged in
  useEffect(() => {
    if (user && !modelPreloaded.current) {
      modelPreloaded.current = true;
      loadSentimentPipeline().catch(() => { });
    }
  }, [user]);

  // ── Submit Feedback ────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please provide a rating');
      return;
    }
    setIsSubmitting(true);

    // 1. Silent sentiment classification
    let sentiment = null;
    try {
      sentiment = await classifySentiment(formData.message);
    } catch {
      sentiment = null;
    }

    // Avatar from profile or OAuth metadata
    const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || null;

    // 2. Submit to backend / Supabase
    try {
      const headers = {};
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const payload = {
        ...formData,
        rating,
        sentiment,
        avatar_url: avatarUrl,
        user_id: user?.id || null,
      };

      const res = await axios.post('/api/feedback', payload, { headers });

      toast.success('Thank you for your feedback!');

      // Optimistically add new item to the top of list
      const newItem = res.data?.data || {
        id: 'temp-' + Date.now(),
        user_id: user?.id,
        name: formData.name,
        email: formData.email,
        rating,
        message: formData.message,
        avatar_url: avatarUrl,
        created_at: new Date().toISOString(),
      };

      setFeedbacks(prev => [newItem, ...prev.filter(item => item.id !== newItem.id)]);
      setFormData(prev => ({ ...prev, message: '' }));
      setRating(0);
      setHoverRating(0);

      // Refresh in background to sync server ID
      fetchFeedbacks();
    } catch (error) {
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete own feedback ───────────────────────────────────────────────────
  const handleDeleteMyFeedback = async (id) => {
    if (!user || !session?.access_token) {
      toast.error('Please sign in to delete your feedback');
      return;
    }

    setDeletingId(id);
    setConfirmDeleteId(null);

    // Optimistic removal from UI
    const previousList = feedbacks;
    setFeedbacks(prev => prev.filter(f => f.id !== id));

    try {
      const headers = { Authorization: `Bearer ${session.access_token}` };
      await axios.delete(`/api/feedback?id=${id}`, { headers });
      toast.success('Your feedback has been deleted');
    } catch (err) {
      // Revert if failed
      setFeedbacks(previousList);
      toast.error(err.response?.data?.error || 'Failed to delete feedback');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen pt-24 md:pt-28 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <span className="inline-block px-4 py-2 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full text-sm font-semibold mb-4">FEEDBACK</span>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-4">
            Share Your <span className="gradient-text">Experience</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-sm md:text-base">
            Read authentic reviews from island explorers, or share your own thoughts and trip memories.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* ── Left Column: Feedback Form ──────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} className="card p-8">
            {!user ? (
              /* Auth gate */
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white mb-6 shadow-lg shadow-teal-500/30">
                  <FaLock className="text-3xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Sign in to Leave Feedback</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs text-sm leading-relaxed">
                  Your feedback helps others plan their trips. Please sign in first.
                </p>
                <a href="/auth" className="btn-primary inline-flex items-center gap-2">
                  Sign In / Create Account
                </a>
              </div>
            ) : (
              /* Feedback form */
              <>
                <div className="flex items-center gap-3 mb-6">
                  <Avatar src={profile?.avatar_url || user?.user_metadata?.avatar_url} name={profile?.full_name || formData.name} />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                      {profile?.full_name || 'Your Review'}
                    </h2>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 text-center uppercase tracking-wider">
                      Select Rating
                    </label>
                    <div className="flex items-center justify-center gap-3 py-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <motion.button
                          key={star}
                          type="button"
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="focus:outline-none p-1"
                          aria-label={`Rate ${star} stars`}
                        >
                          <FaStar
                            size={36}
                            className={`transition-colors ${star <= (hoverRating || rating)
                              ? 'text-yellow-400 drop-shadow-sm'
                              : 'text-gray-300 dark:text-gray-600'
                              }`}
                          />
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Your Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-field"
                      placeholder="e.g. Rahul Sharma"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Your Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input-field"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Your Feedback / Review</label>
                    <textarea
                      required
                      rows="4"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="input-field resize-none"
                      placeholder="Share your experience about us or your trip memories/experience"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner />
                        <span>Submitting feedback...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Feedback</span>
                        <FaPaperPlane size={14} />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </motion.div>

          {/* ── Right Column: Dynamic Feedback List inside Scrollable Container ─ */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            className="card p-6 md:p-8 flex flex-col h-[600px] lg:h-[640px]"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                  What Travelers Say
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Real verified stories from the islands</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400">
                {feedbacks.length} {feedbacks.length === 1 ? 'Review' : 'Reviews'}
              </span>
            </div>

            {loadingFeedbacks ? (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 animate-pulse">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                        <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                      </div>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1.5" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
                  </div>
                ))}
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400">
                <FaQuoteLeft className="text-4xl text-teal-500/20 mb-3" />
                <p className="text-sm font-medium">No reviews shared yet.</p>
                <p className="text-xs text-gray-400 mt-1">Be the first to share your experience!</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 focus:outline-none">
                {feedbacks.map((item) => {
                  const isMyFeedback = Boolean(
                    user && (
                      (item.user_id && item.user_id === user.id) ||
                      (item.email && item.email.toLowerCase() === user.email?.toLowerCase())
                    )
                  );

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 md:p-5 rounded-2xl border transition-all ${isMyFeedback
                        ? 'border-teal-400/40 bg-teal-50/30 dark:bg-teal-950/20 shadow-sm'
                        : 'border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40 hover:border-gray-200 dark:hover:border-gray-700'
                        }`}
                    >
                      {/* Top row: Avatar + Name + Stars + Author-Delete button */}
                      <div className="flex items-start justify-between gap-3 mb-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar src={item.avatar_url} name={item.name} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-gray-900 dark:text-white text-sm truncate">
                                {item.name || 'Anonymous Explorer'}
                              </h4>
                              {isMyFeedback && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-500 text-white shadow-xs">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              {[...Array(5)].map((_, i) => (
                                <FaStar
                                  key={i}
                                  size={12}
                                  className={
                                    i < (item.rating || 5)
                                      ? 'text-yellow-400 drop-shadow-xs'
                                      : 'text-gray-200 dark:text-gray-700'
                                  }
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Author-only Delete button */}
                        {isMyFeedback && (
                          <button
                            onClick={() => setConfirmDeleteId(item.id)}
                            disabled={deletingId === item.id}
                            className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors flex-shrink-0"
                            title="Delete your review"
                            aria-label="Delete your review"
                          >
                            {deletingId === item.id ? (
                              <Spinner className="w-3.5 h-3.5 text-red-500" />
                            ) : (
                              <FaTrash size={12} />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Message text */}
                      <p className="text-gray-700 dark:text-gray-300 text-xs md:text-sm leading-relaxed whitespace-pre-line">
                        "{item.message}"
                      </p>

                      {/* Date */}
                      {item.created_at && (
                        <p className="text-[10px] text-gray-400 mt-2 text-right">
                          {new Date(item.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── Confirmation Modal for Self-Deletion ──────────────────────────── */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain">
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
              onClick={() => setConfirmDeleteId(null)}
              aria-hidden="true"
            />
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-sm rounded-2xl sm:rounded-3xl bg-white dark:bg-gray-900 p-6 text-left shadow-2xl border border-gray-100 dark:border-gray-800 my-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Delete Feedback?</h3>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    type="button"
                    className="p-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                    aria-label="Close"
                  >
                    <FaTimes size={15} />
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                  Are you sure you want to permanently delete your feedback? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xs sm:text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteMyFeedback(confirmDeleteId)}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold text-xs sm:text-sm hover:bg-red-600 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FaTrash size={12} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Feedback;