// api/admin/bookings.js
// Protected admin endpoint for viewing and managing all bookings.
// GET  /api/admin/bookings          → list all bookings (with guest + hotel info)
// PUT  /api/admin/bookings?id=...   → update booking status

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
        .from('bookings')
        .select('*, profiles(full_name, email, phone)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'PUT') {
      if (!id) return res.status(400).json({ error: 'id is required' });
      const { status } = req.body;
      if (!status || !['confirmed', 'cancelled', 'completed'].includes(status)) {
        return res.status(400).json({ error: 'status must be confirmed, cancelled, or completed' });
      }
      const { data, error } = await supabaseAdmin
        .from('bookings')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[admin/bookings]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
