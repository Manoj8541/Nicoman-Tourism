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

export default function TouristPlacesTab() {
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
