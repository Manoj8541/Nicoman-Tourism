// client/src/components/ChatBot.jsx
// ─── Intelligent Island Assistant with Live RAG, Continuity & Entity Resolution ──
// • Zero paid external APIs — 100% self-hosted, deterministic, offline-resilient
// • Live Supabase synchronization with automatic server/in-memory fallback
// • Distinctive token entity matching (eliminates stopword false positives)
// • Price-aware hotel sorting (budget vs luxury)
// • Comprehensive mainland ship routes & inter-island ferry schedules with fares
// • Turn-by-turn conversational continuity (remembers active island/hotel/route context)
// • Interactive markdown link rendering (React Router SPA navigation + external links)
// • Security shield against prompt injection, DB leaks, and administrative snooping

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaComments, FaTimes, FaRobot, FaUser, FaExternalLinkAlt } from 'react-icons/fa';
import axios from 'axios';
import { supabase } from '../lib/supabase';
import { loadIntentPipeline, classifyIntent } from '../lib/aiModels';
import { useAuth } from '../context/AuthContext';

// ─── Inline SVG icons ────────────────────────────────────────────────────────
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

// ─── Content Moderation & Security Shield ────────────────────────────────────
const OFFENSIVE_TERMS = [
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'dick', 'pussy', 'nude', 'porn', 'sex',
  'xxx', 'slut', 'whore', 'cunt', 'kill yourself', 'idiot', 'stupid bot', 'dumb bot'
];

function isOffensiveContent(text) {
  if (!text) return false;
  const clean = text.toLowerCase();
  return OFFENSIVE_TERMS.some(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    return regex.test(clean);
  });
}

function isSecurityExploitQuery(text) {
  if (!text) return false;
  const clean = text.toLowerCase();
  const exploitPatterns = [
    /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
    /system\s+prompt/i,
    /dump\s+(database|db|users|profiles|passwords|auth)/i,
    /select\s+\*\s+from/i,
    /drop\s+table/i,
    /supabase_service_role/i,
    /service_role_key/i,
    /jwt_secret/i,
    /personal\s+(info|data|email|phone)\s+of/i,
    /admin\s+password/i,
    /leak\s+(keys|token|credential)/i,
    /fetch\s+data\s+info\s+like\s+personal/i,
    /unique\s+id\s+or\s+something/i
  ];
  return exploitPatterns.some(regex => regex.test(clean));
}

// ─── Comprehensive Transit Guides (How to Reach) ─────────────────────────────
const TRANSIT_GUIDES = {
  baratang: `🚗 **How to Reach Baratang Island (from Port Blair):**\n\n1. **Distance & Route:** Situated ~100 km north of Port Blair. Transit travels via the Andaman Trunk Road (ATR / NH-4) passing through the protected Jarawa Tribal Reserve.\n2. **Security Convoys:** Private tourist cabs and state transport buses depart strictly in scheduled police-escorted convoys from **Jirkatang Checkpost** at **06:00 AM, 09:00 AM, 12:00 PM, and 02:30 PM** (~3 hours drive).\n3. **Vehicle Ferry Crossing:** At Middle Strait, board the 15-minute vehicle ferry crossing the creek to Baratang Jetty.\n4. **Limestone Caves & Mud Volcano:** From Baratang Jetty, authorized fiber speed boats navigate through mangrove creeks to the **Limestone Caves** (permit fee ~₹800/boat) and local jeeps go to the active **Mud Volcano** (~₹50).\n\n💡 *Pro-Tip: Join the early 06:00 AM convoy to explore the caves comfortably before midday heat!*`,

  havelock: `🚢 **How to Reach Havelock Island (Swaraj Dweep):**\n\n1. **High-Speed Catamarans (Recommended):** Private luxury catamarans (**Makruzz**, **Nautika**, **Green Ocean**, **ITT Majestic**) depart daily from Phoenix Bay Jetty or Haddo Wharf in Port Blair.\n2. **Travel Duration:** ~90 to 120 minutes across the open sea (54 nautical miles).\n3. **Timetables & Fares:** Morning departures operate from 06:00 AM, 08:00 AM, 08:15 AM, and afternoon trips at 01:30 PM & 02:00 PM. Fares start from ₹1,250 to ₹2,200 depending on seat tier (Premium / Deluxe / Royal).\n4. **Government DSS Ferries:** Slower government ferries run at ₹650–₹850 (~2.5 hours).\n\nCheck live schedules on our [Ferries](/ferries) or [Ship Schedule](/ship-schedule) page.`,

  neil: `🚢 **How to Reach Neil Island (Shaheed Dweep):**\n\n1. **From Port Blair:** Direct passenger catamarans take ~75 to 90 minutes from Phoenix Bay Jetty (departures at 06:30 AM & 11:30 AM, ₹1,100–₹1,550).\n2. **From Havelock Island:** Frequent inter-island catamarans connect Havelock to Neil in just ~45 to 60 minutes (daily sailings at 10:30 AM & 02:30 PM, ₹950–₹1,450).\n3. **Local Transit:** Upon arrival at Neil Jetty, rental scooters (₹500/day) or auto-rickshaws easily connect to **Bharatpur Beach** (water sports), **Natural Coral Bridge**, and **Laxmanpur Beach** (spectacular sunsets).`,

  cellular: `🏛️ **How to Reach Cellular Jail (National Memorial):**\n\n• **Location:** Atlanta Point, central Port Blair (~4 km from Veer Savarkar International Airport and 2 km from Aberdeen Bazaar).\n• **Transit:** 10 to 15 minutes by auto-rickshaw (₹100–₹150) or taxi.\n• **Visiting Hours:** Tuesday to Sunday: 09:00 AM – 12:30 PM & 01:30 PM – 04:45 PM (Closed Mondays).\n• **Sound & Light Show:** Evening spectacles run daily at 05:30 PM, 06:45 PM, and 08:00 PM (Tickets ₹150–₹300).`,

  elephant: `🤿 **How to Reach Elephant Beach (Havelock Island):**\n\nFamous for living coral reefs, sea walking, snorkeling, and parasailing:\n1. **By Speed Boat:** 30-minute boat ride from Havelock (Haddo) Jetty (~₹1,000 round-trip including basic snorkeling session).\n2. **By Rainforest Trek:** A scenic 2 km tropical jungle trail starting near Radhanagar road (~35 minutes walk, free entry, ideal for nature lovers).\n\n🕒 *Visiting Hours: 08:00 AM to 03:30 PM.*`,

  radhanagar: `🌅 **How to Reach Radhanagar Beach (Beach No. 7):**\n\n• **Location:** West coast of Havelock Island (~11 km from Havelock Jetty).\n• **Transit:** 20 to 25 minutes by rented two-wheeler (₹500/day), shared auto-rickshaw, or cab.\n• **Accolades:** Crowned Asia's best beach by Time Magazine with pristine powdery white sands and turquoise waters. Open 06:00 AM – 05:30 PM (swimming stops at sunset).`,

  ross: `🏝️ **How to Reach Ross Island (Netaji Subhash Chandra Bose Dweep):**\n\n• **Transit:** A quick 15-minute speed boat ride from Rajiv Gandhi Water Sports Complex (Aberdeen Jetty) in Port Blair.\n• **Timings:** Boats operate from 08:30 AM to 03:00 PM (Closed Wednesdays).\n• **Cost:** ~₹400–₹500 round-trip boat + ₹50 entry fee.\n• **Highlights:** Roam among friendly wild spotted deer and atmospheric British colonial ruins embraced by ancient banyan roots.`,

  diglipur: `🏞️ **How to Reach Diglipur & Ross-Smith Islands (North Andaman):**\n\n• **By Sea (Overnight):** DSS passenger ships sail 3 times weekly from Port Blair to Aerial Bay Jetty in Diglipur (~8–10 hours, fares ₹650–₹1,200).\n• **By Road (ATR):** Scenic bus or private cab journey along the Andaman Trunk Road (~300 km / 10–12 hours crossing Baratang and Rangat).\n• **Highlights:** The iconic Ross & Smith twin islands connected by a natural white sandbar, Saddle Peak (highest mountain in Andaman, 732m), and Kalipur turtle nesting beach.`,

  mainland: `✈️ **How to Reach Andaman from Mainland India (Chennai / Kolkata / Delhi):**\n\n• **By Air (Fastest & Recommended):** Daily non-stop direct flights operate to **Veer Savarkar International Airport (IXZ)** in Port Blair:\n  - From **Chennai (MAA):** ~2 hours flight (IndiGo, Air India)\n  - From **Kolkata (CCU):** ~2 hours 15 minutes (IndiGo, SpiceJet)\n  - From **Delhi (DEL), Bengaluru (BLR), Hyderabad (HYD):** Direct seasonal or 1-stop flights\n\n• **By Sea (Regular Passenger Ships):** Government passenger vessels operated by DSS sail 3–4 times monthly from Chennai, Kolkata, and Visakhapatnam to Port Blair (~50 to 65 hours, 2.5–3 days).\n\n💡 *Tip: For holidays under 7 days, air travel is strongly advised to maximize island vacation time.*`
};

