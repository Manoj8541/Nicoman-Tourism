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
import ImageUploadField from '../../ImageUploadField';
import { uploadBlobToStorage, deleteStorageFile } from '../../../lib/imageCompressor';

export default function HotelsTab() {
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
