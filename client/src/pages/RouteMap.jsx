import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { FaShip, FaClock, FaRuler, FaMapMarkedAlt } from 'react-icons/fa';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Ensure default Leaflet marker icons resolve correctly with Vite (ESM)
// Note: delete L.Icon.Default.prototype._getIconUrl is NOT needed in react-leaflet v4 + Vite
// and can break icon loading. Using CDN URLs directly is the correct approach.
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const RouteMap = () => {
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [loading, setLoading] = useState(true);

  const portCoordinates = {
    'Chennai Port': [13.0827, 80.2707],
    'Kolkata Port': [22.5726, 88.3639],
    'Visakhapatnam Port': [17.6868, 83.2185],
    'Port Blair': [11.6234, 92.7265]
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      const response = await axios.get('/api/ship-routes');
      setRoutes(response.data);
      setSelectedRoute(response.data[0]);
      setLoading(false);
    } catch (error) {
      const fallbackRoutes = [
        { id: 1, from: "Chennai Port", from_state: "Tamil Nadu", to: "Port Blair", distance: 647, unit: "nautical miles", travel_time: "12-14 hours", frequency: "3-4 times/month" },
        { id: 2, from: "Kolkata Port", from_state: "West Bengal", to: "Port Blair", distance: 756, unit: "nautical miles", travel_time: "24-26 hours", frequency: "2-3 times/month" },
        { id: 3, from: "Visakhapatnam Port", from_state: "Andhra Pradesh", to: "Port Blair", distance: 684, unit: "nautical miles", travel_time: "18-22 hours", frequency: "2 times/month" }
      ];
      setRoutes(fallbackRoutes);
      setSelectedRoute(fallbackRoutes[0]);
      setLoading(false);
    }
  };

  const center = [15.0, 87.0];

  return (
    <div className="min-h-screen pt-24 md:pt-28 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30">
            <FaMapMarkedAlt className="text-4xl" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-4">
            Maritime <span className="gradient-text">Routes</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Sea routes from mainland India to Andaman Islands (in nautical miles)
          </p>
        </motion.div>

        {/* Route Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {routes.map((route) => (
            <motion.button
              key={route.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedRoute(route)}
              className={`p-6 rounded-2xl text-left transition-all ${
                selectedRoute?.id === route.id
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-xl shadow-teal-500/30'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-lg hover:shadow-xl'
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <FaShip className="text-2xl" />
                <h3 className="font-bold text-lg">{route.from_state}</h3>
              </div>
              <div className="space-y-2 text-sm opacity-90">
                <div className="flex items-center gap-2">
                  <FaRuler />
                  <span>{route.distance} {route.unit}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaClock />
                  <span>{route.travel_time}</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Map */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-map overflow-hidden mb-8"
          style={{ height: '500px' }}
        >
          {!loading && selectedRoute && (
            <MapContainer
              center={center}
              zoom={5}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <Marker position={portCoordinates[selectedRoute.from]}>
                <Popup>
                  <strong>{selectedRoute.from}</strong><br />
                  {selectedRoute.fromState}
                </Popup>
              </Marker>
              
              <Marker position={portCoordinates[selectedRoute.to]}>
                <Popup>
                  <strong>{selectedRoute.to}</strong><br />
                  Andaman & Nicobar
                </Popup>
              </Marker>

              <Polyline
                positions={[
                  portCoordinates[selectedRoute.from],
                  portCoordinates[selectedRoute.to]
                ]}
                color="#14b8a6"
                weight={4}
                opacity={0.8}
                dashArray="10, 10"
              />
            </MapContainer>
          )}
        </motion.div>

        {/* Route Details */}
        {selectedRoute && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Route: {selectedRoute.from} → {selectedRoute.to}
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl">
                <FaRuler className="text-3xl text-blue-600 dark:text-blue-400 mb-3" />
                <p className="text-3xl font-black text-gray-900 dark:text-white">{selectedRoute.distance}</p>
                <p className="text-gray-600 dark:text-gray-400">{selectedRoute.unit}</p>
              </div>

              <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl">
                <FaClock className="text-3xl text-purple-600 dark:text-purple-400 mb-3" />
                <p className="text-3xl font-black text-gray-900 dark:text-white">{selectedRoute.travel_time?.split('-')[0] ?? '—'}</p>
                <p className="text-gray-600 dark:text-gray-400">hours approx</p>
              </div>

              <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl">
                <FaShip className="text-3xl text-green-600 dark:text-green-400 mb-3" />
                <p className="text-3xl font-black text-gray-900 dark:text-white">{selectedRoute.frequency?.split('/')[0] ?? '—'}</p>
                <p className="text-gray-600 dark:text-gray-400">per month</p>
              </div>

              <div className="p-6 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-2xl">
                <FaMapMarkedAlt className="text-3xl text-orange-600 dark:text-orange-400 mb-3" />
                <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedRoute.from}</p>
                <p className="text-gray-600 dark:text-gray-400">{selectedRoute.from_state}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default RouteMap;