// api/ship-routes.js
// GET → returns mainland-to-Andaman ship routes from Supabase

import { supabaseAdmin } from './_lib/supabase-admin.js';

const FALLBACK = [
  { id: '1', from: 'Chennai Port', from_state: 'Tamil Nadu', to: 'Port Blair', distance: 647, unit: 'nautical miles', travel_time: '12-14 hours', frequency: '3-4 times/month' },
  { id: '2', from: 'Kolkata Port', from_state: 'West Bengal', to: 'Port Blair', distance: 756, unit: 'nautical miles', travel_time: '24-26 hours', frequency: '2-3 times/month' },
  { id: '3', from: 'Visakhapatnam Port', from_state: 'Andhra Pradesh', to: 'Port Blair', distance: 684, unit: 'nautical miles', travel_time: '18-22 hours', frequency: '2 times/month' },
];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('ship_routes')
      .select('*')
      .order('distance', { ascending: true });

    if (error) throw error;
    if (data && data.length > 0) return res.status(200).json(data);
  } catch (err) {
    console.error('[ship-routes] Supabase error, falling back to stub:', err.message);
  }

  return res.status(200).json(FALLBACK);
}