// ─── Authentic Historical Profiles ──────────────────────────────────────────
const HISTORY_GUIDES = {
  cellular: `🏛️ **History of Cellular Jail (Kala Pani National Memorial):**\n\n• **Construction & Architecture:** Built by the British between 1896 and 1906 using bricks transported from Burma. The fortress featured seven 3-story wings radiating out from a central watchtower (Jeremy Bentham's Panopticon concept), housing 698 solitary confinement cells (13.5 × 7 ft) designed so freedom fighters could never communicate.\n• **National Freedom Fighters:** Imprisoned prominent revolutionaries including **Veer Vinayak Damodar Savarkar**, his brother Babarao Savarkar, Batukeshwar Dutt (Bhagat Singh's associate in the 1929 Central Assembly bombing), Bhai Parmanand, and Trailokyanath Chakravarty.\n• **WWII Japanese Occupation (1942–1945):** Japanese imperial forces captured Port Blair in March 1942, using the jail to interrogate and execute suspected Allied spies. On **30 December 1943**, **Netaji Subhash Chandra Bose** visited Port Blair, hoisted the Indian National Tricolor for the first time on liberated soil at Gymkhana Ground, and renamed the islands 'Shaheed' and 'Swaraj'.\n• **Present Day:** Declared a National Memorial in 1969. Visit our [Tourist Places](/tourist-places) page for details.`,

  ross: `🏝️ **History of Ross Island (Netaji Subhash Chandra Bose Dweep):**\n\n• **British Penal Capital (1858–1941):** Named after marine surveyor Captain Daniel Ross. Following the 1857 First War of Independence, the British established Ross Island as the administrative headquarters of the Andaman penal colony. Known as the **"Paris of the East"**, it contained a European ballroom, water distillation plant, printing press, Presbyterian church, swimming pool, and the Chief Commissioner's mansion.\n• **Earthquake & Evacuation (1941):** An 8.1 magnitude earthquake struck in June 1941, damaging buildings and prompting evacuation.\n• **Japanese Bunkers & Renaming:** Occupied by Japanese troops from 1942–1945, who built concrete coastal artillery bunkers that remain intact today. On 30 December 2018, the Government of India officially renamed it **Netaji Subhash Chandra Bose Dweep**.`,

  viper: `⛓️ **History of Viper Island:**\n\n• **Earliest Penal Settlement:** Located inside Port Blair harbour, Viper Island served as the British gallows and penal station from 1858 until Cellular Jail was completed in 1906.\n• **Viper Chain Gang:** Political prisoners and convict freedom fighters were subjected to hard labour and chained together in grueling working parties.\n• **Historic Execution:** Sher Ali Afridi, who assassinated the Viceroy of India, Lord Mayo, during his official inspection tour at Mount Harriet in February 1872, was tried and hanged at the Viper Island gallows.`,

  havelock: `🌴 **History of Havelock Island (Swaraj Dweep):**\n\n• **Naming & Heritage:** Originally named during British rule after Major General Sir Henry Havelock. In December 2018, Prime Minister Narendra Modi officially renamed it **Swaraj Dweep** in tribute to Netaji Subhash Chandra Bose's historic 1943 declaration.\n• **Post-Independence Settlement:** In the 1950s, families from East Bengal were rehabilitated here under the government colonization scheme, developing coconut plantations and agriculture before the island became India's premier scuba and beach paradise.`,

  baratang: `🗿 **Geological & Tribal History of Baratang Island:**\n\n• **Limestone Caves:** Sculpted over millions of years by underground water streams rich in calcium carbonate dissolving sedimentary rock, producing towering stalactites hanging from cave ceilings and stalagmites rising from the cave floor.\n• **Mud Volcanoes:** Baratang features India's only known active mud volcanoes, generated by subsurface natural gas (methane) emissions bubbling up geothermal liquid mud.\n• **Indigenous Heritage:** The island borders the ancestral territory of the nomadic **Jarawa Tribe**, who have lived in the Andaman evergreen rainforests for over 50,000 years.`
};

// ─── Mainland Passenger Ships Knowledge Base ─────────────────────────────────
const MAINLAND_SHIPS = {
  chennai: {
    from: 'Chennai Port (Harbour)',
    to: 'Port Blair (Haddo Wharf)',
    distance: '647 nautical miles (~1,198 km)',
    duration: '50 to 60 hours (~2.5 days)',
    ships: ['MV Swaraj Dweep', 'MV Nancowry', 'MV Nicobar', 'MV Andaman Shipping'],
    frequency: '3 to 4 scheduled sailings per month (Directorate of Shipping Services)',
    tariffs: [
      { tier: 'Bunk Class', price: '₹2,450 – ₹2,800' },
      { tier: 'Second Class Cabin', price: '₹6,500 – ₹7,200' },
      { tier: 'Deluxe / First Class Cabin', price: '₹9,500 – ₹10,500' }
    ],
    status: '🟢 On Time (Scheduled)'
  },
  kolkata: {
    from: 'Kolkata Port (Netaji Subhash Dock)',
    to: 'Port Blair (Haddo Wharf)',
    distance: '756 nautical miles (~1,400 km)',
    duration: '56 to 66 hours (~2.5 to 3 days)',
    ships: ['MV Nicobar', 'MV Nalanda', 'MV Akbar'],
    frequency: '2 to 3 scheduled sailings per month',
    tariffs: [
      { tier: 'Bunk Class', price: '₹2,800 – ₹3,100' },
      { tier: 'Second Class Cabin', price: '₹7,500 – ₹8,200' },
      { tier: 'Deluxe Cabin', price: '₹10,500 – ₹11,500' }
    ],
    status: '🟢 On Time (Scheduled)'
  },
  vizag: {
    from: 'Visakhapatnam Port',
    to: 'Port Blair (Haddo Wharf)',
    distance: '684 nautical miles (~1,267 km)',
    duration: '56 to 64 hours (~2.5 days)',
    ships: ['MV Harshavardhana', 'MV Vizag Gold Express'],
    frequency: '1 to 2 scheduled sailings per month',
    tariffs: [
      { tier: 'Bunk Class', price: '₹2,650 – ₹2,900' },
      { tier: 'Second Class Cabin', price: '₹6,900 – ₹7,500' },
      { tier: 'Deluxe Cabin', price: '₹9,800 – ₹10,800' }
    ],
    status: '🟢 On Time (Scheduled)'
  }
};

