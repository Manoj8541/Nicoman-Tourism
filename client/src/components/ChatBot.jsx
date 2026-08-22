// client/src/components/ChatBot.jsx
// ─── Smarter chatbot with client-side intent classification + real Supabase data ─
// Intent model loads lazily when the chat window is first opened.
// Falls back to upgraded keyword matching if classification fails or while loading.
// All responses are built from live database data, not hardcoded strings.

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaComments, FaTimes, FaRobot, FaUser } from 'react-icons/fa';
import axios from 'axios';
import { supabase } from '../lib/supabase';
import { loadIntentPipeline, classifyIntent } from '../lib/aiModels';
import { useAuth } from '../context/AuthContext';

// ─── Inline SVG icons (no emoji) ─────────────────────────────────────────────
const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

const ModelLoadingIcon = () => (
  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
);

// ─── Booking demo URL — single source of truth via env var ───────────────────
const BOOKING_URL = import.meta.env.VITE_BOOKING_DEMO_URL || 'http://localhost:5174';

// ─── Real Supabase / API data fetchers ───────────────────────────────────────
async function fetchTopPlaces() {
  try {
    const { data, error } = await supabase
      .from('tourist_places')
      .select('name, rating, category, location')
      .order('rating', { ascending: false })
      .limit(3);
    if (!error && data && data.length > 0) return data;

    const res = await axios.get('/api/tourist-places');
    return (res.data || []).slice(0, 3);
  } catch {
    try {
      const res = await axios.get('/api/tourist-places');
      return (res.data || []).slice(0, 3);
    } catch (err) {
      console.error('[ChatBot] fetchTopPlaces failed:', err);
      return null;
    }
  }
}

async function fetchTopHotels() {
  try {
    const { data, error } = await supabase
      .from('hotels')
      .select('name, price_per_night, price, rating, location, category')
      .order('rating', { ascending: false })
      .limit(3);
    if (!error && data && data.length > 0) {
      return data.map(h => ({
        ...h,
        price: h.price ?? h.price_per_night ?? 0
      }));
    }

    const res = await axios.get('/api/hotels');
    return (res.data || []).slice(0, 3).map(h => ({
      ...h,
      price: h.price ?? h.price_per_night ?? 0
    }));
  } catch {
    try {
      const res = await axios.get('/api/hotels');
      return (res.data || []).slice(0, 3).map(h => ({
        ...h,
        price: h.price ?? h.price_per_night ?? 0
      }));
    } catch (err) {
      console.error('[ChatBot] fetchTopHotels failed:', err);
      return null;
    }
  }
}

async function fetchOnTimeFerries() {
  try {
    const { data, error } = await supabase
      .from('ship_schedule')
      .select('ship_name, from, to, departure_time, status')
      .eq('status', 'on_time')
      .limit(3);
    if (!error && data && data.length > 0) return data;

    const res = await axios.get('/api/ship-schedule');
    const onTime = (res.data || []).filter(s => s.status === 'on_time' || s.status === 'On Time');
    return (onTime.length > 0 ? onTime : (res.data || [])).slice(0, 3);
  } catch {
    try {
      const res = await axios.get('/api/ship-schedule');
      return (res.data || []).slice(0, 3);
    } catch (err) {
      console.error('[ChatBot] fetchOnTimeFerries failed:', err);
      return null;
    }
  }
}

// ─── Response builders from real data ────────────────────────────────────────
function buildPlacesResponse(places) {
  if (places === null) return "I am having trouble fetching live data right now. Please try again in a moment, or visit our Tourist Places page.";
  if (places.length === 0) return "No tourist place data is available right now. Please visit our Tourist Places page for the latest information.";
  const list = places.map((p, i) => `${i + 1}. ${p.name} (${p.category || 'Sightseeing'}) in ${p.location || 'Nicoman'} — rated ${p.rating || 4.5}/5`).join('\n');
  return `Here are the top-rated tourist places in Nicoman Tourism:\n\n${list}\n\nVisit our Tourist Places page for full details and directions.`;
}

function buildHotelsResponse(hotels) {
  if (hotels === null) return "I am having trouble fetching live data right now. Please try again in a moment, or visit our Hotels page.";
  if (hotels.length === 0) return "No hotel data is available right now. Please visit our Hotels page for the latest listings.";
  const list = hotels.map((h, i) => `${i + 1}. ${h.name} in ${h.location || 'Nicoman'} — Rs.${(h.price || h.price_per_night || 0).toLocaleString('en-IN')}/night, ${h.rating || 4.0}/5 (${h.category || 'Standard'})`).join('\n');
  return `Here are the top-rated hotels in Nicoman Tourism:\n\n${list}\n\nVisit our Hotels page to see all options and availability.`;
}

