// api/hotels.js
// GET → returns all hotels from Supabase (falls back to stub data)

import { supabaseAdmin } from './_lib/supabase-admin.js';

const FALLBACK = [
  { id: '1', name: 'SeaShell Resort', location: 'Havelock Island', image_url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', price_per_night: 5500, rating: 4.5, amenities: ['WiFi','Pool','Beach Access','Restaurant'], category: 'Luxury', description: 'A stunning beachfront resort with panoramic ocean views.' },
  { id: '2', name: 'Peerless Resort', location: 'Port Blair', image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', price_per_night: 4200, rating: 4.3, amenities: ['WiFi','Pool','Gym','Spa'], category: 'Premium', description: 'Premium resort with world-class amenities.' },
  { id: '3', name: 'Symphony Palms Beach Resort', location: 'Havelock Island', image_url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800', price_per_night: 6800, rating: 4.7, amenities: ['WiFi','Beach Access','Restaurant','Water Sports'], category: 'Luxury', description: 'Nestled among palm trees.' },
  { id: '4', name: 'Coral Reef Resort', location: 'Neil Island', image_url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800', price_per_night: 3500, rating: 4.2, amenities: ['WiFi','Restaurant','Garden'], category: 'Budget', description: 'Affordable comfort.' },
  { id: '5', name: 'TSG Aura', location: 'Port Blair', image_url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800', price_per_night: 3800, rating: 4.1, amenities: ['WiFi','Restaurant','Room Service'], category: 'Budget', description: 'Clean, comfortable rooms.' },
  { id: '6', name: 'Taj Exotica Resort', location: 'Havelock Island', image_url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800', price_per_night: 15000, rating: 4.9, amenities: ['WiFi','Pool','Spa','Beach Access','Fine Dining','Water Sports'], category: 'Ultra Luxury', description: 'The pinnacle of island luxury.' },
];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('hotels')
      .select('*')
      .order('rating', { ascending: false });

    if (error) throw error;
    if (data && data.length > 0) {
      // Map DB field names to what the frontend expects
      const mapped = data.map(h => ({
        ...h,
        image: h.image_url,
        price: h.price_per_night,
      }));
      return res.status(200).json(mapped);
    }
  } catch (err) {
    console.error('[hotels] Supabase error, falling back to stub:', err.message);
  }

  // Fallback: map stub data too for consistency
  const mapped = FALLBACK.map(h => ({ ...h, image: h.image_url, price: h.price_per_night }));
  return res.status(200).json(mapped);
}