// ─── Default Fallback Entities (Guarantees Offline Resilience) ───────────────
const FALLBACK_HOTELS = [
  { id: 'h1', name: 'Coral Reef Resort', location: 'Neil Island', price: 3500, rating: 4.2, category: 'Budget', amenities: ['WiFi', 'Restaurant', 'Garden Lounge', 'Bicycle Rental'], description: 'Cozy tropical cottages near Bharatpur Beach surrounded by tranquil fruit orchards and vibrant coral reef gardens.' },
  { id: 'h2', name: 'TSG Aura Resort', location: 'Port Blair', price: 3800, rating: 4.1, category: 'Budget', amenities: ['WiFi', 'Restaurant', 'Room Service', 'Airport Shuttle'], description: 'Convenient modern boutique accommodation offering comfortable executive suites, fast airport shuttle, and rooftop island dining.' },
  { id: 'h3', name: 'Peerless Resort', location: 'Port Blair', price: 4200, rating: 4.3, category: 'Premium', amenities: ['WiFi', 'Pool', 'Fitness Center', 'Spa', 'Restaurant'], description: 'The only resort located right on Corbyn\'s Cove Beach in Port Blair, offering lush landscaped gardens and ocean-view luxury rooms.' },
  { id: 'h4', name: 'SeaShell Resort & Spa', location: 'Havelock Island', price: 5500, rating: 4.5, category: 'Luxury', amenities: ['WiFi', 'Swimming Pool', 'Beach Access', 'Restaurant', 'Bar'], description: 'Premium wooden beach chalets overlooking crystal-clear waters with an open-air swimming pool, sunset bar, and multi-cuisine restaurant.' },
  { id: 'h5', name: 'Symphony Palms Beach Resort', location: 'Havelock Island', price: 6800, rating: 4.7, category: 'Luxury', amenities: ['WiFi', 'Beach Access', 'Restaurant', 'Dive Center', 'Room Service'], description: 'Beachfront cottages nestled under towering coconut palms with immediate access to private lagoon waters, dive center, and candlelight beach dinners.' },
  { id: 'h6', name: 'Taj Exotica Resort & Spa', location: 'Havelock Island', price: 15000, rating: 4.9, category: 'Ultra Luxury', amenities: ['WiFi', 'Infinity Pool', 'Spa', 'Private Beach Access', 'Fine Dining', 'Water Sports'], description: 'Ultra-luxury 5-star villas situated on Radhanagar Beach, featuring private plunge pools, world-class dining, and rejuvenating Ayurvedic wellness spas.' }
];

const FALLBACK_PLACES = [
  { id: 'p1', name: 'Radhanagar Beach', location: 'Havelock Island', category: 'Beach', rating: 4.8, best_time: 'October to May', description: 'Ranked as Asia\'s best beach by Time Magazine, famous for turquoise waters, powder-soft white sands, and breathtaking tropical sunsets.' },
  { id: 'p2', name: 'Cellular Jail', location: 'Port Blair', category: 'Historic', rating: 4.7, best_time: 'Year Round', description: 'Colonial-era penal settlement known as Kala Pani, symbolizing India\'s struggle for independence with an evening sound and light show.' },
  { id: 'p3', name: 'Elephant Beach', location: 'Havelock Island', category: 'Beach', rating: 4.7, best_time: 'October to May', description: 'Renowned for crystal-clear shallow waters, vibrant living coral reefs, sea walking, snorkeling, and thrilling water sports adventures.' },
  { id: 'p4', name: 'Havelock Island (Swaraj Dweep)', location: 'Havelock Island', category: 'Island', rating: 4.9, best_time: 'October to May', description: 'The premier destination of the archipelago featuring world-class scuba diving, verdant tropical rainforests, and serene beachside resorts.' },
  { id: 'p5', name: 'Neil Island (Shaheed Dweep)', location: 'Neil Island', category: 'Island', rating: 4.6, best_time: 'November to April', description: 'Peaceful, rustic island known for its organic agriculture, natural coral rock formations, Laxmanpur Beach, and Bharatpur coral reefs.' },
  { id: 'p6', name: 'Baratang Island', location: 'Middle Andaman', category: 'Nature', rating: 4.4, best_time: 'November to March', description: 'Famous for fascinating natural limestone caves, active mud volcanoes, and dense mangrove creek boat expeditions.' },
  { id: 'p7', name: 'Ross Island (Netaji Subhash Chandra Bose Dweep)', location: 'Near Port Blair', category: 'Historic', rating: 4.5, best_time: 'October to May', description: 'Former British colonial administrative headquarters with crumbling ruins intertwined with giant banyan trees and roaming spotted deer.' }
];

const FALLBACK_FERRIES = [
  { id: 'f1', ship_name: 'Makruzz Gold Express', from: 'Port Blair', to: 'Havelock Island', departure_time: '06:00 AM', arrival_time: '07:30 AM', travel_time: '1h 30m', price: 1650, status: 'on-time' },
  { id: 'f2', ship_name: 'Green Ocean 1', from: 'Port Blair', to: 'Havelock Island', departure_time: '08:00 AM', arrival_time: '10:15 AM', travel_time: '2h 15m', price: 1250, status: 'on-time' },
  { id: 'f3', ship_name: 'ITT Majestic Catamaran', from: 'Havelock Island', to: 'Neil Island', departure_time: '10:30 AM', arrival_time: '11:45 AM', travel_time: '1h 15m', price: 1450, status: 'on-time' },
  { id: 'f4', ship_name: 'Makruzz Pearl Express', from: 'Neil Island', to: 'Port Blair', departure_time: '02:00 PM', arrival_time: '03:15 PM', travel_time: '1h 15m', price: 1550, status: 'on-time' },
  { id: 'f5', ship_name: 'Nautika Superfast', from: 'Port Blair', to: 'Havelock Island', departure_time: '01:30 PM', arrival_time: '03:00 PM', travel_time: '1h 30m', price: 1750, status: 'on-time' },
  { id: 'f6', ship_name: 'MV Swaraj Dweep (Mainland)', from: 'Chennai Port', to: 'Port Blair', departure_time: '08:00 PM', arrival_time: '10:00 AM +2', travel_time: '54h', price: 2450, status: 'on-time' },
  { id: 'f7', ship_name: 'MV Nicobar (Mainland)', from: 'Kolkata Port', to: 'Port Blair', departure_time: '07:00 PM', arrival_time: '07:00 PM +2', travel_time: '60h', price: 2800, status: 'on-time' },
  { id: 'f8', ship_name: 'MV Harshavardhana (Mainland)', from: 'Visakhapatnam Port', to: 'Port Blair', departure_time: '09:00 PM', arrival_time: '03:00 PM +2', travel_time: '64h', price: 2650, status: 'on-time' }
];

// ─── Live Database Fetchers with Fast Failover ──────────────────────────────
const asyncWithTimeout = (promise, ms = 500) => {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('timeout')), ms);
  });
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    timeoutPromise
  ]);
};

