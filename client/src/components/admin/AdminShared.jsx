import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  FaHotel, FaMapMarkerAlt, FaShip, FaCalendarAlt, FaEnvelope,
  FaStar, FaBell, FaUserShield, FaUserSlash, FaTicketAlt,
  FaEdit, FaTrash, FaTimes, FaExclamationTriangle, FaCheck
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

// ── In-Memory Data Cache (Instant 0ms tab switching & stale-while-revalidate) ─
export const adminCache = {
  hotels: null,
  places: null,
  schedules: null,
  bookings: null,
  ferryBookings: null,
  queries: null,
  feedback: null,
  alerts: null,
  admins: null,
  deletedProfiles: null,
};

// ── Constants ─────────────────────────────────────────────────────────────────
export const BASE_TABS = [
  { id: 'hotels',           label: 'Hotels',           icon: FaHotel,        color: 'from-teal-500 to-cyan-500' },
  { id: 'tourist-places',   label: 'Places',           icon: FaMapMarkerAlt, color: 'from-purple-500 to-pink-500' },
  { id: 'ship-schedule',    label: 'Ferries',          icon: FaShip,         color: 'from-blue-500 to-indigo-500' },
  { id: 'bookings',         label: 'Hotel Bookings',   icon: FaCalendarAlt,  color: 'from-green-500 to-emerald-500' },
  { id: 'ferry-bookings',   label: 'Ship Bookings',    icon: FaTicketAlt,    color: 'from-cyan-500 to-blue-600' },
  { id: 'queries',          label: 'Queries',          icon: FaEnvelope,     color: 'from-orange-500 to-red-500' },
  { id: 'feedback',         label: 'Feedback',         icon: FaStar,         color: 'from-yellow-500 to-amber-500' },
  { id: 'alerts',           label: 'Alerts',           icon: FaBell,         color: 'from-sky-500 to-cyan-500' },
  { id: 'deleted-accounts', label: 'Deleted Accounts', icon: FaUserSlash,    color: 'from-red-600 to-rose-600' },
];

export const SUPERADMIN_TAB = { id: 'manage-admins', label: 'Admins', icon: FaUserShield, color: 'from-rose-500 to-pink-600' };

export const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const STATUS_BADGE = {
  confirmed: 'bg-green-100 dark:bg-green-900/30 text-green-600',
  cancelled:  'bg-red-100 dark:bg-red-900/30 text-red-600',
  completed:  'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
  on_time:    'bg-green-100 dark:bg-green-900/30 text-green-600',
  delayed:    'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
  open:       'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
  replied:    'bg-teal-100 dark:bg-teal-900/30 text-teal-600',
  closed:     'bg-gray-100 dark:bg-gray-700 text-gray-500',
};

// ── Auth Token Helper (Always gets fresh non-expired session JWT) ─────────────
export const getAdminHeaders = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
  } catch (err) {
    console.error('[Admin] getAdminHeaders failed:', err);
  }
  return {};
};

// ── Micro-components ──────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function Label({ children, required }) {
  return (
    <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5 uppercase tracking-wide">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

export function Field({ label, required, children }) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      {children}
    </div>
  );
}

// Star rating display (read-only)
export function Stars({ n }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <FaStar key={i} className={i < n ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'} size={12} />
      ))}
    </span>
  );
}

