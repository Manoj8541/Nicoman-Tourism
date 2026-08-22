import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaHotel, FaShip, FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaClock,
  FaMapMarkerAlt, FaCompass, FaRupeeSign, FaPrint, FaTimes, FaSearch,
  FaTicketAlt, FaCopy, FaBed, FaUser, FaPhone, FaEnvelope, FaExternalLinkAlt,
  FaArrowRight, FaFilter, FaExclamationTriangle, FaTrash, FaCheck
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

// Status badge styling
const STATUS_CONFIG = {
  confirmed: { icon: FaCheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', border: 'border-emerald-200 dark:border-emerald-800', label: 'Confirmed' },
  completed: { icon: FaClock,       color: 'text-blue-600 dark:text-blue-400',       bg: 'bg-blue-100 dark:bg-blue-900/30',       border: 'border-blue-200 dark:border-blue-800',       label: 'Completed' },
  cancelled: { icon: FaTimesCircle, color: 'text-red-500 dark:text-red-400',         bg: 'bg-red-100 dark:bg-red-900/30',         border: 'border-red-200 dark:border-red-800',         label: 'Cancelled' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status?.toLowerCase()] || STATUS_CONFIG.confirmed;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      <Icon size={11} /> {cfg.label}
    </span>
  );
}

const formatDate = (isoStr) => {
  if (!isoStr) return '—';
  const d = new Date(isoStr.includes('T') ? isoStr : isoStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const extractUnitsFromRef = (ref) => {
  if (!ref) return [];
  const match = ref.match(/(?:HTL|FRY)-([A-Za-z0-9\-_,]+)-ANI/i);
  if (match && match[1]) {
    return match[1].split(/[-_,]+/).filter(Boolean);
  }
  return [];
};

export default function Bookings() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [hotelBookings, setHotelBookings] = useState([]);
  const [ferryBookings, setFerryBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'hotel' | 'ferry'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'confirmed' | 'completed' | 'cancelled'
  const [searchQuery, setSearchQuery] = useState('');

  // Voucher modal state
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  // Cancellation modal state
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // Body scroll lock effect
  useEffect(() => {
    if (!selectedVoucher && !cancelModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (!cancelling) setCancelModal(null);
        setSelectedVoucher(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prev === 'hidden' ? 'unset' : (prev || 'unset');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedVoucher, cancelModal, cancelling]);

  // ── Fetch user bookings from Supabase (filtered by user_id & email) ──────────
  const fetchUserBookings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch Hotel Bookings
      let hQuery = supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (user.email && user.id) {
        hQuery = hQuery.or(`user_id.eq.${user.id},guest_email.eq.${user.email}`);
      } else if (user.id) {
        hQuery = hQuery.eq('user_id', user.id);
      }

      // 2. Fetch Ferry Bookings
      let fQuery = supabase
        .from('ferry_bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (user.email && user.id) {
        fQuery = fQuery.or(`user_id.eq.${user.id},passenger_email.eq.${user.email}`);
      } else if (user.id) {
        fQuery = fQuery.eq('user_id', user.id);
      }

      const [hRes, fRes] = await Promise.all([hQuery, fQuery]);

      let hotels = hRes.data || [];
      let ferries = fRes.data || [];

      // Fallback to backend API if needed
      if ((!hotels.length && !ferries.length) || hRes.error || fRes.error) {
        try {
          const session = (await supabase.auth.getSession()).data.session;
          const token = session?.access_token;
          if (token) {
            const [hApi, fApi] = await Promise.all([
              axios.get('/api/user/bookings', { headers: { Authorization: `Bearer ${token}` } }),
              axios.get('/api/user/ferry-bookings', { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            if (hApi.data) hotels = hApi.data;
            if (fApi.data) ferries = fApi.data;
          }
        } catch (apiErr) {
          console.warn('[Bookings] API fallback:', apiErr.message);
        }
      }

      setHotelBookings(hotels);
      setFerryBookings(ferries);
    } catch (err) {
      console.error('[Bookings] fetch error:', err);
      toast.error('Failed to load bookings: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserBookings();
  }, [user]);

  // Copy booking reference
  const handleCopyRef = (ref) => {
    navigator.clipboard.writeText(ref);
    toast.success(`Copied code ${ref}`);
  };

  // Execute cancellation from custom modal
  const handleExecuteCancel = async () => {
    if (!cancelModal) return;
    setCancelling(true);
    const b = cancelModal;
    const isHotel = b._type === 'hotel';

    try {
      const table = isHotel ? 'bookings' : 'ferry_bookings';
      const { error } = await supabase.from(table).update({ status: 'cancelled' }).eq('id', b.id);

      if (error) {
        const session = (await supabase.auth.getSession()).data.session;
        const token = session?.access_token;
        const endpoint = isHotel ? '/api/user/bookings/cancel' : '/api/user/ferry-bookings/cancel';
        await axios.put(endpoint, { id: b.id }, { headers: { Authorization: `Bearer ${token}` } });
      }

      toast.success(`${isHotel ? 'Hotel reservation' : 'Ferry ticket'} ${b.booking_ref} cancelled`);
      setCancelModal(null);
      fetchUserBookings();
    } catch (err) {
      toast.error('Failed to cancel: ' + (err.response?.data?.error || err.message));
    } finally {
      setCancelling(false);
    }
  };

  // Combined and filtered list
  const filteredList = useMemo(() => {
    let combined = [];

    if (activeTab === 'all' || activeTab === 'hotel') {
      combined.push(...hotelBookings.map(item => ({ ...item, _type: 'hotel' })));
    }
    if (activeTab === 'all' || activeTab === 'ferry') {
      combined.push(...ferryBookings.map(item => ({ ...item, _type: 'ferry' })));
    }

    // Sort by created_at desc
    combined.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    // Status filter
    if (statusFilter !== 'all') {
      combined = combined.filter(b => (b.status || 'confirmed').toLowerCase() === statusFilter);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      combined = combined.filter(b => {
        const name = (b.hotel_name || b.ship_name || '').toLowerCase();
        const ref = (b.booking_ref || '').toLowerCase();
        const guest = (b.guest_name || b.passenger_name || '').toLowerCase();
        const route = (b.from ? `${b.from} ${b.to}` : '').toLowerCase();
        return name.includes(q) || ref.includes(q) || guest.includes(q) || route.includes(q);
      });
    }

    return combined;
  }, [hotelBookings, ferryBookings, activeTab, statusFilter, searchQuery]);

  // Status counts
  const counts = useMemo(() => {
    const all = [...hotelBookings, ...ferryBookings];
    return {
      all: all.length,
      hotels: hotelBookings.length,
      ferries: ferryBookings.length,
      confirmed: all.filter(b => (b.status || 'confirmed') === 'confirmed').length,
      completed: all.filter(b => b.status === 'completed').length,
      cancelled: all.filter(b => b.status === 'cancelled').length,
    };
  }, [hotelBookings, ferryBookings]);

  return (
    <div className="min-h-screen pt-24 md:pt-28 pb-16 px-4 bg-gray-50 dark:bg-gray-950 transition-colors">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Page Header ──────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 mb-2">
              <FaTicketAlt size={12} /> ISLAND RESERVATIONS
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
              My <span className="gradient-text">Bookings &amp; Tickets</span>
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-xl">
              Track and manage all your verified hotel stays and express ferry tickets across Andaman.
            </p>
          </div>

          {/* Quick Stats Pills */}
          <div className="flex items-center gap-2 justify-center md:justify-end flex-wrap">
            <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm text-center">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total</p>
              <p className="text-lg font-black text-gray-900 dark:text-white leading-none mt-0.5">{counts.all}</p>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm text-center">
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Confirmed</p>
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 leading-none mt-0.5">{counts.confirmed}</p>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm text-center">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Hotels / Ships</p>
              <p className="text-lg font-black text-teal-600 dark:text-teal-400 leading-none mt-0.5">{counts.hotels} / {counts.ferries}</p>
            </div>
          </div>
        </motion.div>

        {/* ── Category Tabs & Search Bar ───────────────────────────────────────── */}
        <div className="card p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Type Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-gray-800/80 rounded-xl overflow-x-auto">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'all' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
              >
                All Bookings ({counts.all})
              </button>
              <button
                onClick={() => setActiveTab('hotel')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'hotel' ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400'}`}
              >
                <FaHotel size={12} /> Hotels ({counts.hotels})
              </button>
              <button
                onClick={() => setActiveTab('ferry')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'ferry' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'}`}
              >
                <FaShip size={12} /> Ferry Lines ({counts.ferries})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-xs">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                placeholder="Search hotel, ship, ref code..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-teal-500 transition-colors"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <FaTimes size={10} />
                </button>
              )}
            </div>
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-gray-100 dark:border-gray-800 text-xs">
            <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px] mr-1 flex items-center gap-1">
              <FaFilter size={9} /> Status:
            </span>
            {[
              { key: 'all', label: 'All Status' },
              { key: 'confirmed', label: `Confirmed (${counts.confirmed})` },
              { key: 'completed', label: `Completed (${counts.completed})` },
              { key: 'cancelled', label: `Cancelled (${counts.cancelled})` },
            ].map(s => (
              <button
                key={s.key}
                onClick={() => setStatusFilter(s.key)}
                className={`px-3 py-1 rounded-full font-semibold transition-all whitespace-nowrap ${statusFilter === s.key ? 'bg-teal-500 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Bookings Content List ────────────────────────────────────────────── */}
        {loading ? (
          <div className="card p-12 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Loading your verified bookings...</p>
          </div>
        ) : filteredList.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-10 text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-900/30 text-teal-500 flex items-center justify-center mx-auto text-2xl">
              <FaTicketAlt />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {searchQuery || statusFilter !== 'all' ? 'No matching bookings found' : 'No bookings in your account yet'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search terms or status filter to view other reservations.'
                : 'Ready for an unforgettable Andaman island trip? Explore handpicked resorts or book express ferry tickets.'}
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link to="/hotels" className="btn-primary inline-flex items-center gap-2 text-xs">
                <FaHotel /> Explore Hotels
              </Link>
              <Link to="/ferries" className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs inline-flex items-center gap-2 transition-colors">
                <FaShip /> Ferry Schedules
              </Link>
            </div>
          </motion.div>
        ) : (
          /* Bookings Grid Cards */
          <div className="space-y-4">
            {filteredList.map((item, idx) => {
              const isHotel = item._type === 'hotel';
              const allocatedUnits = extractUnitsFromRef(item.booking_ref);

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="card p-5 hover:border-teal-500/40 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

                    {/* Left: Main details */}
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      {/* Service Icon Badge */}
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-md ${isHotel ? 'bg-gradient-to-br from-teal-500 to-cyan-500 shadow-teal-500/20' : 'bg-gradient-to-br from-blue-500 to-indigo-500 shadow-blue-500/20'}`}>
                        {isHotel ? <FaHotel size={20} /> : <FaShip size={20} />}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        {/* Title & Status */}
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider ${isHotel ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                            {isHotel ? 'Hotel Stay' : 'Ferry Line'}
                          </span>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                            {isHotel ? item.hotel_name : item.ship_name || 'Express Ferry'}
                          </h3>
                          <StatusBadge status={item.status} />
                        </div>

                        {/* Route / Location */}
                        <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 flex-wrap">
                          {isHotel ? (
                            <span className="flex items-center gap-1">
                              <FaMapMarkerAlt className="text-teal-500 flex-shrink-0" />
                              Andaman &amp; Nicobar Islands
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 font-semibold text-gray-800 dark:text-gray-200">
                              <FaCompass className="text-blue-500 flex-shrink-0" />
                              {item.from || 'Port Blair'} &rarr; {item.to || 'Havelock Island'}
                              {item.departure_time && <span className="text-gray-400 font-normal">({item.departure_time})</span>}
                            </span>
                          )}

                          <span className="text-gray-300 dark:text-gray-700">&bull;</span>

                          {/* Dates */}
                          <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                            <FaCalendarAlt className="text-teal-500" />
                            {isHotel ? (
                              <span>{formatDate(item.check_in)} &ndash; {formatDate(item.check_out)}</span>
                            ) : (
                              <span>{formatDate(item.travel_date)}</span>
                            )}
                          </span>
                        </div>

                        {/* Units / Guest info */}
                        <div className="flex items-center gap-3 pt-1 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                          <span className="flex items-center gap-1">
                            <FaUser size={10} className="text-gray-400" />
                            {item.guest_name || item.passenger_name}
                          </span>

                          <span className="text-gray-300 dark:text-gray-700">&bull;</span>

                          <span className="flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-300">
                            <FaBed size={11} className="text-teal-500" />
                            {isHotel
                              ? `${item.rooms || 1} Room${item.rooms > 1 ? 's' : ''} ${allocatedUnits.length ? `(${allocatedUnits.map(u => `Room ${u}`).join(', ')})` : ''}`
                              : `${item.seats || 1} Seat${item.seats > 1 ? 's' : ''} ${allocatedUnits.length ? `(${allocatedUnits.map(u => `Seat ${u}`).join(', ')})` : ''}`}
                          </span>

                          <span className="text-gray-300 dark:text-gray-700">&bull;</span>

                          {/* Copyable Ref code */}
                          <button
                            onClick={() => handleCopyRef(item.booking_ref)}
                            className="inline-flex items-center gap-1 font-mono text-[11px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-600 transition-colors"
                            title="Click to copy reference"
                          >
                            <FaCopy size={9} />
                            {item.booking_ref}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right: Pricing & Actions */}
                    <div className="flex lg:flex-col items-center lg:items-end justify-between gap-3 border-t lg:border-t-0 pt-3 lg:pt-0 border-gray-100 dark:border-gray-800 flex-shrink-0">
                      <div className="text-left lg:text-right">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Amount Paid</p>
                        <p className="text-xl font-black text-gray-900 dark:text-white">
                          ₹{(item.total_amount || 0).toLocaleString('en-IN')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* View Voucher */}
                        <button
                          onClick={() => setSelectedVoucher(item)}
                          className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 font-bold text-xs hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors inline-flex items-center gap-1.5"
                        >
                          <FaTicketAlt size={11} /> Voucher
                        </button>

                        {/* Cancel Action */}
                        {(item.status || 'confirmed') === 'confirmed' && (
                          <button
                            onClick={() => setCancelModal(item)}
                            className="px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 font-bold text-xs transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

      </div>

      {/* ── Voucher / Receipt Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedVoucher && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity cursor-pointer"
              onClick={() => setSelectedVoucher(null)}
              aria-hidden="true"
            />
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-full max-w-lg rounded-2xl sm:rounded-3xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col text-left max-h-[88vh]"
            >
                {/* Modal Header */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2.5">
                    <FaTicketAlt size={18} />
                    <div>
                      <h3 className="font-bold text-base leading-tight">Official Booking Voucher</h3>
                      <p className="text-[11px] opacity-80">Nicoman Tourism Portal</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedVoucher(null)}
                    type="button"
                    className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <FaTimes size={16} />
                  </button>
                </div>

                {/* Voucher Content */}
                <div className="p-4 sm:p-6 space-y-4 flex-1 min-h-0 overflow-y-auto overscroll-contain">
                  {/* Reference Banner */}
                  <div className="p-3.5 sm:p-4 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/40 rounded-2xl text-center">
                    <p className="text-[10px] text-orange-600 dark:text-orange-400 font-bold uppercase tracking-widest">
                      Confirmation Code
                    </p>
                    <p className="text-xl sm:text-2xl font-black text-orange-700 dark:text-orange-300 font-mono tracking-wider mt-0.5">
                      {selectedVoucher.booking_ref}
                    </p>
                  </div>

                  <div className="space-y-2.5 text-xs text-gray-700 dark:text-gray-300">
                    <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-gray-400">Service:</span>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {selectedVoucher._type === 'hotel' ? selectedVoucher.hotel_name : selectedVoucher.ship_name || 'Express Ferry'}
                      </span>
                    </div>

                    {selectedVoucher._type === 'ferry' && (
                      <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-gray-400">Route &amp; Time:</span>
                        <span className="font-bold">{selectedVoucher.from} &rarr; {selectedVoucher.to} ({selectedVoucher.departure_time || '08:00 AM'})</span>
                      </div>
                    )}

                    <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-gray-400">Date:</span>
                      <span className="font-bold">
                        {selectedVoucher._type === 'hotel'
                          ? `${formatDate(selectedVoucher.check_in)} to ${formatDate(selectedVoucher.check_out)}`
                          : formatDate(selectedVoucher.travel_date)}
                      </span>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-gray-400">Allocated Units:</span>
                      <span className="font-bold">
                        {selectedVoucher._type === 'hotel'
                          ? `${selectedVoucher.rooms || 1} Room(s)`
                          : `${selectedVoucher.seats || 1} Seat(s)`}
                      </span>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-gray-400">Lead Passenger / Guest:</span>
                      <span className="font-bold">{selectedVoucher.guest_name || selectedVoucher.passenger_name}</span>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-gray-400">Contact Email:</span>
                      <span>{selectedVoucher.guest_email || selectedVoucher.passenger_email}</span>
                    </div>

                    <div className="flex justify-between py-2 border-t-2 border-gray-200 dark:border-gray-700 text-sm">
                      <span className="font-bold text-gray-900 dark:text-white">Total Amount Paid:</span>
                      <span className="font-black text-teal-600 dark:text-teal-400 text-base">
                        ₹{(selectedVoucher.total_amount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Modal Buttons */}
                <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm flex gap-2.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex-1 btn-primary py-2.5 flex items-center justify-center gap-2 text-xs font-bold cursor-pointer"
                  >
                    <FaPrint /> Print Voucher
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedVoucher(null)}
                    className="px-5 py-2.5 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Custom Styled Cancellation Confirmation Modal ────────────────────── */}
      <AnimatePresence>
        {cancelModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden">
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity cursor-pointer"
              onClick={() => !cancelling && setCancelModal(null)}
              aria-hidden="true"
            />
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-full max-w-md rounded-2xl sm:rounded-3xl bg-white dark:bg-gray-900 p-5 sm:p-6 shadow-2xl border border-red-200 dark:border-red-900/40 space-y-4 text-left max-h-[88vh] overflow-y-auto"
            >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0 shadow-xs">
                    <FaExclamationTriangle size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate">
                      Cancel {cancelModal._type === 'hotel' ? 'Hotel Stay' : 'Ferry Ticket'}?
                    </h3>
                    <p className="text-xs text-gray-500 truncate">
                      Ref: <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{cancelModal.booking_ref}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => !cancelling && setCancelModal(null)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <FaTimes size={14} />
                  </button>
                </div>

                {/* Reservation summary card */}
                <div className="p-3.5 sm:p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700/50 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Service:</span>
                    <span className="font-bold text-gray-900 dark:text-white truncate max-w-[200px]">
                      {cancelModal._type === 'hotel' ? cancelModal.hotel_name : cancelModal.ship_name || 'Express Ferry'}
                    </span>
                  </div>
                  {cancelModal._type === 'ferry' && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Route:</span>
                      <span className="font-semibold">{cancelModal.from} &rarr; {cancelModal.to}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date:</span>
                    <span className="font-semibold">
                      {cancelModal._type === 'hotel'
                        ? `${formatDate(cancelModal.check_in)} – ${formatDate(cancelModal.check_out)}`
                        : formatDate(cancelModal.travel_date)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-500">Amount Paid:</span>
                    <span className="font-bold text-teal-600 dark:text-teal-400">
                      ₹{(cancelModal.total_amount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-500 leading-relaxed">
                  Cancelling this reservation will immediately release your allocated room/seat back into open inventory.
                </p>

                {/* Action buttons */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleExecuteCancel}
                    disabled={cancelling}
                    className="flex-1 py-3 px-3 sm:px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {cancelling ? (
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <FaTrash size={11} />
                    )}
                    {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCancelModal(null)}
                    disabled={cancelling}
                    className="py-3 px-4 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    Keep Booking
                  </button>
                </div>
              </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
