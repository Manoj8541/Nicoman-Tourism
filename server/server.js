import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://aojjkrpvzlmxylcyaddg.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

app.use(cors());
// Raw body handler for Resend inbound Svix webhook signature verification
app.use('/api/webhooks/resend-inbound', express.raw({ type: '*/*' }));
app.use(express.json());

// Tourist Places Data with Real Images
const touristPlaces = [
  {
    id: 1,
    name: "Radhanagar Beach",
    location: "Havelock Island",
    description: "Ranked as Asia's best beach, famous for turquoise waters and white sand",
    image: "https://thumbs.dreamstime.com/b/radhanagar-beach-one-most-famous-attractions-havelock-island-andaman-nicobar-islands-radhanagar-beach-253126594.jpg",
    category: "Beach",
    rating: 4.8,
    bestTime: "October to May"
  },
  {
    id: 2,
    name: "Cellular Jail",
    location: "Port Blair",
    description: "Historic colonial prison, symbol of India's freedom struggle",
    image: "https://images.unsplash.com/photo-1721231564051-3b44b8058a9e?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    category: "Historical",
    rating: 4.7,
    bestTime: "Year Round"
  },
  {
    id: 3,
    name: "Neil Island",
    location: "Neil Island",
    description: "Peaceful island known for coral reefs and natural rock formations",
    image: "https://th.bing.com/th/id/R.07552f9c51f70af31487e175bb9c748b?rik=vVXUQWKcCxEV7Q&riu=http%3a%2f%2fwww.andamantourism.org%2fwp-content%2fuploads%2f2017%2f06%2fneils.jpg&ehk=pESrD8gGthu9ZWjDuijnutU8rLzFQGN6NOBPBShE4TM%3d&risl=&pid=ImgRaw&r=0",
    category: "Island",
    rating: 4.6,
    bestTime: "November to April"
  },
  {
    id: 4,
    name: "Ross Island",
    location: "Near Port Blair",
    description: "Former administrative headquarters with colonial ruins",
    image: "https://www.go2andaman.com/wp-content/uploads/2021/01/ross-island-go2andaman-port-blair1.jpeg",
    category: "Historical",
    rating: 4.5,
    bestTime: "October to May"
  },
  {
    id: 5,
    name: "Baratang Island",
    location: "Middle Andaman",
    description: "Famous for limestone caves and mud volcanoes",
    image: "https://tse3.mm.bing.net/th/id/OIP.l_vLrxJC-nsI45eAyOeiHAHaEK?rs=1&pid=ImgDetMain&o=7&rm=3",
    category: "Nature",
    rating: 4.4,
    bestTime: "November to March"
  },
  {
    id: 6,
    name: "Elephant Beach",
    location: "Havelock Island",
    description: "Perfect spot for snorkeling and water sports",
    image: "https://www.andamantourism.org/wp-content/uploads/2025/02/Elephant-beach-1-800x444.jpg",
    category: "Beach",
    rating: 4.7,
    bestTime: "October to May"
  }
];

// Hotels Data
const hotels = [
  {
    id: 1,
    name: "SeaShell Resort",
    location: "Havelock Island",
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800",
    price: 5500,
    rating: 4.5,
    amenities: ["WiFi", "Pool", "Beach Access", "Restaurant"],
    category: "Luxury"
  },
  {
    id: 2,
    name: "Peerless Resort",
    location: "Port Blair",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
    price: 4200,
    rating: 4.3,
    amenities: ["WiFi", "Pool", "Gym", "Spa"],
    category: "Premium"
  },
  {
    id: 3,
    name: "Symphony Palms Beach Resort",
    location: "Havelock Island",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800",
    price: 6800,
    rating: 4.7,
    amenities: ["WiFi", "Beach Access", "Restaurant", "Water Sports"],
    category: "Luxury"
  },
  {
    id: 4,
    name: "Coral Reef Resort",
    location: "Neil Island",
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800",
    price: 3500,
    rating: 4.2,
    amenities: ["WiFi", "Restaurant", "Garden"],
    category: "Budget"
  },
  {
    id: 5,
    name: "TSG Aura",
    location: "Port Blair",
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800",
    price: 3800,
    rating: 4.1,
    amenities: ["WiFi", "Restaurant", "Room Service"],
    category: "Budget"
  },
  {
    id: 6,
    name: "Taj Exotica Resort",
    location: "Havelock Island",
    image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800",
    price: 15000,
    rating: 4.9,
    amenities: ["WiFi", "Pool", "Spa", "Beach Access", "Fine Dining", "Water Sports"],
    category: "Ultra Luxury"
  }
];

// Ship Routes with Nautical Miles
const shipRoutes = [
  {
    id: 1,
    from: "Chennai Port",
    from_state: "Tamil Nadu",
    to: "Port Blair",
    distance: 647,
    unit: "nautical miles",
    travel_time: "12-14 hours",
    frequency: "3-4 times/month"
  },
  {
    id: 2,
    from: "Kolkata Port",
    from_state: "West Bengal",
    to: "Port Blair",
    distance: 756,
    unit: "nautical miles",
    travel_time: "24-26 hours",
    frequency: "2-3 times/month"
  },
  {
    id: 3,
    from: "Visakhapatnam Port",
    from_state: "Andhra Pradesh",
    to: "Port Blair",
    distance: 684,
    unit: "nautical miles",
    travel_time: "18-22 hours",
    frequency: "2 times/month"
  }
];


// Ship Schedule
const shipSchedule = [
  {
    id: 1,
    shipName: "MV Swaraj Dweep",
    from: "Port Blair",
    to: "Havelock Island",
    departure: "06:00 AM",
    arrival: "08:30 AM",
    status: "On Time",
    price: 1250,
    days: ["Mon", "Wed", "Fri", "Sun"]
  },
  {
    id: 2,
    shipName: "MV Makruzz",
    from: "Port Blair",
    to: "Havelock Island",
    departure: "08:15 AM",
    arrival: "10:30 AM",
    status: "On Time",
    price: 1550,
    days: ["Daily"]
  },
  {
    id: 3,
    shipName: "MV Coastal Cruise",
    from: "Havelock Island",
    to: "Neil Island",
    departure: "11:00 AM",
    arrival: "12:00 PM",
    status: "On Time",
    price: 950,
    days: ["Tue", "Thu", "Sat"]
  },
  {
    id: 4,
    shipName: "MV Green Ocean",
    from: "Port Blair",
    to: "Neil Island",
    departure: "06:30 AM",
    arrival: "09:00 AM",
    status: "Delayed 30 min",
    price: 1100,
    days: ["Mon", "Wed", "Fri"]
  },
  {
    id: 5,
    shipName: "MV Nautika",
    from: "Havelock Island",
    to: "Port Blair",
    departure: "04:00 PM",
    arrival: "06:30 PM",
    status: "On Time",
    price: 1650,
    days: ["Daily"]
  }
];

// API Routes — Fetch from Supabase DB first, fallback to static mock data if DB empty

// Zero-Egress, Zero-Memory Health Ping (Resets Supabase 7-day timer with 0 bytes data transfer)
app.get('/api/health', async (req, res) => {
  if (supabase) {
    try {
      // 'head: true' sends a HEAD request: PostgreSQL returns ZERO rows of data (0 egress bandwidth & 0 RAM bloat)
      await supabase.from('tourist_places').select('id', { count: 'exact', head: true });
    } catch (e) {
      console.error('[server] Health ping database error:', e.message);
    }
  }
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/tourist-places', async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('tourist_places').select('*');
      if (!error && data && data.length > 0) return res.json(data);
    } catch (e) { console.error('[server] Supabase fetch tourist_places error:', e.message); }
  }
  res.json(touristPlaces);
});

app.get('/api/hotels', async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('hotels').select('*');
      if (!error && data && data.length > 0) return res.json(data);
    } catch (e) { console.error('[server] Supabase fetch hotels error:', e.message); }
  }
  res.json(hotels);
});

