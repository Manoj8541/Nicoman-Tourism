import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';

// ═════════════════════════════════════════════════════════════════════════════
// Professional Inline SVG Icons
// ═════════════════════════════════════════════════════════════════════════════

const IconCheck = ({ size = 20, color = 'currentColor', strokeWidth = 2.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconCalendar = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconBed = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9" />
  </svg>
);

const IconUser = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconMail = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const IconPhone = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.07 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 2.93 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z" />
  </svg>
);

const IconCard = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const IconLock = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconSpinner = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
    className="animate-spin" aria-label="Processing">
    <path d="M12 2a10 10 0 0 1 10 10" />
  </svg>
);

const IconAlertCircle = ({ size = 56 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <circle cx="12" cy="16" r="0.5" fill="currentColor" />
  </svg>
);

const IconMapPin = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconCompass = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

// ═════════════════════════════════════════════════════════════════════════════
// Animation Spring Configurations
// ═════════════════════════════════════════════════════════════════════════════

const SPRING_TRANSITION = { type: 'spring', stiffness: 340, damping: 28 };
const BOUNCY_SPRING = { type: 'spring', stiffness: 420, damping: 22 };

const stepVariants = {
  enter: { opacity: 0, x: 28 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -28 },
};

// ═════════════════════════════════════════════════════════════════════════════
// Step Indicator Component
// ═════════════════════════════════════════════════════════════════════════════

const STEPS = [
  { key: 'availability', label: 'Availability' },
  { key: 'details', label: 'Guest Details' },
  { key: 'payment', label: 'Payment' },
  { key: 'confirmation', label: 'Confirmed' },
];

function StepIndicator({ currentStep }) {
  const currentIndex = STEPS.findIndex(s => s.key === currentStep);

  return (
    <nav className="step-indicator-wrapper" aria-label="Booking Progress">
      {STEPS.map((step, idx) => {
        const isDone = idx < currentIndex;
        const isActive = idx === currentIndex;
        const stateClass = isDone ? 'done' : isActive ? 'active' : 'pending';

        return (
          <div key={step.key} style={{ display: 'contents' }}>
            <div className="step-node">
              <motion.div
                className={`step-circle ${stateClass}`}
                layout
                transition={SPRING_TRANSITION}
              >
                {isDone ? (
                  <IconCheck size={16} color="#FFFFFF" strokeWidth={3} />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </motion.div>
              <span className={`step-label ${stateClass}`}>
                {step.label}
              </span>
            </div>

            {idx < STEPS.length - 1 && (
              <div className={`step-line ${idx < currentIndex ? 'done' : ''}`} />
            )}
          </div>
        );
      })}
    </nav>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Physical Room & Seat Layout Blueprint (No hardcoded booked states)
// ═════════════════════════════════════════════════════════════════════════════

const HOTEL_ROOMS_LAYOUT = [
  { id: '101', name: '101', type: 'Deluxe' },
  { id: '102', name: '102', type: 'Deluxe' },
  { id: '103', name: '103', type: 'Ocean' },
  { id: '104', name: '104', type: 'Ocean' },
  { id: '201', name: '201', type: 'Premium' },
  { id: '202', name: '202', type: 'Premium' },
  { id: '203', name: '203', type: 'Suite' },
  { id: '204', name: '204', type: 'Suite' },
  { id: '301', name: '301', type: 'Villa' },
  { id: '302', name: '302', type: 'Villa' },
  { id: '303', name: '303', type: 'Penthouse' },
  { id: '304', name: '304', type: 'Penthouse' },
];

const FERRY_SEATS_LAYOUT = [
  // Upper Deck
  { id: 'A1', name: 'A1', deck: 'Upper' },
  { id: 'A2', name: 'A2', deck: 'Upper' },
  { id: 'A3', name: 'A3', deck: 'Upper' },
  { id: 'A4', name: 'A4', deck: 'Upper' },
  { id: 'B1', name: 'B1', deck: 'Upper' },
  { id: 'B2', name: 'B2', deck: 'Upper' },
  { id: 'B3', name: 'B3', deck: 'Upper' },
  { id: 'B4', name: 'B4', deck: 'Upper' },
  // Main Deck
  { id: 'C1', name: 'C1', deck: 'Main' },
  { id: 'C2', name: 'C2', deck: 'Main' },
  { id: 'C3', name: 'C3', deck: 'Main' },
  { id: 'C4', name: 'C4', deck: 'Main' },
  { id: 'D1', name: 'D1', deck: 'Main' },
  { id: 'D2', name: 'D2', deck: 'Main' },
  { id: 'D3', name: 'D3', deck: 'Main' },
  { id: 'D4', name: 'D4', deck: 'Main' },
];

// Helper to extract unit IDs from reference code (e.g. HTL-101-102-ANIXXXX or FRY-A1-A2-ANIXXXX)
function extractBookedUnitsFromRecords(records) {
  const bookedSet = new Set();
  (records || []).forEach(r => {
    if (r.status === 'cancelled') return;
    const ref = r.booking_ref || '';
    const match = ref.match(/(?:HTL|FRY)-([A-Za-z0-9\-_,]+)-ANI/i);
    if (match && match[1]) {
      const units = match[1].split(/[-_,]+/);
      units.forEach(u => { if (u) bookedSet.add(u.trim().toUpperCase()); });
    }
  });
  return bookedSet;
}

// Check UUID format
const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

// ═════════════════════════════════════════════════════════════════════════════
// Step 1: Availability & Multi-Room / Multi-Seat Selection (Live DB Driven)
// ═════════════════════════════════════════════════════════════════════════════

function AvailabilityStep({ params, conflictNotice, onNext }) {
  const isHotel = params.type === 'hotel';
  const today = new Date().toISOString().split('T')[0];

  // Dates state
  const [checkIn, setCheckIn] = useState(today);
  const tomorrowStr = useMemo(() => {
    const tm = new Date();
    tm.setDate(tm.getDate() + 1);
    return tm.toISOString().split('T')[0];
  }, []);
  const [checkOut, setCheckOut] = useState(tomorrowStr);
  const [date, setDate] = useState(today);

  // Live booked units from Supabase
  const [bookedUnitsSet, setBookedUnitsSet] = useState(new Set());
  const [loadingAvailability, setLoadingAvailability] = useState(true);

  // Multi-unit selection state (Room IDs or Seat IDs)
  const [selectedUnits, setSelectedUnits] = useState([]);

  // Base pricing (with live dynamic price fetch from Supabase)
  const initialPrice = Number(params.price) > 0 ? Number(params.price) : (isHotel ? 4500 : 1250);
  const [basePrice, setBasePrice] = useState(initialPrice);

  useEffect(() => {
    // Fetch live dynamic price from Supabase DB configured by admin
    const fetchLivePrice = async () => {
      try {
        if (isHotel) {
          if (params.name) {
            const { data } = await supabase
              .from('hotels')
              .select('price_per_night, price')
              .eq('name', decodeURIComponent(params.name))
              .maybeSingle();
            if (data && (data.price_per_night || data.price)) {
              setBasePrice(Number(data.price_per_night || data.price));
            }
          }
        } else {
          if (params.name) {
            const { data } = await supabase
              .from('ship_schedule')
              .select('price, fare')
              .eq('ship_name', decodeURIComponent(params.name))
              .maybeSingle();
            if (data && (data.price || data.fare)) {
              setBasePrice(Number(data.price || data.fare));
            }
          }
        }
      } catch (e) {
        console.warn('[Live Pricing] Using default:', e.message);
      }
    };
    fetchLivePrice();
  }, [isHotel, params.name]);

  // Nights calculation for hotel
  const nightsCount = useMemo(() => {
    if (!isHotel || !checkIn || !checkOut) return 1;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  }, [isHotel, checkIn, checkOut]);

  // Total price calculation
  const totalPrice = useMemo(() => {
    const unitsCount = selectedUnits.length;
    if (isHotel) {
      return unitsCount * basePrice * nightsCount;
    }
    return unitsCount * basePrice;
  }, [selectedUnits, basePrice, isHotel, nightsCount]);

  // ── Fetch Live Bookings from Supabase ──────────────────────────────────────
  const loadLiveAvailability = useCallback(async () => {
    setLoadingAvailability(true);
    try {
      if (isHotel) {
        if (!checkIn || !checkOut) {
          setBookedUnitsSet(new Set());
          setLoadingAvailability(false);
          return;
        }
        let query = supabase.from('bookings')
          .select('booking_ref, status, check_in, check_out, rooms')
          .neq('status', 'cancelled')
          .lt('check_in', checkOut)
          .gt('check_out', checkIn);

        if (params.name) {
          query = query.eq('hotel_name', decodeURIComponent(params.name));
        }

        const { data, error } = await query;
        if (!error && data) {
          const booked = extractBookedUnitsFromRecords(data);
          setBookedUnitsSet(booked);
          // Auto-deselect any unit that is now booked
          setSelectedUnits(prev => prev.filter(u => !booked.has(u.toUpperCase())));
        }
      } else {
        if (!date) {
          setBookedUnitsSet(new Set());
          setLoadingAvailability(false);
          return;
        }
        let query = supabase.from('ferry_bookings')
          .select('booking_ref, status, travel_date, seats')
          .neq('status', 'cancelled')
          .eq('travel_date', date);

        if (params.name) {
          query = query.eq('ship_name', decodeURIComponent(params.name));
        }

        const { data, error } = await query;
        if (!error && data) {
          const booked = extractBookedUnitsFromRecords(data);
          setBookedUnitsSet(booked);
          setSelectedUnits(prev => prev.filter(u => !booked.has(u.toUpperCase())));
        }
      }
    } catch (err) {
      console.warn('[Live Availability] Error:', err.message);
    } finally {
      setLoadingAvailability(false);
    }
  }, [isHotel, checkIn, checkOut, date, params.name]);

  useEffect(() => {
    loadLiveAvailability();
  }, [loadLiveAvailability]);

  // Real-time live listener for instant seat booking broadcast across multiple users
  useEffect(() => {
    const channel = supabase
      .channel('live-booking-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: isHotel ? 'bookings' : 'ferry_bookings' }, () => {
        loadLiveAvailability();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isHotel, loadLiveAvailability]);

  // Auto-select first free unit on initial load if none selected
  useEffect(() => {
    if (selectedUnits.length === 0 && !loadingAvailability) {
      const layout = isHotel ? HOTEL_ROOMS_LAYOUT : FERRY_SEATS_LAYOUT;
      const firstAvailable = layout.find(item => !bookedUnitsSet.has(item.id.toUpperCase()));
      if (firstAvailable) {
        setSelectedUnits([firstAvailable.id]);
      }
    }
  }, [loadingAvailability, bookedUnitsSet, isHotel, selectedUnits.length]);

  const toggleUnit = (unitId, isBooked) => {
    if (isBooked) return;
    setSelectedUnits(prev => {
      if (prev.includes(unitId)) {
        if (prev.length === 1) return prev; // Keep at least 1 selected
        return prev.filter(id => id !== unitId);
      } else {
        return [...prev, unitId];
      }
    });
  };

  const isFormValid = isHotel
    ? checkIn && checkOut && checkOut > checkIn && selectedUnits.length > 0
    : date && selectedUnits.length > 0;

  const handleContinue = () => {
    if (!isFormValid) return;
    onNext({
      dates: isHotel ? { checkIn, checkOut, nightsCount } : { date },
      selectedUnits,
      unitType: isHotel ? 'room' : 'seat',
      unitCount: selectedUnits.length,
      unitPrice: basePrice,
      totalPrice,
    });
  };

  return (
    <motion.div
      key="step-availability"
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={SPRING_TRANSITION}
    >
      {/* Target Item Overview Card */}
      <div className="target-summary-card">
        <div className="target-icon-badge">
          <img
            src={isHotel ? "/hotel.svg" : "/ferry.svg"}
            alt={isHotel ? "Hotel Icon" : "Ferry Icon"}
          />
        </div>
        <div className="target-info">
          <span className="target-type-tag">
            {isHotel ? 'Hotel Accommodation' : 'Express Ferry Line'}
          </span>
          <h2 className="target-title">
            {decodeURIComponent(params.name || '')}
          </h2>
          {isHotel && params.location && (
            <p className="target-subtext">
              <IconMapPin size={13} />
              {decodeURIComponent(params.location)}
            </p>
          )}
          {!isHotel && params.from && params.to && (
            <p className="target-subtext">
              <IconCompass size={13} />
              {decodeURIComponent(params.from)} &rarr; {decodeURIComponent(params.to)}
            </p>
          )}
          <p className="target-price-tag">
            {'\u20B9'}{basePrice.toLocaleString('en-IN')} {isHotel ? '/ night per room' : '/ passenger seat'}
          </p>
        </div>
      </div>

      {/* Real-time Conflict Alert (First-Come First-Served Banner) */}
      {conflictNotice && (
        <div className="demo-payment-alert" style={{ background: '#FEF2F2', borderColor: '#FCA5A5', color: '#B91C1C', marginBottom: '1.25rem' }}>
          <IconAlertCircle size={18} />
          <div style={{ flex: 1 }}>
            <strong>First-Come First-Served Notice:</strong>
            <p style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>{conflictNotice}</p>
          </div>
        </div>
      )}

      {/* Date Pickers */}
      <div style={{ marginBottom: '0.5rem' }}>
        {isHotel ? (
          <div className="responsive-grid-2">
            <div>
              <label className="input-label">
                <span style={{ color: 'var(--accent)' }}><IconCalendar /></span>
                Check-in Date
              </label>
              <input
                type="date"
                className="custom-input"
                value={checkIn}
                min={today}
                onChange={e => {
                  setCheckIn(e.target.value);
                  if (checkOut && checkOut <= e.target.value) setCheckOut('');
                }}
              />
            </div>
            <div>
              <label className="input-label">
                <span style={{ color: 'var(--accent)' }}><IconCalendar /></span>
                Check-out Date
              </label>
              <input
                type="date"
                className="custom-input"
                value={checkOut}
                min={checkIn || today}
                onChange={e => setCheckOut(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="input-label">
              <span style={{ color: 'var(--accent)' }}><IconCalendar /></span>
              Journey Date
            </label>
            <input
              type="date"
              className="custom-input"
              value={date}
              min={today}
              onChange={e => setDate(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Interactive Selection Grid Box */}
      <div className="selection-box-container">
        <div className="selection-box-header">
          <div className="selection-box-title">
            <span style={{ color: 'var(--accent)' }}><IconBed /></span>
            <span>{isHotel ? 'Live Room Availability' : 'Live Deck Seats Availability'}</span>
          </div>

          <div className="selection-legend">
            <div className="legend-item">
              <span className="legend-dot available" />
              <span>Available</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot selected" />
              <span>Selected</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot booked" />
              <span>Booked</span>
            </div>
          </div>
        </div>

        {/* Real-time Indicator Banner */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.75rem', background: '#F8FAFC', borderRadius: '8px', marginBottom: '0.75rem', fontSize: '0.75rem', color: '#64748B' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
            Live Supabase Real-Time Active
          </span>
          <span>{loadingAvailability ? 'Checking database...' : `${bookedUnitsSet.size} booked for date`}</span>
        </div>

        {/* Hotel Rooms Grid */}
        {isHotel ? (
          <div className="rooms-grid">
            {HOTEL_ROOMS_LAYOUT.map(room => {
              const isBooked = bookedUnitsSet.has(room.id.toUpperCase());
              const isSelected = selectedUnits.includes(room.id);
              return (
                <button
                  type="button"
                  key={room.id}
                  disabled={isBooked}
                  onClick={() => toggleUnit(room.id, isBooked)}
                  className={`unit-box ${isSelected ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
                >
                  <span className="unit-number">Room {room.name}</span>
                  <span className="unit-type">{isBooked ? 'Booked' : room.type}</span>
                </button>
              );
            })}
          </div>
        ) : (
          /* Ferry Deck Seats Grid */
          <div className="ferry-seats-grid">
            {FERRY_SEATS_LAYOUT.map((seat, i) => {
              const isBooked = bookedUnitsSet.has(seat.id.toUpperCase());
              const isSelected = selectedUnits.includes(seat.id);
              const isAisleDivider = i === 8;
              return (
                <div key={seat.id} style={{ display: 'contents' }}>
                  {isAisleDivider && (
                    <div className="deck-aisle-divider">
                      Main Passenger Deck
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={isBooked}
                    onClick={() => toggleUnit(seat.id, isBooked)}
                    className={`unit-box ${isSelected ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
                  >
                    <span className="unit-number">{seat.name}</span>
                    <span className="unit-type">{isBooked ? 'Booked' : seat.deck}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Selection Summary Pill & Live Price */}
        <div className="selection-summary-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              Selected ({selectedUnits.length}):
            </span>
            <div className="selected-tags-list">
              {selectedUnits.map(unit => (
                <span key={unit} className="selected-unit-tag">
                  {isHotel ? `Room ${unit}` : `Seat ${unit}`}
                </span>
              ))}
            </div>
          </div>

          <div className="selection-price-total">
            Total: <span>{'\u20B9'}{totalPrice.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Continue button — page scrolls to reach it on mobile */}
      <button
        type="button"
        className="btn-primary"
        disabled={!isFormValid || loadingAvailability}
        onClick={handleContinue}
      >
        <span>Continue to Guest Details</span>
        <IconCheck size={18} strokeWidth={3} />
      </button>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Step 2: Personal Details
// ═════════════════════════════════════════════════════════════════════════════

function DetailsStep({ params, initialData, onNext }) {
  const [name, setName] = useState(params.guestName ? decodeURIComponent(params.guestName) : '');
  const [email, setEmail] = useState(params.guestEmail ? decodeURIComponent(params.guestEmail) : '');
  const [phone, setPhone] = useState(params.guestPhone ? decodeURIComponent(params.guestPhone) : '');
  const [touched, setTouched] = useState({});

  const nameValid = name.trim().length >= 2;
  const emailValid = /^[^s@]+@[^s@]+.[^s@]+$/.test(email.trim());
  const phoneValid = /^\d{10,14}$/.test(phone.replace(/[\s\-().+]/g, ''));

  const errors = {
    name: !nameValid ? 'Full name is required (at least 2 characters)' : '',
    email: !emailValid ? 'Please enter a valid email address' : '',
    phone: !phoneValid ? 'Please enter a valid 10-digit phone number' : '',
  };

  const isFormValid = nameValid && emailValid && phoneValid;
  const markTouched = field => setTouched(prev => ({ ...prev, [field]: true }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    onNext({
      guestName: name.trim(),
      guestEmail: email.trim(),
      guestPhone: phone.trim(),
    });
  };

  return (
    <motion.form
      key="step-details"
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={SPRING_TRANSITION}
      onSubmit={handleSubmit}
      className="form-group"
    >
      <div>
        <label className="input-label">
          <span style={{ color: 'var(--accent)' }}><IconUser /></span>
          Primary Guest / Passenger Full Name
        </label>
        <input
          type="text"
          className={`custom-input ${touched.name && errors.name ? 'error' : ''}`}
          placeholder="e.g. Johnathan Doe"
          value={name}
          onChange={e => setName(e.target.value)}
          onBlur={() => markTouched('name')}
          autoComplete="name"
          required
        />
        {touched.name && errors.name && (
          <p className="error-text">{errors.name}</p>
        )}
      </div>

      <div>
        <label className="input-label">
          <span style={{ color: 'var(--accent)' }}><IconMail /></span>
          Confirmation Email Address
        </label>
        <input
          type="email"
          className={`custom-input ${touched.email && errors.email ? 'error' : ''}`}
          placeholder="e.g. john.doe@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onBlur={() => markTouched('email')}
          autoComplete="email"
          required
        />
        {touched.email && errors.email && (
          <p className="error-text">{errors.email}</p>
        )}
      </div>

      <div>
        <label className="input-label">
          <span style={{ color: 'var(--accent)' }}><IconPhone /></span>
          Contact Mobile Number
        </label>
        <input
          type="tel"
          className={`custom-input ${touched.phone && errors.phone ? 'error' : ''}`}
          placeholder="10-digit mobile number"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          onBlur={() => markTouched('phone')}
          autoComplete="tel"
          required
        />
        {touched.phone && errors.phone && (
          <p className="error-text">{errors.phone}</p>
        )}
      </div>

      <button
        type="submit"
        className="btn-primary"
        disabled={!isFormValid}
        style={{ marginTop: '0.75rem' }}
      >
        <span>Proceed to Payment</span>
        <IconCheck size={18} strokeWidth={3} />
      </button>
    </motion.form>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Step 3: Payment & Concurrency Conflict Enforcement (First-Come First-Served)
// ═════════════════════════════════════════════════════════════════════════════

function PaymentStep({ params, bookingData, onConflict, onConfirmed }) {
  const isHotel = params.type === 'hotel';
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [touched, setTouched] = useState({});

  const rawCard = cardNumber.replace(/\s/g, '');
  const cardValid = /^\d{16}$/.test(rawCard);
  const expiryValid = /^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry);
  const cvvValid = /^\d{3,4}$/.test(cvv);

  const errors = {
    card: !cardValid ? 'Enter a 16-digit card number' : '',
    expiry: !expiryValid ? 'Format must be MM/YY' : '',
    cvv: !cvvValid ? '3 or 4 digits' : '',
  };

  const isFormValid = cardValid && expiryValid && cvvValid;
  const markTouched = field => setTouched(prev => ({ ...prev, [field]: true }));

  const formatCardInput = (val) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 16);
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiryInput = (val) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 3) return cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    return cleaned;
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if (!isFormValid || isProcessing) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // ── 1. Real-Time Concurrency Check (First-Come First-Served Enforcement) ──
      const userSelected = bookingData.selectedUnits || [];

      if (isHotel) {
        const { data: activeBookings, error: checkErr } = await supabase
          .from('bookings')
          .select('booking_ref, status, check_in, check_out')
          .neq('status', 'cancelled')
          .eq('hotel_name', decodeURIComponent(params.name || ''))
          .lt('check_in', bookingData.dates.checkOut)
          .gt('check_out', bookingData.dates.checkIn);

        if (!checkErr && activeBookings) {
          const currentlyBooked = extractBookedUnitsFromRecords(activeBookings);
          const conflicts = userSelected.filter(u => currentlyBooked.has(u.toUpperCase()));
          if (conflicts.length > 0) {
            setIsProcessing(false);
            onConflict(`Room(s) ${conflicts.join(', ')} was just booked by another user who finished payment first. Please select another available room.`);
            return;
          }
        }
      } else {
        const { data: activeBookings, error: checkErr } = await supabase
          .from('ferry_bookings')
          .select('booking_ref, status, travel_date')
          .neq('status', 'cancelled')
          .eq('ship_name', decodeURIComponent(params.name || ''))
          .eq('travel_date', bookingData.dates.date);

        if (!checkErr && activeBookings) {
          const currentlyBooked = extractBookedUnitsFromRecords(activeBookings);
          const conflicts = userSelected.filter(u => currentlyBooked.has(u.toUpperCase()));
          if (conflicts.length > 0) {
            setIsProcessing(false);
            onConflict(`Seat(s) ${conflicts.join(', ')} was just booked by another traveler who finished payment first. Please select another available seat.`);
            return;
          }
        }
      }

      // ── 2. Generate Deterministic Unique Booking Reference ───────────────────
      const randHex = Math.random().toString(36).substring(2, 7).toUpperCase();
      const unitsTag = userSelected.join('-');
      const generatedRef = isHotel
        ? `HTL-${unitsTag}-ANI${randHex}`
        : `FRY-${unitsTag}-ANI${randHex}`;

      // ── 3. Persist to Supabase Table (with seamless backend API fallback) ──
      let savedRecord = null;
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      if (isHotel) {
        const hotelPayload = {
          user_id: isUUID(params.userId) ? params.userId : null,
          hotel_id: isUUID(params.id) ? params.id : null,
          hotel_name: decodeURIComponent(params.name || 'Hotel Accommodation'),
          booking_ref: generatedRef,
          guest_name: bookingData.guestName,
          guest_email: bookingData.guestEmail,
          guest_phone: bookingData.guestPhone || null,
          check_in: bookingData.dates.checkIn,
          check_out: bookingData.dates.checkOut,
          guests: Number(params.guests) || userSelected.length || 1,
          rooms: userSelected.length,
          total_amount: bookingData.totalPrice,
          status: 'confirmed',
        };

        const { data, error: insertErr } = await supabase
          .from('bookings')
          .insert([hotelPayload])
          .select()
          .single();

        if (insertErr) {
          console.warn('[Payment] Supabase direct insert failed (RLS policy), trying backend API fallback:', insertErr.message);
          const res = await fetch(`${apiUrl}/api/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(hotelPayload),
          });
          const apiRes = await res.json();
          if (!res.ok || !apiRes.data) throw new Error(apiRes.error || insertErr.message);
          savedRecord = apiRes.data;
        } else {
          savedRecord = data;
        }
      } else {
        const ferryPayload = {
          user_id: isUUID(params.userId) ? params.userId : null,
          schedule_id: isUUID(params.id) ? params.id : null,
          booking_ref: generatedRef,
          ship_name: decodeURIComponent(params.name || 'Express Ferry'),
          from: decodeURIComponent(params.from || 'Port Blair'),
          to: decodeURIComponent(params.to || 'Havelock Island'),
          travel_date: bookingData.dates.date,
          departure_time: params.departure_time || '08:00 AM',
          seats: userSelected.length,
          passenger_name: bookingData.guestName,
          passenger_email: bookingData.guestEmail,
          passenger_phone: bookingData.guestPhone || null,
          total_amount: bookingData.totalPrice,
          status: 'confirmed',
        };

        const { data, error: insertErr } = await supabase
          .from('ferry_bookings')
          .insert([ferryPayload])
          .select()
          .single();

        if (insertErr) {
          console.warn('[Payment] Supabase direct insert failed (RLS policy), trying backend API fallback:', insertErr.message);
          const res = await fetch(`${apiUrl}/api/ferry-bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ferryPayload),
          });
          const apiRes = await res.json();
          if (!res.ok || !apiRes.data) throw new Error(apiRes.error || insertErr.message);
          savedRecord = apiRes.data;
        } else {
          savedRecord = data;
        }
      }

      // Success handoff to confirmation screen
      onConfirmed({
        ...bookingData,
        bookingRef: savedRecord.booking_ref,
        dbId: savedRecord.id,
      });
    } catch (err) {
      console.error('[Payment] Booking insertion failed:', err);
      setErrorMessage(err.message || 'Failed to confirm booking. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <motion.form
      key="step-payment"
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={SPRING_TRANSITION}
      onSubmit={handlePay}
    >
      {/* Persistent Demo Notice Banner */}
      <div className="demo-payment-alert" role="alert">
        <IconLock size={15} />
        <span>Live Supabase Transaction — First-Come First-Served Seat Allocation</span>
      </div>

      {errorMessage && (
        <div className="demo-payment-alert" style={{ background: '#FEF2F2', borderColor: '#FCA5A5', color: '#B91C1C', marginBottom: '1rem' }}>
          <IconAlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="form-group">
        <div>
          <label className="input-label">
            <span style={{ color: 'var(--accent)' }}><IconCard /></span>
            Card Number
          </label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="cc-number"
            className={`custom-input ${touched.card && errors.card ? 'error' : ''}`}
            placeholder="4242 4242 4242 4242"
            value={cardNumber}
            onChange={e => setCardNumber(formatCardInput(e.target.value))}
            onBlur={() => markTouched('card')}
            maxLength={19}
            style={{ fontFamily: 'monospace', letterSpacing: '0.08em' }}
            required
          />
          {touched.card && errors.card && (
            <p className="error-text">{errors.card}</p>
          )}
        </div>

        <div className="responsive-grid-2">
          <div>
            <label className="input-label">Expiry (MM/YY)</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="cc-exp"
              className={`custom-input ${touched.expiry && errors.expiry ? 'error' : ''}`}
              placeholder="MM/YY"
              value={expiry}
              onChange={e => setExpiry(formatExpiryInput(e.target.value))}
              onBlur={() => markTouched('expiry')}
              maxLength={5}
              required
            />
            {touched.expiry && errors.expiry && (
              <p className="error-text">{errors.expiry}</p>
            )}
          </div>

          <div>
            <label className="input-label">CVV / CVC</label>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="cc-csc"
              className={`custom-input ${touched.cvv && errors.cvv ? 'error' : ''}`}
              placeholder="123"
              value={cvv}
              onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
              onBlur={() => markTouched('cvv')}
              maxLength={4}
              style={{ fontFamily: 'monospace' }}
              required
            />
            {touched.cvv && errors.cvv && (
              <p className="error-text">{errors.cvv}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={!isFormValid || isProcessing}
          style={{ marginTop: '0.75rem' }}
        >
          {isProcessing ? (
            <>
              <IconSpinner size={18} />
              <span>Verifying Seats &amp; Securing Booking...</span>
            </>
          ) : (
            <>
              <span>Pay &amp; Confirm {'\u20B9'}{bookingData.totalPrice?.toLocaleString('en-IN')}</span>
              <IconCheck size={18} strokeWidth={3} />
            </>
          )}
        </button>
      </div>
    </motion.form>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Step 4: Confirmation & Receipt (Live Database Record Display)
// ═════════════════════════════════════════════════════════════════════════════

const formatDate = (isoStr) => {
  if (!isoStr) return '';
  const d = new Date(isoStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

function ConfirmationStep({ params, bookingData }) {
  const isHotel = params.type === 'hotel';

  return (
    <motion.div
      key="step-confirmation"
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={SPRING_TRANSITION}
      style={{ textAlign: 'center' }}
    >
      {/* Animated Success Checkmark Badge */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={BOUNCY_SPRING}
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem',
          boxShadow: '0 8px 28px rgba(34, 197, 94, 0.35)',
        }}
      >
        <IconCheck size={40} color="#FFFFFF" strokeWidth={3.5} />
      </motion.div>

      <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
        Booking Confirmed &amp; Saved!
      </h2>
      <p style={{ fontSize: '0.925rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Your reservation has been recorded in the database.
      </p>

      {/* Booking Reference Card */}
      <div style={{
        background: '#FFF7ED',
        border: '1.5px solid #FED7AA',
        borderRadius: 'var(--radius-md)',
        padding: '0.875rem 1.25rem',
        marginBottom: '1.5rem',
      }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#EA580C' }}>
          Official Booking Reference Code
        </span>
        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#C2410C', fontFamily: 'monospace', letterSpacing: '0.08em', marginTop: '0.2rem' }}>
          {bookingData.bookingRef}
        </div>
      </div>

      {/* Itemized Receipt Breakdown */}
      <div className="receipt-card">
        <div className="receipt-row">
          <span className="receipt-label">{isHotel ? 'Accommodation' : 'Ferry Line'}</span>
          <span className="receipt-value">{decodeURIComponent(params.name || '')}</span>
        </div>

        {isHotel && params.location && (
          <div className="receipt-row">
            <span className="receipt-label">Location</span>
            <span className="receipt-value">{decodeURIComponent(params.location)}</span>
          </div>
        )}

        {!isHotel && params.from && params.to && (
          <div className="receipt-row">
            <span className="receipt-label">Route</span>
            <span className="receipt-value">{decodeURIComponent(params.from)} &rarr; {decodeURIComponent(params.to)}</span>
          </div>
        )}

        {isHotel ? (
          <>
            <div className="receipt-row">
              <span className="receipt-label">Stay Duration</span>
              <span className="receipt-value">
                {formatDate(bookingData.dates?.checkIn)} &ndash; {formatDate(bookingData.dates?.checkOut)} ({bookingData.dates?.nightsCount} night{bookingData.dates?.nightsCount > 1 ? 's' : ''})
              </span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Allocated Rooms ({bookingData.selectedUnits?.length})</span>
              <span className="receipt-value">
                {bookingData.selectedUnits?.map(r => `Room ${r}`).join(', ')}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="receipt-row">
              <span className="receipt-label">Journey Date</span>
              <span className="receipt-value">{formatDate(bookingData.dates?.date)}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Allocated Seats ({bookingData.selectedUnits?.length})</span>
              <span className="receipt-value">
                {bookingData.selectedUnits?.map(s => `Seat ${s}`).join(', ')}
              </span>
            </div>
          </>
        )}

        <div className="receipt-row">
          <span className="receipt-label">Guest Contact</span>
          <span className="receipt-value">{bookingData.guestName} ({bookingData.guestEmail})</span>
        </div>

        <div className="receipt-total-row">
          <span className="receipt-total-label">Total Amount Paid</span>
          <span className="receipt-total-value">
            {'\u20B9'}{bookingData.totalPrice?.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      <div className="btn-actions-row">
        <button
          type="button"
          className="btn-outline"
          onClick={() => window.print()}
        >
          Print Receipt
        </button>
        <button
          type="button"
          className="btn-outline"
          onClick={() => window.close()}
        >
          Close Tab
        </button>
      </div>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Error State (Invalid Parameters)
// ═════════════════════════════════════════════════════════════════════════════

function ErrorState() {
  return (
    <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
      <div style={{ color: '#EF4444', display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
        <IconAlertCircle size={56} />
      </div>
      <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
        Invalid Booking Link
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', maxWidth: '24rem', margin: '0 auto 1.5rem' }}>
        This link is missing valid property or journey details. Please return to the tourism portal and click "Check Availability &amp; Book".
      </p>
      <button
        type="button"
        className="btn-outline"
        onClick={() => window.close()}
      >
        Close Tab
      </button>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Main Wizard Application Entry
// ═════════════════════════════════════════════════════════════════════════════

export default function App() {
  // Parse query parameters
  const params = Object.fromEntries(new URLSearchParams(window.location.search));
  const isValidEntry = params.type && params.name && ['hotel', 'ferry'].includes(params.type);

  // Wizard state machine
  const [step, setStep] = useState('availability'); // 'availability' | 'details' | 'payment' | 'confirmation'
  const [bookingData, setBookingData] = useState({});
  const [conflictNotice, setConflictNotice] = useState(null);

  const titles = {
    availability: 'Select & Check Live Availability',
    details: 'Primary Guest Information',
    payment: 'Complete Payment & Confirmation',
    confirmation: 'Reservation Confirmation',
  };

  if (!isValidEntry) {
    return (
      <div className="app-container">
        <header className="site-header">
          <div className="site-header-content">
            <a href="/" className="brand-wrapper" title="Return to Nicoman Tourism">
              <div className="brand-icon">
                <img src="/logo_1.svg" alt="Brand Logo" />
              </div>
              <div className="brand-title">
                Nicoman <span>Bookings</span>
              </div>
            </a>
          </div>
        </header>

        <main className="main-content">
          <div className="wizard-container">
            <div className="main-card">
              <ErrorState />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Platform Header */}
      <header className="site-header">
        <div className="site-header-content">
          <a href="/" className="brand-wrapper" title="Return to Nicoman Tourism">
            <div className="brand-icon">
              <img src="/logo_1.svg" alt="Brand Logo" />
            </div>
            <div className="brand-title">
              Nicoman <span>Bookings</span>
            </div>
          </a>
          <span className="brand-badge">
            Island Reservation Portal
          </span>
        </div>
      </header>

      {/* Main Flow */}
      <main className="main-content">
        <div className="wizard-container">
          <div className="wizard-header">
            <h1 className="wizard-title">{titles[step]}</h1>
            <p className="wizard-subtitle">{decodeURIComponent(params.name || '')}</p>
          </div>

          {/* Connected Circles Step Indicator */}
          {step !== 'confirmation' && (
            <StepIndicator currentStep={step} />
          )}

          {/* Wizard Card Frame */}
          <div className="main-card">
            <AnimatePresence mode="wait">
              {step === 'availability' && (
                <AvailabilityStep
                  key="step-avail"
                  params={params}
                  conflictNotice={conflictNotice}
                  onNext={(data) => {
                    setConflictNotice(null);
                    setBookingData(prev => ({ ...prev, ...data }));
                    setStep('details');
                  }}
                />
              )}

              {step === 'details' && (
                <DetailsStep
                  key="step-det"
                  params={params}
                  initialData={bookingData}
                  onNext={(data) => {
                    setBookingData(prev => ({ ...prev, ...data }));
                    setStep('payment');
                  }}
                />
              )}

              {step === 'payment' && (
                <PaymentStep
                  key="step-pay"
                  params={params}
                  bookingData={bookingData}
                  onConflict={(msg) => {
                    setConflictNotice(msg);
                    setStep('availability');
                  }}
                  onConfirmed={(confirmedData) => {
                    setBookingData(confirmedData);
                    setStep('confirmation');
                  }}
                />
              )}

              {step === 'confirmation' && (
                <ConfirmationStep
                  key="step-conf"
                  params={params}
                  bookingData={bookingData}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