async function fetchAllLivePlaces() {
  try {
    return await asyncWithTimeout((async () => {
      if (supabase) {
        const { data, error } = await supabase
          .from('tourist_places')
          .select('name, rating, category, location, description, best_time');
        if (!error && data && data.length > 0) return data;
      }
      const res = await axios.get('/api/tourist-places', { timeout: 400 });
      return res.data?.length > 0 ? res.data : FALLBACK_PLACES;
    })(), 500);
  } catch {
    return FALLBACK_PLACES;
  }
}

async function fetchAllLiveHotels() {
  try {
    return await asyncWithTimeout((async () => {
      if (supabase) {
        const { data, error } = await supabase
          .from('hotels')
          .select('name, price_per_night, price, rating, location, category, amenities, description');
        if (!error && data && data.length > 0) {
          return data.map(h => ({ ...h, price: h.price ?? h.price_per_night ?? 4500 }));
        }
      }
      const res = await axios.get('/api/hotels', { timeout: 400 });
      if (res.data?.length > 0) {
        return res.data.map(h => ({ ...h, price: h.price ?? h.price_per_night ?? 4500 }));
      }
      return FALLBACK_HOTELS;
    })(), 500);
  } catch {
    return FALLBACK_HOTELS;
  }
}

async function fetchAllLiveFerries() {
  try {
    return await asyncWithTimeout((async () => {
      if (supabase) {
        const { data, error } = await supabase
          .from('ship_schedule')
          .select('ship_name, from, to, from_port, to_port, departure_time, arrival_time, travel_time, price, seats_available, status');
        if (!error && data && data.length > 0) return data;
      }
      const res = await axios.get('/api/ship-schedule', { timeout: 400 });
      return res.data?.length > 0 ? res.data : FALLBACK_FERRIES;
    })(), 500);
  } catch {
    return FALLBACK_FERRIES;
  }
}

// ─── Stopword-Free Distinctive Entity Matching ───────────────────────────────
const GENERIC_STOPWORDS = new Set([
  'hotel', 'hotels', 'resort', 'resorts', 'spa', 'beach', 'palms', 'stay', 'stays',
  'room', 'rooms', 'price', 'pricing', 'tariff', 'tariffs', 'cost', 'costs', 'rate', 'rates',
  'location', 'where', 'address', 'and', 'the', 'in', 'at', 'for', 'of', 'a', 'an', 'is', 'are',
  'list', 'budget', 'budgeted', 'luxury', 'tell', 'me', 'about', 'what', 'give', 'show',
  'any', 'good', 'best', 'book', 'booking', 'check', 'details', 'detail', 'info', 'information',
  'reach', 'how', 'to', 'go', 'travel', 'timing', 'time', 'timings'
]);

function extractDistinctiveTokens(str) {
  if (!str) return [];
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !GENERIC_STOPWORDS.has(word));
}

function matchSpecificHotel(queryText, hotels) {
  const queryTokens = extractDistinctiveTokens(queryText);
  if (queryTokens.length === 0) return null;

  let bestMatch = null;
  let highestScore = 0;

  for (const hotel of hotels) {
    const hotelTokens = extractDistinctiveTokens(hotel.name);
    let score = 0;

    for (const qToken of queryTokens) {
      for (const hToken of hotelTokens) {
        if (hToken === qToken) score += 3;
        else if (hToken.startsWith(qToken) || qToken.startsWith(hToken)) score += 2;
        else if (hToken.includes(qToken) || qToken.includes(hToken)) score += 1;
      }
    }

    if (score > highestScore && score >= 2) {
      highestScore = score;
      bestMatch = hotel;
    }
  }

  return bestMatch;
}

// ─── Dynamic Response Formatters ─────────────────────────────────────────────
function buildPlacesResponse(places) {
  if (!places || places.length === 0) return "No tourist place records available right now. Please explore our [Tourist Places](/tourist-places) page.";
  const list = places.slice(0, 3).map((p, i) => `${i + 1}. **${p.name}** (${p.category || 'Sightseeing'}) in ${p.location || 'Nicoman'} — rated ${p.rating || 4.5}/5`).join('\n');
  return `Here are top-rated tourist places in Nicoman Tourism:\n\n${list}\n\nVisit our [Tourist Places](/tourist-places) page for interactive maps, photographs, and directions.`;
}

function buildHotelsResponse(hotels, label = '') {
  if (!hotels || hotels.length === 0) return `No hotel listings found for ${label || 'this search'} right now. Please check our [Hotels](/hotels) page.`;
  const list = hotels.slice(0, 3).map((h, i) => `${i + 1}. **${h.name}** in ${h.location || 'Andaman'} — ₹${(h.price || 4500).toLocaleString('en-IN')}/night, ${h.rating || 4.0}/5 (${h.category || 'Standard'})`).join('\n');
  return `Here are top-rated hotel stays${label ? ` in ${label}` : ''}:\n\n${list}\n\nVisit our [Hotels](/hotels) page to check room amenities, photos, and book availability.`;
}

function buildBudgetHotelsResponse(hotels, locationLabel = '') {
  let filtered = [...hotels];
  if (locationLabel) {
    const locLower = locationLabel.toLowerCase();
    filtered = filtered.filter(h => (h.location || '').toLowerCase().includes(locLower));
  }
  // Sort ascending by price
  filtered.sort((a, b) => (a.price || 4500) - (b.price || 4500));
  const budgetList = filtered.slice(0, 4);

  if (budgetList.length === 0) {
    return `No budget accommodations found${locationLabel ? ` in ${locationLabel}` : ''}. Please browse all stays on our [Hotels](/hotels) page.`;
  }

  const list = budgetList.map((h, i) =>
    `${i + 1}. **${h.name}** (${h.category || 'Budget'})\n   • **Location:** ${h.location}\n   • **Tariff:** ₹${(h.price || 3500).toLocaleString('en-IN')}/night (Rated ${h.rating || 4.2}/5)\n   • **Amenities:** ${(h.amenities || ['WiFi', 'Room Service']).slice(0, 3).join(', ')}`
  ).join('\n\n');

  return `🏨 **Recommended Budget-Friendly Hotels & Stays in Andaman (Under ₹4,500/night):**\n\n${list}\n\nVisit our [Hotels](/hotels) page to filter by 'Budget', or book directly on our [Booking Portal](${BOOKING_URL}).`;
}

function buildBookingResponse() {
  return `🛎️ **How Booking Works on Nicoman Tourism:**\n\nOur main website provides authoritative travel information. When you are ready to reserve:\n\n• **Direct Booking Portal:** [Open Booking Demo](${BOOKING_URL})\n• **Hotel Stays:** Click "Check Availability & Book" on any card at [Hotels](/hotels).\n• **Ferry Tickets:** Click "Book Now" on any vessel schedule row at [Ferries](/ferries).\n\nAll reservations include first-come-first-served room allocation and deterministic confirmation tokens (e.g. \`HTL-101-ANI...\`).`;
}

