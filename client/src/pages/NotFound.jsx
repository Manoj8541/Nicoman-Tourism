// client/src/pages/NotFound.jsx
// Animated 404 page — island-lost ocean theme with wave animation

import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaHome, FaArrowLeft, FaCompass } from 'react-icons/fa';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-gradient-to-b from-sky-100 to-blue-200 dark:from-gray-900 dark:to-gray-800">

      {/* Animated ocean waves at bottom */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none" style={{ height: '180px' }}>
        <motion.svg
          className="absolute bottom-0 w-full"
          style={{ height: '180px', minWidth: '200%' }}
          animate={{ x: [0, '-50%'] }}
          transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 180"
          preserveAspectRatio="none"
        >
          <path
            fill="rgba(14, 165, 233, 0.35)"
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,165.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
          <path
            fill="rgba(6, 182, 212, 0.5)"
            d="M0,128L48,112C96,96,192,64,288,69.3C384,75,480,117,576,138.7C672,160,768,160,864,138.7C960,117,1056,75,1152,64C1248,53,1344,75,1392,85.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </motion.svg>
      </div>

      {/* Floating island emoji */}
      <div className="absolute top-1/4 left-1/4 text-4xl opacity-20 select-none pointer-events-none">🌴</div>
      <div className="absolute top-1/3 right-1/4 text-3xl opacity-20 select-none pointer-events-none">⛵</div>
      <div className="absolute bottom-1/3 left-1/6 text-2xl opacity-20 select-none pointer-events-none">🐠</div>

      <div className="text-center relative z-10">
        {/* 404 number */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: -50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          className="mb-4"
        >
          <h1 className="text-[10rem] md:text-[14rem] font-black leading-none gradient-text select-none">
            404
          </h1>
        </motion.div>

        {/* Compass spin */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
          className="text-5xl mb-6 inline-block text-teal-500"
        >
          <FaCompass />
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-3">
            Island Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-10 max-w-md mx-auto text-lg">
            This page seems to have drifted away into the ocean. Let's navigate you back to safety.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/" className="btn-primary inline-flex items-center gap-2">
                <FaHome /> Back to Home
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur text-gray-700 dark:text-gray-300 font-semibold border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 transition-colors"
              >
                <FaArrowLeft /> Go Back
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
