-- ==============================================================================
--  NICOMAN TOURISM — COMPLETE SUPABASE POSTGRESQL SCHEMA & INITIAL SEED DATA
-- ==============================================================================
--  Instructions:
--  1. Open your Supabase Project Dashboard: https://supabase.com/dashboard
--  2. Navigate to "SQL Editor" -> "New Query"
--  3. Connect your React frontend via VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY
-- ==============================================================================

-- ── 1. Enable Required PostgreSQL Extensions ──────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 2. Create Core Tables ─────────────────────────────────────────────────────

-- 2.1 User Profiles (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin', 'demo_admin')),
  avatar_url TEXT,
  avatar_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.2 Deleted Profiles (30-Day Recovery Vault for GDPR / Self-Service Account Deletion)
CREATE TABLE IF NOT EXISTS public.deleted_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user',
  avatar_url TEXT,
  deletion_reason TEXT,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scheduled_purge_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- 2.3 Tourist Places Catalog
CREATE TABLE IF NOT EXISTS public.tourist_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Nature',
  location TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL DEFAULT 11.6234,
  lng DOUBLE PRECISION NOT NULL DEFAULT 92.7265,
  rating NUMERIC(2,1) NOT NULL DEFAULT 4.5,
  best_time TEXT NOT NULL DEFAULT 'October to May',
  image TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.4 Hotels & Accommodations
CREATE TABLE IF NOT EXISTS public.hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  lat DOUBLE PRECISION DEFAULT 11.6234,
  lng DOUBLE PRECISION DEFAULT 92.7265,
  rating NUMERIC(2,1) NOT NULL DEFAULT 4.5,
  price_per_night NUMERIC(10,2) NOT NULL DEFAULT 4500.00,
  image TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Luxury',
  amenities TEXT[] DEFAULT ARRAY['WiFi', 'Air Conditioning', 'Restaurant', 'Room Service'],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.5 Ferry & Ship Schedules
CREATE TABLE IF NOT EXISTS public.ship_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ship_name TEXT NOT NULL,
  from_port TEXT NOT NULL,
  to_port TEXT NOT NULL,
  departure_time TEXT NOT NULL,
  arrival_time TEXT,
  travel_time TEXT DEFAULT '2h 15m',
  travel_date DATE DEFAULT CURRENT_DATE,
  price NUMERIC(10,2) NOT NULL DEFAULT 1250.00,
  seats_available INTEGER NOT NULL DEFAULT 150,
  status TEXT NOT NULL DEFAULT 'on-time' CHECK (status IN ('on-time', 'delayed', 'cancelled', 'completed')),
  frequency TEXT DEFAULT 'Daily',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.6 Hotel Bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_ref TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  hotel_id UUID REFERENCES public.hotels(id) ON DELETE SET NULL,
  hotel_name TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INTEGER NOT NULL DEFAULT 1,
  rooms INTEGER NOT NULL DEFAULT 1,
  room_type TEXT DEFAULT 'Deluxe Island Suite',
  total_amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.7 Ferry Bookings
CREATE TABLE IF NOT EXISTS public.ferry_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_ref TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  schedule_id UUID REFERENCES public.ship_schedule(id) ON DELETE SET NULL,
  ship_name TEXT NOT NULL,
  from_port TEXT NOT NULL,
  to_port TEXT NOT NULL,
  travel_date DATE NOT NULL,
  departure_time TEXT,
  passenger_name TEXT NOT NULL,
  passenger_email TEXT NOT NULL,
  passenger_phone TEXT,
  seats INTEGER NOT NULL DEFAULT 1,
  seat_class TEXT DEFAULT 'Premium',
  total_amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.8 Customer Reviews & AI Sentiment Feedback
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  category TEXT DEFAULT 'General',
  comment TEXT NOT NULL,
  sentiment TEXT NOT NULL DEFAULT 'neutral' CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  sentiment_score NUMERIC(4,3) DEFAULT 0.500,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('pending', 'published', 'flagged', 'hidden')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.9 Customer Support Queries
CREATE TABLE IF NOT EXISTS public.customer_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_token TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'replied', 'in_progress', 'closed', 'resolved')),
  admin_reply TEXT,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.10 Inbound/Outbound Thread Message History