// ─── Core Query Intelligence & Continuity Router ────────────────────────────
async function routeQueryToResponse(messageText, intent = null, chatContext = {}) {
  const raw = (messageText || '').trim();
  const q = raw.toLowerCase();
  let updatedContext = { ...chatContext };

  // 1. Security Shield: Prompt Injection & DB Snooping Guard
  if (isSecurityExploitQuery(q)) {
    return {
      replyText: `🛡️ **Security Alert: Terminal Protection Active**\n\nPersonal visitor records, internal database UUIDs, administrative secrets, and system configuration keys are strictly isolated behind the **Nicoman Security Shield** and Row Level Security (RLS) policies. These protected entities cannot be queried or revealed through the AI Assistant.\n\nFor authorized administrators, please authenticate via [/auth](/auth) using your credentials.`,
      updatedContext
    };
  }

  // 2. Content Safety & Moderation Shield
  if (isOffensiveContent(q)) {
    return {
      replyText: `🛡️ **Safety & Moderation Notice:**\n\nI am the Nicoman Tourism AI Assistant, dedicated to providing a safe, family-friendly travel guide for the Andaman & Nicobar Islands. Please refrain from offensive, explicit, or abusive language.\n\nHow can I help you explore island destinations, hotel stays, or ferry schedules today?`,
      updatedContext
    };
  }

  // Context resolution: Check if pronouns refer to last discussed entity
  const hasPronounRef = /\b(there|it|that\s+place|that\s+island|that\s+hotel|that\s+resort|the\s+ship|the\s+boat)\b/i.test(q);
  const activeIsland = chatContext.lastIsland || null;
  const activeHotel = chatContext.lastHotel || null;

  // 3. Historical Inquiries (Cellular Jail, Ross Island, Viper Island, etc.)
  const isHistoryQuery = /\b(history|origin|background|story|built|constructed|past|historic|who\s+built|when\s+was|japanese|british|freedom\s+fighter|kala\s+pani|savarkar|netaji)\b/i.test(q);
  if (isHistoryQuery) {
    if (q.includes('cellular') || q.includes('jail') || q.includes('kala pani') || q.includes('savarkar') || (hasPronounRef && chatContext.lastPlace?.toLowerCase().includes('jail'))) {
      updatedContext.lastPlace = 'Cellular Jail';
      updatedContext.lastTopic = 'history';
      return { replyText: HISTORY_GUIDES.cellular, updatedContext };
    }
    if (q.includes('ross') || q.includes('subhash') || q.includes('bose') || (hasPronounRef && chatContext.lastPlace?.toLowerCase().includes('ross'))) {
      updatedContext.lastPlace = 'Ross Island';
      updatedContext.lastIsland = 'ross';
      updatedContext.lastTopic = 'history';
      return { replyText: HISTORY_GUIDES.ross, updatedContext };
    }
    if (q.includes('viper')) {
      updatedContext.lastPlace = 'Viper Island';
      updatedContext.lastTopic = 'history';
      return { replyText: HISTORY_GUIDES.viper, updatedContext };
    }
    if (q.includes('baratang') || (hasPronounRef && activeIsland === 'baratang')) {
      updatedContext.lastIsland = 'baratang';
      updatedContext.lastTopic = 'history';
      return { replyText: HISTORY_GUIDES.baratang, updatedContext };
    }
    if (q.includes('havelock') || q.includes('swaraj') || (hasPronounRef && activeIsland === 'havelock')) {
      updatedContext.lastIsland = 'havelock';
      updatedContext.lastTopic = 'history';
      return { replyText: HISTORY_GUIDES.havelock, updatedContext };
    }
  }

  // 4. Transit Inquiries: "How to reach [place/island]"
  const isTransitQuery = /how\s+(can\s+i\s+|do\s+i\s+)?(reach|go|get|travel)\s+to|directions?\s+to|route\s+to|getting\s+to|distance\s+to|transport\s+to/i.test(q) ||
    ((q.includes('reach') || q.includes('how to go') || q.includes('how to travel')) && !q.includes('contact'));

  if (isTransitQuery) {
    // Check specific destinations (including typo tolerance for baratand / baratang)
    if (q.includes('baratang') || q.includes('baratand') || (hasPronounRef && activeIsland === 'baratang')) {
      updatedContext.lastIsland = 'baratang';
      updatedContext.lastTopic = 'transit';
      return { replyText: TRANSIT_GUIDES.baratang, updatedContext };
    }
    if (q.includes('havelock') || q.includes('swaraj') || (hasPronounRef && activeIsland === 'havelock')) {
      updatedContext.lastIsland = 'havelock';
      updatedContext.lastTopic = 'transit';
      return { replyText: TRANSIT_GUIDES.havelock, updatedContext };
    }
    if (q.includes('neil') || q.includes('shaheed') || (hasPronounRef && activeIsland === 'neil')) {
      updatedContext.lastIsland = 'neil';
      updatedContext.lastTopic = 'transit';
      return { replyText: TRANSIT_GUIDES.neil, updatedContext };
    }
    if (q.includes('cellular') || q.includes('jail')) {
      updatedContext.lastPlace = 'Cellular Jail';
      updatedContext.lastTopic = 'transit';
      return { replyText: TRANSIT_GUIDES.cellular, updatedContext };
    }
    if (q.includes('elephant')) {
      updatedContext.lastPlace = 'Elephant Beach';
      updatedContext.lastIsland = 'havelock';
      updatedContext.lastTopic = 'transit';
      return { replyText: TRANSIT_GUIDES.elephant, updatedContext };
    }
    if (q.includes('radhanagar')) {
      updatedContext.lastPlace = 'Radhanagar Beach';
      updatedContext.lastIsland = 'havelock';
      updatedContext.lastTopic = 'transit';
      return { replyText: TRANSIT_GUIDES.radhanagar, updatedContext };
    }
    if (q.includes('ross')) {
      updatedContext.lastPlace = 'Ross Island';
      updatedContext.lastTopic = 'transit';
      return { replyText: TRANSIT_GUIDES.ross, updatedContext };
    }
    if (q.includes('diglipur') || q.includes('smith')) {
      updatedContext.lastPlace = 'Diglipur';
      updatedContext.lastTopic = 'transit';
      return { replyText: TRANSIT_GUIDES.diglipur, updatedContext };
    }
    if (q.includes('chennai') || q.includes('kolkata') || q.includes('delhi') || q.includes('mainland') || q.includes('flight') || q.includes('port blair') || q.includes('portblair')) {
      updatedContext.lastTopic = 'transit';
      return { replyText: TRANSIT_GUIDES.mainland, updatedContext };
    }
    // If pronoun referred to last known island
    if (hasPronounRef && activeIsland && TRANSIT_GUIDES[activeIsland]) {
      return { replyText: TRANSIT_GUIDES[activeIsland], updatedContext };
    }
    return { replyText: TRANSIT_GUIDES.mainland, updatedContext };
  }

  // 5. Mainland Ships Intelligence (Chennai, Kolkata, Vizag to Port Blair)
  const isChennai = q.includes('chennai') || q.includes('madras');
  const isKolkata = q.includes('kolkata') || q.includes('calcutta');
  const isVizag = q.includes('vizag') || q.includes('visakhapatnam');

  if (isChennai && (q.includes('ship') || q.includes('ferry') || q.includes('port blair') || q.includes('portblair') || q.includes('timing') || q.includes('price') || q.includes('fare') || q.includes('ticket'))) {
    const data = MAINLAND_SHIPS.chennai;
    updatedContext.lastRoute = { from: 'Chennai', to: 'Port Blair' };
    updatedContext.lastTopic = 'ship';
    return {
      replyText: `🚢 **Passenger Ships from Chennai to Port Blair:**\n\n• **Departure Port:** ${data.from}\n• **Arrival Port:** ${data.to}\n• **Travel Time & Distance:** ${data.duration} across ${data.distance}\n• **Active Vessels:** ${data.ships.join(', ')}\n• **Frequency:** ${data.frequency}\n• **Status:** ${data.status}\n\n**Passenger Tariffs & Pricing:**\n${data.tariffs.map(t => `• **${t.tier}:** ${t.price}`).join('\n')}\n\nVisit our [Ferries](/ferries) or [Ship Schedule](/ship-schedule) page for live departure tracking, or reserve tickets via the [Booking Portal](${BOOKING_URL}).`,
      updatedContext
    };
  }

  if (isKolkata && (q.includes('ship') || q.includes('ferry') || q.includes('port blair') || q.includes('portblair') || q.includes('timing') || q.includes('price') || q.includes('fare') || q.includes('ticket'))) {
    const data = MAINLAND_SHIPS.kolkata;
    updatedContext.lastRoute = { from: 'Kolkata', to: 'Port Blair' };
    updatedContext.lastTopic = 'ship';
    return {
      replyText: `🚢 **Passenger Ships from Kolkata to Port Blair:**\n\n• **Departure Port:** ${data.from}\n• **Arrival Port:** ${data.to}\n• **Travel Time & Distance:** ${data.duration} across ${data.distance}\n• **Active Vessels:** ${data.ships.join(', ')}\n• **Frequency:** ${data.frequency}\n• **Status:** ${data.status}\n\n**Passenger Tariffs & Pricing:**\n${data.tariffs.map(t => `• **${t.tier}:** ${t.price}`).join('\n')}\n\nCheck live updates on our [Ferries](/ferries) or [Ship Schedule](/ship-schedule) page.`,
      updatedContext
    };
  }

  if (isVizag && (q.includes('ship') || q.includes('ferry') || q.includes('port blair') || q.includes('portblair') || q.includes('timing') || q.includes('price') || q.includes('fare') || q.includes('ticket'))) {
    const data = MAINLAND_SHIPS.vizag;
    updatedContext.lastRoute = { from: 'Visakhapatnam', to: 'Port Blair' };
    updatedContext.lastTopic = 'ship';
    return {
      replyText: `🚢 **Passenger Ships from Visakhapatnam to Port Blair:**\n\n• **Departure Port:** ${data.from}\n• **Arrival Port:** ${data.to}\n• **Travel Time & Distance:** ${data.duration} across ${data.distance}\n• **Active Vessels:** ${data.ships.join(', ')}\n• **Frequency:** ${data.frequency}\n• **Status:** ${data.status}\n\n**Passenger Tariffs & Pricing:**\n${data.tariffs.map(t => `• **${t.tier}:** ${t.price}`).join('\n')}\n\nVisit our [Ferries](/ferries) or [Ship Schedule](/ship-schedule) page for timetable tracking.`,
      updatedContext
    };
  }

  // Fetch real database records in parallel for dynamic live matching (fast failover)
  const [livePlaces, liveHotels, liveFerries] = await Promise.all([
    fetchAllLivePlaces(),
    fetchAllLiveHotels(),
    fetchAllLiveFerries()
  ]);

  const isFerryQuery = /\b(ship|ships|ferry|ferries|boat|boats|catamaran|sail|sailing|vessel|harbour|wharf)\b/i.test(q) || intent === 'ferries';

  if (isFerryQuery) {
    // Inter-Island Route: Havelock to Neil
    if ((q.includes('havelock') && q.includes('neil')) || (hasPronounRef && activeIsland === 'neil' && q.includes('havelock'))) {
      const interFerries = liveFerries.filter(f => {
        const text = `${f.from || f.from_port || ''} ${f.to || f.to_port || ''}`.toLowerCase();
        return text.includes('havelock') && text.includes('neil');
      });
      const list = (interFerries.length > 0 ? interFerries : FALLBACK_FERRIES.filter(f => f.to.includes('Neil'))).slice(0, 3).map((f, i) =>
        `${i + 1}. **${f.ship_name}**: ${f.from || 'Havelock'} ➔ ${f.to || 'Neil'} at ${f.departure_time} (Duration: ${f.travel_time || '1h 15m'}, ₹${(f.price || 1450).toLocaleString('en-IN')}) — 🟢 On Time`
      ).join('\n');

      return {
        replyText: `🚢 **Ferries between Havelock Island & Neil Island:**\n\n${list}\n\nReserve seats via our [Booking Portal](${BOOKING_URL}) or check live timetables on our [Ferries](/ferries) page.`,
        updatedContext: { ...updatedContext, lastTopic: 'ferry' }
      };
    }

    // Inter-Island Route: Port Blair to Havelock
    if (q.includes('havelock') || (hasPronounRef && activeIsland === 'havelock')) {
      const havelockFerries = liveFerries.filter(f => {
        const to = (f.to || f.to_port || '').toLowerCase();
        return to.includes('havelock');
      });
      const list = (havelockFerries.length > 0 ? havelockFerries : FALLBACK_FERRIES.filter(f => f.to.includes('Havelock'))).slice(0, 4).map((f, i) =>
        `${i + 1}. **${f.ship_name}**: Departs ${f.departure_time} (Travel Time: ${f.travel_time || '1h 30m'}, ₹${(f.price || 1650).toLocaleString('en-IN')}) — 🟢 On Time`
      ).join('\n');

      return {
        replyText: `🚢 **High-Speed Ferries & Catamarans: Port Blair ➔ Havelock Island:**\n\n${list}\n\nFerry bookings sell out rapidly in peak season. Book early on our [Booking Portal](${BOOKING_URL}) or track live status at [Ferries](/ferries).`,
        updatedContext: { ...updatedContext, lastIsland: 'havelock', lastTopic: 'ferry' }
      };
    }

    // Generic Ferries from live database
    const activeFerries = liveFerries.slice(0, 4).map((f, i) =>
      `${i + 1}. **${f.ship_name}**: ${f.from || f.from_port || 'Port Blair'} ➔ ${f.to || f.to_port || 'Island'} at ${f.departure_time} (₹${(f.price || 1250).toLocaleString('en-IN')})`
    ).join('\n');

    return {
      replyText: `🚢 **Live Ferry & Ship Schedules in Nicoman Tourism:**\n\n${activeFerries}\n\nVisit our [Ferries](/ferries) or [Ship Schedule](/ship-schedule) page for live status, route maps, and seat availability.`,
      updatedContext: { ...updatedContext, lastTopic: 'ferry' }
    };
  }

  // 6. Stopword-Free Specific Hotel Matching (e.g. "seashell resort location and price")
  const specificHotel = matchSpecificHotel(q, liveHotels) || (hasPronounRef && activeHotel ? liveHotels.find(h => h.name === activeHotel) : null);
  if (specificHotel) {
    updatedContext.lastHotel = specificHotel.name;
    updatedContext.lastTopic = 'hotel';
    if (specificHotel.location?.toLowerCase().includes('havelock')) updatedContext.lastIsland = 'havelock';
    else if (specificHotel.location?.toLowerCase().includes('neil')) updatedContext.lastIsland = 'neil';
    else if (specificHotel.location?.toLowerCase().includes('port blair')) updatedContext.lastIsland = 'portblair';

    const amenitiesList = (specificHotel.amenities || ['WiFi', 'Pool', 'Restaurant', 'Air Conditioning']).join(', ');
    const bookingLink = `${BOOKING_URL}?type=hotel&name=${encodeURIComponent(specificHotel.name)}&price=${specificHotel.price || 4500}`;

    return {
      replyText: `🏨 **${specificHotel.name} (${specificHotel.category || 'Luxury'})**\n\n• **Location:** ${specificHotel.location}\n• **Nightly Tariff:** ₹${(specificHotel.price || 5500).toLocaleString('en-IN')}/night (Rated ${specificHotel.rating || 4.5}/5)\n• **Key Amenities:** ${amenitiesList}\n\n${specificHotel.description || 'Verified island accommodation featuring serene views and premium guest hospitality.'}\n\n👉 View photos and room options on our [Hotels](/hotels) page, or [Book ${specificHotel.name} on Booking Portal](${bookingLink}).`,
      updatedContext
    };
  }

  // 7. Budget Hotel Queries (e.g. "budgeted hotel list", "cheap stays", "affordable hotels")
  const isBudgetQuery = /\b(budget|budgeted|cheap|cheapest|affordable|low\s*cost|economy|inexpensive|pocket\s*friendly)\b/i.test(q);
  if (isBudgetQuery) {
    let locLabel = '';
    if (q.includes('havelock')) locLabel = 'Havelock Island';
    else if (q.includes('neil')) locLabel = 'Neil Island';
    else if (q.includes('port blair') || q.includes('portblair')) locLabel = 'Port Blair';
    else if (hasPronounRef && activeIsland) locLabel = activeIsland;

    updatedContext.lastTopic = 'hotel';
    return {
      replyText: buildBudgetHotelsResponse(liveHotels, locLabel),
      updatedContext
    };
  }

  // 8. Luxury Hotel Queries (e.g. "luxury hotel list", "5 star resorts", "premium stays")
  const isLuxuryQuery = /\b(luxury|ultra\s*luxury|premium|5\s*star|deluxe|expensive|high\s*end)\b/i.test(q);
  if (isLuxuryQuery) {
    const luxuryList = [...liveHotels]
      .sort((a, b) => (b.price || 4500) - (a.price || 4500))
      .slice(0, 3)
      .map((h, i) => `${i + 1}. **${h.name}** in ${h.location} — ₹${(h.price || 15000).toLocaleString('en-IN')}/night, ${h.rating}/5 (${h.category})`)
      .join('\n');

    updatedContext.lastTopic = 'hotel';
    return {
      replyText: `🏨 **Top Luxury & 5-Star Resorts in Andaman:**\n\n${luxuryList}\n\nExplore full photo galleries and suites on our [Hotels](/hotels) page.`,
      updatedContext
    };
  }

  // 9. General Hotel Queries with Location Filter
  if (q.includes('hotel') || q.includes('stay') || q.includes('resort') || q.includes('accommodation') || q.includes('room')) {
    let locMatches = liveHotels;
    let label = '';
    if (q.includes('havelock')) { locMatches = liveHotels.filter(h => (h.location || '').toLowerCase().includes('havelock')); label = 'Havelock Island'; }
    else if (q.includes('neil')) { locMatches = liveHotels.filter(h => (h.location || '').toLowerCase().includes('neil')); label = 'Neil Island'; }
    else if (q.includes('port blair') || q.includes('portblair')) { locMatches = liveHotels.filter(h => (h.location || '').toLowerCase().includes('port blair')); label = 'Port Blair'; }

    updatedContext.lastTopic = 'hotel';
    return {
      replyText: buildHotelsResponse(locMatches.length > 0 ? locMatches : liveHotels, label),
      updatedContext
    };
  }

  // 10. Platform Features: Demo Admin, Booking, Cancellation, Account Deletion
  if (q.includes('demo admin') || (q.includes('admin') && (q.includes('pass') || q.includes('login') || q.includes('cred') || q.includes('test') || q.includes('preview')))) {
    return {
      replyText: `👑 **Demo Admin Access:**\n\nYou can explore the full management command center without creating an account:\n\n• **Email:** \`demoadmin@nicoman.com\`\n• **Password:** \`DemoPassword123!\`\n• **Direct Sign-in:** [/auth](/auth)\n\n🛡️ **Note:** Operates in a preview simulation sandbox with **Admin Shield** auto-lock protection to safeguard production data.`,
      updatedContext
    };
  }

  if (q.includes('cancel') && (q.includes('booking') || q.includes('hotel') || q.includes('ferry') || q.includes('ticket') || q.includes('seat') || q.includes('room'))) {
    return {
      replyText: `🔄 **How to Cancel a Booking:**\n\n1. Sign in and open your **Bookings** page from the top navigation dropdown ([/bookings](/bookings)).\n2. Locate your confirmed hotel or ferry reservation.\n3. Click the red **"Cancel Booking"** button and confirm.\n4. Your reservation switches immediately to cancelled status, and the unit is released back into the public inventory.`,
      updatedContext
    };
  }

  if (q.includes('delete') && (q.includes('account') || q.includes('profile') || q.includes('data') || q.includes('privacy'))) {
    return {
      replyText: `🗑️ **How to Delete Your Account:**\n\n1. Open your **Profile** page ([/profile](/profile)).\n2. Scroll down to the **Danger Zone** section.\n3. Click **"Delete Account"** and confirm your password.\n\n📦 Your account is immediately invalidated across all devices and securely archived in a 30-day grace vault before permanent purge.`,
      updatedContext
    };
  }

  if (q.includes('book') || q.includes('reserv') || q.includes('payment') || q.includes('pay') || q.includes('checkout')) {
    return {
      replyText: buildBookingResponse(),
      updatedContext
    };
  }

  // 11. Specific Tourist Place Inquiries (Live Supabase Grounded)
  const matchingPlace = livePlaces.find(p => {
    const pName = (p.name || '').toLowerCase();
    const cleanPName = pName.replace(/\(.*?\)/g, '').trim();
    return q.includes(cleanPName) || cleanPName.split(' ').some(word => word.length > 4 && q.includes(word));
  });

  if (matchingPlace) {
    updatedContext.lastPlace = matchingPlace.name;
    if (matchingPlace.location?.toLowerCase().includes('havelock')) updatedContext.lastIsland = 'havelock';
    else if (matchingPlace.location?.toLowerCase().includes('neil')) updatedContext.lastIsland = 'neil';
    else if (matchingPlace.location?.toLowerCase().includes('baratang')) updatedContext.lastIsland = 'baratang';
    updatedContext.lastTopic = 'place';

    return {
      replyText: `📍 **${matchingPlace.name} (${matchingPlace.category || 'Attraction'})**\n• **Location:** ${matchingPlace.location} (Rated ${matchingPlace.rating || 4.5}/5)\n• **Best Season:** ${matchingPlace.best_time || 'October to May'}\n\n${matchingPlace.description || 'A must-visit tropical attraction in the Andaman archipelago.'}\n\nExplore interactive map pins and photos on our [Tourist Places](/tourist-places) page.`,
      updatedContext
    };
  }

  // 12. Island Tips & Weather Logistics
  if (q.includes('best time') || q.includes('when to visit') || q.includes('season') || q.includes('weather') || q.includes('monsoon')) {
    return {
      replyText: `🌤️ **Best Time to Visit Andaman:**\n\n• **Peak Season (October to May):** Calm turquoise seas, clear blue skies, and optimal conditions for water sports, scuba diving, and ferry crossings.\n• **Monsoon Season (June to September):** Heavy tropical rains and rough seas. Ferry delays and water sports suspensions are common during this period.`,
      updatedContext
    };
  }

  if (q.includes('permit') || q.includes('visa') || q.includes('entry') || q.includes('passport') || q.includes('rap')) {
    return {
      replyText: `🛂 **Permits & Entry Requirements:**\n\n• **Indian Citizens:** No special permit required for accessible islands (Port Blair, Havelock, Neil, Baratang).\n• **Foreign Nationals:** The Restricted Area Permit (RAP) requirement has been relaxed for major tourist islands. Passports are stamped upon arrival at Port Blair airport at zero cost.`,
      updatedContext
    };
  }

  if (q.includes('scuba') || q.includes('diving') || q.includes('snorkeling') || q.includes('water sport')) {
    return {
      replyText: `🤿 **Scuba Diving & Water Sports:**\n\n• **Top Diving Sites:** Havelock Island (Nemo Reef, Dixon's Pinnacle) and Neil Island.\n• **Water Sports Hub:** Elephant Beach (Havelock) and North Bay Island offer jet skiing, sea walking, parasailing, and glass-bottom boat rides.\n• **Certification:** PADI/SSI certified dive centers operate across Havelock Island.`,
      updatedContext
    };
  }

  if (q.includes('contact') || q.includes('support') || q.includes('email') || q.includes('help desk')) {
    return {
      replyText: `📞 **Customer Support:**\n\nYou can reach our assistance team directly:\n• **Email:** nicomantourism.myth520@silomails.com\n• **Support Form:** Submit a ticket on our [Contact Us](/contact) page.\n\nOur system supports two-way verified email ticketing via Resend and Svix webhooks.`,
      updatedContext
    };
  }

  if (q.includes('hello') || q.includes('hi') || q.includes('hey') || q.includes('greetings')) {
    return {
      replyText: `👋 **Welcome to Nicoman Tourism Assistant!**\n\nI can assist you with:\n• 🚗 **Directions:** 'How to reach Baratang', 'How to go to Havelock'\n• 🚢 **Ships & Ferries:** 'Ship from Chennai to Port Blair', 'Havelock to Neil ferry'\n• 🏨 **Hotels & Stays:** 'Budgeted hotel list', 'SeaShell Resort price'\n• 🏛️ **History:** 'History of Cellular Jail', 'Ross Island background'\n• 👑 **Demo Admin:** Admin credentials & platform features\n\nWhat would you like to explore today?`,
      updatedContext
    };
  }

  // 13. Intent classification fallback
  if (intent === 'tourist places' || q.includes('place') || q.includes('visit') || q.includes('attraction') || q.includes('beach')) {
    return { replyText: buildPlacesResponse(livePlaces), updatedContext };
  }
  if (intent === 'hotels') {
    return { replyText: buildHotelsResponse(liveHotels), updatedContext };
  }
  if (intent === 'ferries') {
    return { replyText: buildPlacesResponse(livePlaces), updatedContext };
  }
  if (intent === 'booking help') {
    return { replyText: buildBookingResponse(), updatedContext };
  }

  // 14. Polite out-of-scope redirection
  return {
    replyText: `🌴 I am the **Nicoman Tourism Island Assistant**, specialized in the Andaman & Nicobar Islands!\n\nI can help you with:\n• 🚗 **Directions & Transit:** 'How to reach Baratang', 'Mainland to Port Blair'\n• 🚢 **Ship & Ferry Timetables:** 'Ship from Chennai to Port Blair timing and price'\n• 🏨 **Accommodations:** 'Budgeted hotel list', 'SeaShell Resort location and price'\n• 🏛️ **History & Heritage:** 'History of Cellular Jail', 'Ross Island history'\n• 🛎️ **Platform Features:** Demo Admin login, booking demo, and cancellations\n\nWhat island or travel detail would you like to know about?`,
    updatedContext
  };
}

