// client/src/pages/Ferries.jsx
// Merged "Ferries" page — one fetch, two views (Schedule / Map), shared filter.
// Data fetched ONCE at this level; no refetch on tab switch.

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useInView } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  FaShip, FaAnchor, FaMapMarkerAlt, FaCheckCircle,
  FaExclamationCircle, FaBan, FaClock, FaRuler,
  FaListAlt, FaMapMarkedAlt,
} from 'react-icons/fa';
import { MdFilterList } from 'react-icons/md';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// ── Fix Leaflet default icon (Vite/ESM) ───────────────────────────────────────
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ── Fallback data (real jetty / port coordinates) ─────────────────────────────
// departure_lat/lng & arrival_lat/lng are real port/jetty locations from Google Maps.
const FALLBACK = [
  {
    id: 1, ship_name: 'MV Swaraj Dweep', from: 'Port Blair', to: 'Havelock Island',
    departure_time: '06:00 AM', arrival_time: '08:30 AM', status: 'on_time',
    price: 1250,
    days: ['Mon', 'Wed', 'Fri', 'Sun'],
    route_type: 'inter_island', distance_nm: 54, duration_estimate: '2h 30m',
    departure_lat: 11.6742, departure_lng: 92.7462,
    arrival_lat: 11.9775, arrival_lng: 92.9958, waypoints: null,
  },
  {
    id: 2, ship_name: 'MV Makruzz', from: 'Port Blair', to: 'Havelock Island',
    departure_time: '08:15 AM', arrival_time: '10:30 AM', status: 'on_time',
    price: 1550,
    days: ['Daily'],
    route_type: 'inter_island', distance_nm: 54, duration_estimate: '2h 15m',
    departure_lat: 11.6742, departure_lng: 92.7462,
    arrival_lat: 11.9775, arrival_lng: 92.9958, waypoints: null,
  },
  {
    id: 3, ship_name: 'MV Coastal Cruise', from: 'Havelock Island', to: 'Neil Island',
    departure_time: '11:00 AM', arrival_time: '12:00 PM', status: 'on_time',
    price: 950,
    days: ['Tue', 'Thu', 'Sat'],
    route_type: 'inter_island', distance_nm: 14, duration_estimate: '1h',
    departure_lat: 11.9775, departure_lng: 92.9958,
    arrival_lat: 11.8287, arrival_lng: 92.9020, waypoints: null,
  },
  {
    id: 4, ship_name: 'MV Green Ocean', from: 'Port Blair', to: 'Neil Island',
    departure_time: '06:30 AM', arrival_time: '09:00 AM', status: 'delayed',
    price: 1100,
    days: ['Mon', 'Wed', 'Fri'],
    route_type: 'inter_island', distance_nm: 37, duration_estimate: '2h 30m',
    departure_lat: 11.6742, departure_lng: 92.7462,
    arrival_lat: 11.8287, arrival_lng: 92.9020, waypoints: null,
  },
  {
    id: 5, ship_name: 'MV Nautika', from: 'Havelock Island', to: 'Port Blair',
    departure_time: '04:00 PM', arrival_time: '06:30 PM', status: 'on_time',
    price: 1650,
    days: ['Daily'],
    route_type: 'inter_island', distance_nm: 54, duration_estimate: '2h 30m',
    departure_lat: 11.9775, departure_lng: 92.9958,
    arrival_lat: 11.6742, arrival_lng: 92.7462, waypoints: null,
  },
  {
    id: 6, ship_name: 'MV Andaman Shipping', from: 'Chennai Harbour', to: 'Port Blair',
    departure_time: '08:00 PM', arrival_time: '10:00 AM +2', status: 'on_time',
    price: 2450,
    days: ['Mon', 'Thu'],
    route_type: 'mainland_to_island', distance_nm: 647, duration_estimate: '54h',
    departure_lat: 13.0900, departure_lng: 80.2936,
    arrival_lat: 11.6742, arrival_lng: 92.7462, waypoints: null,
  },
  {
    id: 7, ship_name: 'MV Nicobar', from: 'Kolkata Port', to: 'Port Blair',
    departure_time: '07:00 PM', arrival_time: '07:00 PM +2', status: 'on_time',
    price: 2800,
    days: ['Wed', 'Sun'],
    route_type: 'mainland_to_island', distance_nm: 756, duration_estimate: '60h',
    departure_lat: 22.5543, departure_lng: 88.3284,
    arrival_lat: 11.6742, arrival_lng: 92.7462, waypoints: null,
  },
  {
    id: 8, ship_name: 'MV Harshavardhana', from: 'Visakhapatnam Port', to: 'Port Blair',
    departure_time: '09:00 PM', arrival_time: '03:00 PM +2', status: 'cancelled',
    price: 2650,
    days: ['Tue', 'Sat'],
    route_type: 'mainland_to_island', distance_nm: 684, duration_estimate: '64h',
    departure_lat: 17.7048, departure_lng: 83.2952,
    arrival_lat: 11.6742, arrival_lng: 92.7462, waypoints: null,
  },
];