app.get('/api/ship-routes', async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('ship_routes').select('*').order('distance', { ascending: true });
      if (!error && data && data.length > 0) return res.json(data);
    } catch (e) { console.error('[server] Supabase fetch ship_routes error:', e.message); }
  }
  res.json(shipRoutes);
});

app.get('/api/ship-schedule', async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('ship_schedule').select('*');
      if (!error && data && data.length > 0) return res.json(data);
    } catch (e) { console.error('[server] Supabase fetch ship_schedule error:', e.message); }
  }
  res.json(shipSchedule);
});


app.post('/api/hotel-booking', async (req, res) => {
  const { hotelId, hotelName, checkIn, checkOut, guests, rooms, name, email, phone, totalAmount } = req.body;
  const bookingRef = 'ANI' + Math.random().toString(36).substr(2, 9).toUpperCase();

  if (supabase) {
    try {
      // Attempt to resolve the authenticated user from the Bearer token (optional)
      let userId = null;
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) userId = user.id;
      }

      // hotel_id must be a valid UUID; integer IDs from the static fallback data are skipped
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const hotelUuid = uuidRegex.test(hotelId) ? hotelId : null;

      const { data, error } = await supabase.from('bookings').insert([{
        user_id:     userId,
        hotel_id:    hotelUuid,
        hotel_name:  hotelName || 'Unknown Hotel',
        booking_ref: bookingRef,
        guest_name:  name,
        guest_email: email,
        guest_phone: phone || null,
        check_in:    checkIn,
        check_out:   checkOut,
        guests:      parseInt(guests) || 1,
        rooms:       parseInt(rooms)  || 1,
        total_amount: parseInt(totalAmount) || 0,
        status:      'confirmed',
      }]).select().single();

      if (error) {
        console.error('[hotel-booking] Supabase error:', error.message);
        // Still return success with generated ref so UX doesn't break
        return res.json({ success: true, bookingId: bookingRef, message: 'Booking confirmed (DB error logged).' });
      }

      return res.json({ success: true, bookingId: data.booking_ref, message: 'Booking confirmed successfully!' });
    } catch (err) {
      console.error('[hotel-booking] Unexpected error:', err.message);
    }
  }

  // Fallback (no Supabase configured)
  res.json({ success: true, bookingId: bookingRef, message: 'Booking confirmed successfully!' });
});


// ── Feedback: Public GET (fetch live approved feedback from Supabase) ────────
app.get('/api/feedback', async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('id, user_id, name, email, rating, message, avatar_url, created_at, hidden')
        .or('hidden.is.null,hidden.eq.false')
        .order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        return res.json(data);
      }
    } catch (e) {
      console.error('[get feedback]', e.message);
    }
  }

  // Fallback initial reviews if DB is not configured or error
  res.json([
    { id: 'fb-1', name: 'Priya Sharma', rating: 5, message: 'Absolutely stunning! Best vacation ever!', avatar_url: 'https://randomuser.me/api/portraits/women/44.jpg', created_at: new Date().toISOString() },
    { id: 'fb-2', name: 'Rahul Verma', rating: 5, message: 'Booking was smooth, hotels were amazing!', avatar_url: 'https://randomuser.me/api/portraits/men/32.jpg', created_at: new Date().toISOString() },
    { id: 'fb-3', name: 'Anjali Patel', rating: 4, message: 'Beautiful islands with rich history!', avatar_url: 'https://randomuser.me/api/portraits/women/68.jpg', created_at: new Date().toISOString() },
  ]);
});

// ── Feedback: Public POST (saves feedback with avatar_url, user_id, sentiment) ──
app.post('/api/feedback', async (req, res) => {
  const { name, email, rating, message, sentiment, avatar_url, user_id } = req.body;
  let authUserId = user_id || null;

  // Extract verified user ID from Bearer token if present
  const authHeader = req.headers.authorization;
  if (authHeader && supabase) {
    try {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) authUserId = user.id;
    } catch {}
  }

  if (supabase) {
    try {
      const allowedSentiments = ['positive', 'negative', 'neutral'];
      const safeSentiment = allowedSentiments.includes(sentiment) ? sentiment : null;
      const { data, error } = await supabase.from('feedback').insert([{
        user_id: authUserId,
        name,
        email,
        rating: parseInt(rating) || 0,
        message,
        sentiment: safeSentiment,
        avatar_url: avatar_url || null,
      }]).select().single();

      if (!error && data) {
        return res.json({ success: true, message: 'Thank you for your feedback!', data });
      }
    } catch (e) {
      console.error('[feedback]', e.message);
    }
  }
  res.json({ success: true, message: 'Thank you for your feedback!' });
});

// ── Feedback: DELETE (allows a user to delete their own feedback) ─────────────
app.delete('/api/feedback', async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing feedback ID' });

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Sign in required to delete feedback' });
  }

  if (!supabase) {
    return res.json({ success: true });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Check if user is an admin
    let { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).maybeSingle();
    if (!profile) {
      const fallback = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
      profile = fallback.data;
    }
    const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';

    if (isAdmin) {
      const { error: delErr } = await supabase.from('feedback').delete().eq('id', id);
      if (delErr) return res.status(500).json({ error: delErr.message });
      return res.json({ success: true, message: 'Feedback deleted' });
    }

    // Standard user: can ONLY delete feedback they authored (match user_id or email)
    const { data: item, error: fetchErr } = await supabase
      .from('feedback')
      .select('id, user_id, email')
      .eq('id', id)
      .single();

    if (fetchErr || !item) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    const isAuthor = (item.user_id && item.user_id === user.id) ||
                     (item.email && item.email.toLowerCase() === user.email?.toLowerCase());

    if (!isAuthor) {
      return res.status(403).json({ error: 'You can only delete your own feedback' });
    }

    const { error: delErr } = await supabase.from('feedback').delete().eq('id', id);
    if (delErr) return res.status(500).json({ error: delErr.message });

    return res.json({ success: true, message: 'Your feedback was deleted' });
  } catch (err) {
    console.error('[delete feedback]', err.message);
    res.status(500).json({ error: 'Failed to delete feedback' });
  }
});

// ── Contact (public POST — now persisted to Supabase with user_id) ────────────
app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message, user_id } = req.body;
  let resolvedUserId = user_id || null;

  if (supabase) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (token && !resolvedUserId) {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) resolvedUserId = user.id;
      }
      if (!resolvedUserId && email) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('email', email.trim().toLowerCase())
          .maybeSingle();
        if (profile) resolvedUserId = profile.user_id;
      }

      const insertData = {
        name,
        email,
        subject,
        message,
        status: 'open',
        user_id: resolvedUserId,
      };

      let { error } = await supabase.from('customer_queries').insert([insertData]);
      if (error && error.message?.includes('user_id')) {
        delete insertData.user_id;
        await supabase.from('customer_queries').insert([insertData]);
      }
    } catch (e) {
      console.error('[contact]', e.message);
    }
  }
  res.json({ success: true, message: 'We will get back to you soon!' });
});

// ── Admin Auth Middleware with High-Speed Token Caching ───────────────────────
// In-memory cache eliminates 2 sequential remote Supabase round-trips on every single request
const tokenCache = new Map(); // token -> { user, role, expiresAt }

const verifyTokenAndRole = async (token) => {
  const cached = tokenCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    return { user: cached.user, role: cached.role, error: null };
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return { user: null, role: null, error: 'Invalid or expired token' };

  let { data: profile } = await supabase
    .from('profiles').select('role').eq('user_id', user.id).maybeSingle();
  if (!profile) {
    const fallback = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    profile = fallback.data;
  }
  if (!profile) return { user: null, role: null, error: 'Profile not found' };

  // Cache verified user role for 5 minutes
  tokenCache.set(token, { user, role: profile.role, expiresAt: Date.now() + 5 * 60 * 1000 });
  return { user, role: profile.role, error: null };
};

