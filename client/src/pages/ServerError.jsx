// client/src/pages/ServerError.jsx
// Animated 500 error page — storm at sea theme

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaHome, FaArrowLeft, FaExclamationTriangle, FaRedo } from 'react-icons/fa';

export default function ServerError() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-gradient-to-b from-gray-800 to-gray-900 dark:from-gray-950 dark:to-gray-900">

      {/* Dark storm clouds */}
      <motion.div
        animate={{ x: [0, 30, 0], opacity: [0.3, 0.5, 0.3] }}
        transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
        className="absolute top-10 left-0 text-8xl opacity-30 select-none pointer-events-none"
      >☁️</motion.div>
      <motion.div
        animate={{ x: [0, -20, 0], opacity: [0.2, 0.4, 0.2] }}
        transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut', delay: 1 }}
        className="absolute top-16 right-10 text-6xl opacity-20 select-none pointer-events-none"
      >⛅</motion.div>

      {/* Lightning flash */}
      <motion.div
        animate={{ opacity: [0, 1, 0, 0, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeOut', delay: 2 }}
        className="absolute inset-0 bg-yellow-200/5 pointer-events-none"
      />

      {/* Storm waves */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden" style={{ height: '160px' }}>
        <motion.svg
          className="absolute bottom-0 w-full"
          style={{ height: '160px', minWidth: '200%' }}
          animate={{ x: [0, '-50%'] }}
          transition={{ repeat: Infinity, duration: 5, ease: 'linear' }}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 160"
          preserveAspectRatio="none"
        >
          <path
            fill="rgba(30, 58, 138, 0.6)"
            d="M0,64L48,80C96,96,192,128,288,133.3C384,139,480,117,576,96C672,75,768,53,864,64C960,75,1056,117,1152,128C1248,139,1344,117,1392,106.7L1440,96L1440,320L0,320Z"
          />
          <path
            fill="rgba(37, 99, 235, 0.4)"
            d="M0,96L48,80C96,64,192,32,288,42.7C384,53,480,107,576,128C672,149,768,139,864,117.3C960,96,1056,64,1152,58.7C1248,53,1344,75,1392,85.3L1440,96L1440,320L0,320Z"
          />
        </motion.svg>
      </div>

      <div className="text-center relative z-10">
        {/* Warning icon */}
        <motion.div
          animate={{ rotate: [-5, 5, -5], scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="text-7xl mb-4 inline-block"
        >
          ⛈️
        </motion.div>

        {/* 500 number */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 150, damping: 15 }}
        >
          <h1 className="text-[10rem] md:text-[14rem] font-black leading-none select-none"
            style={{ color: 'transparent', WebkitTextStroke: '3px #ef4444', filter: 'drop-shadow(0 0 30px rgba(239,68,68,0.4))' }}
          >
            500
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <FaExclamationTriangle className="text-red-400 text-2xl" />
            <h2 className="text-3xl md:text-4xl font-black text-white">
              Server Error
            </h2>
            <FaExclamationTriangle className="text-red-400 text-2xl" />
          </div>
          <p className="text-gray-400 mb-10 max-w-md mx-auto text-lg">
            Something went wrong on our end — our ferry hit a storm. We're working to fix it. Please try again shortly.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors shadow-lg shadow-red-500/30"
              >
                <FaRedo /> Try Again
              </button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 backdrop-blur text-white font-semibold border border-white/20 hover:bg-white/20 transition-colors"
              >
                <FaHome /> Go Home
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