CREATE TABLE IF NOT EXISTS public.query_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id UUID NOT NULL REFERENCES public.customer_queries(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'admin')),
  sender_email TEXT NOT NULL,
  message TEXT NOT NULL,
  resend_email_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.11 Emergency Travel Notices & Broadcast Alerts
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'emergency', 'weather', 'schedule')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 3. Functions & Automated Triggers ──────────────────────────────────────────

-- 3.1 Function: Automatically update updated_at timestamp on row modification
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all core tables
DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_hotels_updated_at ON public.hotels;
CREATE TRIGGER tr_hotels_updated_at BEFORE UPDATE ON public.hotels FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_tourist_places_updated_at ON public.tourist_places;
CREATE TRIGGER tr_tourist_places_updated_at BEFORE UPDATE ON public.tourist_places FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_ship_schedule_updated_at ON public.ship_schedule;
CREATE TRIGGER tr_ship_schedule_updated_at BEFORE UPDATE ON public.ship_schedule FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_bookings_updated_at ON public.bookings;
CREATE TRIGGER tr_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_ferry_bookings_updated_at ON public.ferry_bookings;
CREATE TRIGGER tr_ferry_bookings_updated_at BEFORE UPDATE ON public.ferry_bookings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_feedback_updated_at ON public.feedback;
CREATE TRIGGER tr_feedback_updated_at BEFORE UPDATE ON public.feedback FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_customer_queries_updated_at ON public.customer_queries;
CREATE TRIGGER tr_customer_queries_updated_at BEFORE UPDATE ON public.customer_queries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3.2 Function & Trigger: Automatically create public.profiles on auth.users sign-up (Email or OAuth)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _full_name TEXT;
  _avatar_url TEXT;
  _role TEXT := 'user';
