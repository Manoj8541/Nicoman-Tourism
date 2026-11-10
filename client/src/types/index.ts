/**
 * Nicoman Tourism — Core Domain TypeScript Definitions
 * 
 * Provides type contracts for user profiles, hotel/ferry catalogs,
 * reservation entities, AI sentiment metadata, and terminal security states.
 */

// ── User & Authorization Types ───────────────────────────────────────────────
export type UserRole = 'user' | 'admin' | 'superadmin' | 'demo_admin';

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name?: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

// ── Lodging & Hotel Catalog Types ─────────────────────────────────────────────
export interface HotelRoom {
  room_number: string;
  room_type: string;
  price: number;
  capacity: number;
}

export interface Hotel {
  id: string | number;
  name: string;
  location: string;
  rating: number;
  price_per_night: number;
  images: string[];
  amenities: string[];
  description?: string;
  created_at?: string;
}

export type BookingStatus = 'confirmed' | 'pending' | 'cancelled' | 'delayed' | 'completed';

export interface HotelBooking {
  id: string | number;
  booking_reference: string;
  user_id: string;
  hotel_id: string | number;
  hotel_name?: string;
  check_in: string;
  check_out: string;
  rooms: string[] | number;
  total_price: number;
  status: BookingStatus;
  guest_name?: string;
  guest_email?: string;
  created_at?: string;
}

// ── Maritime & Ferry Catalog Types ────────────────────────────────────────────
export type VesselClass = 'economy' | 'deluxe' | 'royal';

export interface FerrySchedule {
  id: string | number;
  vessel_name: string;
  source: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  duration?: string;
  price: number;
  available_seats: number;
  total_capacity?: number;
  status: 'on_time' | 'delayed' | 'cancelled';
  created_at?: string;
}

export interface FerryBooking {
  id: string | number;
  booking_reference: string;
  user_id: string;
  schedule_id: string | number;
  vessel_name?: string;
  route?: string;
  departure_date: string;
  seats: string[];
  passengers?: Array<{ name: string; age?: number; gender?: string }>;
  total_price: number;
  status: BookingStatus;
  created_at?: string;
}

// ── Destination & Attraction Types ────────────────────────────────────────────
export type IslandLocation = 'South Andaman' | 'Havelock (Swaraj Dweep)' | 'Neil (Shaheed Dweep)' | 'North & Middle Andaman';

export interface TouristPlace {
  id: string | number;
  name: string;
  category: 'Beach' | 'Historical' | 'Water Sports' | 'Nature & Trekking';
  island: IslandLocation;
  best_time_to_visit?: string;
  latitude: number;
  longitude: number;
  images: string[];
  description: string;
  entry_fee?: number;
}

// ── Community Feedback & On-Device AI Types ──────────────────────────────────
export type SentimentLabel = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';

export interface SentimentClassification {
  label: SentimentLabel;
  score: number;
}

export interface FeedbackEntry {
  id: string | number;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  rating: number;
  comment: string;
  sentiment_label?: SentimentLabel;
  sentiment_score?: number;
  created_at?: string;
}

// ── Customer Support & Ticketing Types ────────────────────────────────────────
export type QueryStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface CustomerQuery {
  id: string | number;
  thread_token: string;
  user_id?: string;
  name: string;
  email: string;
  subject: string;
  status: QueryStatus;
  created_at: string;
  updated_at?: string;
}

export interface QueryMessage {
  id: string | number;
  query_id: string | number;
  sender_type: 'customer' | 'admin';
  message: string;
  resend_message_id?: string;
  created_at: string;
}

// ── System Broadcast & Emergency Alerts ───────────────────────────────────────
export type AlertSeverity = 'info' | 'warning' | 'emergency';

export interface SystemAlert {
  id: string | number;
  title: string;
  message: string;
  severity: AlertSeverity;
  is_active: boolean;
  expires_at?: string;
  created_at?: string;
}

// ── Security & Terminal Protection Types ──────────────────────────────────────
export interface AdminShieldState {
  isLocked: boolean;
  lastActivity: number;
  remainingLockMs: number;
}

export interface BookingConflictPayload {
  conflictingBooking: HotelBooking | FerryBooking;
  availableUnits: string[];
  unitType: 'hotel' | 'ferry';
  collisionMessage: string;
}
