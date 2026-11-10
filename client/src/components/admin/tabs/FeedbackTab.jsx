import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaHotel, FaMapMarkerAlt, FaShip, FaCalendarAlt, FaEnvelope,
  FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaReply,
  FaCheckCircle, FaTimesCircle, FaClock, FaStar, FaRupeeSign,
  FaSearch, FaBell, FaUserShield, FaEye, FaEyeSlash,
  FaShieldAlt, FaRedo, FaTicketAlt, FaPhone, FaUser, FaUserFriends,
  FaExclamationTriangle, FaUserSlash, FaUndoAlt, FaTrashAlt,
  FaInfoCircle
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from 'axios';
import {
  adminCache,
  getAdminHeaders,
  Spinner,
  Label,
  Field,
  Stars,
  DayCheckboxes,
  ConfirmDialog,
  Modal,
  RowActions,
  STATUS_BADGE,
  WEEK_DAYS,
  matchesBookingDateRange,
  BookingConflictModal
} from '../AdminShared';

// ── Sentiment badge components (inline SVG icons, no emoji) ──────────────────
const SentimentBadge = ({ sentiment }) => {
  if (!sentiment) return null;
  const cfg = {
    positive: {
      cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
      icon: (
        <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 flex-shrink-0">
          <path d="M8 4l4 5H4z" />
        </svg>
      ),
      label: 'Positive',
    },
    negative: {
      cls: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      icon: (
        <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 flex-shrink-0">
          <path d="M8 12L4 7h8z" />
        </svg>
      ),
      label: 'Negative',
    },
    neutral: {
      cls: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
      icon: (
        <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 flex-shrink-0">
          <rect x="3" y="7.5" width="10" height="1.5" rx="0.75" />
        </svg>
      ),
      label: 'Neutral',
    },
  };
  const { cls, icon, label } = cfg[sentiment] || {};
  if (!cls) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cls}`}>
      {icon}
      {label}
    </span>
  );
};

// ── Date range filter helper ──────────────────────────────────────────────────
const matchesFeedbackDate = (createdAt, dateFilter) => {
  if (!createdAt || dateFilter === 'all') return true;
  const itemDate = new Date(createdAt);
  const now = new Date();

  if (dateFilter === 'today') {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return itemDate >= startOfToday;
  }
  if (dateFilter === '7days') {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return itemDate >= sevenDaysAgo;
  }
  if (dateFilter === '30days') {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return itemDate >= thirtyDaysAgo;
  }
  return true;
};

// ── Feedback Tab ──────────────────────────────────────────────────────────────
export default function FeedbackTab() {
  const [items, setItems] = useState(adminCache.feedback || []);
  const [loading, setLoading] = useState(!adminCache.feedback);
  const [confirm, setConfirm] = useState(null);

  // Multi-dimensional Compound Filters ("Filters Inside Filters")
  const [sentimentFilter, setSentimentFilter] = useState('all'); // 'all' | 'positive' | 'negative' | 'neutral'
  const [dateFilter, setDateFilter] = useState('all');           // 'all' | 'today' | '7days' | '30days'
  const [ratingFilter, setRatingFilter] = useState('all');       // 'all' | '5' | '4' | '3' | '1-2'
  const [search, setSearch] = useState('');
  const [negativeFirst, setNegativeFirst] = useState(false);
  const [sortBy, setSortBy] = useState('newest');               // 'newest' | 'oldest' | 'rating_desc' | 'rating_asc'

  const load = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const headers = await getAdminHeaders();
      const { data } = await axios.get('/api/admin/feedback', { headers });
      const list = Array.isArray(data) ? data : [];
      adminCache.feedback = list;
      setItems(list);
    } catch {
      if (!isSilent) toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(!!adminCache.feedback);

    let bc = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('nicoman_events');
      bc.onmessage = (event) => {
        if (event.data?.type === 'FEEDBACK_DELETED') {
          setItems(prev => prev.filter(f => f.id !== event.data.id));
          adminCache.feedback = (adminCache.feedback || []).filter(f => f.id !== event.data.id);
        } else if (event.data?.type === 'FEEDBACK_MUTATED') {
          load(true);
        }
      };
    }

    return () => {
      if (bc) bc.close();
    };
  }, [load]);

  const toggleHide = async (item) => {
    const newHidden = !item.hidden;
    setItems(prev => prev.map(f => f.id === item.id ? { ...f, hidden: newHidden } : f));
    adminCache.feedback = (adminCache.feedback || []).map(f => f.id === item.id ? { ...f, hidden: newHidden } : f);
    toast.success(newHidden ? 'Feedback hidden' : 'Feedback unhidden');

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel('nicoman_events');
      bc.postMessage({ type: 'FEEDBACK_MUTATED', id: item.id });
      bc.close();
    }

    try {
      const headers = await getAdminHeaders();
      await axios.put(`/api/admin/feedback?id=${item.id}`, { hidden: newHidden }, { headers });
    } catch {
      toast.error('Failed to update feedback');
      load(false);
    }
  };

  const handleDelete = async (id) => {
    setItems(prev => prev.filter(f => f.id !== id));
    adminCache.feedback = (adminCache.feedback || []).filter(f => f.id !== id);
    setConfirm(null);
    toast.success('Feedback deleted');

    // Notify other open tabs immediately (0 network calls)
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel('nicoman_events');
      bc.postMessage({ type: 'FEEDBACK_DELETED', id });
      bc.close();
    }

    try {
      const headers = await getAdminHeaders();
      await axios.delete(`/api/admin/feedback?id=${id}`, { headers });
    } catch (err) {
      if (err.response?.status === 404) {
        // Already deleted on server
        return;
      }
      toast.error('Failed to delete feedback');
      load(false);
    }
  };

  if (loading) return <Spinner />;

  // ── Compound Multi-Filter Execution ─────────────────────────────────────────
  const dateScopedItems = items.filter(f => matchesFeedbackDate(f.created_at, dateFilter));

  const filterBtns = [
    { key: 'all', label: 'All', count: dateScopedItems.length },
    { key: 'positive', label: 'Positive', count: dateScopedItems.filter(f => f.sentiment === 'positive').length },
    { key: 'negative', label: 'Negative', count: dateScopedItems.filter(f => f.sentiment === 'negative').length },
    { key: 'neutral', label: 'Neutral', count: dateScopedItems.filter(f => f.sentiment === 'neutral').length },
  ];

  let displayed = items.filter(item => {
    // 1. Sentiment filter
    const matchesSentiment = sentimentFilter === 'all' || item.sentiment === sentimentFilter;

    // 2. Date filter
    const matchesDate = matchesFeedbackDate(item.created_at, dateFilter);

    // 3. Rating filter
    let matchesRating = true;
    if (ratingFilter === '5') matchesRating = item.rating === 5;
    else if (ratingFilter === '4') matchesRating = item.rating === 4;
    else if (ratingFilter === '3') matchesRating = item.rating === 3;
    else if (ratingFilter === '1-2') matchesRating = item.rating <= 2;

    // 4. Search query
    const q = search.trim().toLowerCase();
    const matchesSearch = !q ||
      item.name?.toLowerCase().includes(q) ||
      item.email?.toLowerCase().includes(q) ||
      item.message?.toLowerCase().includes(q);

    return matchesSentiment && matchesDate && matchesRating && matchesSearch;
  });

  // ── Sorting ────────────────────────────────────────────────────────────────
  const SENTIMENT_ORDER = { negative: 0, neutral: 1, positive: 2 };

  displayed = [...displayed].sort((a, b) => {
    if (negativeFirst) {
      const oa = SENTIMENT_ORDER[a.sentiment] ?? 3;
      const ob = SENTIMENT_ORDER[b.sentiment] ?? 3;
      if (oa !== ob) return oa - ob;
    }

    if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
    if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
    if (sortBy === 'rating_desc') return (b.rating || 0) - (a.rating || 0);
    if (sortBy === 'rating_asc') return (a.rating || 0) - (b.rating || 0);
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const hasActiveFilters = sentimentFilter !== 'all' || dateFilter !== 'all' || ratingFilter !== 'all' || search !== '' || negativeFirst;

  const resetAllFilters = () => {
    setSentimentFilter('all');
    setDateFilter('all');
    setRatingFilter('all');
    setSearch('');
    setNegativeFirst(false);
    setSortBy('newest');
  };

  return (
    <>
      {/* ── Filter & Search Controls Header ─────────────────────────────────── */}
      <div className="space-y-3 mb-5 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
        {/* Row 1: Sentiment Pills (Primary) + Negative-First Sort + Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Sentiment filter pills with live counts */}
          <div className="flex gap-1.5 flex-wrap">
            {filterBtns.map(btn => (
              <button
                key={btn.key}
                onClick={() => setSentimentFilter(btn.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  sentimentFilter === btn.key
                    ? 'bg-teal-500 text-white shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {btn.label}
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                  sentimentFilter === btn.key ? 'bg-white/25 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {btn.count}
                </span>
              </button>
            ))}
          </div>

          {/* Negative First Toggle + Refresh */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setNegativeFirst(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                negativeFirst
                  ? 'bg-red-500 text-white border-red-500 shadow-sm'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-red-300 dark:hover:border-red-700 hover:text-red-500'
              }`}
            >
              <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                <path d="M8 12L4 7h8z" />
              </svg>
              Negative first
            </button>
            <button onClick={() => load(false)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-teal-600 dark:hover:text-teal-400">
              <FaRedo size={10} />
            </button>
          </div>
        </div>

        {/* Row 2: Secondary Nested Filters (Date Range, Star Rating, Search, Sort) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-gray-200/60 dark:border-gray-700/60">
          {/* Date Filter Dropdown */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Timeframe</label>
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-teal-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>

          {/* Rating Filter Dropdown */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Rating</label>
            <select
              value={ratingFilter}
              onChange={e => setRatingFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-teal-500"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="1-2">1–2 Stars (Low)</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-teal-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="rating_desc">Highest Rating</option>
              <option value="rating_asc">Lowest Rating</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Search Text</label>
            <div className="relative">
              <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={10} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Name, email, words..."
                className="w-full pl-7 pr-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Filter Summary & Reset Bar */}
        <div className="flex items-center justify-between pt-1 text-[11px] text-gray-500 dark:text-gray-400">
          <span>
            Showing <strong className="text-gray-900 dark:text-white">{displayed.length}</strong> of {items.length} feedback entries
          </span>
          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="text-teal-600 dark:text-teal-400 hover:underline font-bold"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* ── Feedback list ───────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {displayed.map(item => (
          <div key={item.id}
            className={`p-4 rounded-xl border transition-all ${
              item.hidden
                ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
            }`}
          >
            <div className="flex items-start gap-3">
              {item.avatar_url && (
                <img
                  src={item.avatar_url}
                  alt={item.name}
                  className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-bold text-gray-900 dark:text-white text-sm">{item.name}</span>
                  <span className="text-xs text-gray-400">{item.email}</span>
                  {item.hidden && (
                    <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-500 text-[10px] rounded-full font-bold">Hidden</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Stars n={item.rating} />
                  <span className="text-xs text-gray-500">{item.rating}/5</span>
                  {/* Sentiment badge — admin-only */}
                  <SentimentBadge sentiment={item.sentiment} />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{item.message}</p>
                <p className="text-[10px] text-gray-400 mt-1.5">{new Date(item.created_at).toLocaleString()}</p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button onClick={() => toggleHide(item)}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors"
                  title={item.hidden ? 'Unhide' : 'Hide'}>
                  {item.hidden ? <FaEye size={13} /> : <FaEyeSlash size={13} />}
                </button>
                <button onClick={() => setConfirm(item.id)}
                  className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500 hover:bg-red-100 transition-colors">
                  <FaTrash size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {displayed.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            <p>No feedback entries match your active filters.</p>
          </div>
        )}
      </div>

      {confirm && (
        <ConfirmDialog
          message="Permanently delete this feedback? This cannot be undone."
          onConfirm={() => handleDelete(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}