BEGIN
  _full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  _avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    NULL
  );

  -- Set demo_admin role automatically if demo email is used
  IF NEW.email = 'demoadmin@nicoman.com' THEN
    _role := 'demo_admin';
  END IF;

  INSERT INTO public.profiles (user_id, email, full_name, role, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    _full_name,
    _role,
    _avatar_url,
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3.3 Helper Function: Fast Admin Role Validation for RLS Policies
CREATE OR REPLACE FUNCTION public.is_admin(user_uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = user_uid
    AND role IN ('admin', 'superadmin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ── 4. Storage Bucket Setup (Avatars & Public Assets) ─────────────────────────

-- Create avatars storage bucket if it doesn't already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880;

-- ── 5. Row Level Security (RLS) Configuration ─────────────────────────────────

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deleted_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tourist_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ship_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ferry_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- 5.1 Profiles Policies
DROP POLICY IF EXISTS "Public profiles read" ON public.profiles;
CREATE POLICY "Public profiles read" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins full profiles access" ON public.profiles;
CREATE POLICY "Admins full profiles access" ON public.profiles FOR ALL USING (public.is_admin(auth.uid()));

-- 5.2 Catalogs (Tourist Places, Hotels, Ship Schedule, Alerts): Public Read, Admin Write
DROP POLICY IF EXISTS "Public read tourist places" ON public.tourist_places;
CREATE POLICY "Public read tourist places" ON public.tourist_places FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage tourist places" ON public.tourist_places;
CREATE POLICY "Admins manage tourist places" ON public.tourist_places FOR ALL USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Public read hotels" ON public.hotels;
CREATE POLICY "Public read hotels" ON public.hotels FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage hotels" ON public.hotels;
CREATE POLICY "Admins manage hotels" ON public.hotels FOR ALL USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Public read ship schedule" ON public.ship_schedule;
CREATE POLICY "Public read ship schedule" ON public.ship_schedule FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage ship schedule" ON public.ship_schedule;
CREATE POLICY "Admins manage ship schedule" ON public.ship_schedule FOR ALL USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Public read active alerts" ON public.alerts;
CREATE POLICY "Public read active alerts" ON public.alerts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage alerts" ON public.alerts;
CREATE POLICY "Admins manage alerts" ON public.alerts FOR ALL USING (public.is_admin(auth.uid()));

-- 5.3 Bookings & Ferry Bookings Policies
DROP POLICY IF EXISTS "Users view own hotel bookings" ON public.bookings;
CREATE POLICY "Users view own hotel bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can insert hotel bookings" ON public.bookings;
CREATE POLICY "Anyone can insert hotel bookings" ON public.bookings FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users update own hotel bookings" ON public.bookings;
CREATE POLICY "Users update own hotel bookings" ON public.bookings FOR UPDATE USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users view own ferry bookings" ON public.ferry_bookings;
CREATE POLICY "Users view own ferry bookings" ON public.ferry_bookings FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone can insert ferry bookings" ON public.ferry_bookings;
CREATE POLICY "Anyone can insert ferry bookings" ON public.ferry_bookings FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users update own ferry bookings" ON public.ferry_bookings;
CREATE POLICY "Users update own ferry bookings" ON public.ferry_bookings FOR UPDATE USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- 5.4 Feedback Policies
DROP POLICY IF EXISTS "Public view published feedback" ON public.feedback;
CREATE POLICY "Public view published feedback" ON public.feedback FOR SELECT USING (status = 'published' OR public.is_admin(auth.uid()) OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone insert feedback" ON public.feedback;
CREATE POLICY "Anyone insert feedback" ON public.feedback FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins manage feedback" ON public.feedback;
CREATE POLICY "Admins manage feedback" ON public.feedback FOR ALL USING (public.is_admin(auth.uid()));

-- 5.5 Customer Queries & Thread Messages Policies
DROP POLICY IF EXISTS "Users view own queries" ON public.customer_queries;
CREATE POLICY "Users view own queries" ON public.customer_queries FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Anyone insert query" ON public.customer_queries;
CREATE POLICY "Anyone insert query" ON public.customer_queries FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins manage queries" ON public.customer_queries;
CREATE POLICY "Admins manage queries" ON public.customer_queries FOR ALL USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Read thread messages" ON public.query_messages;
CREATE POLICY "Read thread messages" ON public.query_messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert thread messages" ON public.query_messages;
CREATE POLICY "Insert thread messages" ON public.query_messages FOR INSERT WITH CHECK (true);

-- 5.6 Deleted Profiles Vault (Admins only)
DROP POLICY IF EXISTS "Admins manage deleted profiles" ON public.deleted_profiles;
CREATE POLICY "Admins manage deleted profiles" ON public.deleted_profiles FOR ALL USING (public.is_admin(auth.uid()));

-- 5.7 Storage Policies for Avatars Bucket
DROP POLICY IF EXISTS "Public Avatar Image Read" ON storage.objects;
CREATE POLICY "Public Avatar Image Read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated User Upload Avatar" ON storage.objects;
CREATE POLICY "Authenticated User Upload Avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated User Update Avatar" ON storage.objects;
CREATE POLICY "Authenticated User Update Avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated User Delete Avatar" ON storage.objects;
CREATE POLICY "Authenticated User Delete Avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- ── 6. Initial Seed Data (Iconic Andaman Destinations & Catalogs) ─────────────

-- 6.1 Seed Tourist Places
INSERT INTO public.tourist_places (name, category, location, lat, lng, rating, best_time, image, description)
VALUES
  (
    'Radhanagar Beach',
    'Beach',
    'Havelock Island',
    11.9820,
    92.9640,
    4.8,
    'October to May',
    'https://thumbs.dreamstime.com/b/radhanagar-beach-one-most-famous-attractions-havelock-island-andaman-nicobar-islands-radhanagar-beach-253126594.jpg',
    'Ranked as Asia''s best beach by Time Magazine, famous for turquoise waters, powder-soft white sands, and breathtaking tropical sunsets.'
  ),
  (
    'Cellular Jail',
    'Historic',
    'Port Blair',
    11.6741,
    92.7477,
    4.7,
    'Year Round',
    'https://images.unsplash.com/photo-1721231564051-3b44b8058a9e?q=80&w=1074&auto=format&fit=crop',
    'Colonial-era penal settlement known as Kala Pani, symbolizing India''s struggle for independence with an evening sound and light show.'
  ),
  (
    'Elephant Beach',
    'Beach',
    'Havelock Island',
    12.0280,
    93.0000,
    4.7,
    'October to May',
    'https://www.andamantourism.org/wp-content/uploads/2025/02/Elephant-beach-1-800x444.jpg',
    'Renowned for crystal-clear shallow waters, vibrant living coral reefs, sea walking, snorkeling, and thrilling water sports adventures.'
  ),
  (
    'Havelock Island (Swaraj Dweep)',
    'Island',
    'Havelock Island',
    11.9600,
    93.0000,
    4.9,
    'October to May',
    'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
    'The premier destination of the archipelago featuring world-class scuba diving, verdant tropical rainforests, and serene beachside resorts.'
  ),
  (
    'Neil Island (Shaheed Dweep)',
    'Island',
    'Neil Island',
    11.8300,
    93.0300,
    4.6,
    'November to April',
    'https://th.bing.com/th/id/R.07552f9c51f70af31487e175bb9c748b?rik=vVXUQWKcCxEV7Q&riu=http%3a%2f%2fwww.andamantourism.org%2fwp-content%2fuploads%2f2017%2f06%2fneils.jpg&ehk=pESrD8gGthu9ZWjDuijnutU8rLzFQGN6NOBPBShE4TM%3d&risl=&pid=ImgRaw&r=0',
    'Peaceful, rustic island known for its organic agriculture, natural coral rock formations, Laxmanpur Beach, and Bharatpur coral reefs.'
  ),
  (
    'Baratang Island',
    'Nature',
    'Middle Andaman',
    12.1774,
    92.7575,
    4.4,
    'November to March',
    'https://tse3.mm.bing.net/th/id/OIP.l_vLrxJC-nsI45eAyOeiHAHaEK?rs=1&pid=ImgDetMain&o=7&rm=3',
    'Famous for fascinating natural limestone caves, active mud volcanoes, and dense mangrove creek boat expeditions.'
  ),
  (
    'Ross Island (Netaji Subhash Chandra Bose Dweep)',
    'Historic',
    'Near Port Blair',
    11.6775,
    92.7635,
    4.5,
    'October to May',
    'https://www.go2andaman.com/wp-content/uploads/2021/01/ross-island-go2andaman-port-blair1.jpeg',
    'Former British colonial administrative headquarters with crumbling ruins intertwined with giant banyan trees and roaming spotted deer.'
  ),
  (
    'Mount Harriet National Park',
    'Nature',
    'South Andaman',
    11.7100,
    92.7400,
    4.3,
    'October to April',
    'https://images.unsplash.com/photo-1503435980610-a51f3ddfee50?w=800',
    'Highest peak in South Andaman offering sweeping panoramic views of the archipelago, rich birdlife, and lush evergreen forest trails.'
  )
ON CONFLICT DO NOTHING;

-- 6.2 Seed Hotels & Resorts
INSERT INTO public.hotels (name, location, lat, lng, rating, price_per_night, image, description, category, amenities)
VALUES
  (
    'Taj Exotica Resort & Spa',
    'Havelock Island',
    11.9750,
    92.9680,
    4.9,
    18500.00,
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
    'Ultra-luxury 5-star villas situated on Radhanagar Beach, featuring private plunge pools, world-class dining, and rejuvenating Ayurvedic wellness spas.',
    'Ultra Luxury',
    ARRAY['WiFi', 'Infinity Pool', 'Spa', 'Private Beach Access', 'Fine Dining', 'Water Sports']
  ),
  (
    'Symphony Palms Beach Resort',
    'Havelock Island',
    11.9850,
    92.9800,
    4.7,
    6800.00,
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
    'Beachfront cottages nestled under towering coconut palms with immediate access to private lagoon waters, dive center, and candlelight beach dinners.',
    'Luxury',
    ARRAY['WiFi', 'Beach Access', 'Restaurant', 'Dive Center', 'Room Service']
  ),
  (
    'SeaShell Resort & Spa',
    'Havelock Island',
    11.9920,
    92.9910,
    4.5,
    5500.00,
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
    'Premium wooden beach chalets overlooking crystal-clear waters with an open-air swimming pool, sunset bar, and multi-cuisine restaurant.',
    'Luxury',
    ARRAY['WiFi', 'Swimming Pool', 'Beach Access', 'Restaurant', 'Bar']
  ),
  (
    'Peerless Resort',
    'Port Blair',
    11.6420,
    92.7480,
    4.3,
    4200.00,
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    'The only resort located right on Corbyn''s Cove Beach in Port Blair, offering lush landscaped gardens and ocean-view luxury rooms.',
    'Premium',
    ARRAY['WiFi', 'Pool', 'Fitness Center', 'Spa', 'Restaurant']
  ),
  (
    'Coral Reef Resort',
    'Neil Island',
    11.8380,
    93.0320,
    4.2,
    3500.00,
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
    'Cozy tropical cottages near Bharatpur Beach surrounded by tranquil fruit orchards and vibrant coral reef gardens.',
    'Budget',
    ARRAY['WiFi', 'Restaurant', 'Garden Lounge', 'Bicycle Rental']
  ),
  (
    'TSG Aura Resort',
    'Port Blair',
    11.6310,
    92.7310,
    4.1,
    3800.00,
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
    'Convenient modern boutique accommodation offering comfortable executive suites, fast airport shuttle, and rooftop island dining.',
    'Budget',
    ARRAY['WiFi', 'Restaurant', 'Room Service', 'Airport Shuttle']
  )
ON CONFLICT DO NOTHING;

-- 6.3 Seed Ship & Ferry Schedules
INSERT INTO public.ship_schedule (ship_name, from_port, to_port, departure_time, arrival_time, travel_time, price, seats_available, status, frequency)
VALUES
  ('Makruzz Gold Express', 'Port Blair', 'Havelock Island', '06:00 AM', '07:30 AM', '1h 30m', 1650.00, 180, 'on-time', 'Daily (Morning)'),
  ('Green Ocean 1', 'Port Blair', 'Havelock Island', '08:00 AM', '10:15 AM', '2h 15m', 1250.00, 220, 'on-time', 'Daily (Morning)'),
  ('ITT Majestic Catamaran', 'Havelock Island', 'Neil Island', '10:30 AM', '11:45 AM', '1h 15m', 1450.00, 140, 'on-time', 'Daily'),
  ('Makruzz Pearl Express', 'Neil Island', 'Port Blair', '02:00 PM', '03:15 PM', '1h 15m', 1550.00, 160, 'on-time', 'Daily (Afternoon)'),
  ('Nautika Superfast', 'Port Blair', 'Havelock Island', '01:30 PM', '03:00 PM', '1h 30m', 1750.00, 190, 'on-time', 'Daily (Afternoon)'),
  ('DSS Government Vessel', 'Port Blair', 'Diglipur (North Andaman)', '06:00 AM', '02:00 PM', '8h 00m', 650.00, 350, 'on-time', '3 times / week')
ON CONFLICT DO NOTHING;

-- 6.4 Seed Broadcast Travel Alert
INSERT INTO public.alerts (title, message, type, is_active, expires_at)
VALUES (
  'Welcome to Andaman & Nicobar Tourism',
  'All inter-island passenger ferries and high-speed catamarans are operating on normal schedule with fair weather conditions.',
  'info',
  true,
  now() + INTERVAL '30 days'
)
ON CONFLICT DO NOTHING;

-- ==============================================================================
--  Your database is fully provisioned with tables, RLS, triggers & seed data.
-- ==============================================================================
