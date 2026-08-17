import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStar, FaMapMarkerAlt, FaClock, FaHeart, FaShare, FaFilter } from 'react-icons/fa';
import axios from 'axios';

const TouristPlaces = () => {
  const [places, setPlaces] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);

  const categories = ['All', 'Beach', 'Historical', 'Island', 'Nature', 'Adventure'];

  useEffect(() => {
    fetchPlaces();
  }, []);

  const fetchPlaces = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/tourist-places');
      setPlaces(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching places:', error);
      // Fallback data
      setPlaces([
        { id: 1, name: "Radhanagar Beach", location: "Havelock Island", description: "Ranked as Asia's best beach, famous for turquoise waters and white sand", image: "https://thumbs.dreamstime.com/b/radhanagar-beach-one-most-famous-attractions-havelock-island-andaman-nicobar-islands-radhanagar-beach-253126594.jpg", category: "Beach", rating: 4.9, bestTime: "October to May" },
        { id: 2, name: "Cellular Jail", location: "Port Blair", description: "Historic colonial prison, symbol of India's freedom struggle", image: "https://images.unsplash.com/photo-1721231564051-3b44b8058a9e?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", category: "Historical", rating: 4.8, bestTime: "Year Round" },
        { id: 3, name: "Neil Island", location: "Neil Island", description: "Peaceful island known for coral reefs and natural rock formations", image: "https://th.bing.com/th/id/R.07552f9c51f70af31487e175bb9c748b?rik=vVXUQWKcCxEV7Q&riu=http%3a%2f%2fwww.andamantourism.org%2fwp-content%2fuploads%2f2017%2f06%2fneils.jpg&ehk=pESrD8gGthu9ZWjDuijnutU8rLzFQGN6NOBPBShE4TM%3d&risl=&pid=ImgRaw&r=0", category: "Island", rating: 4.7, bestTime: "November to April" },
        { id: 4, name: "Ross Island", location: "Near Port Blair", description: "Former administrative headquarters with colonial ruins", image: "https://www.go2andaman.com/wp-content/uploads/2021/01/ross-island-go2andaman-port-blair1.jpeg", category: "Historical", rating: 4.6, bestTime: "October to May" },
        { id: 5, name: "Baratang Island", location: "Middle Andaman", description: "Famous for limestone caves and mud volcanoes", image: "https://tse3.mm.bing.net/th/id/OIP.l_vLrxJC-nsI45eAyOeiHAHaEK?rs=1&pid=ImgDetMain&o=7&rm=3", category: "Nature", rating: 4.5, bestTime: "November to March" },
        { id: 6, name: "Elephant Beach", location: "Havelock Island", description: "Perfect spot for snorkeling and water sports", image: "https://www.andamantourism.org/wp-content/uploads/2025/02/Elephant-beach-1-800x444.jpg", category: "Beach", rating: 4.8, bestTime: "October to May" },
      ]);
      setLoading(false);
    }
  };

  const filteredPlaces = filter === 'All' 
    ? places 
    : places.filter(place => place.category === filter);

  const toggleFavorite = (id) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fav => fav !== id) : [...prev, id]
    );
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
            EXPLORE DESTINATIONS
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-4">
            Discover <span className="gradient-text">Paradise</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            From pristine beaches to historic monuments, explore the best of Andaman & Nicobar Islands
          </p>
        </motion.div>

        {/* Filter Tabs */}
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

        {/* Places Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <AnimatePresence mode="popLayout">
              {filteredPlaces.map((place, index) => (
                <motion.div
                  key={place.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="group"
                >
                  <div className="card overflow-hidden h-full">
                    {/* Image */}
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={place.image}
                        alt={place.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      
                      {/* Category Badge */}
                      <div className="absolute top-4 left-4">
                        <span className="px-4 py-1.5 bg-white/90 backdrop-blur-sm text-gray-900 rounded-full text-sm font-semibold">
                          {place.category}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button
                          onClick={() => toggleFavorite(place.id)}
                          className={`p-2.5 rounded-full backdrop-blur-sm transition-colors ${
                            favorites.includes(place.id)
                              ? 'bg-red-500 text-white'
                              : 'bg-white/90 text-gray-700 hover:bg-red-500 hover:text-white'
                          }`}
                        >
                          <FaHeart />
                        </button>
                        <button className="p-2.5 bg-white/90 backdrop-blur-sm rounded-full text-gray-700 hover:bg-teal-500 hover:text-white transition-colors">
                          <FaShare />
                        </button>
                      </div>

                      {/* Rating */}
                      <div className="absolute bottom-4 left-4 flex items-center gap-1 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full">
                        <FaStar className="text-yellow-500" />
                        <span className="font-bold text-gray-900">{place.rating}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-2">
                        <FaMapMarkerAlt className="mr-2 text-teal-500" />
                        {place.location}
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                        {place.name}
                      </h3>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {place.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <FaClock className="mr-2 text-teal-500" />
                          {place.bestTime}
                        </div>
                        <button className="text-teal-600 dark:text-teal-400 font-semibold hover:underline">
                          Learn More →
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && filteredPlaces.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">🏝️</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No places found/Update Soon...
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try selecting a different category
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TouristPlaces;