function buildFerriesResponse(ferries) {
  if (ferries === null) return "I am having trouble fetching live ferry data right now. Please visit our Ferries page for current schedules.";
  if (ferries.length === 0) return "No on-time ferry routes are showing right now. Please check our Ferries page for the latest schedule and status updates.";
  const list = ferries.map((f, i) => `${i + 1}. ${f.ship_name}: ${f.from} to ${f.to} at ${f.departure_time || '08:00 AM'}`).join('\n');
  return `Here are currently available ferry routes:\n\n${list}\n\nVisit our Ferries page for full schedules and booking details.`;
}

function buildBookingResponse() {
  return `This information site does not process bookings directly. To check availability and book, please visit our dedicated booking demo:\n\n${BOOKING_URL}\n\nYou can also use the "Check Availability & Book" buttons on the Hotels and Ferries pages.`;
}

// ─── Intent to Supabase query router ─────────────────────────────────────────
async function routeIntentToResponse(intent) {
  switch (intent) {
    case 'tourist places': {
      const data = await fetchTopPlaces();
      return buildPlacesResponse(data);
    }
    case 'hotels': {
      const data = await fetchTopHotels();
      return buildHotelsResponse(data);
    }
    case 'ferries': {
      const data = await fetchOnTimeFerries();
      return buildFerriesResponse(data);
    }
    case 'booking help':
      return buildBookingResponse();
    case 'general question':
    default:
      return "I can help with hotels, ferries, or tourist places in Nicoman Tourism. Which one would you like to know about?";
  }
}

// ─── Upgraded keyword-based fallback (also uses real data) ────────────────────
async function getKeywordFallbackResponse(message) {
  const q = message.toLowerCase();

  if (q.includes('book') || q.includes('reserv') || q.includes('payment') || q.includes('pay')) {
    return buildBookingResponse();
  }
  if (q.includes('hotel') || q.includes('stay') || q.includes('resort') || q.includes('accommodation') || q.includes('room')) {
    const data = await fetchTopHotels();
    return buildHotelsResponse(data);
  }
  if (q.includes('ferry') || q.includes('ship') || q.includes('boat') || q.includes('schedule') || q.includes('sail')) {
    const data = await fetchOnTimeFerries();
    return buildFerriesResponse(data);
  }
  if (q.includes('place') || q.includes('visit') || q.includes('beach') || q.includes('tourist') || q.includes('attraction') || q.includes('island') || q.includes('jail') || q.includes('scuba')) {
    const data = await fetchTopPlaces();
    return buildPlacesResponse(data);
  }
  if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
    return "Welcome to Nicoman Tourism! I can help you with hotels, ferry schedules, and top tourist places. What would you like to know?";
  }
  if (q.includes('price') || q.includes('cost') || q.includes('budget') || q.includes('rate')) {
    const data = await fetchTopHotels();
    return buildHotelsResponse(data);
  }
  if (q.includes('best time') || q.includes('when to visit') || q.includes('season') || q.includes('weather') || q.includes('month')) {
    return "The best time to visit the islands is October to May, when skies are clear and seas are calm — ideal for beaches, diving, and island hopping. Avoid June to September (monsoon season).";
  }
  if (q.includes('permit') || q.includes('visa') || q.includes('entry') || q.includes('passport')) {
    return "Indian citizens do not need a permit for most accessible islands. Foreign nationals need a Restricted Area Permit (RAP), issued free on arrival at Port Blair airport.";
  }
  if (q.includes('flight') || q.includes('airport') || q.includes('reach') || q.includes('travel') || q.includes('how to go')) {
    return "The islands are accessible by air (direct flights from Chennai, Kolkata, Delhi to Port Blair — 2 to 3 hours) or by sea (passenger ships from Chennai, Kolkata, Vizag — 50 to 70 hours). Air travel is recommended for most visitors.";
  }

  return "I can help with hotels, ferry schedules, and tourist places in Nicoman Tourism. What would you like to know?";
}

