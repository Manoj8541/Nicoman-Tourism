// client/src/pages/AdminDashboard.jsx
// Full admin CRUD dashboard — protected by RequireAuth + RequireRole('admin').
// 8 tabs: Hotels | Tourist Places | Ship Schedule | Hotel Bookings | Ship Bookings | Queries | Feedback | Alerts
// Superadmin-only: Manage Admins
// Ultra-fast: In-memory cache + optimistic UI updates for 0ms instant CRUD operations.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaHotel, FaMapMarkerAlt, FaShip, FaCalendarAlt, FaEnvelope,
  FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaReply,
  FaCheckCircle, FaTimesCircle, FaClock, FaStar, FaRupeeSign,
  FaSearch, FaBell, FaUserShield, FaEye, FaEyeSlash,
  FaShieldAlt, FaRedo, FaTicketAlt, FaPhone, FaUser, FaUserFriends,
  FaExclamationTriangle, FaUserSlash, FaUndoAlt, FaTrashAlt,
  FaInfoCircle,
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import ImageUploadField from '../components/ImageUploadField';
import { uploadBlobToStorage, deleteStorageFile } from '../lib/imageCompressor';

// ── In-Memory Data Cache (Instant 0ms tab switching & stale-while-revalidate) ─
const adminCache = {
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
const BASE_TABS = [
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
const SUPERADMIN_TAB = { id: 'manage-admins', label: 'Admins', icon: FaUserShield, color: 'from-rose-500 to-pink-600' };

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const STATUS_BADGE = {
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
const getAdminHeaders = async () => {
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
function Spinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function Label({ children, required }) {
  return (
    <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5 uppercase tracking-wide">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      {children}
    </div>
  );
}

// Star rating display (read-only)
function Stars({ n }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <FaStar key={i} className={i < n ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'} size={12} />
      ))}
    </span>
  );
}

// Day checkboxes
function DayCheckboxes({ value = [], onChange }) {
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
function ConfirmDialog({ message, onConfirm, onCancel, confirmText = 'Delete', confirmColor = 'bg-red-500 hover:bg-red-600' }) {
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
function Modal({ title, onClose, children, footer, wide = false }) {
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
function RowActions({ onEdit, onDelete, editColor = 'teal' }) {
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

// ── Hotels Tab ────────────────────────────────────────────────────────────────
function HotelsTab() {
  const [hotels, setHotels] = useState(adminCache.hotels || []);
  const [loading, setLoading] = useState(!adminCache.hotels);
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const BLANK = { name: '', location: '', description: '', image_url: '', pendingImage: null, price_per_night: '', rating: '', amenities: '', category: 'Budget' };

  const load = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const headers = await getAdminHeaders();
      const { data } = await axios.get('/api/admin/hotels', { headers });
      const list = Array.isArray(data) ? data : [];
      adminCache.hotels = list;
      setHotels(list);
    } catch (err) {
      if (!isSilent) toast.error('Failed to load hotels: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(!!adminCache.hotels); }, [load]);

  const openAdd  = () => { setForm(BLANK); setModal('add'); };
  const openEdit = (h) => { setForm({ ...h, pendingImage: null, amenities: Array.isArray(h.amenities) ? h.amenities.join(', ') : h.amenities || '' }); setModal(h); };

  const handleSave = async () => {
    if (!form.name?.trim() || !form.location?.trim()) return toast.error('Name and location required');
    const rating = parseFloat(form.rating) || 0;
    if (rating < 0 || rating > 5) return toast.error('Rating must be between 0 and 5');
    
    setSaving(true);
    let finalImageUrl = form.image_url || '';

    // If an in-memory compressed image was selected, upload it NOW during save
    if (form.pendingImage?.blob) {
      try {
        const { publicUrl } = await uploadBlobToStorage(form.pendingImage.blob, 'place-images');
        finalImageUrl = publicUrl;
      } catch (uploadErr) {
        setSaving(false);
        return toast.error('Image upload failed: ' + uploadErr.message);
      }
    }

    // Clean up old storage image if image was replaced or removed
    if (modal !== 'add' && modal?.image_url && modal.image_url !== finalImageUrl) {
      deleteStorageFile(modal.image_url, 'place-images');
    }

    const payload = {
      ...form,
      image_url: finalImageUrl,
      amenities: typeof form.amenities === 'string'
        ? form.amenities.split(',').map(s => s.trim()).filter(Boolean)
        : form.amenities || [],
      price_per_night: parseInt(form.price_per_night) || 0,
      rating: Math.min(5, Math.max(0, rating)),
    };
    delete payload.pendingImage;

    // Instant Optimistic Update
    const isAdding = modal === 'add';
    const tempId = isAdding ? 'temp-' + Date.now() : modal.id;
    const optimisticHotel = { ...payload, id: tempId };

    if (isAdding) {
      setHotels(prev => [optimisticHotel, ...prev]);
      adminCache.hotels = [optimisticHotel, ...(adminCache.hotels || [])];
      toast.success('Hotel added!');
    } else {
      setHotels(prev => prev.map(h => h.id === modal.id ? optimisticHotel : h));
      adminCache.hotels = (adminCache.hotels || []).map(h => h.id === modal.id ? optimisticHotel : h);
      toast.success('Hotel updated!');
    }
    setModal(null);
    setSaving(false);

    // Background sync
    try {
      const headers = await getAdminHeaders();
      if (isAdding) {
        const { data } = await axios.post('/api/admin/hotels', payload, { headers });
        if (data?.id) {
          setHotels(prev => prev.map(h => h.id === tempId ? data : h));
          adminCache.hotels = (adminCache.hotels || []).map(h => h.id === tempId ? data : h);
        }
      } else {
        await axios.put(`/api/admin/hotels?id=${modal.id}`, payload, { headers });
      }
    } catch (err) {
      toast.error('Sync failed: ' + (err.response?.data?.error || err.message));
      load(false);
    }
  };

  const handleDelete = async (id) => {
    // Find hotel and clean up storage image
    const target = hotels.find(h => h.id === id);
    if (target?.image_url) {
      deleteStorageFile(target.image_url, 'place-images');
    }

    // Instant Optimistic Delete
    setHotels(prev => prev.filter(h => h.id !== id));
    adminCache.hotels = (adminCache.hotels || []).filter(h => h.id !== id);
    setConfirm(null);
    toast.success('Hotel deleted');

    // Background sync
    try {
      const headers = await getAdminHeaders();
      await axios.delete(`/api/admin/hotels?id=${id}`, { headers });
    } catch (err) {
      toast.error('Delete sync failed: ' + (err.response?.data?.error || err.message));
      load(false);
    }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const filtered = hotels.filter(h =>
    h.name?.toLowerCase().includes(search.toLowerCase()) ||
    h.location?.toLowerCase().includes(search.toLowerCase()) ||
    h.category?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Spinner />;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-600 dark:text-teal-400 pointer-events-none" size={14} />
          <input
            type="text"
            placeholder="Search hotels by name, location, category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
          />
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center justify-center gap-1.5 text-xs sm:text-sm px-4 py-2.5 flex-shrink-0">
          <FaPlus size={11} /> Add Hotel
        </button>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
        <span>{filtered.length} of {hotels.length} hotels</span>
        <button onClick={() => load(false)} className="flex items-center gap-1 hover:text-teal-600 dark:hover:text-teal-400">
          <FaRedo size={10} /> Refresh
        </button>
      </div>

      <div className="space-y-2.5">
        {filtered.map(hotel => (
          <div key={hotel.id}
            className="flex items-center gap-3 p-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50"
          >
            {hotel.image_url && (
              <img src={hotel.image_url} alt={hotel.name}
                className="w-12 h-12 rounded-xl object-cover flex-shrink-0 bg-gray-200 dark:bg-gray-700"
                onError={e => e.target.style.display = 'none'} />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{hotel.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{hotel.location} · {hotel.category}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400">₹{hotel.price_per_night?.toLocaleString('en-IN')}/night</span>
                <Stars n={hotel.rating} />
                <span className="text-xs text-gray-400">{hotel.rating}/5</span>
              </div>
            </div>
            <RowActions onEdit={() => openEdit(hotel)} onDelete={() => setConfirm(hotel.id)} editColor="teal" />
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            <p>{search ? 'No hotels match your search.' : 'No hotels yet. Add one above.'}</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {modal && (
          <Modal
            title={modal === 'add' ? 'Add Hotel' : 'Edit Hotel'}
            onClose={() => setModal(null)}
            footer={
              <>
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="flex-1 py-3 px-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xs sm:text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-all cursor-pointer active:scale-95 touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 touch-manipulation disabled:opacity-50"
                >
                  <FaCheck /> {modal === 'add' ? 'Add Hotel' : 'Update Hotel'}
                </button>
              </>
            }
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Hotel Name" required>
                  <input className="input-field" value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="e.g. Sea Pearl Resort" />
                </Field>
                <Field label="Location" required>
                  <input className="input-field" value={form.location || ''} onChange={e => set('location', e.target.value)} placeholder="e.g. Port Blair" />
                </Field>
              </div>

              <Field label="Description">
                <textarea rows={3} className="input-field resize-none" value={form.description || ''} onChange={e => set('description', e.target.value)} placeholder="Brief description of the hotel..." />
              </Field>

              <ImageUploadField
                label="Hotel Image"
                value={form.image_url || ''}
                pendingImage={form.pendingImage}
                onChange={url => set('image_url', url)}
                onPendingChange={pending => set('pendingImage', pending)}
              />

              <div className="grid grid-cols-2 gap-4">
                <Field label="Price per Night (₹)" required>
                  <div className="relative">
                    <FaRupeeSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                    <input type="number" min="0" className="input-field pl-8" value={form.price_per_night || ''} onChange={e => set('price_per_night', e.target.value)} placeholder="4500" />
                  </div>
                </Field>
                <Field label="Rating (0 – 5)">
                  <input type="number" min="0" max="5" step="0.1" className="input-field" value={form.rating || ''} onChange={e => set('rating', e.target.value)} placeholder="4.2" />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Category">
                  <select className="input-field" value={form.category || 'Budget'} onChange={e => set('category', e.target.value)}>
                    {['Budget', 'Premium', 'Luxury', 'Ultra Luxury'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Amenities (comma-separated)">
                  <input className="input-field" value={form.amenities || ''} onChange={e => set('amenities', e.target.value)} placeholder="Pool, WiFi, AC, Spa..." />
                </Field>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {confirm && (
        <ConfirmDialog
          message="Delete this hotel? This cannot be undone."
          onConfirm={() => handleDelete(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}

// ── Tourist Places Tab ────────────────────────────────────────────────────────
function TouristPlacesTab() {
  const [places, setPlaces] = useState(adminCache.places || []);
  const [loading, setLoading] = useState(!adminCache.places);
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const CATEGORIES = ['Beach', 'Island', 'Historical', 'Nature', 'Adventure', 'Cultural'];
  const BLANK = { name: '', location: '', description: '', image_url: '', pendingImage: null, category: 'Beach', rating: '', best_time: '', lat: '', lng: '' };

  const load = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const headers = await getAdminHeaders();
      const { data } = await axios.get('/api/admin/tourist-places', { headers });
      const list = Array.isArray(data) ? data : [];
      adminCache.places = list;
      setPlaces(list);
    } catch (err) {
      if (!isSilent) toast.error('Failed to load places');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(!!adminCache.places); }, [load]);

  const openAdd  = () => { setForm(BLANK); setModal('add'); };
  const openEdit = (p) => { setForm({ ...p, pendingImage: null, lat: p.lat ?? '', lng: p.lng ?? '' }); setModal(p); };

  const handleSave = async () => {
    if (!form.name?.trim() || !form.location?.trim()) return toast.error('Name and location required');
    const rating = parseFloat(form.rating) || 0;
    if (rating < 0 || rating > 5) return toast.error('Rating must be between 0 and 5');

    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    if (isNaN(lat) || isNaN(lng)) {
      return toast.error('Valid Latitude and Longitude are required for map location');
    }

    setSaving(true);
    let finalImageUrl = form.image_url || '';

    // If an in-memory compressed image was selected, upload it NOW during save
    if (form.pendingImage?.blob) {
      try {
        const { publicUrl } = await uploadBlobToStorage(form.pendingImage.blob, 'place-images');
        finalImageUrl = publicUrl;
      } catch (uploadErr) {
        setSaving(false);
        return toast.error('Image upload failed: ' + uploadErr.message);
      }
    }

    // Clean up old storage image if image was replaced or removed
    if (modal !== 'add' && modal?.image_url && modal.image_url !== finalImageUrl) {
      deleteStorageFile(modal.image_url, 'place-images');
    }

    const payload = {
      ...form,
      image_url: finalImageUrl,
      rating: Math.min(5, Math.max(0, rating)),
      lat,
      lng,
    };
    delete payload.pendingImage;

    // Instant Optimistic Update
    const isAdding = modal === 'add';
    const tempId = isAdding ? 'temp-' + Date.now() : modal.id;
    const optimisticPlace = { ...payload, id: tempId };

    if (isAdding) {
      setPlaces(prev => [optimisticPlace, ...prev]);
      adminCache.places = [optimisticPlace, ...(adminCache.places || [])];
      toast.success('Place added!');
    } else {
      setPlaces(prev => prev.map(p => p.id === modal.id ? optimisticPlace : p));
      adminCache.places = (adminCache.places || []).map(p => p.id === modal.id ? optimisticPlace : p);
      toast.success('Place updated!');
    }
    setModal(null);
    setSaving(false);

    // Background sync
    try {
      const headers = await getAdminHeaders();
      if (isAdding) {
        const { data } = await axios.post('/api/admin/tourist-places', payload, { headers });
        if (data?.id) {
          setPlaces(prev => prev.map(p => p.id === tempId ? data : p));
          adminCache.places = (adminCache.places || []).map(p => p.id === tempId ? data : p);
        }
      } else {
        await axios.put(`/api/admin/tourist-places?id=${modal.id}`, payload, { headers });
      }
    } catch (err) {
      toast.error('Sync failed: ' + (err.response?.data?.error || err.message));
      load(false);
    }
  };

  const handleDelete = async (id) => {
    // Find place and clean up storage image
    const target = places.find(p => p.id === id);
    if (target?.image_url) {
      deleteStorageFile(target.image_url, 'place-images');
    }

    // Instant Optimistic Delete
    setPlaces(prev => prev.filter(p => p.id !== id));
    adminCache.places = (adminCache.places || []).filter(p => p.id !== id);
    setConfirm(null);
    toast.success('Place deleted');

    // Background sync
    try {
      const headers = await getAdminHeaders();
      await axios.delete(`/api/admin/tourist-places?id=${id}`, { headers });
    } catch (err) {
      toast.error('Delete sync failed: ' + (err.response?.data?.error || err.message));
      load(false);
    }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const filtered = places.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.location?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Spinner />;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-purple-600 dark:text-purple-400 pointer-events-none" size={14} />
          <input
            type="text"
            placeholder="Search places by name, location, category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
          />
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center justify-center gap-1.5 text-xs sm:text-sm px-4 py-2.5 flex-shrink-0">
          <FaPlus size={11} /> Add Place
        </button>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
        <span>{filtered.length} of {places.length} places</span>
        <button onClick={() => load(false)} className="flex items-center gap-1 hover:text-teal-600 dark:hover:text-teal-400">
          <FaRedo size={10} /> Refresh
        </button>
      </div>

      <div className="space-y-2.5">
        {filtered.map(place => (
          <div key={place.id}
            className="flex items-center gap-3 p-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50"
          >
            {place.image_url && (
              <img src={place.image_url} alt={place.name}
                className="w-12 h-12 rounded-xl object-cover flex-shrink-0 bg-gray-200 dark:bg-gray-700"
                onError={e => e.target.style.display = 'none'} />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{place.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{place.location} · <span className="text-purple-600 dark:text-purple-400">{place.category}</span></p>
              <div className="flex items-center gap-2 mt-0.5">
                <Stars n={place.rating} />
                <span className="text-xs text-gray-400">{place.rating}/5</span>
                {place.best_time && <span className="text-xs text-gray-400">· Best: {place.best_time}</span>}
              </div>
            </div>
            <RowActions onEdit={() => openEdit(place)} onDelete={() => setConfirm(place.id)} editColor="purple" />
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            <p>{search ? 'No places match your search.' : 'No places yet. Add one above.'}</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {modal && (
          <Modal
            title={modal === 'add' ? 'Add Tourist Place' : 'Edit Tourist Place'}
            onClose={() => setModal(null)}
            footer={
              <>
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="flex-1 py-3 px-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xs sm:text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-all cursor-pointer active:scale-95 touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 touch-manipulation disabled:opacity-50"
                >
                  <FaCheck /> {modal === 'add' ? 'Add Place' : 'Update Place'}
                </button>
              </>
            }
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Place Name" required>
                  <input className="input-field" value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="e.g. Radhanagar Beach" />
                </Field>
                <Field label="Location" required>
                  <input className="input-field" value={form.location || ''} onChange={e => set('location', e.target.value)} placeholder="e.g. Havelock Island" />
                </Field>
              </div>

              <Field label="Description">
                <textarea rows={3} className="input-field resize-none" value={form.description || ''} onChange={e => set('description', e.target.value)} />
              </Field>

              <ImageUploadField
                label="Place Image"
                value={form.image_url || ''}
                pendingImage={form.pendingImage}
                onChange={url => set('image_url', url)}
                onPendingChange={pending => set('pendingImage', pending)}
              />

              <div className="grid grid-cols-2 gap-4">
                <Field label="Category">
                  <select className="input-field" value={form.category || 'Beach'} onChange={e => set('category', e.target.value)}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Rating (0 – 5)">
                  <input type="number" min="0" max="5" step="0.1" className="input-field" value={form.rating || ''} onChange={e => set('rating', e.target.value)} placeholder="4.5" />
                </Field>
              </div>

              <Field label="Best Time to Visit">
                <input className="input-field" value={form.best_time || ''} onChange={e => set('best_time', e.target.value)} placeholder="e.g. Oct – May" />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Latitude (GPS)" required>
                  <input type="number" step="any" className="input-field" value={form.lat || ''} onChange={e => set('lat', e.target.value)} placeholder="11.6234" required />
                </Field>
                <Field label="Longitude (GPS)" required>
                  <input type="number" step="any" className="input-field" value={form.lng || ''} onChange={e => set('lng', e.target.value)} placeholder="92.7265" required />
                </Field>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {confirm && (
        <ConfirmDialog
          message="Delete this tourist place? This cannot be undone."
          onConfirm={() => handleDelete(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}

// ── Ship Schedule Tab ─────────────────────────────────────────────────────────
function ShipScheduleTab() {
  const [schedules, setSchedules] = useState(adminCache.schedules || []);
  const [loading, setLoading] = useState(!adminCache.schedules);
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const BLANK = {
    ship_name: '', from: '', to: '',
    departure_time: '', arrival_time: '',
    status: 'on_time', days: [],
    price: '1250',
    distance_nm: '', duration_estimate: '',
    route_type: 'inter_island',
    departure_lat: '', departure_lng: '',
    arrival_lat: '', arrival_lng: '',
    waypoints: '',
  };

  const load = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const headers = await getAdminHeaders();
      const { data } = await axios.get('/api/admin/ship-schedule', { headers });
      const list = Array.isArray(data) ? data : [];
      adminCache.schedules = list;
      setSchedules(list);
    } catch (err) {
      if (!isSilent) toast.error('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(!!adminCache.schedules); }, [load]);

  const openAdd  = () => { setForm(BLANK); setModal('add'); };
  const openEdit = (s) => {
    setForm({
      ...BLANK, ...s,
      price: s.price ?? s.fare ?? 1250,
      days: Array.isArray(s.days) ? s.days : [],
      distance_nm: s.distance_nm ?? '',
      duration_estimate: s.duration_estimate ?? '',
      departure_lat: s.departure_lat ?? '',
      departure_lng: s.departure_lng ?? '',
      arrival_lat: s.arrival_lat ?? '',
      arrival_lng: s.arrival_lng ?? '',
      waypoints: s.waypoints ? (typeof s.waypoints === 'string' ? s.waypoints : JSON.stringify(s.waypoints)) : '',
    });
    setModal(s);
  };

  const handleSave = async () => {
    if (!form.ship_name?.trim() || !form.from?.trim() || !form.to?.trim()) {
      return toast.error('Ship name, from and to are required');
    }
    if (!form.departure_time || !form.arrival_time) {
      return toast.error('Departure and arrival times are required');
    }

    const price = parseInt(form.price) || 0;
    if (price <= 0) {
      return toast.error('Valid seat fare / price is required');
    }

    const depLat = parseFloat(form.departure_lat);
    const depLng = parseFloat(form.departure_lng);
    const arrLat = parseFloat(form.arrival_lat);
    const arrLng = parseFloat(form.arrival_lng);
    if (isNaN(depLat) || isNaN(depLng)) {
      return toast.error('Valid Departure Latitude and Longitude are required');
    }
    if (isNaN(arrLat) || isNaN(arrLng)) {
      return toast.error('Valid Arrival Latitude and Longitude are required');
    }

    let parsedWaypoints = null;
    if (form.waypoints) {
      if (typeof form.waypoints === 'string' && form.waypoints.trim()) {
        try {
          parsedWaypoints = JSON.parse(form.waypoints);
        } catch {
          try {
            parsedWaypoints = form.waypoints
              .split(';')
              .map(p => p.split(',').map(n => parseFloat(n.trim())))
              .filter(p => p.length === 2 && !isNaN(p[0]) && !isNaN(p[1]));
            if (parsedWaypoints.length === 0) parsedWaypoints = null;
          } catch {
            parsedWaypoints = null;
          }
        }
      } else if (Array.isArray(form.waypoints)) {
        parsedWaypoints = form.waypoints;
      }
    }

    const payload = {
      ...form,
      price,
      days: form.days || [],
      distance_nm: form.distance_nm ? parseFloat(form.distance_nm) : null,
      departure_lat: depLat,
      departure_lng: depLng,
      arrival_lat: arrLat,
      arrival_lng: arrLng,
      waypoints: parsedWaypoints,
    };

    // Instant Optimistic Update
    const isAdding = modal === 'add';
    const tempId = isAdding ? 'temp-' + Date.now() : modal.id;
    const optimisticSchedule = { ...payload, id: tempId };

    if (isAdding) {
      setSchedules(prev => [optimisticSchedule, ...prev]);
      adminCache.schedules = [optimisticSchedule, ...(adminCache.schedules || [])];
      toast.success('Route added with dynamic fare!');
    } else {
      setSchedules(prev => prev.map(s => s.id === modal.id ? optimisticSchedule : s));
      adminCache.schedules = (adminCache.schedules || []).map(s => s.id === modal.id ? optimisticSchedule : s);
      toast.success('Route updated with dynamic fare!');
    }
    setModal(null);

    // Background sync
    try {
      const headers = await getAdminHeaders();
      if (isAdding) {
        const { data } = await axios.post('/api/admin/ship-schedule', payload, { headers });
        if (data?.id) {
          setSchedules(prev => prev.map(s => s.id === tempId ? data : s));
          adminCache.schedules = (adminCache.schedules || []).map(s => s.id === tempId ? data : s);
        }
      } else {
        await axios.put(`/api/admin/ship-schedule?id=${modal.id}`, payload, { headers });
      }
    } catch (err) {
      toast.error('Sync failed: ' + (err.response?.data?.error || err.message));
      load(false);
    }
  };

  const handleDelete = async (id) => {
    // Instant Optimistic Delete
    setSchedules(prev => prev.filter(s => s.id !== id));
    adminCache.schedules = (adminCache.schedules || []).filter(s => s.id !== id);
    setConfirm(null);
    toast.success('Route deleted');

    // Background sync
    try {
      const headers = await getAdminHeaders();
      await axios.delete(`/api/admin/ship-schedule?id=${id}`, { headers });
    } catch (err) {
      toast.error('Delete sync failed: ' + (err.response?.data?.error || err.message));
      load(false);
    }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const filtered = schedules.filter(s =>
    s.ship_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.from?.toLowerCase().includes(search.toLowerCase()) ||
    s.to?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Spinner />;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400 pointer-events-none" size={14} />
          <input
            type="text"
            placeholder="Search by ship name, from or to port..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center justify-center gap-1.5 text-xs sm:text-sm px-4 py-2.5 flex-shrink-0">
          <FaPlus size={11} /> Add Route
        </button>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
        <span>{filtered.length} of {schedules.length} routes</span>
        <button onClick={() => load(false)} className="flex items-center gap-1 hover:text-teal-600 dark:hover:text-teal-400">
          <FaRedo size={10} /> Refresh
        </button>
      </div>

      <div className="space-y-2.5">
        {filtered.map(s => (
          <div key={s.id}
            className="flex items-center gap-3 p-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white flex-shrink-0">
              <FaShip size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{s.ship_name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{s.from} → {s.to} · {s.departure_time} – {s.arrival_time}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  ₹{(s.price || 1250).toLocaleString('en-IN')}/seat
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_BADGE[s.status] || ''}`}>
                  {s.status?.replace('_', ' ')}
                </span>
                {s.days?.length > 0 && (
                  <span className="text-[10px] text-gray-400">{s.days.join(', ')}</span>
                )}
              </div>
            </div>
            <RowActions onEdit={() => openEdit(s)} onDelete={() => setConfirm(s.id)} editColor="blue" />
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            <p>{search ? 'No routes match your search.' : 'No ferry routes yet. Add one above.'}</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {modal && (
          <Modal
            title={modal === 'add' ? 'Add Ferry Route' : 'Edit Ferry Route'}
            onClose={() => setModal(null)}
            wide
            footer={
              <>
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="flex-1 py-3 px-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xs sm:text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-all cursor-pointer active:scale-95 touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 touch-manipulation disabled:opacity-50"
                >
                  <FaCheck /> {modal === 'add' ? 'Add Route' : 'Update Route'}
                </button>
              </>
            }
          >
            <div className="space-y-5">
              {/* Basic Info */}
              <div>
                <p className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">Basic Information &amp; Dynamic Pricing</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-3">
                    <Field label="Ship / Vessel Name" required>
                      <input className="input-field" value={form.ship_name || ''} onChange={e => set('ship_name', e.target.value)} placeholder="e.g. MV Andaman Cruise" required />
                    </Field>
                  </div>
                  <Field label="From (Departure Port)" required>
                    <input className="input-field" value={form.from || ''} onChange={e => set('from', e.target.value)} placeholder="Port Blair" required />
                  </Field>
                  <Field label="To (Arrival Port)" required>
                    <input className="input-field" value={form.to || ''} onChange={e => set('to', e.target.value)} placeholder="Havelock Island" required />
                  </Field>
                  <Field label="Fare / Seat Price (₹)" required>
                    <input type="number" min="0" className="input-field" value={form.price || ''} onChange={e => set('price', e.target.value)} placeholder="1250" required />
                  </Field>
                  <div className="sm:col-span-3">
                    <Field label="Route Type">
                      <select className="input-field" value={form.route_type || 'inter_island'} onChange={e => set('route_type', e.target.value)}>
                        <option value="inter_island">Island Hopping (Inter-Island)</option>
                        <option value="mainland_to_island">Getting to Andaman (Mainland → Island)</option>
                      </select>
                    </Field>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div>
                <p className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">Schedule &amp; Timing</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <Field label="Departure Time" required>
                    <input type="time" className="input-field [color-scheme:light] dark:[color-scheme:dark]" value={form.departure_time || ''} onChange={e => set('departure_time', e.target.value)} required />
                  </Field>
                  <Field label="Arrival Time" required>
                    <input type="time" className="input-field [color-scheme:light] dark:[color-scheme:dark]" value={form.arrival_time || ''} onChange={e => set('arrival_time', e.target.value)} required />
                  </Field>
                  <Field label="Distance (Nautical Miles)">
                    <input type="number" min="0" step="0.1" className="input-field" value={form.distance_nm || ''} onChange={e => set('distance_nm', e.target.value)} placeholder="e.g. 57.5" />
                  </Field>
                  <Field label="Duration Estimate">
                    <input className="input-field" value={form.duration_estimate || ''} onChange={e => set('duration_estimate', e.target.value)} placeholder="e.g. 2h 30m" />
                  </Field>
                </div>
                <Field label="Operating Days">
                  <DayCheckboxes value={form.days || []} onChange={v => set('days', v)} />
                </Field>
              </div>

              {/* Status */}
              <div>
                <p className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">Status</p>
                <div className="flex gap-3">
                  {[{ v: 'on_time', label: 'On Time' }, { v: 'delayed', label: 'Delayed' }, { v: 'cancelled', label: 'Cancelled' }].map(({ v, label }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => set('status', v)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all
                        ${form.status === v
                          ? v === 'on_time' ? 'bg-green-500 border-green-500 text-white'
                            : v === 'delayed' ? 'bg-amber-500 border-amber-500 text-white'
                            : 'bg-red-500 border-red-500 text-white'
                          : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* GPS Coordinates (Required for Map Display) */}
              <div>
                <p className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">
                  GPS Coordinates (Required for Map)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Departure Latitude" required>
                    <input type="number" step="any" className="input-field" value={form.departure_lat || ''} onChange={e => set('departure_lat', e.target.value)} placeholder="11.6234" required />
                  </Field>
                  <Field label="Departure Longitude" required>
                    <input type="number" step="any" className="input-field" value={form.departure_lng || ''} onChange={e => set('departure_lng', e.target.value)} placeholder="92.7265" required />
                  </Field>
                  <Field label="Arrival Latitude" required>
                    <input type="number" step="any" className="input-field" value={form.arrival_lat || ''} onChange={e => set('arrival_lat', e.target.value)} placeholder="11.9816" required />
                  </Field>
                  <Field label="Arrival Longitude" required>
                    <input type="number" step="any" className="input-field" value={form.arrival_lng || ''} onChange={e => set('arrival_lng', e.target.value)} placeholder="92.9996" required />
                  </Field>
                </div>
                <div className="mt-3">
                  <Field label="Waypoints / Polyline Navigation Coordinates (Optional)">
                    <input
                      className="input-field font-mono text-xs"
                      value={typeof form.waypoints === 'string' ? form.waypoints : (form.waypoints ? JSON.stringify(form.waypoints) : '')}
                      onChange={e => set('waypoints', e.target.value)}
                      placeholder="e.g. [[11.75, 92.80], [11.85, 92.90]]"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Intermediate coordinates plotted on the interactive route map to form curved navigation polylines.
                    </p>
                  </Field>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {confirm && (
        <ConfirmDialog
          message="Delete this ferry route? This cannot be undone."
          onConfirm={() => handleDelete(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}

// ── Date Match Helper for Bookings ──────────────────────────────────────────
function matchesBookingDateRange(dateStr, filter) {
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
function BookingConflictModal({ conflictData, isHotel, onClose, onResolve }) {
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

// ── Hotel Bookings Tab ────────────────────────────────────────────────────────
function BookingsTab() {
  const [bookings, setBookings] = useState(adminCache.bookings || []);
  const [loading, setLoading] = useState(!adminCache.bookings);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'confirmed' | 'completed' | 'cancelled'
  const [timeframeFilter, setTimeframeFilter] = useState('all'); // 'all' | 'today' | 'upcoming' | 'past' | '7days' | '30days'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'checkin_asc' | 'amount_desc' | 'amount_asc'
  const [search, setSearch] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [conflictModal, setConflictModal] = useState(null);

  const load = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const headers = await getAdminHeaders();
      const { data } = await axios.get('/api/admin/bookings', { headers });
      const list = Array.isArray(data) ? data : [];
      adminCache.bookings = list;
      setBookings(list);
    } catch (err) {
      if (!isSilent) toast.error('Failed to load hotel bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(!!adminCache.bookings); }, [load]);

  const updateStatus = async (id, status, newUnit = null, force = false) => {
    // If not confirming, do standard optimistic update
    if (status !== 'confirmed' || force || newUnit) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
      adminCache.bookings = (adminCache.bookings || []).map(b => b.id === id ? { ...b, status } : b);
    }

    try {
      const headers = await getAdminHeaders();
      const payload = { status };
      if (newUnit) payload.new_unit = newUnit;
      if (force) payload.force = true;

      await axios.put(`/api/admin/bookings?id=${id}`, payload, { headers });
      toast.success(newUnit ? `Re-allocated to Room ${newUnit} & confirmed!` : `Booking marked as ${status}`);
      setConflictModal(null);
      load(false);
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.conflict) {
        setConflictModal({
          bookingId: id,
          ...err.response.data,
        });
      } else {
        toast.error('Update sync failed: ' + (err.response?.data?.error || err.message));
        load(false);
      }
    }
  };

  const handleDelete = async (id) => {
    // Instant Optimistic Delete
    setBookings(prev => prev.filter(b => b.id !== id));
    adminCache.bookings = (adminCache.bookings || []).filter(b => b.id !== id);
    setConfirm(null);
    toast.success('Booking deleted');

    // Background sync
    try {
      const headers = await getAdminHeaders();
      await axios.delete(`/api/admin/bookings?id=${id}`, { headers });
    } catch (err) {
      toast.error('Delete sync failed: ' + (err.response?.data?.error || err.message));
      load(false);
    }
  };

  if (loading) return <Spinner />;

  // Dynamic counts for status pills
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const completedCount = bookings.filter(b => b.status === 'completed').length;
  const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;

  let displayed = bookings.filter(b => {
    const matchesStatus =
      statusFilter === 'all' ? true : b.status === statusFilter;

    const matchesDate = matchesBookingDateRange(b.check_in, timeframeFilter);

    const q = search.trim().toLowerCase();
    const matchesSearch = !q ||
      b.booking_ref?.toLowerCase().includes(q) ||
      b.guest_name?.toLowerCase().includes(q) ||
      b.guest_email?.toLowerCase().includes(q) ||
      b.guest_phone?.toLowerCase().includes(q) ||
      b.hotel_name?.toLowerCase().includes(q);

    return matchesStatus && matchesDate && matchesSearch;
  });

  // Sorting
  displayed = [...displayed].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    if (sortBy === 'checkin_asc') return new Date(a.check_in || 0) - new Date(b.check_in || 0);
    if (sortBy === 'amount_desc') return (b.total_amount || 0) - (a.total_amount || 0);
    if (sortBy === 'amount_asc') return (a.total_amount || 0) - (b.total_amount || 0);
    return 0;
  });

  const hasActiveFilters = statusFilter !== 'all' || timeframeFilter !== 'all' || search !== '' || sortBy !== 'newest';

  const resetAllFilters = () => {
    setStatusFilter('all');
    setTimeframeFilter('all');
    setSortBy('newest');
    setSearch('');
  };

  return (
    <>
      {/* Filter Controls Bar */}
      <div className="space-y-3 mb-5 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
        {/* Row 1: Status Filter Pills + Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'all'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              All Bookings
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                statusFilter === 'all' ? 'bg-white/20 dark:bg-gray-900/20' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
              }`}>
                {bookings.length}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('confirmed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'confirmed'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30'
              }`}
            >
              Confirmed
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                statusFilter === 'confirmed' ? 'bg-white/25 text-white' : 'bg-green-200/60 dark:bg-green-800/60 text-green-800 dark:text-green-300'
              }`}>
                {confirmedCount}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'completed'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30'
              }`}
            >
              Completed
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                statusFilter === 'completed' ? 'bg-white/25 text-white' : 'bg-blue-200/60 dark:bg-blue-800/60 text-blue-800 dark:text-blue-300'
              }`}>
                {completedCount}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'cancelled'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
              }`}
            >
              Cancelled
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                statusFilter === 'cancelled' ? 'bg-white/25 text-white' : 'bg-red-200/60 dark:bg-red-800/60 text-red-800 dark:text-red-300'
              }`}>
                {cancelledCount}
              </span>
            </button>
          </div>

          <button onClick={() => load(false)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-teal-600 dark:hover:text-teal-400 self-end sm:self-auto">
            <FaRedo size={10} /> Refresh
          </button>
        </div>

        {/* Row 2: Secondary Nested Filters (Timeframe, Sort, Search) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-gray-200/60 dark:border-gray-700/60">
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Check-in Dates</label>
            <select
              value={timeframeFilter}
              onChange={e => setTimeframeFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-teal-500"
            >
              <option value="all">All Dates</option>
              <option value="today">Today's Check-ins</option>
              <option value="upcoming">Upcoming Check-ins</option>
              <option value="past">Past Check-outs</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-teal-500"
            >
              <option value="newest">Newest Bookings</option>
              <option value="checkin_asc">Earliest Check-in</option>
              <option value="amount_desc">Highest Amount (₹)</option>
              <option value="amount_asc">Lowest Amount (₹)</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Search Bookings</label>
            <div className="relative">
              <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={10} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Ref, guest, email, phone, hotel..."
                className="w-full pl-7 pr-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Filter Summary & Reset Bar */}
        <div className="flex items-center justify-between pt-1 text-[11px] text-gray-500 dark:text-gray-400">
          <span>
            Showing <strong className="text-gray-900 dark:text-white">{displayed.length}</strong> of {bookings.length} hotel bookings
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

      {/* Bookings List */}
      <div className="space-y-3">
        {displayed.map(b => {
          const nights = Math.max(1, Math.ceil((new Date(b.check_out) - new Date(b.check_in)) / 86400000) || 1);
          return (
            <div key={b.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50 transition-all hover:border-gray-200 dark:hover:border-gray-700">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-gray-900 dark:text-white text-sm">{b.hotel_name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_BADGE[b.status] || ''}`}>{b.status}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Ref: <strong className="font-mono text-gray-700 dark:text-gray-300">{b.booking_ref}</strong>
                  </p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 font-medium mt-1">
                    {b.guest_name} {b.guest_phone ? `· ${b.guest_phone}` : ''} {b.guest_email ? `· ${b.guest_email}` : ''}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {b.check_in} → {b.check_out} · {nights} night{nights > 1 ? 's' : ''} · {b.guests} guest{b.guests > 1 ? 's' : ''} · {b.rooms} room{b.rooms > 1 ? 's' : ''}
                  </p>
                  {b.created_at && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      Booked: {new Date(b.created_at).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-base font-black text-teal-600 dark:text-teal-400 block">
                    ₹{(b.total_amount || 0).toLocaleString('en-IN')}
                  </span>
                  <button
                    onClick={() => setConfirm(b.id)}
                    className="p-1.5 mt-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Delete booking record"
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap pt-2 border-t border-gray-100 dark:border-gray-700/50">
                {b.status !== 'confirmed' && (
                  <button onClick={() => updateStatus(b.id, 'confirmed')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-green-50 dark:bg-green-900/30 text-green-600 hover:bg-green-100 transition-colors">
                    <FaCheckCircle size={11} /> Confirm
                  </button>
                )}
                {b.status !== 'completed' && (
                  <button onClick={() => updateStatus(b.id, 'completed')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-100 transition-colors">
                    <FaClock size={11} /> Mark Completed
                  </button>
                )}
                {b.status !== 'cancelled' && (
                  <button onClick={() => updateStatus(b.id, 'cancelled')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 dark:bg-red-900/30 text-red-500 hover:bg-red-100 transition-colors">
                    <FaTimesCircle size={11} /> Cancel Booking
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {displayed.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            <p>No hotel bookings match your active filters.</p>
          </div>
        )}
      </div>

      {confirm && (
        <ConfirmDialog
          message="Delete this hotel booking record? This cannot be undone."
          onConfirm={() => handleDelete(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}

      {conflictModal && (
        <BookingConflictModal
          isHotel={true}
          conflictData={conflictModal}
          onResolve={({ newUnit, force }) => updateStatus(conflictModal.bookingId, 'confirmed', newUnit, force)}
          onClose={() => setConflictModal(null)}
        />
      )}
    </>
  );
}

// ── Ship / Ferry Bookings Tab ─────────────────────────────────────────────────
function FerryBookingsTab() {
  const [bookings, setBookings] = useState(adminCache.ferryBookings || []);
  const [loading, setLoading] = useState(!adminCache.ferryBookings);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'confirmed' | 'completed' | 'cancelled'
  const [timeframeFilter, setTimeframeFilter] = useState('all'); // 'all' | 'today' | 'upcoming' | 'past' | '7days' | '30days'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'travel_asc' | 'amount_desc' | 'seats_desc'
  const [search, setSearch] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [conflictModal, setConflictModal] = useState(null);

  const load = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const headers = await getAdminHeaders();
      const { data } = await axios.get('/api/admin/ferry-bookings', { headers });
      const list = Array.isArray(data) ? data : [];
      adminCache.ferryBookings = list;
      setBookings(list);
    } catch (err) {
      if (!isSilent) toast.error('Failed to load ship bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(!!adminCache.ferryBookings); }, [load]);

  const updateStatus = async (id, status, newUnit = null, force = false) => {
    if (status !== 'confirmed' || force || newUnit) {
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
      adminCache.ferryBookings = (adminCache.ferryBookings || []).map(b => b.id === id ? { ...b, status } : b);
    }

    try {
      const headers = await getAdminHeaders();
      const payload = { status };
      if (newUnit) payload.new_unit = newUnit;
      if (force) payload.force = true;

      await axios.put(`/api/admin/ferry-bookings?id=${id}`, payload, { headers });
      toast.success(newUnit ? `Re-allocated to Seat ${newUnit} & confirmed!` : `Ship booking marked as ${status}`);
      setConflictModal(null);
      load(false);
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.conflict) {
        setConflictModal({
          bookingId: id,
          ...err.response.data,
        });
      } else {
        toast.error('Update sync failed: ' + (err.response?.data?.error || err.message));
        load(false);
      }
    }
  };

  const handleDelete = async (id) => {
    // Instant Optimistic Delete
    setBookings(prev => prev.filter(b => b.id !== id));
    adminCache.ferryBookings = (adminCache.ferryBookings || []).filter(b => b.id !== id);
    setConfirm(null);
    toast.success('Ship booking deleted');

    // Background sync
    try {
      const headers = await getAdminHeaders();
      await axios.delete(`/api/admin/ferry-bookings?id=${id}`, { headers });
    } catch (err) {
      toast.error('Delete sync failed: ' + (err.response?.data?.error || err.message));
      load(false);
    }
  };

  if (loading) return <Spinner />;

  // Dynamic counts for status pills
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const completedCount = bookings.filter(b => b.status === 'completed').length;
  const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;

  let displayed = bookings.filter(b => {
    const matchesStatus =
      statusFilter === 'all' ? true : b.status === statusFilter;

    const matchesDate = matchesBookingDateRange(b.travel_date, timeframeFilter);

    const q = search.trim().toLowerCase();
    const matchesSearch = !q ||
      b.booking_ref?.toLowerCase().includes(q) ||
      b.passenger_name?.toLowerCase().includes(q) ||
      b.passenger_email?.toLowerCase().includes(q) ||
      b.passenger_phone?.toLowerCase().includes(q) ||
      b.ship_name?.toLowerCase().includes(q) ||
      b.from?.toLowerCase().includes(q) ||
      b.to?.toLowerCase().includes(q);

    return matchesStatus && matchesDate && matchesSearch;
  });

  // Sorting
  displayed = [...displayed].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    if (sortBy === 'travel_asc') return new Date(a.travel_date || 0) - new Date(b.travel_date || 0);
    if (sortBy === 'amount_desc') return (b.total_amount || 0) - (a.total_amount || 0);
    if (sortBy === 'seats_desc') return (b.seats || 0) - (a.seats || 0);
    return 0;
  });

  const hasActiveFilters = statusFilter !== 'all' || timeframeFilter !== 'all' || search !== '' || sortBy !== 'newest';

  const resetAllFilters = () => {
    setStatusFilter('all');
    setTimeframeFilter('all');
    setSortBy('newest');
    setSearch('');
  };

  return (
    <>
      {/* Filter Controls Bar */}
      <div className="space-y-3 mb-5 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50">
        {/* Row 1: Status Filter Pills + Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'all'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              All Ship Bookings
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                statusFilter === 'all' ? 'bg-white/20 dark:bg-gray-900/20' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
              }`}>
                {bookings.length}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('confirmed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'confirmed'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30'
              }`}
            >
              Confirmed
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                statusFilter === 'confirmed' ? 'bg-white/25 text-white' : 'bg-green-200/60 dark:bg-green-800/60 text-green-800 dark:text-green-300'
              }`}>
                {confirmedCount}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'completed'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30'
              }`}
            >
              Completed
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                statusFilter === 'completed' ? 'bg-white/25 text-white' : 'bg-blue-200/60 dark:bg-blue-800/60 text-blue-800 dark:text-blue-300'
              }`}>
                {completedCount}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === 'cancelled'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
              }`}
            >
              Cancelled
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                statusFilter === 'cancelled' ? 'bg-white/25 text-white' : 'bg-red-200/60 dark:bg-red-800/60 text-red-800 dark:text-red-300'
              }`}>
                {cancelledCount}
              </span>
            </button>
          </div>

          <button onClick={() => load(false)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-cyan-600 dark:hover:text-cyan-400 self-end sm:self-auto">
            <FaRedo size={10} /> Refresh
          </button>
        </div>

        {/* Row 2: Secondary Nested Filters (Timeframe, Sort, Search) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-gray-200/60 dark:border-gray-700/60">
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Travel Dates</label>
            <select
              value={timeframeFilter}
              onChange={e => setTimeframeFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Dates</option>
              <option value="today">Today's Departures</option>
              <option value="upcoming">Upcoming Trips</option>
              <option value="past">Past Trips</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="newest">Newest Bookings</option>
              <option value="travel_asc">Earliest Travel Date</option>
              <option value="amount_desc">Highest Amount (₹)</option>
              <option value="seats_desc">Most Seats</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Search Ship Bookings</label>
            <div className="relative">
              <FaSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={10} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Ref, passenger, ship, from, to..."
                className="w-full pl-7 pr-2.5 py-1.5 text-xs rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Filter Summary & Reset Bar */}
        <div className="flex items-center justify-between pt-1 text-[11px] text-gray-500 dark:text-gray-400">
          <span>
            Showing <strong className="text-gray-900 dark:text-white">{displayed.length}</strong> of {bookings.length} ship bookings
          </span>
          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="text-cyan-600 dark:text-cyan-400 hover:underline font-bold"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* Ferry Bookings List */}
      <div className="space-y-3">
        {displayed.map(b => (
          <div key={b.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50 transition-all hover:border-gray-200 dark:hover:border-gray-700">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-bold text-gray-900 dark:text-white text-sm">{b.ship_name || 'Ferry Trip'}</span>
                  {b.from && b.to && (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300">
                      {b.from} → {b.to}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_BADGE[b.status] || ''}`}>{b.status}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Ref: <strong className="font-mono text-gray-700 dark:text-gray-300">{b.booking_ref}</strong>
                </p>
                <p className="text-xs text-gray-700 dark:text-gray-300 font-medium mt-1">
                  {b.passenger_name} {b.passenger_phone ? `· ${b.passenger_phone}` : ''} {b.passenger_email ? `· ${b.passenger_email}` : ''}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Travel Date: <strong className="text-gray-700 dark:text-gray-300">{b.travel_date}</strong> {b.departure_time ? `at ${b.departure_time}` : ''} · {b.seats || 1} seat{(b.seats || 1) > 1 ? 's' : ''}
                </p>
                {b.created_at && (
                  <p className="text-[10px] text-gray-400 mt-1">
                    Booked: {new Date(b.created_at).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-base font-black text-cyan-600 dark:text-cyan-400 block">
                  ₹{(b.total_amount || 0).toLocaleString('en-IN')}
                </span>
                <button
                  onClick={() => setConfirm(b.id)}
                  className="p-1.5 mt-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Delete ship booking record"
                >
                  <FaTrash size={12} />
                </button>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap pt-2 border-t border-gray-100 dark:border-gray-700/50">
              {b.status !== 'confirmed' && (
                <button onClick={() => updateStatus(b.id, 'confirmed')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-green-50 dark:bg-green-900/30 text-green-600 hover:bg-green-100 transition-colors">
                  <FaCheckCircle size={11} /> Confirm
                </button>
              )}
              {b.status !== 'completed' && (
                <button onClick={() => updateStatus(b.id, 'completed')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-100 transition-colors">
                  <FaClock size={11} /> Mark Completed
                </button>
              )}
              {b.status !== 'cancelled' && (
                <button onClick={() => updateStatus(b.id, 'cancelled')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 dark:bg-red-900/30 text-red-500 hover:bg-red-100 transition-colors">
                  <FaTimesCircle size={11} /> Cancel Booking
                </button>
              )}
            </div>
          </div>
        ))}
        {displayed.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            <p>No ship bookings match your active filters.</p>
          </div>
        )}
      </div>

      {confirm && (
        <ConfirmDialog
          message="Delete this ship booking record? This cannot be undone."
          onConfirm={() => handleDelete(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}

      {conflictModal && (
        <BookingConflictModal
          isHotel={false}
          conflictData={conflictModal}
          onResolve={({ newUnit, force }) => updateStatus(conflictModal.bookingId, 'confirmed', newUnit, force)}
          onClose={() => setConflictModal(null)}
        />
      )}
    </>
  );
}

// ── Queries Tab ───────────────────────────────────────────────────────────────
function QueriesTab() {
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
function FeedbackTab() {
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

  useEffect(() => { load(!!adminCache.feedback); }, [load]);

  const toggleHide = async (item) => {
    const newHidden = !item.hidden;
    setItems(prev => prev.map(f => f.id === item.id ? { ...f, hidden: newHidden } : f));
    adminCache.feedback = (adminCache.feedback || []).map(f => f.id === item.id ? { ...f, hidden: newHidden } : f);
    toast.success(newHidden ? 'Feedback hidden' : 'Feedback unhidden');
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
    try {
      const headers = await getAdminHeaders();
      await axios.delete(`/api/admin/feedback?id=${id}`, { headers });
    } catch {
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


// ── Alerts Tab ────────────────────────────────────────────────────────────────
const ALERT_TYPES = ['info', 'warning', 'danger', 'success'];
const ALERT_TYPE_STYLES = {
  info:    'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
  warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
  danger:  'bg-red-100 dark:bg-red-900/30 text-red-600',
  success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600',
};
const BLANK_ALERT = { title: '', message: '', type: 'info', active: true, expires_at: '' };

function AlertsTab() {
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

// ── Deleted Accounts Tab (30-Day Recovery Vault) ──────────────────────────────
function DeletedAccountsTab() {
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

// ── Manage Admins Tab (Superadmin only) ───────────────────────────────────────
function ManageAdminsTab() {
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

// ── Main AdminDashboard ───────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { session, profile, isSuperAdmin, isDemoAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('hotels');

  const TABS = isSuperAdmin ? [...BASE_TABS, SUPERADMIN_TAB] : BASE_TABS;
  const activeTabObj = TABS.find(t => t.id === activeTab) || TABS[0];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-16 md:pt-20">
      {/* ── Mobile Header ─────────────────────────────────────────────────── */}
      <div className="lg:hidden sticky top-16 md:top-20 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <div>
          <span className={`text-[10px] font-black tracking-widest uppercase ${isDemoAdmin ? 'text-amber-500' : isSuperAdmin ? 'text-purple-500' : 'text-teal-500'}`}>
            {isDemoAdmin ? 'Demo Admin (Preview)' : isSuperAdmin ? 'Super Admin' : 'Admin'}
          </span>
          <h1 className="text-lg font-black text-gray-900 dark:text-white leading-none">Dashboard</h1>
        </div>
        <span className="text-xs text-gray-500 truncate max-w-[140px]">{profile?.email || session?.user?.email}</span>
      </div>

      <div className="max-w-7xl mx-auto flex">
        {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
        <aside className="hidden lg:flex flex-col w-60 xl:w-64 flex-shrink-0 min-h-[calc(100vh-5rem)] sticky top-20 self-start">
          <div className="p-4 pt-6">
            {/* Sidebar brand */}
            <div className="mb-6 px-2">
              <span className={`text-[10px] font-black tracking-widest uppercase block ${isDemoAdmin ? 'text-amber-500' : isSuperAdmin ? 'text-purple-500' : 'text-teal-500'}`}>
                {isDemoAdmin ? 'Demo Admin Preview' : isSuperAdmin ? 'Super Admin Panel' : 'Admin Panel'}
              </span>
              <h1 className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
                Admin <span className="gradient-text">Dashboard</span>
              </h1>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 truncate">
                {profile?.email || session?.user?.email}
              </p>
            </div>

            {/* Sidebar nav */}
            <nav className="space-y-1">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-left
                      ${isActive
                        ? `bg-gradient-to-r ${tab.color} text-white shadow-md`
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                      }`}
                  >
                    <Icon size={15} className="flex-shrink-0" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* ── Main Content ─────────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0 p-3 sm:p-4 lg:p-6 pb-8">
          
          {/* ── Mobile Tab Scroll Bar ── shown at TOP on mobile only ─────── */}
          <div className="lg:hidden flex overflow-x-auto scrollbar-hide gap-2 pb-3 mb-4 -mx-3 px-3">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all
                    ${isActive
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-md`
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                    }`}
                >
                  <Icon size={12} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Desktop page title */}
          <div className="hidden lg:block mb-6">
            <h2 className="text-xl font-black text-gray-900 dark:text-white">{activeTabObj.label}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Manage {activeTabObj.label.toLowerCase()} data
            </p>
          </div>

          {/* Demo Admin Notification Banner */}
          {isDemoAdmin && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300 shadow-xs"
            >
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-200/60 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-700/80 flex items-center justify-center flex-shrink-0 text-amber-700 dark:text-amber-300 shadow-2xs">
                  <FaShieldAlt size={15} />
                </div>
                <div>
                  <p className="font-black text-sm text-amber-900 dark:text-amber-200">
                    Public Demo Admin Preview (Read-Only Mode)
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                    Modifying live production data is disabled. You are allowed to test the <strong>Deleted Accounts Vault</strong> (Restore & Purge).
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-amber-200/80 dark:bg-amber-900/60 font-black rounded-xl uppercase tracking-wider text-[10px] self-start sm:self-auto flex-shrink-0 text-amber-900 dark:text-amber-200">
                Preview Mode
              </span>
            </motion.div>
          )}

          <div key={activeTab} className="card p-4 sm:p-5 transition-opacity duration-200">
            {activeTab === 'hotels'         && <HotelsTab />}
            {activeTab === 'tourist-places' && <TouristPlacesTab />}
            {activeTab === 'ship-schedule'  && <ShipScheduleTab />}
            {activeTab === 'bookings'         && <BookingsTab />}
            {activeTab === 'ferry-bookings'   && <FerryBookingsTab />}
            {activeTab === 'queries'          && <QueriesTab />}
            {activeTab === 'feedback'         && <FeedbackTab />}
            {activeTab === 'alerts'           && <AlertsTab />}
            {activeTab === 'deleted-accounts' && <DeletedAccountsTab />}
            {activeTab === 'manage-admins'    && isSuperAdmin && <ManageAdminsTab />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
