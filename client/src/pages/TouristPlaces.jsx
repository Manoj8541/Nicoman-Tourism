// client/src/pages/TouristPlaces.jsx
// Interactive satellite-map Tourist Places page — fully dynamic from /api/tourist-places.
// Phase-based animation: map load → staggered pin entrance → radar pulse → click interaction.
// Admin-added places instantly appear here after the admin saves via the Admin Dashboard.

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaStar, FaClock, FaSearch, FaTimes, FaChevronRight, FaMapMarkerAlt,
} from 'react-icons/fa';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

// ── Phase constants ────────────────────────────────────────────────────────────
const PH = { LOADING: 0, PLACING: 1, PULSING: 2 };

const STATUS = {
  [PH.LOADING]: 'Loading map…',
  [PH.PLACING]: 'Placing spots…',
  [PH.PULSING]: 'Tap a pin to explore.',
};

// ── Category visual config ─────────────────────────────────────────────────────
const CAT = {
  Beach:      { color: '#3B82F6', bg: '#DBEAFE', text: '#1D4ED8', label: 'Beach' },
  Nature:     { color: '#10B981', bg: '#D1FAE5', text: '#065F46', label: 'Nature' },
  Historic:   { color: '#F59E0B', bg: '#FEF3C7', text: '#92400E', label: 'Historic' },
  Historical: { color: '#F59E0B', bg: '#FEF3C7', text: '#92400E', label: 'Historic' },
  Island:     { color: '#8B5CF6', bg: '#EDE9FE', text: '#5B21B6', label: 'Island' },
  Adventure:  { color: '#EF4444', bg: '#FEE2E2', text: '#991B1B', label: 'Adventure' },
  Cultural:   { color: '#EC4899', bg: '#FCE7F3', text: '#9D174D', label: 'Cultural' },
};

const LEGEND = [
  { key: 'Beach',     color: '#3B82F6', label: 'Beach' },
  { key: 'Nature',    color: '#10B981', label: 'Nature' },
  { key: 'Historic',  color: '#F59E0B', label: 'Historic' },
  { key: 'Island',    color: '#8B5CF6', label: 'Island' },
  { key: 'Adventure', color: '#EF4444', label: 'Adventure' },
  { key: 'Cultural',  color: '#EC4899', label: 'Cultural' },
];

// ── Coordinate lookup — maps known Andaman location strings to lat/lng ─────────
// Used when a place fetched from Supabase has no explicit lat/lng columns.
const ANDAMAN_COORDS = {
  'Port Blair':        [11.6234, 92.7265],
  'Havelock Island':   [11.9775, 92.9958],
  'Havelock':          [11.9775, 92.9958],
  'Neil Island':       [11.8287, 92.9020],
  'Neil':              [11.8287, 92.9020],
  'Middle Andaman':    [12.5000, 92.8000],
  'North Andaman':     [13.0000, 92.9000],
  'South Andaman':     [11.6500, 92.7200],
  'Near Port Blair':   [11.6700, 92.7600],
  'Little Andaman':    [10.7000, 92.5000],
  'Diglipur':          [13.2673, 92.9737],
  'Rangat':            [12.5231, 92.8949],
  'Mayabunder':        [12.9368, 92.9071],
  'Baratang':          [12.1774, 92.7575],
  'Wandoor':           [11.5581, 92.5986],
  'Chidiyatapu':       [11.4779, 92.6883],
};

function getCoords(place) {
  const lat = parseFloat(place.lat);
  const lng = parseFloat(place.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0) return { lat, lng };
  // Try location-name lookup (substring match)
  const locStr = (place.location || '').toLowerCase();
  for (const [key, coords] of Object.entries(ANDAMAN_COORDS)) {
    if (locStr.includes(key.toLowerCase())) return { lat: coords[0], lng: coords[1] };
  }
  // Safe Fallback: scatter around Port Blair so the pin is always valid and visible
  const idNum = typeof place.id === 'number' ? place.id : 1;
  return {
    lat: 11.6234 + (idNum % 7) * 0.07,
    lng: 92.7265 + (idNum % 5) * 0.06,
  };
}

// Normalise a raw API/DB object into the shape the UI expects
function normalizePlace(p) {
  const coords = getCoords(p);
  return {
    ...p,
    lat:      coords.lat,
    lng:      coords.lng,
    image:    p.image    || p.image_url  || '',
    bestTime: p.bestTime || p.best_time  || 'Year Round',
    category: p.category || 'Nature',
    rating:   parseFloat(p.rating) || 4.0,
  };
}

