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

export default function FerryBookingsTab() {
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