const requireAdmin = async (req, res, next) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No auth token provided' });
  try {
    const { user, role, error } = await verifyTokenAndRole(token);
    if (error || !user) return res.status(401).json({ error: error || 'Unauthorized' });
    if (!['admin', 'superadmin', 'demo_admin'].includes(role))
      return res.status(403).json({ error: 'Admin access required' });

    // Block Demo Admin from mutating production data (except testing deleted accounts restore & purge)
    if (role === 'demo_admin' && req.method !== 'GET') {
      const path = req.path || req.originalUrl || '';
      const isAllowedDemoAction = path.includes('/api/admin/deleted-profiles/restore') ||
                                  path.includes('/api/admin/deleted-profiles/purge');
      if (!isAllowedDemoAction) {
        return res.status(403).json({
          error: 'Demo Admin mode is read-only. Modifying production data is disabled in demo mode.'
        });
      }
    }

    req.adminUser = user;
    req.adminRole = role;
    next();
  } catch (err) {
    console.error('[requireAdmin]', err.message);
    res.status(500).json({ error: 'Auth check failed' });
  }
};

const requireSuperAdmin = async (req, res, next) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No auth token provided' });
  try {
    const { user, role, error } = await verifyTokenAndRole(token);
    if (error || !user) return res.status(401).json({ error: error || 'Unauthorized' });
    if (role !== 'superadmin')
      return res.status(403).json({ error: 'Superadmin access required' });
    req.adminUser = user;
    req.adminRole = role;
    next();
  } catch (err) {
    console.error('[requireSuperAdmin]', err.message);
    res.status(500).json({ error: 'Auth check failed' });
  }
};

// ── Helper: Storage Image Cleanup ─────────────────────────────────────────────
const cleanupStorageImage = async (imageUrl, bucket = 'place-images') => {
  if (!imageUrl || typeof imageUrl !== 'string' || !supabase) return;
  let path = imageUrl;
  if (imageUrl.includes(`/storage/v1/object/public/${bucket}/`)) {
    path = imageUrl.split(`/storage/v1/object/public/${bucket}/`)[1]?.split('?')[0];
  } else if (imageUrl.includes(`/${bucket}/`)) {
    path = imageUrl.split(`/${bucket}/`)[1]?.split('?')[0];
  } else if (imageUrl.startsWith('http')) {
    return; // external URL like Unsplash
  } else {
    path = imageUrl.split('?')[0];
  }
  if (!path) return;
  try {
    await supabase.storage.from(bucket).remove([path]);
    console.log(`[storage-cleanup] Removed ${bucket}/${path}`);
  } catch (err) {
    console.warn(`[storage-cleanup] Warning removing ${path}:`, err.message);
  }
};

