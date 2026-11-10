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

export default function QueriesTab() {
  const [queries, setQueries] = useState(adminCache.queries || []);
  const [loading, setLoading] = useState(!adminCache.queries);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'attention' | 'open' | 'replied'
  const [search, setSearch] = useState('');
  const [replyModal, setReplyModal] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const headers = await getAdminHeaders();
      const { data } = await axios.get('/api/admin/queries', { headers });
      const list = Array.isArray(data) ? data : [];
      adminCache.queries = list;
      setQueries(list);
      // Only refresh thread in replyModal if modal is currently open
      setReplyModal(current => {
        if (!current) return null;
        const updatedCurrent = list.find(q => q.id === current.id);
        return updatedCurrent || current;
      });
    } catch {
      if (!isSilent) toast.error('Failed to load queries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(!!adminCache.queries); }, [load]);

  // Helper: check if customer replied to an existing thread (reopened query needing attention)
  const isCustomerResponded = (q) => {
    if (q.status !== 'open') return false;
    const msgs = q.query_messages || [];
    const hasCustomerFollowup = msgs.some(m => m.sender_type === 'customer');
    const hasPriorAdminReply = !!q.admin_reply || msgs.some(m => m.sender_type === 'admin');
    return hasCustomerFollowup || hasPriorAdminReply;
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return toast.error('Reply cannot be empty');
    const queryId = replyModal.id;
    const optimisticMessage = {
      id: 'opt_' + Date.now(),
      query_id: queryId,
      sender_type: 'admin',
      message: replyText.trim(),
      created_at: new Date().toISOString(),
    };

    setSending(true);

    // Instant Optimistic Update
    setQueries(prev => prev.map(q => {
      if (q.id === queryId) {
        const updatedMsgs = [...(q.query_messages || []), optimisticMessage];
        return { ...q, admin_reply: replyText.trim(), status: 'replied', query_messages: updatedMsgs };
      }
      return q;
    }));

    adminCache.queries = (adminCache.queries || []).map(q => {
      if (q.id === queryId) {
        const updatedMsgs = [...(q.query_messages || []), optimisticMessage];
        return { ...q, admin_reply: replyText.trim(), status: 'replied', query_messages: updatedMsgs };
      }
      return q;
    });

    setReplyModal(null);
    toast.success('Reply dispatched via email!');
    const textToSend = replyText.trim();
    setReplyText('');

    // Background sync
    try {
      const headers = await getAdminHeaders();
      const { data: updated } = await axios.put(`/api/admin/queries?id=${queryId}`, { admin_reply: textToSend, status: 'replied' }, { headers });
      if (updated) {
        setQueries(prev => prev.map(q => q.id === queryId ? { ...q, ...updated } : q));
      }
    } catch (err) {
      toast.error('Sync failed: ' + (err.response?.data?.error || err.message));
      load(false);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Spinner />;

  // Dynamic counts for status pills (always live)
  const attentionCount = queries.filter(isCustomerResponded).length;
  const openCount = queries.filter(q => q.status === 'open' && !isCustomerResponded(q)).length;
  const repliedCount = queries.filter(q => q.status === 'replied').length;

  const filtered = queries.filter(q => {
    const matchesStatus =
      statusFilter === 'all' ? true :
      statusFilter === 'attention' ? isCustomerResponded(q) :
      statusFilter === 'open' ? (q.status === 'open' && !isCustomerResponded(q)) :
      q.status === 'replied';

    const s = search.trim().toLowerCase();
    const matchesSearch = !s ||
      q.name?.toLowerCase().includes(s) ||
      q.email?.toLowerCase().includes(s) ||
      q.subject?.toLowerCase().includes(s) ||
      q.reply_token?.toLowerCase().includes(s) ||
      q.message?.toLowerCase().includes(s) ||
      (q.query_messages || []).some(m => m.message?.toLowerCase().includes(s));

    return matchesStatus && matchesSearch;
  });

  return (
    <>
      {/* ── Filter Bar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        {/* Status Filter Buttons with Live Dynamic Counts */}
        <div className="flex items-center gap-1.5 flex-wrap flex-1">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            All Queries
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
              statusFilter === 'all' ? 'bg-white/20 dark:bg-gray-900/20' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
            }`}>
              {queries.length}
            </span>
          </button>

          {/* Needs Attention / Customer Responded Filter */}
          <button
            onClick={() => setStatusFilter('attention')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
              statusFilter === 'attention'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping inline-block mr-0.5" />
            Customer Replied
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
              statusFilter === 'attention' ? 'bg-white/25 text-white' : 'bg-rose-200/60 dark:bg-rose-800/60 text-rose-700 dark:text-rose-300'
            }`}>
              {attentionCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('open')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'open'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30'
            }`}
          >
            New Unreplied
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
              statusFilter === 'open' ? 'bg-white/25 text-white' : 'bg-amber-200/60 dark:bg-amber-800/60 text-amber-700 dark:text-amber-300'
            }`}>
              {openCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('replied')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'replied'
                ? 'bg-teal-500 text-white shadow-sm'
                : 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/30'
            }`}
          >
            Replied
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
              statusFilter === 'replied' ? 'bg-white/25 text-white' : 'bg-teal-200/60 dark:bg-teal-800/60 text-teal-700 dark:text-teal-300'
            }`}>
              {repliedCount}
            </span>
          </button>
        </div>

        {/* Search bar & Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={11} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search queries, token, msgs..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-teal-500 focus:outline-none w-36 sm:w-52 text-gray-900 dark:text-white"
            />
          </div>
          <button onClick={() => load(false)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-teal-600 dark:hover:text-teal-400 flex-shrink-0" title="Reload Queries">
            <FaRedo size={10} />
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
        Showing {filtered.length} of {queries.length} queries
      </p>

      {/* ── Queries List ────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.map(q => {
          const needsAttention = isCustomerResponded(q);
          const threadMsgs = q.query_messages || [];
          const totalReplies = threadMsgs.length;
          const lastMsg = threadMsgs[threadMsgs.length - 1];

          return (
            <div
              key={q.id}
              className={`p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border transition-all ${
                needsAttention
                  ? 'border-rose-300 dark:border-rose-800/70 bg-rose-50/20 dark:bg-rose-950/10 shadow-sm'
                  : 'border-gray-100 dark:border-gray-700/50 hover:border-teal-200 dark:hover:border-teal-800/50'
              }`}
            >
              <div className="flex items-start gap-3.5">
                {/* Customer Avatar */}
                {q.avatar_url ? (
                  <img
                    src={q.avatar_url}
                    alt={q.name}
                    className="w-11 h-11 rounded-2xl object-cover ring-2 ring-teal-500/20 flex-shrink-0 shadow-sm"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-sm">
                    {(q.name || q.email || '?')[0].toUpperCase()}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-gray-900 dark:text-white text-sm">{q.name}</span>
                    <span className="text-xs text-gray-400">{q.email}</span>
                    {(q.user_phone || q.phone) && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-lg">
                        <FaPhone size={9} /> {q.user_phone || q.phone}
                      </span>
                    )}
                    {q.reply_token && (
                      <span className="font-mono text-[10px] bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300 font-semibold" title="Thread Matching Token">
                        #{q.reply_token}
                      </span>
                    )}
                    {needsAttention ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse flex items-center gap-1">
                        <FaExclamationTriangle size={9} /> Customer Responded
                      </span>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_BADGE[q.status] || ''}`}>
                        {q.status}
                      </span>
                    )}
                  </div>

                  {q.subject && <p className="text-xs font-bold text-teal-600 dark:text-teal-400 mb-1">{q.subject}</p>}
                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">{q.message}</p>

                  {/* Thread Summary preview */}
                  {totalReplies > 0 ? (
                    <div className="mt-2 pl-3 border-l-2 border-teal-400 dark:border-teal-600 bg-teal-50/40 dark:bg-teal-950/20 py-1.5 px-2 rounded-r-xl space-y-0.5">
                      <div className="flex items-center gap-2 text-[11px] font-bold">
                        <span className="text-teal-700 dark:text-teal-300">
                          {lastMsg.sender_type === 'admin' ? '🛡️ Admin Reply' : '💬 Customer Follow-up'}
                        </span>
                        <span className="text-[10px] font-normal text-gray-400">
                          ({totalReplies} message{totalReplies > 1 ? 's' : ''} in thread)
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 italic line-clamp-1">
                        {lastMsg.message}
                      </p>
                    </div>
                  ) : q.admin_reply ? (
                    <div className="mt-2 pl-3 border-l-2 border-teal-400 dark:border-teal-600 bg-teal-50/50 dark:bg-teal-950/20 py-1 rounded-r-xl">
                      <p className="text-xs text-gray-600 dark:text-gray-300 italic">
                        <strong className="text-teal-700 dark:text-teal-400 not-italic font-bold">Admin Reply: </strong>
                        {q.admin_reply}
                      </p>
                    </div>
                  ) : null}

                  <p className="text-[10px] text-gray-400 mt-1.5">
                    Received: {new Date(q.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <button
                  onClick={() => { setReplyModal(q); setReplyText(''); }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 shadow-sm ${
                    needsAttention
                      ? 'bg-rose-500 hover:bg-rose-600 text-white'
                      : 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 hover:bg-teal-100 dark:hover:bg-teal-900/50'
                  }`}
                >
                  <FaReply size={11} /> {totalReplies > 0 ? `Thread (${totalReplies})` : q.admin_reply ? 'View Thread' : 'Quick Reply'}
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            <p>{search ? 'No matching queries found.' : `No ${statusFilter !== 'all' ? statusFilter : ''} queries yet.`}</p>
          </div>
        )}
      </div>

      {/* ── Threaded Reply Modal ────────────────────────────────────────────── */}
      <AnimatePresence>
        {replyModal && (
          <Modal
            title={`Conversation Thread: ${replyModal.name}`}
            onClose={() => setReplyModal(null)}
            wide
            footer={
              <>
                <button
                  type="button"
                  onClick={() => setReplyModal(null)}
                  className="flex-1 py-3 px-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xs sm:text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-all cursor-pointer active:scale-95 touch-manipulation"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSendReply}
                  disabled={sending || !replyText.trim()}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95 touch-manipulation"
                >
                  <FaReply /> {sending ? 'Sending...' : 'Send Reply via Email'}
                </button>
              </>
            }
          >
            <div className="space-y-4">
              {/* Customer Profile Summary */}
              <div className="p-3.5 bg-gray-50 dark:bg-gray-800/70 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                {replyModal.avatar_url ? (
                  <img src={replyModal.avatar_url} alt={replyModal.name} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-teal-500/20" />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center text-white font-black text-base">
                    {(replyModal.name || replyModal.email || '?')[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0 text-xs space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{replyModal.name}</p>
                    {replyModal.reply_token && (
                      <span className="font-mono text-[10px] bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full font-bold">
                        [#{replyModal.reply_token}]
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 truncate">{replyModal.email}</p>
                  {(replyModal.user_phone || replyModal.phone) && (
                    <p className="text-teal-600 dark:text-teal-400 font-semibold">{replyModal.user_phone || replyModal.phone}</p>
                  )}
                </div>
              </div>

              {/* Thread Messages History */}
              <div className="space-y-3 p-3 bg-gray-100/60 dark:bg-gray-900/60 rounded-2xl border border-gray-200 dark:border-gray-700/60">
                {/* 1. Initial Customer Message */}
                <div className="p-3.5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 space-y-1 shadow-xs">
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span className="font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
                      <FaUser size={10} /> Initial Customer Inquiry
                    </span>
                    <span>{new Date(replyModal.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {replyModal.subject && <p className="text-xs font-bold text-gray-900 dark:text-white">{replyModal.subject}</p>}
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{replyModal.message}</p>
                </div>

                {/* 2. Chronological Thread of query_messages */}
                {(replyModal.query_messages || []).map((msg, idx) => {
                  const isAdmin = msg.sender_type === 'admin';
                  return (
                    <div
                      key={msg.id || idx}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isAdmin
                          ? 'ml-4 sm:ml-8 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/60 shadow-xs'
                          : 'mr-4 sm:mr-8 bg-white dark:bg-gray-800 border-rose-200 dark:border-rose-900/40 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className={`font-bold flex items-center gap-1 ${isAdmin ? 'text-teal-700 dark:text-teal-300' : 'text-rose-600 dark:text-rose-400'}`}>
                          {isAdmin ? <FaShieldAlt size={10} /> : <FaEnvelope size={10} />}
                          {isAdmin ? 'Admin Response' : 'Customer Reply (via Email)'}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(msg.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  );
                })}

                {/* Fallback backward-compatibility: If no query_messages but old single admin_reply exists */}
                {(!replyModal.query_messages || replyModal.query_messages.length === 0) && replyModal.admin_reply && (
                  <div className="ml-4 sm:ml-8 p-3.5 bg-teal-50 dark:bg-teal-950/40 rounded-2xl border border-teal-200 dark:border-teal-800/60 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-teal-700 dark:text-teal-300 font-bold">
                      <span className="flex items-center gap-1"><FaShieldAlt size={10} /> Admin Response (Legacy)</span>
                    </div>
                    <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{replyModal.admin_reply}</p>
                  </div>
                )}
              </div>

              {/* Compose New Reply Area */}
              <div className="space-y-1.5 pt-1">
                <Field label={`Compose Reply (will email ${replyModal.email})`}>
                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Type your response here... (Customer will receive an email and can reply directly to continue the thread)"
                    className="input-field resize-none text-xs leading-relaxed"
                  />
                </Field>
                <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                  <FaInfoCircle size={10} className="text-teal-500 flex-shrink-0" />
                  Subject will include thread token <strong className="font-mono text-teal-600 dark:text-teal-400">[#{replyModal.reply_token || '...'}]</strong>. Inbound customer replies will land right here.
                </p>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}
