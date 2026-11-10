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

const ALERT_TYPES = ['info', 'warning', 'danger', 'success'];
const ALERT_TYPE_STYLES = {
  info:    'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
  warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
  danger:  'bg-red-100 dark:bg-red-900/30 text-red-600',
  success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600',
};
const BLANK_ALERT = { title: '', message: '', type: 'info', active: true, expires_at: '' };

export default function AlertsTab() {
  const [alerts, setAlerts] = useState(adminCache.alerts || []);
  const [loading, setLoading] = useState(!adminCache.alerts);
  const [form, setForm] = useState(BLANK_ALERT);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const headers = await getAdminHeaders();
      const { data } = await axios.get('/api/admin/alerts', { headers });
      const list = Array.isArray(data) ? data : [];
      adminCache.alerts = list;
      setAlerts(list);
    } catch {
      if (!isSilent) toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(!!adminCache.alerts); }, [load]);

  const handleSave = async () => {
    if (!form.title.trim() || !form.message.trim()) return toast.error('Title and message are required');
    
    // Instant Optimistic Update
    const isAdding = !editing;
    const tempId = isAdding ? 'temp-' + Date.now() : editing;
    const optimisticAlert = { ...form, id: tempId, created_at: new Date().toISOString() };

    if (isAdding) {
      setAlerts(prev => [optimisticAlert, ...prev]);
      adminCache.alerts = [optimisticAlert, ...(adminCache.alerts || [])];
      toast.success('Alert posted!');
    } else {
      setAlerts(prev => prev.map(a => a.id === editing ? optimisticAlert : a));
      adminCache.alerts = (adminCache.alerts || []).map(a => a.id === editing ? optimisticAlert : a);
      toast.success('Alert updated');
    }
    setForm(BLANK_ALERT);
    setEditing(null);

    // Background sync
    try {
      const headers = await getAdminHeaders();
      if (editing) {
        await axios.put(`/api/admin/alerts?id=${editing}`, form, { headers });
      } else {
        const { data } = await axios.post('/api/admin/alerts', form, { headers });
        if (data?.id) {
          setAlerts(prev => prev.map(a => a.id === tempId ? data : a));
          adminCache.alerts = (adminCache.alerts || []).map(a => a.id === tempId ? data : a);
        }
      }
    } catch {
      toast.error('Failed to save alert');
      load(false);
    }
  };

  const handleDelete = async (id) => {
    // Instant Optimistic Delete
    setAlerts(prev => prev.filter(a => a.id !== id));
    adminCache.alerts = (adminCache.alerts || []).filter(a => a.id !== id);
    setConfirm(null);
    toast.success('Alert deleted');

    // Background sync
    try {
      const headers = await getAdminHeaders();
      await axios.delete(`/api/admin/alerts?id=${id}`, { headers });
    } catch {
      toast.error('Failed to delete alert');
      load(false);
    }
  };

  const toggleActive = async (alert) => {
    // Instant Optimistic Toggle
    const nextActive = !alert.active;
    setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, active: nextActive } : a));
    adminCache.alerts = (adminCache.alerts || []).map(a => a.id === alert.id ? { ...a, active: nextActive } : a);
    toast.success(nextActive ? 'Alert activated' : 'Alert deactivated');

    // Background sync
    try {
      const headers = await getAdminHeaders();
      await axios.put(`/api/admin/alerts?id=${alert.id}`, { ...alert, active: nextActive }, { headers });
    } catch {
      toast.error('Failed to toggle alert');
      load(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <>
      {/* Form */}
      <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-4 mb-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-black text-gray-800 dark:text-white text-sm mb-4">{editing ? 'Edit Alert' : 'Post New Alert'}</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Title">
              <input className="input-field" placeholder="e.g. Weather Advisory" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </Field>
            <Field label="Type">
              <select className="input-field" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {ALERT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Message">
            <textarea rows={3} className="input-field resize-none" placeholder="Alert message visible to all visitors"
              value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <Field label="Expires at (optional)">
              <input type="datetime-local" className="input-field [color-scheme:light] dark:[color-scheme:dark]" value={form.expires_at}
                onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
            </Field>
            <label className="flex items-center gap-2 cursor-pointer pb-1">
              <input type="checkbox" checked={form.active}
                onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                className="w-4 h-4 accent-teal-500 rounded" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Active immediately</span>
            </label>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 text-sm">
              <FaBell /> {editing ? 'Update Alert' : 'Post Alert'}
            </button>
            {editing && (
              <button onClick={() => { setEditing(null); setForm(BLANK_ALERT); }}
                className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-300 transition-colors">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Alert List */}
      <div className="space-y-2.5">
        {alerts.map(alert => (
          <div key={alert.id}
            className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold flex-shrink-0 mt-0.5 ${ALERT_TYPE_STYLES[alert.type] || ''}`}>
              {alert.type}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-gray-900 dark:text-white">{alert.title}</p>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{alert.message}</p>
              <p className="text-[10px] text-gray-400 mt-1">{new Date(alert.created_at).toLocaleString()}</p>
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <button onClick={() => toggleActive(alert)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                  alert.active
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 hover:bg-green-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200'
                }`}>
                {alert.active ? 'Active' : 'Off'}
              </button>
              <button onClick={() => { setEditing(alert.id); setForm({ title: alert.title, message: alert.message, type: alert.type, active: alert.active, expires_at: alert.expires_at || '' }); }}
                className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-500 hover:bg-blue-100 transition-colors">
                <FaEdit size={12} />
              </button>
              <button onClick={() => setConfirm(alert.id)}
                className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500 hover:bg-red-100 transition-colors">
                <FaTrash size={12} />
              </button>
            </div>
          </div>
        ))}
        {alerts.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            <p>No alerts posted yet. Create one above to broadcast to all visitors instantly.</p>
          </div>
        )}
      </div>

      {confirm && (
        <ConfirmDialog
          message="Delete this alert? It will disappear for all visitors immediately."
          onConfirm={() => handleDelete(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}
