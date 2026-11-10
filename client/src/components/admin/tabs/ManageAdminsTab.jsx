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

export default function ManageAdminsTab() {
  const [admins, setAdmins] = useState(adminCache.admins || []);
  const [loading, setLoading] = useState(!adminCache.admins);
  const [email, setEmail] = useState('');
  const [lookupUser, setLookupUser] = useState(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const headers = await getAdminHeaders();
      const { data } = await axios.get('/api/admin/manage-admins', { headers });
      const list = Array.isArray(data) ? data : [];
      adminCache.admins = list;
      setAdmins(list);
    } catch {
      if (!isSilent) toast.error('Failed to load admin list');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(!!adminCache.admins); }, [load]);

  // Live user lookup by email
  useEffect(() => {
    const q = email.trim();
    if (!q || !q.includes('@') || q.length < 5) {
      setLookupUser(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLookingUp(true);
      try {
        const headers = await getAdminHeaders();
        const { data } = await axios.get(`/api/admin/user-lookup?email=${encodeURIComponent(q)}`, { headers });
        setLookupUser(data || null);
      } catch {
        setLookupUser('not_found');
      } finally {
        setLookingUp(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [email]);

  const promote = async () => {
    if (!email.trim()) return toast.error('Enter an email address');
    setPromoting(true);
    try {
      const headers = await getAdminHeaders();
      await axios.post('/api/admin/manage-admins', { email: email.trim() }, { headers });
      toast.success(`${email} promoted to Admin!`);
      setEmail('');
      setLookupUser(null);
      load(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to promote user');
    } finally {
      setPromoting(false);
    }
  };

  const demote = async (id, adminEmail) => {
    // Instant Optimistic Demote
    setAdmins(prev => prev.filter(a => a.id !== id));
    adminCache.admins = (adminCache.admins || []).filter(a => a.id !== id);
    setConfirm(null);
    toast.success(`${adminEmail} demoted to User`);

    // Background sync
    try {
      const headers = await getAdminHeaders();
      await axios.delete(`/api/admin/manage-admins?id=${id}`, { headers });
    } catch {
      toast.error('Failed to demote admin');
      load(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-md">
          <FaShieldAlt className="text-white" size={16} />
        </div>
        <div>
          <h2 className="text-base font-black text-gray-900 dark:text-white">Manage Admin Accounts</h2>
          <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider">Superadmin access only</p>
        </div>
      </div>

      {/* Promote Box with Live User Lookup */}
      <div className="bg-rose-50/80 dark:bg-rose-950/20 rounded-2xl p-4 sm:p-5 mb-6 border border-rose-200 dark:border-rose-900/40 space-y-3">
        <div>
          <h3 className="font-bold text-gray-800 dark:text-white text-sm mb-0.5">Promote User to Admin</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Type an email to fetch user details and promote to Administrator.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            className="input-field flex-1 text-xs sm:text-sm"
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && promote()}
          />
          <button
            onClick={promote}
            disabled={promoting || (lookupUser && lookupUser.role === 'admin')}
            className="btn-primary flex items-center justify-center gap-2 sm:whitespace-nowrap py-2.5 px-4 text-xs font-bold"
          >
            {promoting ? (
              <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <FaUserShield size={13} />
            )}
            Promote to Admin
          </button>
        </div>

        {/* Live User Details Preview Card */}
        {lookingUp && (
          <p className="text-xs text-gray-400 italic">Fetching user details from Supabase...</p>
        )}

        {lookupUser && lookupUser !== 'not_found' && (
          <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-3">
            {lookupUser.avatar_url ? (
              <img src={lookupUser.avatar_url} alt={lookupUser.full_name} className="w-10 h-10 rounded-xl object-cover ring-2 ring-rose-500/20" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white font-bold text-sm flex items-center justify-center">
                {(lookupUser.full_name || lookupUser.email || '?')[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0 text-xs">
              <p className="font-bold text-gray-900 dark:text-white truncate">{lookupUser.full_name || 'No Name Set'}</p>
              <p className="text-gray-500 truncate">{lookupUser.email}</p>
              {lookupUser.phone && <p className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">{lookupUser.phone}</p>}
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              lookupUser.role === 'superadmin' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' :
              lookupUser.role === 'admin' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' :
              'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
            }`}>
              Current Role: {lookupUser.role}
            </span>
          </div>
        )}

        {lookupUser === 'not_found' && (
          <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
            No registered user found with this email. The user must sign up first.
          </p>
        )}
      </div>

      {/* Current Admins List */}
      <div className="space-y-2.5">
        <h3 className="font-bold text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wider mb-3">
          Current Staff &amp; Admins ({admins.length})
        </h3>
        {admins.map(admin => (
          <div
            key={admin.id}
            className="flex items-center gap-3.5 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:border-teal-300 dark:hover:border-teal-700 transition-all"
          >
            {/* Admin Avatar */}
            {admin.avatar_url ? (
              <img
                src={admin.avatar_url}
                alt={admin.full_name || admin.email}
                className="w-11 h-11 rounded-2xl object-cover ring-2 ring-rose-500/20 flex-shrink-0 shadow-sm"
              />
            ) : (
              <div className="w-11 h-11 bg-gradient-to-br from-teal-400 to-cyan-600 rounded-2xl flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-sm">
                {(admin.full_name || admin.email || '?')[0].toUpperCase()}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{admin.full_name || 'Admin User'}</p>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  admin.role === 'superadmin'
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 border border-purple-200 dark:border-purple-800'
                    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 border border-amber-200 dark:border-amber-800'
                }`}>
                  {admin.role}
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate">{admin.email}</p>
              {admin.phone && (
                <p className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1 mt-0.5">
                  <FaPhone size={9} /> {admin.phone}
                </p>
              )}
            </div>

            {admin.role !== 'superadmin' && (
              <button
                onClick={() => setConfirm({ id: admin.id, email: admin.email })}
                className="p-2 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-500 hover:bg-red-100 transition-colors flex-shrink-0"
                title="Demote to standard user"
              >
                <FaTimesCircle size={14} />
              </button>
            )}
          </div>
        ))}
        {admins.length === 0 && <p className="text-center text-gray-400 dark:text-gray-500 py-8 text-sm">No admin accounts found.</p>}
      </div>

      {confirm && (
        <ConfirmDialog
          message={`Demote ${confirm.email} back to regular user? They will lose all admin access immediately.`}
          onConfirm={() => demote(confirm.id, confirm.email)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}