// Day checkboxes
export function DayCheckboxes({ value = [], onChange }) {
  const selected = Array.isArray(value) ? value : [];
  const toggle = (day) => {
    const next = selected.includes(day)
      ? selected.filter(d => d !== day)
      : [...selected, day];
    onChange(next);
  };
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {WEEK_DAYS.map(day => (
        <button
          key={day}
          type="button"
          onClick={() => toggle(day)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all
            ${selected.includes(day)
              ? 'bg-blue-500 border-blue-500 text-white shadow-sm'
              : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-blue-300'
            }`}
        >
          {day}
        </button>
      ))}
    </div>
  );
}

// ── Confirm Dialog ─────────────────────────────────────────────────────────────
export function ConfirmDialog({ message, onConfirm, onCancel, confirmText = 'Delete', confirmColor = 'bg-red-500 hover:bg-red-600' }) {
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancelRef.current();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prev === 'hidden' ? 'unset' : (prev || 'unset');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
      {/* 1. Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity cursor-pointer" 
        onClick={onCancel} 
        aria-hidden="true" 
      />

      {/* 2. Dialog Panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-sm rounded-2xl sm:rounded-3xl bg-white dark:bg-gray-900 p-6 text-left shadow-2xl border border-gray-100 dark:border-gray-800"
      >
        <p className="text-gray-800 dark:text-gray-200 font-semibold mb-6 text-center text-sm leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button 
            type="button" 
            onClick={onCancel} 
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs sm:text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer active:scale-95"
          >
            Cancel
          </button>
          <button 
            type="button" 
            onClick={onConfirm} 
            className={`flex-1 py-2.5 rounded-xl text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95 ${confirmColor}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Mobile-First Modal Wrapper with Pinned Header & Action Footer ─────────────
export function Modal({ title, onClose, children, footer, wide = false }) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCloseRef.current?.();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prev === 'hidden' ? 'unset' : (prev || 'unset');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
      {/* 1. Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. Modal Panel — Fully self-contained flexbox guaranteed to fit any mobile or desktop screen */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative z-10 w-full ${
          wide ? 'max-w-3xl' : 'max-w-xl'
        } rounded-2xl sm:rounded-3xl bg-white dark:bg-gray-900 text-left shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden`}
        style={{
          height: 'min(68dvh, 650px)',
          maxHeight: 'min(68dvh, 650px)',
          touchAction: 'pan-y'
        }}
      >
        {/* Pinned Header with High-Visibility Large Close Button */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0">
          <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white truncate pr-2">{title}</h3>
          <button
            onClick={onClose}
            type="button"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 active:scale-95 transition-all flex items-center justify-center flex-shrink-0 shadow-xs cursor-pointer"
            aria-label="Close modal"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Scrollable Form Body — Guaranteed to scroll smoothly on touch devices */}
        <div 
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 focus:outline-none"
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
        >
          {children}
        </div>

        {/* Pinned Sticky Footer Actions — ALWAYS visible at the bottom of the card on ANY screen */}
        {footer && (
          <div 
            className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm flex-shrink-0 flex gap-2.5 sm:gap-3 relative z-20"
            style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// ── Item Row actions ───────────────────────────────────────────────────────────
export function RowActions({ onEdit, onDelete, editColor = 'teal' }) {
  const colors = {
    teal:   'bg-teal-50 dark:bg-teal-900/30 text-teal-600 hover:bg-teal-100',
    purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 hover:bg-purple-100',
    blue:   'bg-blue-50 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-100',
  };
  return (
    <div className="flex gap-1.5 flex-shrink-0">
      <button onClick={onEdit}   className={`p-2 rounded-lg transition-colors ${colors[editColor]}`}><FaEdit size={13} /></button>
      <button onClick={onDelete} className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500 hover:bg-red-100 transition-colors"><FaTrash size={13} /></button>
    </div>
  );
}

// ── Date Match Helper for Bookings ──────────────────────────────────────────
export function matchesBookingDateRange(dateStr, filter) {
  if (!dateStr || filter === 'all') return true;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return true;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (filter === 'today') {
    return d >= todayStart && d <= todayEnd;
  }
  if (filter === 'upcoming') {
    return d >= todayStart;
  }
  if (filter === 'past') {
    return d < todayStart;
  }
  if (filter === '7days') {
    const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d >= past7;
  }
  if (filter === '30days') {
    const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return d >= past30;
  }
  return true;
}

// ── Booking Conflict Resolution Modal ─────────────────────────────────────────
export function BookingConflictModal({ conflictData, isHotel, onClose, onResolve }) {
  const [selectedUnit, setSelectedUnit] = useState(conflictData?.available_units?.[0] || '');
  const [resolving, setResolving] = useState(false);
  const [showForceConfirm, setShowForceConfirm] = useState(false);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCloseRef.current?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prev === 'hidden' ? 'unset' : (prev || 'unset');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleReallocate = async () => {
    if (!selectedUnit) return toast.error('Please select an available unit');
    setResolving(true);
    await onResolve({ newUnit: selectedUnit, force: false });
    setResolving(false);
  };

  const handleForce = async () => {
    setResolving(true);
    await onResolve({ newUnit: null, force: true });
    setResolving(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-hidden">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity cursor-pointer" onClick={onClose} aria-hidden="true" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-lg rounded-2xl sm:rounded-3xl bg-white dark:bg-gray-900 p-5 sm:p-6 text-left shadow-2xl border border-amber-300 dark:border-amber-900/50 space-y-4 overflow-y-auto flex flex-col"
        style={{
          height: 'min(68dvh, 600px)',
          maxHeight: 'min(68dvh, 600px)',
          touchAction: 'pan-y'
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
            <FaExclamationTriangle size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              {isHotel ? 'Room Collision Detected' : 'Ferry Seat Collision Detected'}
            </h3>
            <p className="text-xs text-gray-500">
              Unit {conflictData?.conflicting_units?.join(', ')} is currently held by another confirmed customer.
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer">
            <FaTimes size={14} />
          </button>
        </div>

        {/* Existing Confirmed Guest Details */}
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-2xl text-xs space-y-2">
          <p className="font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider text-[10px]">
            Currently Occupied By Active Booking:
          </p>
          {conflictData?.conflicting_bookings?.map(cb => (
            <div key={cb.id} className="text-gray-700 dark:text-gray-300 flex justify-between items-center py-0.5 border-t border-amber-200/50 dark:border-amber-800/50">
              <span className="font-semibold truncate max-w-[200px]">
                {cb.guest_name || cb.passenger_name} ({cb.guest_email || cb.passenger_email})
              </span>
              <span className="font-mono text-[11px] font-bold text-amber-800 dark:text-amber-300">{cb.booking_ref}</span>
            </div>
          ))}
        </div>

        {/* Reassignment Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
            {isHotel ? 'Re-allocate to Free Room:' : 'Re-allocate to Free Seat:'}
          </label>
          {conflictData?.available_units?.length > 0 ? (
            <select
              value={selectedUnit}
              onChange={e => setSelectedUnit(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-teal-500"
            >
              {conflictData.available_units.map(u => (
                <option key={u} value={u}>
                  {isHotel ? `Room ${u} (Available)` : `Seat ${u} (Available)`}
                </option>
              ))}
            </select>
          ) : (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 text-xs rounded-xl font-medium">
              100% Sold Out: No remaining free units for this voyage/date.
            </div>
          )}
        </div>

        {/* Force Confirm Warning Banner if toggled */}
        {showForceConfirm && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-2xl text-xs text-red-700 dark:text-red-300 space-y-2">
            <p className="font-bold flex items-center gap-1.5">
              <FaExclamationTriangle size={12} /> Confirm Overbooking?
            </p>
            <p className="text-[11px]">
              This will create a double-booking where two customers share the same unit. Are you sure you want to proceed?
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleForce}
                disabled={resolving}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
              >
                Yes, Force Confirm
              </button>
              <button
                type="button"
                onClick={() => setShowForceConfirm(false)}
                className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!showForceConfirm && (
          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            {conflictData?.available_units?.length > 0 && (
              <button
                type="button"
                onClick={handleReallocate}
                disabled={resolving}
                className="flex-1 btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <FaCheck /> Re-allocate &amp; Confirm
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowForceConfirm(true)}
              disabled={resolving}
              className="px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-bold hover:bg-amber-100 transition-colors"
            >
              Force Confirm
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Keep Cancelled
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
