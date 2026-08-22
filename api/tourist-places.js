// api/tourist-places.js
// GET → returns all tourist places from Supabase (falls back to stub data)

import { supabaseAdmin } from './_lib/supabase-admin.js';

const FALLBACK = [
  { id: '1', name: 'Radhanagar Beach', location: 'Havelock Island', description: "Ranked as Asia's best beach, famous for turquoise waters and white sand", image_url: 'https://thumbs.dreamstime.com/b/radhanagar-beach-one-most-famous-attractions-havelock-island-andaman-nicobar-islands-radhanagar-beach-253126594.jpg', category: 'Beach', rating: 4.8, best_time: 'October to May' },
  { id: '2', name: 'Cellular Jail', location: 'Port Blair', description: "Historic colonial prison, symbol of India's freedom struggle", image_url: 'https://images.unsplash.com/photo-1721231564051-3b44b8058a9e?q=80&w=1074&auto=format&fit=crop', category: 'Historical', rating: 4.7, best_time: 'Year Round' },
  { id: '3', name: 'Neil Island', location: 'Neil Island', description: 'Peaceful island known for coral reefs and natural rock formations', image_url: 'https://th.bing.com/th/id/R.07552f9c51f70af31487e175bb9c748b', category: 'Island', rating: 4.6, best_time: 'November to April' },
  { id: '4', name: 'Ross Island', location: 'Near Port Blair', description: 'Former administrative headquarters with colonial ruins', image_url: 'https://www.go2andaman.com/wp-content/uploads/2021/01/ross-island-go2andaman-port-blair1.jpeg', category: 'Historical', rating: 4.5, best_time: 'October to May' },
  { id: '5', name: 'Baratang Island', location: 'Middle Andaman', description: 'Famous for limestone caves and mud volcanoes', image_url: 'https://tse3.mm.bing.net/th/id/OIP.l_vLrxJC-nsI45eAyOeiHAHaEK', category: 'Nature', rating: 4.4, best_time: 'November to March' },
  { id: '6', name: 'Elephant Beach', location: 'Havelock Island', description: 'Perfect spot for snorkeling and water sports', image_url: 'https://www.andamantourism.org/wp-content/uploads/2025/02/Elephant-beach-1-800x444.jpg', category: 'Beach', rating: 4.7, best_time: 'October to May' },
];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('tourist_places')
      .select('*')
      .order('rating', { ascending: false });

    if (error) throw error;
    if (data && data.length > 0) return res.status(200).json(data);
  } catch (err) {
    console.error('[tourist-places] Supabase error, falling back to stub:', err.message);
  }

  return res.status(200).json(FALLBACK);
}