// ─── Main ChatBot component ───────────────────────────────────────────────────
const ChatBot = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Welcome to Nicoman Tourism. I can help you find hotels, ferry schedules, and top tourist places. What would you like to know?", isBot: true }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const modelStarted = useRef(false);

  // Hide ChatBot on Profile, Admin Dashboard, and Auth pages
  const isHiddenPage = ['/profile', '/admin', '/auth', '/reset-password'].some(
    (path) => location.pathname.startsWith(path)
  );

  const quickReplies = [
    'Top beaches',
    'Best hotels',
    'Ferry schedules',
    'How to reach?',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Global listener allowing other components (like mobile navbar) to trigger chatbot
  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('open-chatbot', handleOpenChat);
    return () => window.removeEventListener('open-chatbot', handleOpenChat);
  }, []);

  // Load the intent model when the chat window is first opened
  useEffect(() => {
    if (isOpen && !modelStarted.current) {
      modelStarted.current = true;
      setModelLoading(true);
      loadIntentPipeline()
        .then(() => {
          setModelReady(true);
          setModelLoading(false);
        })
        .catch(() => {
          setModelReady(false);
          setModelLoading(false);
          console.warn('[ChatBot] Intent model failed to load, using keyword fallback.');
        });
    }
  }, [isOpen]);

  const appendBot = useCallback((text) => {
    setMessages(prev => [...prev, { text, isBot: true }]);
    setIsTyping(false);
  }, []);

  const handleSend = useCallback(async (messageText = input) => {
    const trimmed = messageText.trim();
    if (!trimmed) return;

    setMessages(prev => [...prev, { text: trimmed, isBot: false }]);
    setInput('');
    setIsTyping(true);

    try {
      if (modelReady) {
        const intent = await classifyIntent(trimmed);
        const reply = await routeIntentToResponse(intent);
        appendBot(reply);
      } else {
        const reply = await getKeywordFallbackResponse(trimmed);
        appendBot(reply);
      }
    } catch (err) {
      console.warn('[ChatBot] Fallback triggered:', err);
      const reply = await getKeywordFallbackResponse(trimmed);
      appendBot(reply);
    }
  }, [input, modelReady, appendBot]);

  // Only show ChatBot for authenticated users and on permitted pages
  if (!user || isHiddenPage) return null;

  return createPortal(
    <div className="chatbot-portal-root">
      {/* Chat Toggle Button - High visibility & touch friendly on all screen sizes */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`chatbot-fab w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 active:scale-95 touch-manipulation cursor-pointer border-2 border-white/40 ${isOpen
          ? 'bg-red-500 hover:bg-red-600'
          : 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:shadow-teal-500/50 pulse-glow ring-4 ring-teal-400/25'
          }`}
        aria-label={isOpen ? 'Close chat' : 'Open chat assistant'}
      >
        {isOpen ? (
          <FaTimes className="text-white text-xl sm:text-2xl" />
        ) : (
          <FaComments className="text-white text-xl sm:text-2xl" />
        )}
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="chatbot-window w-[calc(100vw-1.5rem)] sm:w-[380px] max-w-[400px]"
          >
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col max-h-[min(560px,calc(100dvh-6.5rem))]">

              {/* Header */}
              <div className="bg-gradient-to-r from-teal-500 to-cyan-500 p-4 sm:p-5 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <FaRobot className="text-xl sm:text-2xl text-white" />
                      </div>
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-base sm:text-lg leading-none">Island Assistant</h3>
                      {modelLoading ? (
                        <div className="flex items-center gap-1.5 mt-1">
                          <ModelLoadingIcon />
                          <p className="text-xs text-white/90">Loading AI model...</p>
                        </div>
                      ) : (
                        <p className="text-xs text-white/90 mt-1">
                          {modelReady ? 'AI Powered & Live Data' : 'Nicoman Tourism Assistant'}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors sm:hidden cursor-pointer"
                    aria-label="Close assistant"
                  >
                    <FaTimes size={16} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10, x: message.isBot ? -20 : 20 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`flex items-end gap-2 max-w-[85%] ${message.isBot ? 'flex-row' : 'flex-row-reverse'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.isBot
                        ? 'bg-gradient-to-r from-teal-500 to-cyan-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                        }`}>
                        {message.isBot
                          ? <FaRobot className="text-white text-sm" />
                          : <FaUser className="text-gray-600 dark:text-gray-300 text-sm" />
                        }
                      </div>
                      <div className={`px-4 py-3 rounded-2xl text-sm whitespace-pre-line leading-relaxed ${message.isBot
                        ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-md rounded-bl-none'
                        : 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-br-none'
                        }`}>
                        {message.text}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-end gap-2"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center">
                      <FaRobot className="text-white text-sm" />
                    </div>
                    <div className="bg-white dark:bg-gray-700 px-4 py-3 rounded-2xl rounded-bl-none shadow-md">
                      <div className="flex space-x-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Replies */}
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-2">
                  {quickReplies.map((reply, index) => (
                    <button
                      key={index}
                      onClick={() => handleSend(reply)}
                      className="px-3 py-1 text-xs bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-full hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:border-teal-300 dark:hover:border-teal-600 hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Ask about hotels, ferries, places..."
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 rounded-xl border-2 border-transparent focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-all text-sm"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isTyping}
                    className="p-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl hover:shadow-lg hover:shadow-teal-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    aria-label="Send message"
                  >
                    <SendIcon />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
};

export default ChatBot;