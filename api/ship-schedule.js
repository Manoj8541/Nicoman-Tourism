// api/ship-schedule.js
// GET → returns inter-island ferry schedule from Supabase

import { supabaseAdmin } from './_lib/supabase-admin.js';

const FALLBACK = [
  { id: '1', ship_name: 'MV Swaraj Dweep', from: 'Port Blair', to: 'Havelock Island', departure_time: '06:00 AM', arrival_time: '08:30 AM', status: 'on_time', days: ['Mon','Wed','Fri','Sun'] },
  { id: '2', ship_name: 'MV Makruzz', from: 'Port Blair', to: 'Havelock Island', departure_time: '08:15 AM', arrival_time: '10:30 AM', status: 'on_time', days: ['Daily'] },
  { id: '3', ship_name: 'MV Coastal Cruise', from: 'Havelock Island', to: 'Neil Island', departure_time: '11:00 AM', arrival_time: '12:00 PM', status: 'on_time', days: ['Tue','Thu','Sat'] },
  { id: '4', ship_name: 'MV Green Ocean', from: 'Port Blair', to: 'Neil Island', departure_time: '06:30 AM', arrival_time: '09:00 AM', status: 'delayed', days: ['Mon','Wed','Fri'] },
  { id: '5', ship_name: 'MV Nautika', from: 'Havelock Island', to: 'Port Blair', departure_time: '04:00 PM', arrival_time: '06:30 PM', status: 'on_time', days: ['Daily'] },
];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('ship_schedule')
      .select('*')
      .order('departure_time', { ascending: true });

    if (error) throw error;
    if (data && data.length > 0) return res.status(200).json(data);
  } catch (err) {
    console.error('[ship-schedule] Supabase error, falling back to stub:', err.message);
  }

  return res.status(200).json(FALLBACK);
}
