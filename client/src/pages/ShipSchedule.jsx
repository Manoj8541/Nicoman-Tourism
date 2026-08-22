import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaShip, FaClock, FaMapMarkerAlt, FaCheckCircle, FaExclamationCircle, FaCalendarAlt, FaAnchor } from 'react-icons/fa';
import axios from 'axios';
import { SkeletonList } from '../components/SkeletonCard';

const ShipSchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState('All');

  const days = ['All', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await axios.get('/api/ship-schedule');
      setSchedules(response.data);
      setLoading(false);
    } catch (error) {
      // Fallback data
      setSchedules([
        { id: 1, ship_name: "MV Swaraj Dweep", from: "Port Blair", to: "Havelock Island", departure_time: "06:00 AM", arrival_time: "08:30 AM", status: "on_time", days: ["Mon", "Wed", "Fri", "Sun"] },
        { id: 2, ship_name: "MV Makruzz", from: "Port Blair", to: "Havelock Island", departure_time: "08:15 AM", arrival_time: "10:30 AM", status: "on_time", days: ["Daily"] },
        { id: 3, ship_name: "MV Coastal Cruise", from: "Havelock Island", to: "Neil Island", departure_time: "11:00 AM", arrival_time: "12:00 PM", status: "on_time", days: ["Tue", "Thu", "Sat"] },
        { id: 4, ship_name: "MV Green Ocean", from: "Port Blair", to: "Neil Island", departure_time: "06:30 AM", arrival_time: "09:00 AM", status: "delayed", days: ["Mon", "Wed", "Fri"] },
        { id: 5, ship_name: "MV Nautika", from: "Havelock Island", to: "Port Blair", departure_time: "04:00 PM", arrival_time: "06:30 PM", status: "on_time", days: ["Daily"] },
      ]);
      setLoading(false);
    }
  };

  const filteredSchedules = selectedDay === 'All'
    ? schedules
    : schedules.filter(schedule => 
        schedule.days.includes('Daily') || schedule.days.includes(selectedDay)
      );

  const getStatusStyles = (status) => {
    if (status === 'on_time') return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', icon: FaCheckCircle, label: 'On Time' };
    if (status === 'delayed') return { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400', icon: FaExclamationCircle, label: 'Delayed' };
    return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', icon: FaExclamationCircle, label: 'Cancelled' };
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
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30">
            <FaShip className="text-4xl" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-4">
            Ferry <span className="gradient-text">Schedule</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Real-time ferry timings between Port Blair, Havelock, and Neil Island
          </p>
        </motion.div>

        {/* Day Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {days.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                selectedDay === day
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30 scale-105'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-lg hover:scale-105'
              }`}
            >
              {day}
            </button>
          ))}
        </motion.div>

        {/* Schedule Cards */}
        {loading ? (
          <SkeletonList count={5} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchedules.map((schedule, index) => {
              const statusStyles = getStatusStyles(schedule.status);
              const StatusIcon = statusStyles.icon;
              
              return (
                <motion.div
                  key={schedule.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="card p-6 group hover:border-teal-500/50"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                        <FaShip className="text-2xl" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                          {schedule.ship_name}
                        </h3>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusStyles.bg} ${statusStyles.text}`}>
                          <StatusIcon className="text-sm" />
                          {statusStyles.label}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Route */}
                  <div className="relative mb-6">
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                          <FaAnchor className="text-teal-600 dark:text-teal-400" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{schedule.from}</p>
                        <p className="text-xs text-gray-500">{schedule.departure_time}</p>
                      </div>

                      {/* Arrow */}
                      <div className="flex-1 mx-4 relative">
                        <div className="h-0.5 w-full bg-gradient-to-r from-teal-500 to-cyan-500" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white dark:bg-gray-800 rounded-full border-2 border-teal-500 flex items-center justify-center">
                          <FaShip className="text-teal-500 text-xs" />
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                          <FaMapMarkerAlt className="text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{schedule.to}</p>
                        <p className="text-xs text-gray-500">{schedule.arrival_time}</p>
                      </div>
                    </div>
                  </div>

                  {/* Days */}
                  <div className="flex flex-wrap gap-2">
                    {schedule.days.map((day, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold"
                      >
                        {day}
                      </span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 card p-8 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20"
        >
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Important Information
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              "Arrive at the port 30 minutes before departure",
              "Carry valid ID proof and booking confirmation",
              "Schedule may change due to weather conditions",
              "Online booking recommended during peak season"
            ].map((info, index) => (
              <div key={index} className="flex items-start gap-3">
                <FaCheckCircle className="text-teal-500 mt-1 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">{info}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ShipSchedule;