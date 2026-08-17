import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStar, FaMapMarkerAlt, FaWifi, FaSwimmingPool, FaUtensils, FaSpa, FaTimes, FaCheck, FaRupeeSign } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

const Hotels = () => {
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
    rooms: 1,
    name: '',
    email: '',
    phone: ''
  });

  const categories = ['All', 'Budget', 'Premium', 'Luxury', 'Ultra Luxury'];

  const amenityIcons = {
    'WiFi': FaWifi,
    'Pool': FaSwimmingPool,
    'Restaurant': FaUtensils,
    'Spa': FaSpa,
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/hotels');
      setHotels(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching hotels:', error);
      // Fallback data
      setHotels([
        { id: 1, name: "SeaShell Resort", location: "Havelock Island", image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800", price: 5500, rating: 4.5, amenities: ["WiFi", "Pool", "Beach Access", "Restaurant"], category: "Luxury" },
        { id: 2, name: "Peerless Resort", location: "Port Blair", image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800", price: 4200, rating: 4.3, amenities: ["WiFi", "Pool", "Gym", "Spa"], category: "Premium" },
        { id: 3, name: "Symphony Palms", location: "Havelock Island", image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800", price: 6800, rating: 4.7, amenities: ["WiFi", "Beach Access", "Restaurant", "Water Sports"], category: "Luxury" },
        { id: 4, name: "Coral Reef Resort", location: "Neil Island", image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800", price: 3500, rating: 4.2, amenities: ["WiFi", "Restaurant", "Garden"], category: "Budget" },
        { id: 5, name: "TSG Aura", location: "Port Blair", image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800", price: 3800, rating: 4.1, amenities: ["WiFi", "Restaurant", "Room Service"], category: "Budget" },
        { id: 6, name: "Taj Exotica Resort", location: "Havelock Island", image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800", price: 15000, rating: 4.9, amenities: ["WiFi", "Pool", "Spa", "Beach Access", "Fine Dining"], category: "Ultra Luxury" },
      ]);
      setLoading(false);
    }
  };

  const filteredHotels = filter === 'All' 
    ? hotels 
    : hotels.filter(hotel => hotel.category === filter);

  const handleBooking = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post('http://localhost:5000/api/hotel-booking', {
        hotelId: selectedHotel.id,
        ...bookingData
      });
      
      toast.success(`Booking Confirmed! ID: ${response.data.bookingId}`, {
        duration: 5000,
        style: {
          background: '#10B981',
          color: 'white',
          fontWeight: 'bold'
        }
      });
      setShowBookingModal(false);
      setBookingData({ checkIn: '', checkOut: '', guests: 1, rooms: 1, name: '', email: '', phone: '' });
    } catch (error) {
      toast.error('Booking failed. Please try again.');
    }
  };

  const calculateTotal = () => {
    if (!bookingData.checkIn || !bookingData.checkOut || !selectedHotel) return 0;
    const start = new Date(bookingData.checkIn);
    const end = new Date(bookingData.checkOut);
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return nights * selectedHotel.price * bookingData.rooms;
  };

  return (
    <div className="min-h-screen pt-32 md:pt-36 pb-12 px-4">
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

        {/* Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                filter === category
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30 scale-105'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-lg hover:scale-105'
              }`}
            >
              {category}
            </button>
          ))}
        </motion.div>

        {/* Hotels Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
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

                    {/* Book Button */}
                    <button
                      onClick={() => {
                        setSelectedHotel(hotel);
                        setShowBookingModal(true);
                      }}
                      className="mt-auto btn-primary w-full"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {showBookingModal && selectedHotel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowBookingModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              {/* Modal Header */}
              <div className="relative h-48">
                <img
                  src={selectedHotel.image}
                  alt={selectedHotel.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full text-white hover:bg-white/40 transition-colors"
                >
                  <FaTimes />
                </button>
                <div className="absolute bottom-4 left-6 right-6">
                  <h2 className="text-2xl font-bold text-white">{selectedHotel.name}</h2>
                  <p className="text-white/80">{selectedHotel.location}</p>
                </div>
              </div>

              {/* Booking Form */}
              <form onSubmit={handleBooking} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Check-in
                    </label>
                    <input
                      type="date"
                      required
                      value={bookingData.checkIn}
                      onChange={(e) => setBookingData({...bookingData, checkIn: e.target.value})}
                      className="input-field"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Check-out
                    </label>
                    <input
                      type="date"
                      required
                      value={bookingData.checkOut}
                      onChange={(e) => setBookingData({...bookingData, checkOut: e.target.value})}
                      className="input-field"
                      min={bookingData.checkIn || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Guests
                    </label>
                    <select
                      value={bookingData.guests}
                      onChange={(e) => setBookingData({...bookingData, guests: e.target.value})}
                      className="input-field"
                    >
                      {[1,2,3,4,5,6].map(n => (
                        <option key={n} value={n}>{n} Guest{n>1?'s':''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Rooms
                    </label>
                    <select
                      value={bookingData.rooms}
                      onChange={(e) => setBookingData({...bookingData, rooms: e.target.value})}
                      className="input-field"
                    >
                      {[1,2,3,4,5].map(n => (
                        <option key={n} value={n}>{n} Room{n>1?'s':''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={bookingData.name}
                    onChange={(e) => setBookingData({...bookingData, name: e.target.value})}
                    className="input-field"
                    placeholder="FirstName SurName"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={bookingData.email}
                    onChange={(e) => setBookingData({...bookingData, email: e.target.value})}
                    className="input-field"
                    placeholder="Enter your mail-id"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={bookingData.phone}
                    onChange={(e) => setBookingData({...bookingData, phone: e.target.value})}
                    className="input-field"
                    placeholder="Enter 10 digit number"
                  />
                </div>

                {/* Price Summary */}
                {calculateTotal() > 0 && (
                  <div className="p-4 bg-teal-50 dark:bg-teal-900/30 rounded-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Total Amount</span>
                      <span className="text-2xl font-black text-teal-600 dark:text-teal-400">
                        ₹{calculateTotal().toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                <button type="submit" className="btn-primary w-full">
                  Confirm Booking
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Hotels;