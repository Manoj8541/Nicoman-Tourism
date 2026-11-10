import express from 'express';
import { supabase } from '../lib/supabase.js';
import { writeLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// ── Health Ping ─────────────────────────────────────────────────────────────
router.get('/health', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ status: 'error', reason: 'supabase_not_initialized' });
  }
  try {
    const { error } = await supabase.from('tourist_places').select('id').limit(1).single();
    if (error) throw error;
    res.status(200).json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch (e) {
    console.error('[server] Health ping database error:', e.message);
    res.status(500).json({ status: 'error', reason: e.message });
  }
});

// ── Turnstile Verification ─────────────────────────────────────────────────
router.post('/verify-turnstile', writeLimiter, async (req, res) => {
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

// ── Chatbot API ─────────────────────────────────────────────────────────────
router.post('/chatbot', writeLimiter, (req, res) => {
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

export default router;