// ─── Interactive Formatted Message Renderer ──────────────────────────────────
function parseMessageTokens(text) {
  if (!text) return [];
  const tokenRegex = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`)/g;
  return text.split(tokenRegex).filter(Boolean);
}

function FormattedBotMessage({ text, onNavigate }) {
  if (!text) return null;
  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 leading-relaxed text-sm">
      {lines.map((line, lineIdx) => {
        if (!line.trim()) {
          return <div key={lineIdx} className="h-1.5" />;
        }

        const tokens = parseMessageTokens(line);

        return (
          <div key={lineIdx} className="break-words">
            {tokens.map((token, tokIdx) => {
              // Markdown Link [Label](url)
              const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
              if (linkMatch) {
                const [, label, url] = linkMatch;
                const isExternal = url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//');
                return (
                  <a
                    key={tokIdx}
                    href={url}
                    onClick={(e) => {
                      if (!isExternal) {
                        e.preventDefault();
                        onNavigate(url);
                      }
                    }}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                    className="inline-flex items-center gap-1 font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 underline decoration-teal-400/50 hover:decoration-teal-400 transition-colors cursor-pointer"
                  >
                    <span>{label}</span>
                    {isExternal && (
                      <FaExternalLinkAlt className="w-2.5 h-2.5 opacity-70 inline" />
                    )}
                  </a>
                );
              }

              // Bold **text**
              const boldMatch = token.match(/^\*\*([^*]+)\*\*$/);
              if (boldMatch) {
                return (
                  <strong key={tokIdx} className="font-bold text-gray-900 dark:text-white">
                    {boldMatch[1]}
                  </strong>
                );
              }

              // Inline code `code`
              const codeMatch = token.match(/^`([^`]+)`$/);
              if (codeMatch) {
                return (
                  <code key={tokIdx} className="px-1.5 py-0.5 text-xs rounded bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-mono border border-teal-200/60 dark:border-teal-800/60">
                    {codeMatch[1]}
                  </code>
                );
              }

              // Normal text
              return <span key={tokIdx}>{token}</span>;
            })}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main ChatBot Component ──────────────────────────────────────────────────
