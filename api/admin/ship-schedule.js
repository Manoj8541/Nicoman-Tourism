// api/admin/ship-schedule.js
// Protected admin CRUD for the ship_schedule table.
// GET    /api/admin/ship-schedule          → list all schedules
// POST   /api/admin/ship-schedule          → create schedule entry
// PUT    /api/admin/ship-schedule?id=...   → update schedule entry
// DELETE /api/admin/ship-schedule?id=...   → delete schedule entry

import { supabaseAdmin } from '../_lib/supabase-admin.js';
import { requireAdmin } from '../_lib/admin-auth.js';

export default async function handler(req, res) {
  try {
    await requireAdmin(req);
  } catch (err) {
    return res.status(err.status || 403).json({ error: err.message });
  }

  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('ship_schedule')
        .select('*')
        .order('departure_time', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { ship_name, from, to, departure_time, arrival_time, status, days } = req.body;
      if (!ship_name || !from || !to || !departure_time || !arrival_time) {
        return res.status(400).json({ error: 'ship_name, from, to, departure_time, arrival_time are required' });
      }
      const { data, error } = await supabaseAdmin
        .from('ship_schedule')
        .insert({
          ship_name,
          from,
          to,
          departure_time,
          arrival_time,
          status: status || 'on_time',
          days: days || [],
        })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { ship_name, from, to, departure_time, arrival_time, status, days } = req.body;
      const { data, error } = await supabaseAdmin
        .from('ship_schedule')
        .update({ ship_name, from, to, departure_time, arrival_time, status, days })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { error } = await supabaseAdmin.from('ship_schedule').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[admin/ship-schedule]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