// ── Hardcoded fallback — only used if the API call fails entirely ──────────────
const FALLBACK_PLACES = [
  { id: 1, name: 'Baratang Island',  lat: 12.1774, lng: 92.7575, category: 'Nature',   rating: 4.4, location: 'Middle Andaman',  description: 'Famous for rare limestone caves and active mud volcanoes.',       image: 'https://tse3.mm.bing.net/th/id/OIP.l_vLrxJC-nsI45eAyOeiHAHaEK?rs=1&pid=ImgDetMain&o=7&rm=3',                                bestTime: 'November to March' },
  { id: 2, name: 'Elephant Beach',   lat: 12.0280, lng: 93.0000, category: 'Beach',    rating: 4.7, location: 'Havelock Island', description: 'Crystal-clear snorkeling waters and vivid coral reefs.',             image: 'https://www.andamantourism.org/wp-content/uploads/2025/02/Elephant-beach-1-800x444.jpg',                                        bestTime: 'October to May' },
  { id: 3, name: 'Radhanagar Beach', lat: 11.9820, lng: 92.9640, category: 'Beach',    rating: 4.8, location: 'Havelock Island', description: "Ranked Asia's best beach — turquoise water and powdery white sand.", image: 'https://thumbs.dreamstime.com/b/radhanagar-beach-one-most-famous-attractions-havelock-island-andaman-nicobar-islands-radhanagar-beach-253126594.jpg', bestTime: 'October to May' },
  { id: 4, name: 'Havelock Island',  lat: 11.9600, lng: 93.0000, category: 'Island',   rating: 4.9, location: 'Havelock Island', description: 'Most popular destination — world-class diving and lush forests.',    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',                                                               bestTime: 'October to May' },
  { id: 5, name: 'Neil Island',      lat: 11.8300, lng: 93.0300, category: 'Island',   rating: 4.6, location: 'Neil Island',     description: 'Serene island with natural coral bridges and quiet beaches.',       image: 'https://th.bing.com/th/id/R.07552f9c51f70af31487e175bb9c748b?rik=vVXUQWKcCxEV7Q&riu=http%3a%2f%2fwww.andamantourism.org%2fwp-content%2fuploads%2f2017%2f06%2fneils.jpg&ehk=pESrD8gGthu9ZWjDuijnutU8rLzFQGN6NOBPBShE4TM%3d&risl=&pid=ImgRaw&r=0', bestTime: 'November to April' },
  { id: 6, name: 'Mount Harriet',    lat: 11.7100, lng: 92.7400, category: 'Nature',   rating: 4.3, location: 'South Andaman',   description: 'Highest peak in South Andaman with sweeping forest panoramas.',   image: 'https://images.unsplash.com/photo-1503435980610-a51f3ddfee50?w=800',                                                           bestTime: 'October to April' },
  { id: 7, name: 'Ross Island',      lat: 11.6775, lng: 92.7635, category: 'Historic', rating: 4.5, location: 'Near Port Blair', description: 'Former British HQ with crumbling colonial ruins and spotted deer.',  image: 'https://www.go2andaman.com/wp-content/uploads/2021/01/ross-island-go2andaman-port-blair1.jpeg',                                bestTime: 'October to May' },
  { id: 8, name: 'Cellular Jail',    lat: 11.6741, lng: 92.7477, category: 'Historic', rating: 4.7, location: 'Port Blair',      description: "Colonial-era prison and symbol of India's independence struggle.",  image: 'https://images.unsplash.com/photo-1721231564051-3b44b8058a9e?q=80&w=1074&auto=format&fit=crop',                                bestTime: 'Year Round' },
];

const MAP_CENTER = [11.9, 92.85];
const MAP_ZOOM   = 9;
const PIN_DELAY  = 190; // ms between each staggered pin

// ── Custom divIcon factory ─────────────────────────────────────────────────────
function buildIcon(color, isSelected) {
  const cls = `map-pin${isSelected ? ' pin-selected' : ''}`;
  return L.divIcon({
    html: `<div class="${cls}">
      <div class="pin-ring" style="border-color:${color};"></div>
      <div class="pin-core"  style="background:${color};"></div>
    </div>`,
    className: '',
    iconSize:   [36, 36],
    iconAnchor: [18, 18],
  });
}

// ── MapController: programmatic flyTo ─────────────────────────────────────────
function MapController({ flyTarget, onFlyDone }) {
  const map = useMap();
  const lastTarget = useRef(null);

  useEffect(() => {
    if (!flyTarget || flyTarget === lastTarget.current) return;
    lastTarget.current = flyTarget;
    map.flyTo([flyTarget.lat, flyTarget.lng], 13, { duration: 1.35 });
    map.once('moveend', () => {
      const pt = map.latLngToContainerPoint([flyTarget.lat, flyTarget.lng]);
      onFlyDone?.(flyTarget, { x: pt.x, y: pt.y });
    });
  }, [flyTarget, map, onFlyDone]);

  return null;
}

// ── MapInner — receives live data as props (no module-level constants) ─────────
function MapInner({ places, sorted, icons, visibleIds, selected, onPin, onMapClick, onBoundsUpdate }) {
  const map = useMap();

  const updateBounds = useCallback(() => {
    const b = map.getBounds();
    onBoundsUpdate(places.filter(p => b.contains([p.lat, p.lng])).map(p => p.id));
  }, [map, onBoundsUpdate, places]);

  useMapEvents({ moveend: updateBounds, zoomend: updateBounds, click: onMapClick });
  useEffect(() => { updateBounds(); }, [updateBounds]);

  return (
    <>
      {sorted.map(place => {
        if (!visibleIds.includes(place.id)) return null;
        const isSel  = selected?.id === place.id;
        const icon   = icons[`${place.id}_${isSel ? 's' : 'n'}`];
        if (!icon) return null;
        return (
          <Marker
            key={place.id}
            position={[place.lat, place.lng]}
            icon={icon}
            eventHandlers={{
              click: (e) => {
                e.originalEvent.stopPropagation();
                const pt = map.latLngToContainerPoint([place.lat, place.lng]);
                onPin(place, { x: pt.x, y: pt.y });
              },
            }}
          />
        );
      })}
    </>
  );
}

// ── Info card (shared between desktop popup + mobile bottom-sheet) ─────────────
function PlaceCard({ place, onClose }) {
  const cat = CAT[place.category] || CAT.Nature;
  return (
    <>
      <div className="relative h-36 rounded-xl overflow-hidden mb-3 flex-shrink-0">
        <img
          src={place.image}
          alt={place.name}
          className="w-full h-full object-cover"
          onError={e => { e.target.src = 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <span
          className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-xs font-bold text-white"
          style={{ background: cat.color }}
        >
          {cat.label}
        </span>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm
            flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          aria-label="Close"
        >
          <FaTimes className="text-xs" />
        </button>
      </div>

      <h3 className="font-black text-gray-900 dark:text-white text-base leading-snug mb-1">
        {place.name}
      </h3>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="flex items-center gap-1 text-xs font-bold" style={{ color: '#F59E0B' }}>
          <FaStar /> {place.rating}
        </span>
        <span className="text-gray-300 dark:text-gray-600">·</span>
        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <FaMapMarkerAlt className="text-teal-400" /> {place.location}
        </span>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3 line-clamp-3">
        {place.description}
      </p>
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <FaClock className="text-teal-400 flex-shrink-0" />
        <span>Best: {place.bestTime}</span>
      </div>
    </>
  );
}

// ── Desktop floating popup ─────────────────────────────────────────────────────
function DesktopPopup({ place, pixelPos, mapW, onClose }) {
  const W = 284;
  let left = pixelPos.x - W / 2;
  let top  = pixelPos.y - 310;
  if (top < 8) top = pixelPos.y + 30;
  left = Math.max(8, Math.min(left, mapW - W - 8));
  const tailAbove = top < pixelPos.y;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.87, y: tailAbove ? 6 : -6 }}
      animate={{ opacity: 1, scale: 1,    y: 0 }}
      exit={{    opacity: 0, scale: 0.87, y: tailAbove ? 6 : -6 }}
      transition={{ type: 'spring', stiffness: 340, damping: 26 }}
      className="absolute z-[900] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-4"
      style={{ width: W, left, top }}
    >
      <div
        className="popup-tail dark:bg-gray-900 bg-white"
        style={tailAbove
          ? { bottom: -7, top: 'auto' }
          : { top: -7, bottom: 'auto', transform: 'translateX(-50%) rotate(45deg)' }}
      />
      <PlaceCard place={place} onClose={onClose} />
    </motion.div>
  );
}

