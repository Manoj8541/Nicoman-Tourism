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

export default function ShipScheduleTab() {
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
