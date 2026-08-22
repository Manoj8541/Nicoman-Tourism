import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaStar, FaMapMarkerAlt, FaRupeeSign } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { SkeletonGrid } from '../components/SkeletonCard';

// ── URL construction — never hardcoded, always from env ───────────────────────
const BOOKING_BASE = import.meta.env.VITE_BOOKING_DEMO_URL || 'http://localhost:5174';

const Hotels = () => {
  const [hotels, setHotels] = useState([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const categories = ['All', 'Budget', 'Premium', 'Luxury', 'Ultra Luxury'];
  const { user, profile } = useAuth();

  useEffect(() => {
    fetchHotels();
  }, []);

  // Supabase uses price_per_night and image_url; legacy fallback data uses price and image.
  // Normalise once here so the rest of the component always reads .price and .image.
  const normalizeHotel = (h) => ({
    ...h,
    price: h.price ?? h.price_per_night ?? 0,
    image: h.image ?? h.image_url ?? '',
  });

  const fetchHotels = async () => {
    try {
      const response = await axios.get('/api/hotels');
      setHotels(response.data.map(normalizeHotel));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching hotels:', error);
      // Fallback data
      setHotels([
        { id: 1, name: 'SeaShell Resort', location: 'Havelock Island', image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', price: 5500, rating: 4.5, amenities: ['WiFi', 'Pool', 'Beach Access', 'Restaurant'], category: 'Luxury' },
        { id: 2, name: 'Peerless Resort', location: 'Port Blair', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', price: 4200, rating: 4.3, amenities: ['WiFi', 'Pool', 'Gym', 'Spa'], category: 'Premium' },
        { id: 3, name: 'Symphony Palms', location: 'Havelock Island', image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800', price: 6800, rating: 4.7, amenities: ['WiFi', 'Beach Access', 'Restaurant', 'Water Sports'], category: 'Luxury' },
        { id: 4, name: 'Coral Reef Resort', location: 'Neil Island', image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800', price: 3500, rating: 4.2, amenities: ['WiFi', 'Restaurant', 'Garden'], category: 'Budget' },
        { id: 5, name: 'TSG Aura', location: 'Port Blair', image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800', price: 3800, rating: 4.1, amenities: ['WiFi', 'Restaurant', 'Room Service'], category: 'Budget' },
        { id: 6, name: 'Taj Exotica Resort', location: 'Havelock Island', image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800', price: 15000, rating: 4.9, amenities: ['WiFi', 'Pool', 'Spa', 'Beach Access', 'Fine Dining'], category: 'Ultra Luxury' },
      ]);
      setLoading(false);
    }
  };

  const filteredHotels = hotels.filter(hotel => {
    const matchesCategory = filter === 'All' || hotel.category === filter;
    const q = search.trim().toLowerCase();
    const matchesSearch = !q ||
      hotel.name?.toLowerCase().includes(q) ||
      hotel.location?.toLowerCase().includes(q) ||
      hotel.category?.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  // Auth-gated handoff: signed-in users are sent to the demo booking site.
  // Name and email are auto-fetched from their account and pre-filled in the wizard.
  const handleCheckAvailability = (hotel) => {
    if (!user) {
      toast.error('Please sign in to book a hotel', {
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        ),
      });
      setTimeout(() => { window.location.href = '/auth'; }, 800);
      return;
    }
    const params = new URLSearchParams({
      type: 'hotel',
      id: hotel.id,
      name: hotel.name,
      location: hotel.location || '',
      price: hotel.price || 0,
    });
    // Auto-fetch name & email & phone & userId from signed-in user
    if (profile?.full_name) params.set('guestName', profile.full_name);
    if (user.email)         params.set('guestEmail', user.email);
    if (profile?.phone)     params.set('guestPhone', profile.phone);
    if (user.id)            params.set('userId', user.id);
    window.open(`${BOOKING_BASE}/book?${params.toString()}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen pt-24 md:pt-28 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-2 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-full text-sm font-semibold mb-4">
            ACCOMMODATION
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-4">
            Find Your <span className="gradient-text">Perfect Stay</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            From beachfront resorts to budget-friendly hotels, find the perfect accommodation for your island adventure
          </p>
        </motion.div>

        {/* Search + Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          {/* Glassmorphism card wrapping the search bar */}
          <div className="relative max-w-3xl mx-auto bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/60 dark:border-gray-700/60 p-2 flex flex-col sm:flex-row gap-2">

            {/* Teal gradient left accent bar */}
            <div className="absolute left-0 top-4 bottom-4 w-1 rounded-full bg-gradient-to-b from-teal-400 to-cyan-500 hidden sm:block" />

            {/* Search input */}
            <div className="relative flex-1 sm:pl-3">
              <div className="absolute left-5 sm:left-7 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-400">
                <svg fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search hotel name or location..."
                className="w-full pl-12 pr-10 py-3.5 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm font-medium focus:outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300 hover:bg-teal-100 dark:hover:bg-teal-800 hover:text-teal-600 flex items-center justify-center transition-all"
                  aria-label="Clear search"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px bg-gray-200 dark:bg-gray-600 my-2" />

            {/* Category dropdown */}
            <div className="relative sm:w-52">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 8h10M11 12h4" />
                </svg>
              </div>
              <select
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="appearance-none w-full pl-9 pr-8 py-3.5 bg-transparent text-gray-900 dark:text-white text-sm font-semibold focus:outline-none cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat} className="bg-white dark:bg-gray-800">
                    {cat === 'All' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Search button */}
            <button
              onClick={() => {}}
              className="sm:self-center px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-bold shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:scale-105 active:scale-95 transition-all duration-200 whitespace-nowrap"
            >
              Search
            </button>
          </div>

          {/* Result count badge */}
          {(search || filter !== 'All') && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center mt-4"
            >
              <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium shadow-sm border ${
                filteredHotels.length === 0
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                  : 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300'
              }`}>
                <span className={`w-2 h-2 rounded-full ${filteredHotels.length === 0 ? 'bg-red-400' : 'bg-teal-400'}`} />
                {filteredHotels.length === 0
                  ? 'No hotels match your search'
                  : `${filteredHotels.length} hotel${filteredHotels.length !== 1 ? 's' : ''} found${filter !== 'All' ? ` · ${filter}` : ''}${search ? ` · "${search}"` : ''}`
                }
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Hotels Grid */}
        {loading ? (
          <SkeletonGrid count={6} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredHotels.map((hotel, index) => (
              <motion.div
                key={hotel.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <div className="card overflow-hidden h-full flex flex-col">
                  {/* Image */}
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={hotel.image}
                      alt={hotel.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Price Badge */}
                    <div className="absolute top-4 right-4">
                      <div className="px-4 py-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg">
                        <div className="flex items-center gap-1">
                          <FaRupeeSign className="text-teal-600" />
                          <span className="text-2xl font-black text-gray-900">{hotel.price.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-gray-500 text-right">per night</p>
                      </div>
                    </div>

                    {/* Category Badge */}
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                        hotel.category === 'Ultra Luxury' ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' :
                        hotel.category === 'Luxury' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' :
                        hotel.category === 'Premium' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' :
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {hotel.category}
                      </span>
                    </div>

                    {/* Rating */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <FaStar
                            key={i}
                            className={i < Math.floor(hotel.rating) ? 'text-yellow-400' : 'text-white/40'}
                          />
                        ))}
                      </div>
                      <span className="text-white font-bold">{hotel.rating}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-teal-600 transition-colors">
                      {hotel.name}
                    </h3>

                    <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-4">
                      <FaMapMarkerAlt className="mr-2 text-teal-500" />
                      {hotel.location}
                    </div>

                    {/* Amenities */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {hotel.amenities.slice(0, 4).map((amenity, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-lg text-sm font-medium"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>

                    {/* Check Availability button — auth-gated, opens demo booking site in new tab */}
                    <button
                      id={`hotel-book-${hotel.id}`}
                      onClick={() => handleCheckAvailability(hotel)}
                      className="mt-auto btn-primary w-full inline-flex items-center justify-center gap-2 text-base"
                    >
                      {user ? (
                        <>
                          Check Availability &amp; Book
                          {/* External link SVG — no emoji */}
                          <svg className="w-3.5 h-3.5 opacity-80 flex-shrink-0" fill="none"
                            stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round"
                              d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6m0 0v6m0-6L10 14" />
                          </svg>
                        </>
                      ) : (
                        <>
                          {/* Lock SVG — no emoji */}
                          <svg className="w-4 h-4 flex-shrink-0" fill="none"
                            stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                          Sign in to Book
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Hotels;