// ── Status helpers ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  on_time:   { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', Icon: FaCheckCircle,      label: 'On Time',   lineColor: '#14b8a6' },
  delayed:   { bg: 'bg-amber-100  dark:bg-amber-900/30',   text: 'text-amber-600  dark:text-amber-400',   Icon: FaExclamationCircle, label: 'Delayed',   lineColor: '#f59e0b' },
  cancelled: { bg: 'bg-red-100    dark:bg-red-900/30',     text: 'text-red-500    dark:text-red-400',     Icon: FaBan,               label: 'Cancelled', lineColor: '#ef4444' },
};
const getStatus = (s) => STATUS_CONFIG[s] ?? STATUS_CONFIG.cancelled;

// ── Custom Leaflet marker icon ─────────────────────────────────────────────────
const portIcon = (isIsland = false) => L.divIcon({
  className: '',
  html: `<div style="
    width:14px;height:14px;border-radius:50%;
    background:${isIsland ? '#0d9488' : '#2563eb'};
    border:2.5px solid white;
    box-shadow:0 2px 6px rgba(0,0,0,0.35);
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -10],
});

// ══════════════════════════════════════════════════════════════════════════════
// RouteConnector — animated boat on the schedule card
// Boat glides back‑and‑forth ONLY when status === 'on_time' AND card is in view.
// Correctness rule: motion implies "in progress" so delayed/cancelled → static.
// ══════════════════════════════════════════════════════════════════════════════
const RouteConnector = ({ status }) => {
  const ref = useRef(null);
  // once:false → inView toggles as user scrolls → animation pauses off-screen
  const inView = useInView(ref, { margin: '-60px 0px', once: false });
  const active = status === 'on_time';

  return (
    <div ref={ref} className="flex-1 mx-3 relative h-8 flex items-center min-w-0">
      {/* Track line */}
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5
        bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-400 rounded-full" />

      {/* Boat icon — animated only when active + in view */}
      <motion.div
        className="absolute top-1/2 -translate-y-1/2"
        animate={active && inView ? { left: ['2%', '78%', '2%'] } : { left: '40%' }}
        transition={active && inView
          ? { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }
          : { duration: 0.2 }}
        style={{ position: 'absolute' }}
      >
        <div className={`w-7 h-7 rounded-full flex items-center justify-center shadow-md
          ${active
            ? 'bg-gradient-to-br from-teal-500 to-cyan-500 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'}`}>
          <FaShip className="text-xs" />
        </div>
      </motion.div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// RouteCard
// ══════════════════════════════════════════════════════════════════════════════
const RouteCard = ({ route, index }) => {
  const { bg, text, Icon, label } = getStatus(route.status);
  const inactive = route.status !== 'on_time';
  const { user, profile } = useAuth();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 1 }}
      transition={{ delay: Math.min(index * 0.07, 0.5) }}
      className={`card p-5 group hover:border-teal-500/50 transition-opacity duration-300
        ${inactive ? 'opacity-55' : ''}`}
    >
      {/* Ship name + status */}
      <div className="flex items-start justify-between gap-2 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center text-white shadow-md
            ${inactive
              ? 'bg-gray-400 dark:bg-gray-600'
              : 'bg-gradient-to-br from-blue-500 to-cyan-500 group-hover:scale-110 transition-transform'}`}>
            <FaShip className="text-xl" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight truncate">
              {route.ship_name}
            </h3>
            {route.route_type && (
              <span className="text-[10px] font-semibold uppercase tracking-wide
                text-gray-400 dark:text-gray-500">
                {route.route_type === 'inter_island' ? 'Island Hop' : 'Mainland → Andaman'}
              </span>
            )}
          </div>
        </div>
        <span className={`flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1
          rounded-full text-xs font-semibold ${bg} ${text}`}>
          <Icon className="text-[10px]" />
          {label}
        </span>
      </div>

      {/* Route row: departure — animated boat — arrival */}
      <div className="flex items-center gap-1 mb-5">
        {/* Departure */}
        <div className="text-center flex-shrink-0 w-16">
          <div className={`w-9 h-9 mx-auto mb-1.5 rounded-full flex items-center justify-center
            ${inactive
              ? 'bg-gray-100 dark:bg-gray-800'
              : 'bg-teal-100 dark:bg-teal-900/30'}`}>
            <FaAnchor className={inactive
              ? 'text-gray-400 dark:text-gray-600 text-xs'
              : 'text-teal-600 dark:text-teal-400 text-xs'} />
          </div>
          <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">{route.from}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">{route.departure_time}</p>
        </div>

        <RouteConnector status={route.status} />

        {/* Arrival */}
        <div className="text-center flex-shrink-0 w-16">
          <div className={`w-9 h-9 mx-auto mb-1.5 rounded-full flex items-center justify-center
            ${inactive
              ? 'bg-gray-100 dark:bg-gray-800'
              : 'bg-cyan-100 dark:bg-cyan-900/30'}`}>
            <FaMapMarkerAlt className={inactive
              ? 'text-gray-400 dark:text-gray-600 text-xs'
              : 'text-cyan-600 dark:text-cyan-400 text-xs'} />
          </div>
          <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">{route.to}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">{route.arrival_time}</p>
        </div>
      </div>

      {/* Meta row: distance / duration */}
      {(route.distance_nm || route.duration_estimate) && (
        <div className="flex items-center gap-4 mb-4 text-xs text-gray-500 dark:text-gray-400">
          {route.distance_nm && (
            <span className="flex items-center gap-1">
              <FaRuler className="text-[10px]" /> {route.distance_nm} nm
            </span>
          )}
          {route.duration_estimate && (
            <span className="flex items-center gap-1">
              <FaClock className="text-[10px]" /> {route.duration_estimate}
            </span>
          )}
        </div>
      )}

      {/* Day pills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {(route.days || []).map((day) => (
          <span key={day}
            className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700/70 text-gray-600
              dark:text-gray-300 rounded-lg text-[11px] font-semibold">
            {day}
          </span>
        ))}
      </div>

      {/* Check Availability button — auth-gated, opens demo booking site in a new tab */}
      <button
        id={`ferry-book-${route.id}`}
        disabled={inactive}
        onClick={() => {
          if (!user) {
            window.location.href = '/auth';
            return;
          }
          const base = import.meta.env.VITE_BOOKING_DEMO_URL || 'http://localhost:5174';
          const params = new URLSearchParams({
            type: 'ferry',
            id: route.id,
            name: route.ship_name,
            from: route.from,
            to: route.to,
            departure_time: route.departure_time || '',
            price: route.price || 1250,
          });
          // Auto-fetch name & email & phone & userId from signed-in user
          if (profile?.full_name) params.set('guestName', profile.full_name);
          if (user.email)         params.set('guestEmail', user.email);
          if (profile?.phone)     params.set('guestPhone', profile.phone);
          if (user.id)            params.set('userId', user.id);
          window.open(`${base}/book?${params.toString()}`, '_blank', 'noopener,noreferrer');
        }}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
          text-sm font-bold transition-all duration-200
          ${inactive
            ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-[1.02] active:scale-95'
          }`}
      >
        {inactive ? 'Not Available' : !user ? (
          <>
            {/* Lock SVG — no emoji */}
            <svg className="w-4 h-4 flex-shrink-0" fill="none"
              stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Sign in to Book
          </>
        ) : (
          <>
            Check Availability &amp; Book
            {/* External link SVG — no emoji */}
            <svg className="w-3.5 h-3.5 opacity-80" fill="none"
              stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6m0 0v6m0-6L10 14" />
            </svg>
          </>
        )}
      </button>
    </motion.div>
  );
};


// ══════════════════════════════════════════════════════════════════════════════
// ScheduleView
// ══════════════════════════════════════════════════════════════════════════════
const DAYS = ['All', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const ScheduleView = ({ routes }) => {
  const [selectedDay, setSelectedDay] = useState('All');

  const visible = selectedDay === 'All'
    ? routes
    : routes.filter(r => (r.days || []).includes('Daily') || (r.days || []).includes(selectedDay));

  return (
    <div>
      {/* Day filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[44px]
              ${selectedDay === day
                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/25 scale-105'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-md hover:scale-105'}`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      {visible.length === 0 ? (
        <div className="text-center py-20 text-gray-500 dark:text-gray-400">
          <FaShip className="mx-auto text-5xl mb-4 opacity-30" />
          <p className="font-semibold">No ferries on {selectedDay}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map((route, i) => (
            <RouteCard key={route.id} route={route} index={i} />
          ))}
        </div>
      )}

      {/* Info notice */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-14 card p-6 bg-gradient-to-r from-teal-50 to-cyan-50
          dark:from-teal-900/20 dark:to-cyan-900/20"
      >
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Important Information
        </h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            'Arrive at the port 30 minutes before departure',
            'Carry valid ID proof and booking confirmation',
            'Schedule may change due to weather conditions',
            'Online booking recommended during peak season',
          ].map((info) => (
            <div key={info} className="flex items-start gap-2.5">
              <FaCheckCircle className="text-teal-500 mt-0.5 flex-shrink-0 text-sm" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{info}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MapBoundsFitter — adjusts map viewport to show all plotted routes
// ══════════════════════════════════════════════════════════════════════════════
const isValidCoord = (lat, lng) => Number.isFinite(parseFloat(lat)) && Number.isFinite(parseFloat(lng));

const MapBoundsFitter = ({ routes }) => {
  const map = useMap();

  useEffect(() => {
    if (!routes || !routes.length) return;
    const pts = routes.flatMap(r => [
      isValidCoord(r.departure_lat, r.departure_lng) && [parseFloat(r.departure_lat), parseFloat(r.departure_lng)],
      isValidCoord(r.arrival_lat, r.arrival_lng) && [parseFloat(r.arrival_lat), parseFloat(r.arrival_lng)],
      ...(Array.isArray(r.waypoints) ? r.waypoints.filter(wp => Array.isArray(wp) && isValidCoord(wp[0], wp[1])) : []),
    ].filter(Boolean));

    if (pts.length < 2) return;
    try { map.fitBounds(pts, { padding: [48, 48], maxZoom: 11 }); }
    catch (_) { /* silently ignore if map not ready */ }
  }, [routes, map]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
};

// ══════════════════════════════════════════════════════════════════════════════
// RouteMapView
// ══════════════════════════════════════════════════════════════════════════════
const RouteMapView = ({ routes }) => {
  const [activeRoute, setActiveRoute] = useState(null);

  // Unique ports for markers
  const ports = useMemo(() => {
    const seen = {};
    (routes || []).forEach(r => {
      if (isValidCoord(r.departure_lat, r.departure_lng)) {
        seen[r.from] = { name: r.from, lat: parseFloat(r.departure_lat), lng: parseFloat(r.departure_lng), type: r.route_type };
      }
      if (isValidCoord(r.arrival_lat, r.arrival_lng)) {
        seen[r.to] = { name: r.to, lat: parseFloat(r.arrival_lat), lng: parseFloat(r.arrival_lng), type: r.route_type };
      }
    });
    return Object.values(seen);
  }, [routes]);

  // Esri World Imagery — single consistent satellite tile, no dark/light switching
  const TILE_URL  = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  const TILE_ATTR = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

  return (
    <div className="space-y-4">
      {/* Map */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200/50
        dark:border-gray-700/50" style={{ height: 'clamp(340px, 60vh, 600px)' }}>
        <MapContainer
          center={[13.5, 86.5]}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
          zoomControl
        >
          <TileLayer url={TILE_URL} attribution={TILE_ATTR} maxZoom={19} />

          {/* Port markers */}
          {ports.map(p => (
            <Marker
              key={p.name}
              position={[p.lat, p.lng]}
              icon={portIcon(p.type === 'inter_island')}
            >
              <Popup className="ferry-popup">
                <strong className="block text-gray-900 text-sm">{p.name}</strong>
                <span className="text-xs text-gray-500 capitalize">
                  {p.type === 'inter_island' ? 'Island port' : 'Mainland port'}
                </span>
              </Popup>
            </Marker>
          ))}

          {/* Route polylines */}
          {routes.map(route => {
            if (!isValidCoord(route.departure_lat, route.departure_lng) || !isValidCoord(route.arrival_lat, route.arrival_lng)) return null;
            const positions = [
              [parseFloat(route.departure_lat), parseFloat(route.departure_lng)],
              ...(Array.isArray(route.waypoints) ? route.waypoints : []),
              [parseFloat(route.arrival_lat), parseFloat(route.arrival_lng)],
            ];
            const { lineColor } = getStatus(route.status);
            return (
              <Polyline
                key={route.id}
                positions={positions}
                color={lineColor}
                weight={route.id === activeRoute?.id ? 5 : 3}
                opacity={route.id === activeRoute?.id ? 1 : 0.7}
                dashArray="9, 7"
                eventHandlers={{
                  click: () => setActiveRoute(r => r?.id === route.id ? null : route),
                }}
              >
                <Popup>
                  <strong className="text-gray-900 block mb-1">{route.ship_name}</strong>
                  <span className="text-xs text-gray-600 block">{route.from} → {route.to}</span>
                  {route.distance_nm && (
                    <span className="text-xs text-gray-500 block">
                      {route.distance_nm} nm · {route.duration_estimate}
                    </span>
                  )}
                </Popup>
              </Polyline>
            );
          })}

          <MapBoundsFitter routes={routes} />
        </MapContainer>

        {/* Legend overlay */}
        <div className="absolute bottom-3 left-3 z-[500] bg-white/90 dark:bg-gray-900/90
          backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-gray-200/50
          dark:border-gray-700/50 space-y-1">
          {[
            { color: '#14b8a6', label: 'On Time' },
            { color: '#f59e0b', label: 'Delayed' },
            { color: '#ef4444', label: 'Cancelled' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-5 h-0.5 rounded" style={{ background: color,
                backgroundImage: `repeating-linear-gradient(to right,${color} 0,${color} 5px,transparent 5px,transparent 9px)` }} />
              <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300">{label}</span>
            </div>
          ))}
          <hr className="border-gray-200 dark:border-gray-700 my-1" />
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-teal-600 border border-white/80" />
            <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300">Island port</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-600 border border-white/80" />
            <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300">Mainland port</span>
          </div>
        </div>
      </div>

      {/* Mobile bottom-sheet style detail card — shown when a route line is clicked */}
      {activeRoute && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className="card p-5 border-l-4"
          style={{ borderLeftColor: getStatus(activeRoute.status).lineColor }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white">{activeRoute.ship_name}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {activeRoute.from} → {activeRoute.to}
              </p>
            </div>
            <button
              onClick={() => setActiveRoute(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            {activeRoute.distance_nm && (
              <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <FaRuler className="text-teal-500" /> {activeRoute.distance_nm} nm
              </span>
            )}
            {activeRoute.duration_estimate && (
              <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <FaClock className="text-teal-500" /> {activeRoute.duration_estimate}
              </span>
            )}
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
              ${getStatus(activeRoute.status).bg} ${getStatus(activeRoute.status).text}`}>
              {getStatus(activeRoute.status).label}
            </span>
          </div>
        </motion.div>
      )}

      {/* Route list below map on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {routes.map(route => {
          const { bg, text, label, lineColor } = getStatus(route.status);
          const isActive = activeRoute?.id === route.id;
          return (
            <button
              key={route.id}
              onClick={() => setActiveRoute(r => r?.id === route.id ? null : route)}
              className={`text-left p-4 rounded-2xl border-2 transition-all duration-200
                ${isActive
                  ? 'shadow-lg scale-[1.02]'
                  : 'border-transparent bg-white dark:bg-gray-800 hover:shadow-md hover:scale-[1.01]'}`}
              style={isActive ? { borderColor: lineColor } : {}}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                  {route.ship_name}
                </span>
                <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${bg} ${text}`}>
                  {label}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {route.from} → {route.to}
              </p>
              {route.distance_nm && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {route.distance_nm} nm · {route.duration_estimate}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// Ferries — top-level page component
// ══════════════════════════════════════════════════════════════════════════════
const FILTERS = [
  { key: 'all',                  label: 'All Routes' },
  { key: 'mainland_to_island',   label: 'Getting to Andaman' },
  { key: 'inter_island',         label: 'Island Hopping' },
];

const Ferries = () => {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggle,  setToggle]  = useState('schedule');   // 'schedule' | 'map'
  const [filter,  setFilter]  = useState('all');

  // ── Single fetch on mount ── never refetches on tab/filter switch ────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: rows } = await axios.get('/api/ship-schedule');
        if (!cancelled) setData(rows);
      } catch {
        if (!cancelled) setData(FALLBACK);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []); // ← empty deps = runs ONCE

  // ── Shared filter applied to both views ─────────────────────────────────────
  const filteredData = useMemo(() => {
    if (filter === 'all') return data;
    return data.filter(r => (r.route_type ?? 'inter_island') === filter);
  }, [data, filter]);

  return (
    <div className="min-h-screen pt-24 md:pt-28 pb-14 px-4">
      <div className="max-w-7xl mx-auto">

        {/* ── Page header ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-18 h-18 mb-5 rounded-2xl
            bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30 p-5">
            <FaShip className="text-3xl" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-3">
            Ferries <span className="gradient-text">& Routes</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Explore all ferry schedules and sea routes to &amp; within the Andaman &amp; Nicobar Islands
          </p>
        </motion.div>

        {/* ── Segmented toggle (Schedule / Map) ────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center mb-6"
        >
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 gap-1 shadow-inner">
            {[
              { key: 'schedule', Icon: FaListAlt,      label: 'Schedule' },
              { key: 'map',      Icon: FaMapMarkedAlt, label: 'Map' },
            ].map(({ key, Icon, label }) => (
              <button
                key={key}
                id={`ferries-tab-${key}`}
                onClick={() => setToggle(key)}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200
                  min-h-[44px] min-w-[120px]
                  ${toggle === key
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md shadow-teal-500/30'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'}`}
              >
                <Icon className="text-base" />
                {label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Route-type filter (shared across both views) ─────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-wrap justify-center gap-2 mb-8"
        >
          <MdFilterList className="self-center text-gray-400 text-lg mr-1" />
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                min-h-[40px]
                ${filter === key
                  ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:shadow-md'}`}
            >
              {label}
            </button>
          ))}
        </motion.div>

        {/* ── Conditional view ─────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="flex gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4" />
                <div className="flex gap-2">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-7 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : toggle === 'schedule' ? (
          <ScheduleView routes={filteredData} />
        ) : (
          <RouteMapView routes={filteredData} />
        )}

      </div>
    </div>
  );
};

export default Ferries;