// ── Mobile bottom sheet ────────────────────────────────────────────────────────
function BottomSheet({ place, onClose }) {
  return (
    <>
      <motion.div
        className="fixed inset-0 z-[998] bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-[999] bg-white dark:bg-gray-900
          rounded-t-3xl shadow-2xl px-5 pt-3 pb-8 max-h-[85dvh] overflow-y-auto overscroll-contain"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{    y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="w-10 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto mb-4" />
        <PlaceCard place={place} onClose={onClose} />
      </motion.div>
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TouristPlaces() {
  // ── Data state (fetched from API) ──────────────────────────────────────────
  const [places,  setPlaces]  = useState([]);
  const [apiLoading, setApiLoading] = useState(true);

  // ── Map interaction state ──────────────────────────────────────────────────
  const [phase,      setPhase]      = useState(PH.LOADING);
  const [visibleIds, setVisibleIds] = useState([]);
  const [inBounds,   setInBounds]   = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [pixelPos,   setPixelPos]   = useState(null);
  const [flyTarget,  setFlyTarget]  = useState(null);
  const [search,     setSearch]     = useState('');
  const [showDrop,   setShowDrop]   = useState(false);
  const [mapSize,    setMapSize]    = useState({ w: 600, h: 500 });

  const mapWrapRef = useRef(null);

  // ── Detect mobile ──────────────────────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  // ── Fetch places from API ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    axios.get('/api/tourist-places')
      .then(res => {
        if (!cancelled) {
          setPlaces(res.data.map(normalizePlace));
          setApiLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          // Graceful fallback so the page still works without Supabase tables
          setPlaces(FALLBACK_PLACES);
          setApiLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  // ── Derived: sorted north→south for staggered pin entrance ────────────────
  const sorted = useMemo(
    () => [...places].sort((a, b) => b.lat - a.lat),
    [places]
  );

  // ── Stable icon references per place — prevents Leaflet re-render flicker ──
  const icons = useMemo(() => {
    const obj = {};
    places.forEach(p => {
      const cat = CAT[p.category] || CAT.Nature;
      obj[`${p.id}_n`] = buildIcon(cat.color, false);
      obj[`${p.id}_s`] = buildIcon(cat.color, true);
    });
    return obj;
  }, [places]);

  // ── Phase sequence: re-run whenever sorted changes (i.e. after fetch) ─────
  useEffect(() => {
    if (sorted.length === 0) return;
    setVisibleIds([]);
    setPhase(PH.LOADING);

    const t = setTimeout(() => {
      setPhase(PH.PLACING);
      sorted.forEach((place, i) => {
        setTimeout(() => {
          setVisibleIds(prev => [...prev, place.id]);
          if (i === sorted.length - 1) {
            setTimeout(() => setPhase(PH.PULSING), 250);
          }
        }, i * PIN_DELAY);
      });
    }, 850);

    return () => clearTimeout(t);
  }, [sorted]);

  // ── Map container size for popup clamping ──────────────────────────────────
  useEffect(() => {
    if (!mapWrapRef.current) return;
    const ob = new ResizeObserver(([e]) => setMapSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ob.observe(mapWrapRef.current);
    return () => ob.disconnect();
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handlePin      = useCallback((place, pos) => { setSelected(place); setPixelPos(pos); }, []);
  const handleMapClick = useCallback(() => { setSelected(null); setPixelPos(null); }, []);
  const handleClose    = useCallback(() => { setSelected(null); setPixelPos(null); }, []);
  const handleFlyDone  = useCallback((place, pos) => { setSelected(place); setPixelPos(pos); setFlyTarget(null); }, []);

  // ── Search suggestions (live, using fetched places) ───────────────────────
  const suggestions = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return places.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.location  || '').toLowerCase().includes(q) ||
      (p.category  || '').toLowerCase().includes(q)
    );
  }, [search, places]);

  const selectSuggestion = useCallback((place) => {
    setSearch(''); setShowDrop(false); setSelected(null); setFlyTarget(place);
  }, []);

  const wrapCls = phase >= PH.PULSING ? 'phase-pulsing' : '';

  return (
    <div className="min-h-screen pt-24 md:pt-28 pb-12 px-3 md:px-6">
      <div className="max-w-7xl mx-auto">

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <span className="inline-block px-4 py-1.5 bg-teal-100 dark:bg-teal-900/30
            text-teal-600 dark:text-teal-400 rounded-full text-sm font-bold tracking-wide mb-3">
            EXPLORE THE ISLANDS
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white">
            Tourist <span className="gradient-text">Places</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm md:text-base">
            {apiLoading ? 'Loading places…' : `${places.length} iconic spots · tap any pin to explore`}
          </p>
        </motion.div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="relative max-w-2xl mx-auto mb-5"
          style={{ zIndex: 510 }}
        >
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setShowDrop(true); }}
              onFocus={() => setShowDrop(true)}
              onBlur={() => setTimeout(() => setShowDrop(false), 160)}
              placeholder="Search a beach, island, or viewpoint..."
              className="w-full pl-11 pr-10 py-3.5 rounded-2xl border-2 border-gray-200
                dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                placeholder:text-gray-400 shadow-lg
                focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none
                transition-all duration-300"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setShowDrop(false); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400
                  hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <FaTimes />
              </button>
            )}
          </div>

          {/* Suggestions dropdown */}
          <AnimatePresence>
            {showDrop && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0,  scale: 1    }}
                exit={{    opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.14 }}
                className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-gray-800
                  rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden"
              >
                {suggestions.map(place => {
                  const cat = CAT[place.category] || CAT.Nature;
                  return (
                    <button
                      key={place.id}
                      onMouseDown={() => selectSuggestion(place)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left
                        hover:bg-gray-50 dark:hover:bg-gray-700/70 transition-colors"
                    >
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{place.name}</p>
                        <p className="text-xs text-gray-400">{place.location} · {cat.label}</p>
                      </div>
                      <FaChevronRight className="text-gray-300 text-xs flex-shrink-0" />
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Map area */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          id="tourist-map-wrap"
          ref={mapWrapRef}
          className={`relative rounded-3xl overflow-hidden shadow-2xl
            border border-gray-200 dark:border-gray-700 ${wrapCls}`}
        >
          <MapContainer
            center={MAP_CENTER}
            zoom={MAP_ZOOM}
            className="h-[60vh] md:h-[70vh] lg:h-[78vh] w-full"
            zoomControl
            scrollWheelZoom
          >
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
              maxZoom={18}
            />

            <MapController flyTarget={flyTarget} onFlyDone={handleFlyDone} />

            {/* Only render MapInner once places are loaded */}
            {!apiLoading && (
              <MapInner
                places={places}
                sorted={sorted}
                icons={icons}
                visibleIds={visibleIds}
                selected={selected}
                phase={phase}
                onPin={handlePin}
                onMapClick={handleMapClick}
                onBoundsUpdate={setInBounds}
              />
            )}
          </MapContainer>

          {/* Status label */}
          <div className="absolute bottom-4 left-4 z-[400]">
            <AnimatePresence mode="wait">
              <motion.span
                key={apiLoading ? 'api' : phase}
                initial={{ opacity: 0, y: 4  }}
                animate={{ opacity: 1, y: 0  }}
                exit={{    opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="px-3 py-1.5 bg-black/55 backdrop-blur-sm rounded-full
                  text-white text-xs font-medium inline-block"
              >
                {apiLoading ? 'Fetching places…' : STATUS[phase]}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* Legend */}
          <div className="absolute top-3 right-3 z-[400] bg-black/55 backdrop-blur-sm
            rounded-2xl px-3 py-2.5 flex flex-col gap-1.5">
            {LEGEND.map(l => (
              <div key={l.key} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: l.color }} />
                <span className="text-white text-xs font-medium">{l.label}</span>
              </div>
            ))}
          </div>

          {/* Desktop floating popup */}
          <AnimatePresence>
            {selected && pixelPos && !isMobile && (
              <DesktopPopup
                place={selected}
                pixelPos={pixelPos}
                mapW={mapSize.w}
                mapH={mapSize.h}
                onClose={handleClose}
              />
            )}
          </AnimatePresence>
        </motion.div>

        {/* Pin count indicator */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= PH.PULSING ? 1 : 0 }}
          transition={{ delay: 0.3 }}
          className="text-center text-xs text-gray-400 dark:text-gray-600 mt-3"
        >
          Showing {visibleIds.length} of {places.length} places · {inBounds.length} in current view
        </motion.p>

      </div>

      {/* Mobile bottom sheet */}
      <AnimatePresence>
        {selected && isMobile && (
          <BottomSheet place={selected} onClose={handleClose} />
        )}
      </AnimatePresence>
    </div>
  );
}