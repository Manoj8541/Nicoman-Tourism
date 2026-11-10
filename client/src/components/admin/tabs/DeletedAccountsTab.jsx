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

export default function DeletedAccountsTab() {
  const [items, setItems] = useState(adminCache.deletedProfiles || []);
  const [loading, setLoading] = useState(!adminCache.deletedProfiles);
  const [search, setSearch] = useState('');
  const [confirmPurge, setConfirmPurge] = useState(null);
  const [confirmRestore, setConfirmRestore] = useState(null);

  const load = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const headers = await getAdminHeaders();
      const { data } = await axios.get('/api/admin/deleted-profiles', { headers });
      const list = Array.isArray(data) ? data : [];
      adminCache.deletedProfiles = list;
      setItems(list);
    } catch {
      if (!isSilent) toast.error('Failed to load deleted accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(!!adminCache.deletedProfiles); }, [load]);

  // Restore / Revoke Account back to profiles
  const handleRestore = async (account) => {
    setItems(prev => prev.filter(a => a.id !== account.id));
    adminCache.deletedProfiles = (adminCache.deletedProfiles || []).filter(a => a.id !== account.id);
    setConfirmRestore(null);
    toast.success(`Restoring ${account.email}...`);

    try {
      const headers = await getAdminHeaders();
      await axios.post('/api/admin/deleted-profiles/restore', { id: account.id }, { headers });
      toast.success(`Account ${account.email} restored! A password reset link has been emailed to the user.`);
      load(false);
    } catch (err) {
      toast.error('Failed to restore account: ' + (err.response?.data?.error || err.message));
      load(false);
    }
  };

  // Permanently Purge Account and All Traces across All Tables
  const handlePurge = async (account) => {
    setItems(prev => prev.filter(a => a.id !== account.id));
    adminCache.deletedProfiles = (adminCache.deletedProfiles || []).filter(a => a.id !== account.id);
    setConfirmPurge(null);
    toast.success(`Purging all records for ${account.email}...`);

    try {
      const headers = await getAdminHeaders();
      await axios.delete(`/api/admin/deleted-profiles/purge?id=${account.id}`, { headers });
      toast.success(`Permanently purged ${account.email} & all database traces.`);
      load(false);
    } catch (err) {
      toast.error('Failed to purge account: ' + (err.response?.data?.error || err.message));
      load(false);
    }
  };

  if (loading) return <Spinner />;

  const filtered = items.filter(a => {
    const q = search.trim().toLowerCase();
    return !q ||
      a.full_name?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.phone?.toLowerCase().includes(q) ||
      a.deletion_reason?.toLowerCase().includes(q);
  });

  return (
    <>
      {/* Header Info Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 p-4 rounded-2xl bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/20 border border-red-200 dark:border-red-900/40">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-red-600 to-rose-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-red-500/20 flex-shrink-0">
            <FaUserSlash size={18} />
          </div>
          <div>
            <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              Deleted Accounts Vault
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300">
                {items.length} Archived
              </span>
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              30-day grace recovery archive. Choose to revoke/restore an account or permanently wipe all traces.
            </p>
          </div>
        </div>

        <button onClick={() => load(false)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:text-teal-600 self-start sm:self-auto shadow-sm">
          <FaRedo size={10} /> Refresh
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search deleted accounts by name, email, reason..."
          className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-red-500"
        />
      </div>

      {/* Account Cards */}
      <div className="space-y-3">
        {filtered.map(account => {
          const deletedDate = new Date(account.deleted_at);
          const purgeDate = account.scheduled_purge_at ? new Date(account.scheduled_purge_at) : null;
          const daysLeft = purgeDate ? Math.max(0, Math.ceil((purgeDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;

          return (
            <div
              key={account.id}
              className="p-4 sm:p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/80 shadow-sm hover:border-red-300 dark:hover:border-red-800/60 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Avatar */}
                  {account.avatar_url ? (
                    <img
                      src={account.avatar_url}
                      alt={account.full_name || account.email}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-red-500/20 flex-shrink-0 shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-black text-base flex-shrink-0 shadow-sm">
                      {(account.full_name || account.email || '?')[0].toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 dark:text-white text-sm">
                        {account.full_name || 'Anonymous User'}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">{account.email}</span>
                      {account.phone && (
                        <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold inline-flex items-center gap-1 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-lg">
                          <FaPhone size={9} /> {account.phone}
                        </span>
                      )}
                    </div>

                    {account.deletion_reason && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        <strong className="text-gray-500 dark:text-gray-400 font-semibold">Reason: </strong>
                        {account.deletion_reason}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400 flex-wrap">
                      <span>Deleted: {deletedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      {daysLeft !== null && (
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          daysLeft <= 5
                            ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                        }`}>
                          {daysLeft > 0 ? `${daysLeft} days until auto-purge` : 'Purge due today'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions: Revoke vs Permanently Purge */}
                <div className="flex sm:flex-col items-stretch gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-700">
                  {/* Revoke / Restore Button */}
                  <button
                    type="button"
                    onClick={() => setConfirmRestore(account)}
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    title="Revoke deletion and restore to profiles"
                  >
                    <FaUndoAlt size={11} /> Revoke &amp; Restore
                  </button>

                  {/* Purge All Traces Button */}
                  <button
                    type="button"
                    onClick={() => setConfirmPurge(account)}
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    title="Permanently delete and purge all traces from all tables"
                  >
                    <FaTrashAlt size={11} /> Purge All Traces
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            <p>{search ? 'No matching deleted accounts found.' : 'Vault is clear — no deleted accounts currently in 30-day grace period.'}</p>
          </div>
        )}
      </div>

      {/* Styled Revoke / Restore Dialog */}
      {confirmRestore && (
        <ConfirmDialog
          message={`Revoke cancellation and restore ${confirmRestore.email}? This moves their data back to active profiles so they can log in again via Google OAuth or Email with past bookings intact.`}
          confirmText="Yes, Restore Account"
          confirmColor="bg-emerald-600 hover:bg-emerald-700"
          onConfirm={() => handleRestore(confirmRestore)}
          onCancel={() => setConfirmRestore(null)}
        />
      )}

      {/* Styled Purge All Traces Dialog */}
      {confirmPurge && (
        <ConfirmDialog
          message={`PERMANENTLY PURGE all data for ${confirmPurge.email}? This will immediately delete this user and all their records from deleted_profiles, customer_queries, feedback, bookings, and auth. This cannot be undone.`}
          confirmText="Permanently Purge Everything"
          confirmColor="bg-red-600 hover:bg-red-700"
          onConfirm={() => handlePurge(confirmPurge)}
          onCancel={() => setConfirmPurge(null)}
        />
      )}
    </>
  );
}