// ── Admin: Hotels ─────────────────────────────────────────────────────────────
app.get('/api/admin/hotels', requireAdmin, async (req, res) => {
  const { data, error } = await supabase.from('hotels').select('*').order('id', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
app.post('/api/admin/hotels', requireAdmin, async (req, res) => {
  const { data, error } = await supabase.from('hotels').insert([req.body]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
app.put('/api/admin/hotels', requireAdmin, async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  // Cleanup old storage image if replaced or removed
  if (req.body.image_url !== undefined) {
    const { data: existing } = await supabase.from('hotels').select('image_url').eq('id', id).maybeSingle();
    if (existing?.image_url && existing.image_url !== req.body.image_url) {
      await cleanupStorageImage(existing.image_url, 'place-images');
    }
  }

  const { data, error } = await supabase.from('hotels').update(req.body).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
app.delete('/api/admin/hotels', requireAdmin, async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  // Cleanup storage image before deletion
  const { data: existing } = await supabase.from('hotels').select('image_url').eq('id', id).maybeSingle();
  if (existing?.image_url) {
    await cleanupStorageImage(existing.image_url, 'place-images');
  }

  const { error } = await supabase.from('hotels').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ── Admin: Tourist Places ─────────────────────────────────────────────────────
app.get('/api/admin/tourist-places', requireAdmin, async (req, res) => {
  const { data, error } = await supabase.from('tourist_places').select('*').order('id', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
app.post('/api/admin/tourist-places', requireAdmin, async (req, res) => {
  const { data, error } = await supabase.from('tourist_places').insert([req.body]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
app.put('/api/admin/tourist-places', requireAdmin, async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  // Cleanup old storage image if replaced or removed
  if (req.body.image_url !== undefined) {
    const { data: existing } = await supabase.from('tourist_places').select('image_url').eq('id', id).maybeSingle();
    if (existing?.image_url && existing.image_url !== req.body.image_url) {
      await cleanupStorageImage(existing.image_url, 'place-images');
    }
  }

  const { data, error } = await supabase.from('tourist_places').update(req.body).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
app.delete('/api/admin/tourist-places', requireAdmin, async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  // Cleanup storage image before deletion
  const { data: existing } = await supabase.from('tourist_places').select('image_url').eq('id', id).maybeSingle();
  if (existing?.image_url) {
    await cleanupStorageImage(existing.image_url, 'place-images');
  }

  const { error } = await supabase.from('tourist_places').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ── Admin: Ship Schedule ──────────────────────────────────────────────────────
app.get('/api/admin/ship-schedule', requireAdmin, async (req, res) => {
  const { data, error } = await supabase.from('ship_schedule').select('*').order('id', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
app.post('/api/admin/ship-schedule', requireAdmin, async (req, res) => {
  const { data, error } = await supabase.from('ship_schedule').insert([req.body]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
app.put('/api/admin/ship-schedule', requireAdmin, async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const { data, error } = await supabase.from('ship_schedule').update(req.body).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
app.delete('/api/admin/ship-schedule', requireAdmin, async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const { error } = await supabase.from('ship_schedule').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

const ALL_HOTEL_ROOMS = ['101', '102', '103', '104', '105', '106', '107', '108', '201', '202', '203', '204', '205', '206', '207', '208', '301', '302', '303', '304'];
const ALL_FERRY_SEATS = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8'];

function extractUnitsFromRef(ref) {
  if (!ref) return [];
  const match = ref.match(/(?:HTL|FRY)-([A-Za-z0-9\-_,]+)-ANI/i);
  if (match && match[1]) {
    return match[1].split(/[-_,]+/).filter(Boolean).map(s => s.toUpperCase());
  }
  return [];
}

// ── Admin: Bookings (Hotel Bookings with Conflict Detection) ──────────────────
app.get('/api/admin/bookings', requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('bookings').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.put('/api/admin/bookings', requireAdmin, async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const { status, new_unit, force } = req.body;

  try {
    const { data: target, error: fetchErr } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();
    if (fetchErr || !target) return res.status(404).json({ error: 'Booking not found' });

    let updatedRef = target.booking_ref;

    // When confirming, validate that unit isn't already occupied by another active booking
    if (status === 'confirmed') {
      const unitsToCheck = new_unit ? [new_unit.toUpperCase()] : extractUnitsFromRef(target.booking_ref);

      const { data: activeList } = await supabase
        .from('bookings')
        .select('*')
        .eq('status', 'confirmed')
        .eq('hotel_name', target.hotel_name)
        .neq('id', id)
        .lt('check_in', target.check_out)
        .gt('check_out', target.check_in);

      const activeBookings = activeList || [];
      const occupiedUnits = new Set();
      const conflictingBookings = [];

      for (const b of activeBookings) {
        const bUnits = extractUnitsFromRef(b.booking_ref);
        for (const u of bUnits) {
          occupiedUnits.add(u);
          if (unitsToCheck.includes(u)) {
            conflictingBookings.push(b);
          }
        }
      }

      if (conflictingBookings.length > 0 && !force && !new_unit) {
        const availableUnits = ALL_HOTEL_ROOMS.filter(r => !occupiedUnits.has(r.toUpperCase()));
        return res.status(409).json({
          conflict: true,
          message: `Room ${unitsToCheck.join(', ')} is currently occupied by another confirmed guest on these dates.`,
          conflicting_units: unitsToCheck,
          conflicting_bookings: conflictingBookings,
          available_units: availableUnits,
        });
      }

      if (new_unit) {
        const randHex = Math.random().toString(36).substring(2, 7).toUpperCase();
        updatedRef = `HTL-${new_unit.toUpperCase()}-ANI${randHex}`;
      }
    }

    const updatePayload = { status };
    if (new_unit) updatePayload.booking_ref = updatedRef;

    const { data, error } = await supabase
      .from('bookings')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/bookings', requireAdmin, async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const { error } = await supabase.from('bookings').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ── Admin: Ferry Bookings (Ship Bookings with Conflict Detection) ─────────────
app.get('/api/admin/ferry-bookings', requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('ferry_bookings').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.put('/api/admin/ferry-bookings', requireAdmin, async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const { status, new_unit, force } = req.body;

  try {
    const { data: target, error: fetchErr } = await supabase
      .from('ferry_bookings')
      .select('*')
      .eq('id', id)
      .single();
    if (fetchErr || !target) return res.status(404).json({ error: 'Ferry booking not found' });

    let updatedRef = target.booking_ref;

    if (status === 'confirmed') {
      const unitsToCheck = new_unit ? [new_unit.toUpperCase()] : extractUnitsFromRef(target.booking_ref);

      const { data: activeList } = await supabase
        .from('ferry_bookings')
        .select('*')
        .eq('status', 'confirmed')
        .eq('ship_name', target.ship_name)
        .eq('travel_date', target.travel_date)
        .neq('id', id);

      const activeBookings = activeList || [];
      const occupiedUnits = new Set();
      const conflictingBookings = [];

      for (const b of activeBookings) {
        const bUnits = extractUnitsFromRef(b.booking_ref);
        for (const u of bUnits) {
          occupiedUnits.add(u);
          if (unitsToCheck.includes(u)) {
            conflictingBookings.push(b);
          }
        }
      }

      if (conflictingBookings.length > 0 && !force && !new_unit) {
        const availableUnits = ALL_FERRY_SEATS.filter(s => !occupiedUnits.has(s.toUpperCase()));
        return res.status(409).json({
          conflict: true,
          message: `Seat ${unitsToCheck.join(', ')} is already booked by another passenger for this voyage.`,
          conflicting_units: unitsToCheck,
          conflicting_bookings: conflictingBookings,
          available_units: availableUnits,
        });
      }

      if (new_unit) {
        const randHex = Math.random().toString(36).substring(2, 7).toUpperCase();
        updatedRef = `FRY-${new_unit.toUpperCase()}-ANI${randHex}`;
      }
    }

    const updatePayload = { status };
    if (new_unit) updatePayload.booking_ref = updatedRef;

    const { data, error } = await supabase
      .from('ferry_bookings')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/ferry-bookings', requireAdmin, async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const { error } = await supabase.from('ferry_bookings').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ── Public Booking Endpoints (Bypasses RLS safely via backend service role) ───
app.post('/api/bookings', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  try {
    const payload = req.body;
    const { data, error } = await supabase.from('bookings').insert([payload]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ferry-bookings', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  try {
    const payload = req.body;
    const { data, error } = await supabase.from('ferry_bookings').insert([payload]).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── User Bookings (Authenticated user history & cancellation) ────────────────
app.get('/api/user/bookings', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No auth token provided' });
  try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: 'Invalid or expired session' });

    let query = supabase.from('bookings').select('*').order('created_at', { ascending: false });
    if (user.email) {
      query = query.or(`user_id.eq.${user.id},guest_email.eq.${user.email}`);
    } else {
      query = query.eq('user_id', user.id);
    }
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/user/ferry-bookings', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No auth token provided' });
  try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: 'Invalid or expired session' });

    let query = supabase.from('ferry_bookings').select('*').order('created_at', { ascending: false });
    if (user.email) {
      query = query.or(`user_id.eq.${user.id},passenger_email.eq.${user.email}`);
    } else {
      query = query.eq('user_id', user.id);
    }
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/user/bookings/cancel', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No auth token provided' });
  try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: 'Invalid session' });
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing booking id' });

    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/user/ferry-bookings/cancel', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No auth token provided' });
  try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: 'Invalid session' });
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing booking id' });

    const { data, error } = await supabase
      .from('ferry_bookings')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper: strip email quotes (lines with >, On ... wrote, etc.)
function stripQuotedEmailContent(rawText) {
  if (!rawText) return '';
  const lines = rawText.split(/\r?\n/);
  const cleaned = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith('>')) break;
    if (/^On\s+.+wrote:?$/i.test(trimmed)) break;
    if (/^-+\s*Original Message\s*-+/i.test(trimmed)) break;
    if (/^From:\s+.+/i.test(trimmed) && i + 1 < lines.length && /^(Sent|Date|To|Subject):/i.test(lines[i + 1].trim())) break;
    cleaned.push(line);
  }

  const result = cleaned.join('\n').trim();
  return result || rawText.trim();
}

// ── Inbound Resend Webhook Handler (V2 Feature 6) ───────────────────────────
app.post('/api/webhooks/resend-inbound', async (req, res) => {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[resend-inbound] RESEND_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  const rawBuffer = Buffer.isBuffer(req.body)
    ? req.body
    : Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

  const svixId = req.headers['svix-id'];
  const svixTimestamp = req.headers['svix-timestamp'];
  const svixSignature = req.headers['svix-signature'];

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.warn('[resend-inbound] Missing Svix headers');
    return res.status(401).json({ error: 'Missing webhook signature headers' });
  }

  let payload;
  try {
    const { Webhook } = await import('svix');
    const wh = new Webhook(secret);
    payload = wh.verify(rawBuffer.toString('utf8'), {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });
  } catch (err) {
    console.warn('[resend-inbound] Signature verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  if (!payload || payload.type !== 'email.received') {
    return res.status(200).json({ message: 'Ignored non-email.received event' });
  }

  const emailData = payload.data || {};
  const emailId = emailData.email_id || emailData.id;
  const subject = emailData.subject || '';

  // Extract thread token [#a1b2c3d4]
  const match = subject.match(/\[#([a-f0-9]{8})\]/i);
  if (!match) {
    console.log(`[resend-inbound] No thread token found in subject: "${subject}"`);
    return res.status(200).json({ message: 'No thread token, skipped' });
  }

  const extractedToken = match[1].toLowerCase();

  try {
    const { data: query, error: queryErr } = await supabase
      .from('customer_queries')
      .select('id, email, status, name')
      .eq('reply_token', extractedToken)
      .maybeSingle();

    if (queryErr || !query) {
      console.warn(`[resend-inbound] No query found for token: ${extractedToken}`);
      return res.status(200).json({ message: 'No matching query, skipped' });
    }

    // Check idempotency on resend_email_id
    if (emailId) {
      const { data: existingMsg } = await supabase
        .from('query_messages')
        .select('id')
        .eq('resend_email_id', emailId)
        .maybeSingle();

      if (existingMsg) {
        console.log(`[resend-inbound] Duplicate message for ${emailId} skipped.`);
        return res.status(200).json({ message: 'Duplicate event skipped' });
      }
    }

    // Fetch full email content from Resend Receiving API
    let fullBodyText = '';
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey && emailId) {
      try {
        const response = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
          headers: { Authorization: `Bearer ${resendApiKey}` },
        });
        if (response.ok) {
          const fullEmail = await response.json();
          fullBodyText = fullEmail.text || fullEmail.html?.replace(/<[^>]*>/g, ' ') || '';
        } else {
          const fallbackRes = await fetch(`https://api.resend.com/emails/${emailId}`, {
            headers: { Authorization: `Bearer ${resendApiKey}` },
          });
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            fullBodyText = fallbackData.text || fallbackData.html?.replace(/<[^>]*>/g, ' ') || '';
          }
        }
      } catch (fetchErr) {
        console.error('[resend-inbound] Resend email fetch error:', fetchErr.message);
      }
    }

    const finalMessage = fullBodyText
      ? stripQuotedEmailContent(fullBodyText)
      : 'Reply received via email (content preview unavailable).';

    // Insert customer reply into thread
    await supabase.from('query_messages').insert([
      {
        query_id: query.id,
        sender_type: 'customer',
        message: finalMessage || 'Reply received.',
        resend_email_id: emailId || null,
      },
    ]);

    // Reopen query
    await supabase
      .from('customer_queries')
      .update({ status: 'open' })
      .eq('id', query.id);

    console.log(`[resend-inbound] Appended customer reply to query ${query.id} [#${extractedToken}]`);
    return res.status(200).json({ success: true, query_id: query.id });
  } catch (err) {
    console.error('[resend-inbound] Webhook handler error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── Admin: Queries (contact form submissions with thread messages & profile enrich) ──
app.get('/api/admin/queries', requireAdmin, async (req, res) => {
  let queries = [];
  try {
    const { data: qData, error: qErr } = await supabase
      .from('customer_queries')
      .select('*, query_messages(*)')
      .order('created_at', { ascending: false });

    if (qErr) {
      // Fallback if query_messages table doesn't exist yet
      const { data: plainData } = await supabase
        .from('customer_queries')
        .select('*')
        .order('created_at', { ascending: false });
      queries = plainData || [];
    } else {
      queries = (qData || []).map(q => ({
        ...q,
        query_messages: (q.query_messages || []).sort(
          (a, b) => new Date(a.created_at) - new Date(b.created_at)
        ),
      }));
    }
  } catch {
    const { data: plainData } = await supabase
      .from('customer_queries')
      .select('*')
      .order('created_at', { ascending: false });
    queries = plainData || [];
  }

  try {
    // Enrich with avatar_url & phone from profiles if available
    const emails = [...new Set((queries || []).map(q => q.email?.toLowerCase()).filter(Boolean))];
    const profileMap = {};
    if (emails.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('email, avatar_url, full_name, phone')
        .in('email', emails);
      if (profiles) {
        profiles.forEach(p => {
          if (p.email) profileMap[p.email.toLowerCase()] = p;
        });
      }
    }

    const enriched = (queries || []).map(q => {
      const p = profileMap[q.email?.toLowerCase()];
      return {
        ...q,
        avatar_url: p?.avatar_url || null,
        user_phone: p?.phone || q.phone || null,
        user_profile_name: p?.full_name || null,
      };
    });
    res.json(enriched);
  } catch (err) {
    res.json(queries || []);
  }
});

app.put('/api/admin/queries', requireAdmin, async (req, res) => {
  const id = req.query.id || req.body.id;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  const replyText = req.body.admin_reply || req.body.message || '';
  const status = req.body.status || 'replied';

  if (!replyText.trim()) {
    return res.status(400).json({ error: 'admin_reply is required' });
  }

  try {
    // Fetch query details
    const { data: query, error: fetchErr } = await supabase
      .from('customer_queries')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !query) return res.status(404).json({ error: 'Query not found' });

    // Ensure reply_token
    let replyToken = query.reply_token;
    if (!replyToken) {
      replyToken = Math.random().toString(36).substring(2, 10);
      await supabase
        .from('customer_queries')
        .update({ reply_token: replyToken })
        .eq('id', id);
    }

    // 1. Insert admin message into query_messages table
    let insertedMessageId = null;
    try {
      const { data: msgData } = await supabase
        .from('query_messages')
        .insert([
          {
            query_id: id,
            sender_type: 'admin',
            message: replyText.trim(),
          },
        ])
        .select()
        .single();
      if (msgData) insertedMessageId = msgData.id;
    } catch (msgErr) {
      console.warn('[admin/queries] query_messages insert warning:', msgErr.message);
    }

    // 2. Send email via Resend with reply_to header and subject token
    const resendKey = process.env.RESEND_API_KEY;
    const inboundAddress = process.env.RESEND_INBOUND_ADDRESS || 'support@coruebjen.resend.app';
    let resendEmailId = null;

    if (resendKey && query.email) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(resendKey);

        const subjectLine = query.subject
          ? `Re: ${query.subject} [#${replyToken}]`
          : `Re: Your message to Nicoman Tourism [#${replyToken}]`;

        const emailResult = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'Nicoman Tourism <support@nicoman.man-ray.is-a.dev>',
          reply_to: inboundAddress,
          to: query.email,
          subject: subjectLine,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #14b8a6, #06b6d4); padding: 28px 32px;">
                <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em;">Nicoman Tourism Support</h1>
                <p style="color: rgba(255, 255, 255, 0.9); margin: 4px 0 0 0; font-size: 13px;">Reference Token: [#${replyToken}]</p>
              </div>
              <div style="padding: 28px 32px;">
                <p style="color: #475569; font-size: 14px; margin: 0 0 12px 0;">Hello <strong>${query.name || 'Traveler'}</strong>,</p>
                <p style="color: #475569; font-size: 14px; margin: 0 0 20px 0;">Our support team has replied to your query:</p>

                <div style="background: #f0fdfa; border-left: 4px solid #14b8a6; padding: 16px 20px; border-radius: 0 12px 12px 0; margin-bottom: 24px;">
                  <p style="color: #0f172a; font-size: 15px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${replyText.trim()}</p>
                </div>

                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
                  <p style="color: #64748b; font-size: 12px; margin: 0 0 6px 0; font-weight: 600;">Your Original Message:</p>
                  <p style="color: #94a3b8; font-size: 13px; margin: 0; font-style: italic; line-height: 1.5;">"${query.message}"</p>
                </div>

                <div style="padding-top: 16px; border-top: 1px solid #f1f5f9; text-align: center;">
                  <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                    💬 <strong>Need to reply?</strong> Simply reply directly to this email and your response will attach to this thread automatically.
                  </p>
                </div>
              </div>
            </div>
          `,
        });

        if (emailResult?.data?.id) {
          resendEmailId = emailResult.data.id;
          if (insertedMessageId) {
            await supabase
              .from('query_messages')
              .update({ resend_email_id: resendEmailId })
              .eq('id', insertedMessageId);
          }
        }
      } catch (emailErr) {
        console.error('[server:admin/queries] Resend error:', emailErr.message);
      }
    }

    // 3. Update customer_queries row
    const { data: updated, error: updateErr } = await supabase
      .from('customer_queries')
      .update({
        admin_reply: replyText.trim(),
        status: status || 'replied',
        reply_token: replyToken,
      })
      .eq('id', id)
      .select('*, query_messages(*)')
      .single();

    if (updateErr) return res.status(500).json({ error: updateErr.message });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin: Feedback ───────────────────────────────────────────────────────────
app.get('/api/admin/feedback', requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('feedback').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
app.put('/api/admin/feedback', requireAdmin, async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const { data, error } = await supabase
    .from('feedback').update(req.body).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
app.delete('/api/admin/feedback', requireAdmin, async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const { error } = await supabase.from('feedback').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ── Admin: Alerts ─────────────────────────────────────────────────────────────
app.get('/api/admin/alerts', requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('alerts').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
app.post('/api/admin/alerts', requireAdmin, async (req, res) => {
  const { data, error } = await supabase.from('alerts').insert([req.body]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
app.put('/api/admin/alerts', requireAdmin, async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const { data, error } = await supabase
    .from('alerts').update(req.body).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
app.delete('/api/admin/alerts', requireAdmin, async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  const { error } = await supabase.from('alerts').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ── Admin: Manage Admins (Superadmin only) ────────────────────────────────────
app.get('/api/admin/manage-admins', requireSuperAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['admin', 'superadmin'])
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  const mapped = (data || []).map(a => ({
    id: a.user_id || a.id,
    user_id: a.user_id || a.id,
    full_name: a.full_name,
    email: a.email,
    phone: a.phone,
    avatar_url: a.avatar_url,
    role: a.role,
    created_at: a.created_at,
  }));
  res.json(mapped);
});

// User Lookup for Superadmin
app.get('/api/admin/user-lookup', requireSuperAdmin, async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email parameter required' });
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('user_id, full_name, email, phone, role, avatar_url, created_at')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();
  if (error || !profile) return res.status(404).json({ error: 'User not found' });
  res.json(profile);
});

app.post('/api/admin/manage-admins', requireSuperAdmin, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  const { data: profile, error: findErr } = await supabase
    .from('profiles').select('*').eq('email', email.trim().toLowerCase()).maybeSingle();
  if (findErr || !profile) return res.status(404).json({ error: 'User not found. They must sign up first.' });
  if (profile.role === 'superadmin') return res.status(400).json({ error: 'Cannot modify a superadmin account.' });
  
  const uid = profile.user_id;
  const { error } = await supabase.from('profiles').update({ role: 'admin' }).eq('user_id', uid);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});
app.delete('/api/admin/manage-admins', requireSuperAdmin, async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });
  let { data: profile } = await supabase.from('profiles').select('*').eq('user_id', id).maybeSingle();
  if (profile?.role === 'superadmin') return res.status(400).json({ error: 'Cannot demote a superadmin.' });
  
  const { error } = await supabase.from('profiles').update({ role: 'user' }).eq('user_id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ── Admin: Deleted Accounts / Deleted Profiles ────────────────────────────────
app.get('/api/admin/deleted-profiles', requireAdmin, async (req, res) => {
  const { data, error } = await supabase
    .from('deleted_profiles')
    .select('*')
    .order('deleted_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  const mapped = (data || []).map(d => ({
    id: d.user_id || d.id,
    user_id: d.user_id || d.id,
    email: d.email,
    full_name: d.full_name,
    phone: d.phone,
    role: d.role,
    avatar_url: d.avatar_url,
    deleted_at: d.deleted_at,
    scheduled_purge_at: d.scheduled_purge_at,
    deletion_reason: d.deletion_reason,
    created_at: d.created_at,
  }));
  res.json(mapped);
});

// Revoke / Restore Account from deleted_profiles back to profiles
app.post('/api/admin/deleted-profiles/restore', requireAdmin, async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing account ID' });

  try {
    let { data: delProf } = await supabase
      .from('deleted_profiles')
      .select('*')
      .eq('user_id', id)
      .maybeSingle();

    if (!delProf) {
      return res.status(404).json({ error: 'Deleted account record not found in archive.' });
    }

    const email = delProf.email?.trim().toLowerCase();
    const targetUserId = delProf.user_id;

    // 1. Ensure a valid user exists in auth.users for foreign key constraint
    let validAuthUserId = null;

    if (targetUserId) {
      try {
        const { data: authUser } = await supabase.auth.admin.getUserById(targetUserId);
        if (authUser?.user) {
          validAuthUserId = authUser.user.id;
        }
      } catch (e) {}
    }

    if (!validAuthUserId && email) {
      try {
        const { data: listRes } = await supabase.auth.admin.listUsers();
        const matched = (listRes?.users || []).find(u => u.email?.toLowerCase() === email);
        if (matched) {
          validAuthUserId = matched.id;
        }
      } catch (e) {}
    }

    // If user was deleted from auth.users, recreate in auth.users so foreign key constraint is satisfied
    if (!validAuthUserId && email) {
      try {
        const { data: newAuth } = await supabase.auth.admin.createUser({
          email: delProf.email,
          email_confirm: true,
          user_metadata: {
            full_name: delProf.full_name,
            avatar_url: delProf.avatar_url,
          },
        });
        if (newAuth?.user) {
          validAuthUserId = newAuth.user.id;
        }
      } catch (authCreateErr) {
        console.warn('[restore auth user creation]:', authCreateErr.message);
      }
    }

    // Check if a profile with this user_id or email already exists in profiles
    let existingProfile = null;
    if (validAuthUserId) {
      const { data: byUid } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', validAuthUserId)
        .maybeSingle();
      existingProfile = byUid;
    }
    if (!existingProfile && email) {
      const { data: byEmail } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      existingProfile = byEmail;
    }

    const finalUserId = validAuthUserId || existingProfile?.user_id || targetUserId;

    const restorePayload = {
      user_id: finalUserId,
      email: delProf.email,
      full_name: existingProfile?.full_name || delProf.full_name,
      phone: existingProfile?.phone || delProf.phone,
      role: delProf.role || existingProfile?.role || 'user',
      avatar_url: existingProfile?.avatar_url || delProf.avatar_url,
      created_at: delProf.created_at || existingProfile?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let restored = null;
    let insErr = null;

    if (existingProfile) {
      // Update existing profile
      const resUpdate = await supabase
        .from('profiles')
        .update({
          full_name: restorePayload.full_name,
          phone: restorePayload.phone,
          role: restorePayload.role,
          avatar_url: restorePayload.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', existingProfile.user_id)
        .select()
        .single();
      restored = resUpdate.data;
      insErr = resUpdate.error;
    } else {
      // Insert new profile
      const resInsert = await supabase
        .from('profiles')
        .insert([restorePayload])
        .select()
        .single();
      restored = resInsert.data;
      insErr = resInsert.error;
    }

    if (insErr) {
      console.error('[restore profile error]:', insErr.message);
      return res.status(500).json({ error: insErr.message });
    }

    // Link historical bookings and queries to the new valid user_id if changed
    if (targetUserId && finalUserId && targetUserId !== finalUserId) {
      try {
        await supabase.from('bookings').update({ user_id: finalUserId }).eq('user_id', targetUserId);
        await supabase.from('ferry_bookings').update({ user_id: finalUserId }).eq('user_id', targetUserId);
        await supabase.from('customer_queries').update({ user_id: finalUserId }).eq('user_id', targetUserId);
        await supabase.from('feedback').update({ user_id: finalUserId }).eq('user_id', targetUserId);
      } catch (linkErr) {
        console.warn('[restore history relink]:', linkErr.message);
      }
    }

    // ── Generate password reset link & notify user via Resend ─────────────
    let recoveryLink = null;
    try {
      const origin = req.headers.origin || 'https://nicoman-tourism.vercel.app';
      const { data: linkData } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: delProf.email,
        options: { redirectTo: `${origin}/reset-password` },
      });
      if (linkData?.properties?.action_link) {
        recoveryLink = linkData.properties.action_link;
      }
    } catch (linkErr) {
      console.warn('[restore generateLink warning]:', linkErr.message);
    }

    // Send email notification to user via Resend
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey && delProf.email) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(resendKey);
        const origin = req.headers.origin || 'https://nicoman-tourism.vercel.app';
        const actionUrl = recoveryLink || `${origin}/reset-password`;

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'Nicoman Tourism <support@nicoman.man-ray.is-a.dev>',
          to: delProf.email,
          subject: 'Your Nicoman Tourism Account Has Been Restored! 🌴',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
              <div style="background: linear-gradient(135deg, #14b8a6, #06b6d4); padding: 28px 32px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800;">Welcome Back to Nicoman Tourism! 🏝️</h1>
                <p style="color: rgba(255, 255, 255, 0.9); margin: 6px 0 0 0; font-size: 14px;">Account Restored Successfully</p>
              </div>
              <div style="padding: 28px 32px;">
                <p style="color: #475569; font-size: 15px; margin: 0 0 16px 0;">Hello <strong>${delProf.full_name || 'Traveler'}</strong>,</p>
                <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                  Good news! Your deleted Nicoman Tourism account (<strong>${delProf.email}</strong>) has been reviewed and restored by our team.
                </p>
                <div style="background: #f0fdfa; border-left: 4px solid #14b8a6; padding: 16px 20px; border-radius: 0 12px 12px 0; margin-bottom: 24px;">
                  <p style="color: #0f172a; font-size: 14px; margin: 0 0 6px 0; font-weight: 700;">How to log in:</p>
                  <ul style="color: #334155; font-size: 13px; margin: 0; padding-left: 18px; line-height: 1.6;">
                    <li><strong>Google Sign-In:</strong> Simply click "Sign in with Google" on the login page.</li>
                    <li><strong>Email & Password:</strong> Click the button below to set your password.</li>
                  </ul>
                </div>
                <div style="text-align: center; margin: 28px 0;">
                  <a href="${actionUrl}" style="background: linear-gradient(135deg, #14b8a6, #06b6d4); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);">
                    Set Your Password & Log In →
                  </a>
                </div>
                <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
                  If you did not request this restoration, please contact our support team at <a href="mailto:nicomantourism.myth520@silomails.com" style="color: #14b8a6;">nicomantourism.myth520@silomails.com</a>.
                </p>
              </div>
            </div>
          `,
        });
        console.log(`[restore] Sent account restoration email to ${delProf.email}`);
      } catch (emailErr) {
        console.warn('[restore email notification warning]:', emailErr.message);
      }
    }

    res.json({
      success: true,
      message: `Account ${delProf.email} restored successfully! Password recovery link sent to user.`,
      recovery_link: recoveryLink,
      data: restored,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Permanently Purge Account and All Traces across All Tables
app.delete('/api/admin/deleted-profiles/purge', requireAdmin, async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing account ID' });

  try {
    let { data: delProf } = await supabase
      .from('deleted_profiles')
      .select('*')
      .eq('user_id', id)
      .maybeSingle();

    if (!delProf) {
      const fallback = await supabase
        .from('deleted_profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      delProf = fallback.data;
    }

    const email = delProf?.email?.trim().toLowerCase();
    const targetUserId = id;

    // 1. Delete from deleted_profiles (by user_id, id, and email)
    await supabase.from('deleted_profiles').delete().eq('user_id', targetUserId);
    await supabase.from('deleted_profiles').delete().eq('id', targetUserId);
    if (email) {
      await supabase.from('deleted_profiles').delete().eq('email', email);
    }

    // 2. Delete from profiles (by user_id, id, and email)
    await supabase.from('profiles').delete().eq('user_id', targetUserId);
    await supabase.from('profiles').delete().eq('id', targetUserId);
    if (email) {
      await supabase.from('profiles').delete().eq('email', email);
    }

    // 3. Delete all traces across other tables
    await supabase.from('customer_queries').delete().eq('user_id', targetUserId);
    await supabase.from('feedback').delete().eq('user_id', targetUserId);
    await supabase.from('bookings').delete().eq('user_id', targetUserId);
    await supabase.from('ferry_bookings').delete().eq('user_id', targetUserId);

    if (email) {
      await supabase.from('customer_queries').delete().eq('email', email);
      await supabase.from('feedback').delete().eq('email', email);
      await supabase.from('bookings').delete().eq('email', email);
      await supabase.from('ferry_bookings').delete().eq('email', email);
    }

    // 4. Delete from auth.users (if still exists)
    try {
      await supabase.auth.admin.deleteUser(targetUserId);
    } catch (authErr) {
      // Ignored if already deleted
    }

    res.json({
      success: true,
      message: `Account ${email || targetUserId} and all traces permanently purged from all tables.`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Sync / Create User Profile (Google OAuth & new sign-ins) ──────────────────
app.post('/api/user/sync-profile', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No auth token provided' });

  try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: 'Invalid or expired session' });

    const meta = user.user_metadata || {};
    const fullName = meta.full_name || meta.name || meta.given_name || user.email?.split('@')[0] || 'Traveller';
    const avatarUrl = meta.avatar_url || meta.picture || null;
    const email = user.email?.trim().toLowerCase();

    // If an archived profile exists in deleted_profiles for this user/email, auto-unarchive and clean it up!
    let archivedProfile = null;
    if (email) {
      const { data: delRow } = await supabase
        .from('deleted_profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      archivedProfile = delRow;
      if (delRow) {
        // Remove from deleted_profiles so no duplicate remains
        await supabase.from('deleted_profiles').delete().eq('email', email);
      }
    }

    // Check existing profile (try user_id first, then email, then id)
    let { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!existing && email) {
      const fallbackEmail = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      existing = fallbackEmail.data;
    }

    if (!existing) {
      const fallback = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      existing = fallback.data;
    }

    const profileData = {
      user_id: user.id,
      email: user.email,
      full_name: existing?.full_name || archivedProfile?.full_name || fullName,
      phone: existing?.phone || archivedProfile?.phone || null,
      avatar_url: existing?.avatar_url || archivedProfile?.avatar_url || avatarUrl,
      role: existing?.role || archivedProfile?.role || 'user',
      updated_at: new Date().toISOString(),
    };
    if (!existing) {
      profileData.created_at = archivedProfile?.created_at || new Date().toISOString();
    }

    let savedProfile = null;
    let saveErr = null;

    if (existing) {
      const resUpdate = await supabase
        .from('profiles')
        .update(profileData)
        .eq('user_id', existing.user_id || user.id)
        .select()
        .single();
      savedProfile = resUpdate.data;
      saveErr = resUpdate.error;
    } else {
      const resInsert = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();
      savedProfile = resInsert.data;
      saveErr = resInsert.error;
    }

    if (saveErr) {
      console.error('[sync-profile] Profile error:', saveErr.message);
      return res.status(500).json({ error: saveErr.message });
    }

    res.json({ success: true, profile: savedProfile });
  } catch (err) {
    console.error('[sync-profile] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Update User Profile (with Service-Role Avatar Storage Cleanup) ─────────────
app.put('/api/user/profile', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No auth token provided' });

  try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' });

    let { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile) {
      const fallback = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      profile = fallback.data;
    }

    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    if (profile.role === 'demo_admin') {
      return res.status(403).json({ error: 'Demo Admin profile is locked. Profile modifications are disabled in demo mode.' });
    }

    const { full_name, phone, avatar_url, avatar_path } = req.body;
    const updateData = { updated_at: new Date().toISOString() };

    if (full_name !== undefined) updateData.full_name = full_name;
    if (phone !== undefined) updateData.phone = phone;

    // If avatar is being replaced or removed, clean up old storage avatar file!
    if (avatar_url !== undefined) {
      updateData.avatar_url = avatar_url;
      if (avatar_path !== undefined) updateData.avatar_path = avatar_path;

      const oldAvatar = profile.avatar_path || profile.avatar_url;
      const isChanged = (avatar_url !== profile.avatar_url);
      if (oldAvatar && isChanged) {
        await cleanupStorageImage(oldAvatar, 'avatars');
      }
    }

    const { data: updated, error: updateErr } = await supabase
      .from('profiles')
      .update(updateData)
      .eq(profile.user_id ? 'user_id' : 'id', user.id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    res.json({ success: true, profile: updated });
  } catch (err) {
    console.error('[update-profile] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── User Avatar Deletion (Service Role) ───────────────────────────────────────
app.delete('/api/user/avatar', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No auth token provided' });

  try {
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' });

    let { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile) {
      const fallback = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      profile = fallback.data;
    }

    if (profile?.role === 'demo_admin') {
      return res.status(403).json({ error: 'Demo Admin profile is locked. Photo deletion is disabled in demo mode.' });
    }

    const avatarPath = profile?.avatar_path || (
      profile?.avatar_url?.includes('/avatars/')
        ? profile.avatar_url.split('/avatars/')[1]?.split('?')[0]
        : null
    );

    if (avatarPath) {
      await supabase.storage.from('avatars').remove([avatarPath]);
      console.log(`[user/avatar] Removed ${avatarPath} from avatars bucket`);
    }

    await supabase
      .from('profiles')
      .update({ avatar_url: null, avatar_path: null, updated_at: new Date().toISOString() })
      .eq(profile?.user_id ? 'user_id' : 'id', user.id);

    res.json({ success: true, message: 'Avatar removed from storage' });
  } catch (err) {
    console.error('[user/avatar] Deletion error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── User Account Self-Deletion & Archival ─────────────────────────────────────
app.delete('/api/user/account', async (req, res) => {
  if (!supabase) return res.status(503).json({ error: 'Database not configured' });
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No auth token provided' });

  try {
    // 1. Verify user identity
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: 'Invalid or expired session' });

    // 2. Fetch profile
    let { data: profile, error: profErr } = await supabase
      .from('profiles').select('*').eq('user_id', user.id).maybeSingle();
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    // 3. Superadmin & Demo Admin cannot self-delete
    if (profile.role === 'superadmin' || profile.role === 'demo_admin') {
      return res.status(403).json({
        error: profile.role === 'demo_admin'
          ? 'Demo Admin accounts are protected and cannot be deleted in public preview.'
          : 'Superadmin accounts cannot be self-deleted to protect system stability.'
      });
    }

    const { reason, turnstileToken } = req.body || {};

    // 4. Optional Turnstile check
    if (turnstileToken && process.env.TURNSTILE_SECRET_KEY) {
      try {
        const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret: process.env.TURNSTILE_SECRET_KEY, response: turnstileToken }),
        });
        const verifyData = await verifyRes.json();
        if (!verifyData.success) return res.status(400).json({ error: 'Security verification failed' });
      } catch (tErr) {
        console.warn('[user-account] Turnstile verification error:', tErr.message);
      }
    }

    // 5. Clean up avatar file from Supabase storage
    const avatarPath = profile.avatar_path || (
      profile.avatar_url?.includes('/avatars/')
        ? profile.avatar_url.split('/avatars/')[1]?.split('?')[0]
        : null
    );
    if (avatarPath) {
      try {
        await supabase.storage.from('avatars').remove([avatarPath]);
        console.log(`[user-account] Cleaned up avatar storage file: ${avatarPath}`);
      } catch (storageErr) {
        console.warn('[user-account] Storage avatar cleanup note:', storageErr.message);
      }
    }

    // 6. Transfer / Archive row to deleted_profiles table without loss of columns
    const scheduledPurge = new Date();
    scheduledPurge.setDate(scheduledPurge.getDate() + 30);

    const archivePayload = {
      user_id: user.id,
      email: profile.email || user.email,
      full_name: profile.full_name,
      phone: profile.phone,
      role: profile.role,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      avatar_url: profile.avatar_url,
      deleted_at: new Date().toISOString(),
      scheduled_purge_at: scheduledPurge.toISOString(),
      deletion_reason: reason || 'User self-deletion via profile',
    };

    let { error: archiveErr } = await supabase
      .from('deleted_profiles')
      .upsert(archivePayload, { onConflict: 'user_id' });

    if (archiveErr) {
      console.warn('[user-account] Archival warning:', archiveErr.message);
    }

    // 6. Explicitly delete from public.profiles immediately
    await supabase.from('profiles').delete().eq('user_id', user.id);
    if (profile.email) {
      await supabase.from('profiles').delete().eq('email', profile.email);
    }

    // 7. Delete user from auth.users
    try {
      await supabase.auth.admin.deleteUser(user.id);
    } catch (authErr) {
      console.warn('[user-account] deleteUser note:', authErr.message);
    }

    // 8. Clean up user queries and feedback traces
    try {
      await supabase.from('customer_queries').delete().eq('user_id', user.id);
      await supabase.from('feedback').delete().eq('user_id', user.id);
      if (user.email) {
        await supabase.from('customer_queries').delete().eq('email', user.email);
        await supabase.from('feedback').delete().eq('email', user.email);
      }
    } catch (cleanErr) {
      console.warn('[user-account] Trace cleanup error:', cleanErr.message);
    }

    res.json({
      success: true,
      message: 'Account deleted and archived for 30 days.',
      scheduled_purge_at: scheduledPurge.toISOString(),
    });
  } catch (err) {
    console.error('[user-account] Deletion error:', err.message);
    res.status(500).json({ error: 'Failed to delete account: ' + err.message });
  }
});

// ── Turnstile Verification ─────────────────────────────────────────────────
// This was previously missing — causing signup to fail with ECONNREFUSED/404.
app.post('/api/verify-turnstile', async (req, res) => {
  const { token } = req.body;
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    // Dev mode: if no secret key configured, bypass verification
    console.warn('[verify-turnstile] No TURNSTILE_SECRET_KEY set — bypassing in dev mode');
    return res.json({ success: true, dev_bypass: true });
  }

  if (!token) {
    return res.status(400).json({ success: false, error: 'Missing token' });
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token }),
    });
    const data = await response.json();
    return res.json({ success: data.success, error: data['error-codes'] });
  } catch (err) {
    console.error('[verify-turnstile] Cloudflare API error:', err.message);
    // Fail open in dev so local testing isn't blocked
    return res.json({ success: true, dev_bypass: true });
  }
});

// ── Chatbot API ───────────────────────────────────────────────────────────────
app.post('/api/chatbot', (req, res) => {
  const { message } = req.body;
  const query = (message || '').toLowerCase();
  let response = '';

  if (query.includes('hello') || query.includes('hi')) {
    response = 'Hello! Welcome to Andaman & Nicobar Tourism. How can I help you today?';
  } else if (query.includes('beach')) {
    response = "Our top beaches include Radhanagar Beach (Asia's best!), Elephant Beach, and Corbyn's Cove. Would you like more details about any specific beach?";
  } else if (query.includes('hotel') || query.includes('stay')) {
    response = 'We have hotels ranging from budget (₹3,500/night) to ultra-luxury (₹15,000/night). Popular options include SeaShell Resort, Taj Exotica, and Symphony Palms. Visit our Hotels page for bookings!';
  } else if (query.includes('ship') || query.includes('ferry')) {
    response = 'Ships operate daily between Port Blair, Havelock, and Neil Island. Journey time: Port Blair to Havelock is 2.5 hours. Check our Ferries page for timings.';
  } else if (query.includes('price') || query.includes('cost')) {
    response = 'Average costs: Hotels ₹3,500–15,000/night, Ferry ₹500–2,500, Activities ₹1,000–5,000. A 5-day trip costs around ₹30,000–50,000 per person.';
  } else if (query.includes('best time') || query.includes('when')) {
    response = 'Best time to visit: October to May. Weather is pleasant with clear skies, perfect for beaches and water sports. Avoid monsoons (June–September).';
  } else if (query.includes('cellular jail')) {
    response = 'Cellular Jail (Kala Pani) is a historic colonial prison in Port Blair. Light & Sound show at 6 PM. Entry: ₹30 for Indians. A must-visit for history enthusiasts!';
  } else if (query.includes('scuba') || query.includes('diving')) {
    response = 'Andaman is perfect for scuba diving! Best spots: Havelock, Neil Island. Cost: ₹3,500–5,000 per dive. No prior experience needed — trainers available!';
  } else if (query.includes('how to reach') || query.includes('flight')) {
    response = 'By Air: Direct flights from Chennai, Kolkata, Delhi to Port Blair (2–3 hours). By Sea: Ships from Chennai, Kolkata, Vizag (50–70 hours).';
  } else {
    response = 'I can help you with information about beaches, hotels, ships, prices, best time to visit, and activities. What would you like to know?';
  }

  res.json({ response });
});

export default app;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}