const ChatBot = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      text: "👋 Welcome to Nicoman Tourism Assistant! I can help you with live hotel pricing, ship & ferry schedules, step-by-step directions (like Baratang or Havelock), and island history. What would you like to explore?",
      isBot: true
    }
  ]);
  const [chatContext, setChatContext] = useState({
    lastIsland: null,
    lastHotel: null,
    lastPlace: null,
    lastRoute: null,
    lastTopic: null
  });
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
    'How to reach Baratang?',
    'Ship from Chennai',
    'Budgeted hotel list',
    'History of Cellular Jail',
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

  const handleNavigate = useCallback((url) => {
    if (!url) return;
    if (url.startsWith('/')) {
      navigate(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [navigate]);

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
      let intent = null;
      if (modelReady) {
        intent = await classifyIntent(trimmed);
      }
      const { replyText, updatedContext } = await routeQueryToResponse(trimmed, intent, chatContext);
      if (updatedContext) {
        setChatContext(updatedContext);
      }
      appendBot(replyText);
    } catch (err) {
      console.warn('[ChatBot] Fallback triggered:', err);
      const { replyText } = await routeQueryToResponse(trimmed, null, chatContext);
      appendBot(replyText);
    }
  }, [input, modelReady, appendBot, chatContext]);

  // Only show ChatBot for authenticated users and on permitted pages
  if (!user || isHiddenPage) return null;

  return createPortal(
    <div className="chatbot-portal-root">
      {/* Chat Toggle Button */}
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
                      <h3 className="font-bold text-white text-base sm:text-lg leading-none">Nicoman Assistant</h3>
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

              {/* Messages Container */}
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
                      <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${message.isBot
                        ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-md rounded-bl-none'
                        : 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-br-none whitespace-pre-line'
                        }`}>
                        {message.isBot ? (
                          <FormattedBotMessage text={message.text} onNavigate={handleNavigate} />
                        ) : (
                          message.text
                        )}
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

              {/* Input Bar */}
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

export {
  isSecurityExploitQuery,
  isOffensiveContent,
  extractDistinctiveTokens,
  matchSpecificHotel,
  parseMessageTokens,
  routeQueryToResponse,
  TRANSIT_GUIDES,
  HISTORY_GUIDES,
  MAINLAND_SHIPS,
  FALLBACK_HOTELS
};

export default ChatBot;
