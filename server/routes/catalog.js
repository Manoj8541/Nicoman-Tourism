import express from 'express';
import { supabase } from '../lib/supabase.js';
import { writeLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// ── Static Mock Data (Fallback when DB empty or offline) ──────────────────────
export const touristPlaces = [
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

export const hotels = [
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

export const shipRoutes = [
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

export const shipSchedule = [
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

// ── Public Catalog Routes (Always live, never cached) ─────────────────────────
router.get('/tourist-places', async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('tourist_places').select('*');
      if (!error && data && data.length > 0) return res.json(data);
    } catch (e) { console.error('[server] Supabase fetch tourist_places error:', e.message); }
  }
  res.json(touristPlaces);
});

router.get('/hotels', async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('hotels').select('*');
      if (!error && data && data.length > 0) return res.json(data);
    } catch (e) { console.error('[server] Supabase fetch hotels error:', e.message); }
  }
  res.json(hotels);
});

router.get('/ship-routes', async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('ship_routes').select('*').order('distance', { ascending: true });
      if (!error && data && data.length > 0) return res.json(data);
    } catch (e) { console.error('[server] Supabase fetch ship_routes error:', e.message); }
  }
  res.json(shipRoutes);
});

router.get('/ship-schedule', async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('ship_schedule').select('*');
      if (!error && data && data.length > 0) return res.json(data);
    } catch (e) { console.error('[server] Supabase fetch ship_schedule error:', e.message); }
  }
  res.json(shipSchedule);
});

// ── Feedback: Public GET (fetch live approved feedback from Supabase) ────────
router.get('/feedback', async (req, res) => {
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
router.post('/feedback', writeLimiter, async (req, res) => {
  const { name, email, rating, message, sentiment, avatar_url, user_id } = req.body;
  let authUserId = user_id || null;

  // Extract verified user ID from Bearer token if present
  const authHeader = req.headers.authorization;
  if (authHeader && supabase) {
    try {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) authUserId = user.id;
    } catch { }
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
router.delete('/feedback', async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing feedback ID' });

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Sign in required to delete feedback' });
  }

  if (!supabase) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Check if user is admin/superadmin
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

// ── Contact (public POST — persisted to Supabase with user_id) ───────────────
router.post('/contact', writeLimiter, async (req, res) => {
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

export default router;
